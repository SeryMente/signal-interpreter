using System.Text.Json;
using System.Text.RegularExpressions;
using System.Windows.Automation;

internal static class Program
{
    private const string ChromeWindowClass = "Chrome_WidgetWin_1";
    private const string CaptionBubbleClass = "CaptionBubbleLabel";
    private const string CaptionViewClass = "AXVirtualView";
    private static readonly Regex Whitespace = new(@"\s+", RegexOptions.Compiled);
    private static LocalTransport? Transport;

    private static void Main(string[] args)
    {
        var intervalMs = GetInt(args, "--interval-ms", 150, 50);
        var stabilityMs = GetInt(args, "--stability-ms", 750, 250);
        var port = GetInt(args, "--port", 8787, 1024);
        var reconciler = new CaptionReconciler(TimeSpan.FromMilliseconds(stabilityMs));
        var sequence = 0L;
        var found = false;
        var previousRawSnapshot = "";

        try
        {
            Transport = new LocalTransport(port);
            Transport.Start();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Signal Live Caption Bridge | transport error | {ex.Message}");
        }

        Emit(new
        {
            type = "bridge.status",
            status = Transport is null ? "transport_disabled" : "listening",
            protocol = "signal-live-caption.v1",
            transport = "websocket",
            url = Transport?.WebSocketUrl,
            intervalMs,
            stabilityMs,
            timestamp = DateTimeOffset.UtcNow
        });

        Console.Error.WriteLine($"Signal Live Caption Bridge | UIA | poll={intervalMs}ms | stability={stabilityMs}ms | ws={(Transport?.WebSocketUrl ?? "disabled")}");

        while (true)
        {
            try
            {
                var now = DateTimeOffset.UtcNow;
                var snapshot = ReadCaption();

                if (!string.IsNullOrWhiteSpace(snapshot))
                {
                    if (!found)
                    {
                        Emit(new { type = "caption.status", status = "found", timestamp = now, sequence = ++sequence });
                        found = true;
                    }

                    var normalizedSnapshot = Normalize(snapshot);
                    foreach (var segment in reconciler.Observe(normalizedSnapshot, now))
                    {
                        Emit(new
                        {
                            type = "caption.segment", mode = "final", source = "live-caption",
                            reason = segment.Reason, text = segment.Text, snapshot = segment.Snapshot,
                            timestamp = now, sequence = ++sequence
                        });
                    }

                    if (!string.Equals(normalizedSnapshot, previousRawSnapshot, StringComparison.Ordinal))
                    {
                        Emit(new
                        {
                            type = TryAppend(previousRawSnapshot, normalizedSnapshot, out _) ? "caption.delta" : "caption.revision",
                            mode = TryAppend(previousRawSnapshot, normalizedSnapshot, out var delta) ? "append" : "replace",
                            text = deltaOrSnapshot(previousRawSnapshot, normalizedSnapshot, delta),
                            snapshot = normalizedSnapshot,
                            timestamp = now,
                            sequence = ++sequence
                        });
                        previousRawSnapshot = normalizedSnapshot;
                    }
                }
                else if (found)
                {
                    foreach (var segment in reconciler.Flush(DateTimeOffset.UtcNow, "caption-cleared"))
                    {
                        Emit(new
                        {
                            type = "caption.segment", mode = "final", source = "live-caption",
                            reason = segment.Reason, text = segment.Text, snapshot = segment.Snapshot,
                            timestamp = DateTimeOffset.UtcNow, sequence = ++sequence
                        });
                    }
                    Emit(new { type = "caption.status", status = "not_found", timestamp = DateTimeOffset.UtcNow, sequence = ++sequence });
                    found = false;
                    previousRawSnapshot = "";
                }
            }
            catch (Exception ex)
            {
                Emit(new { type = "bridge.error", error = ex.ToString(), timestamp = DateTimeOffset.UtcNow, sequence = ++sequence });
            }
            Thread.Sleep(intervalMs);
        }
    }

    private static string ReadCaption()
    {
        var root = AutomationElement.RootElement;
        var windows = root.FindAll(TreeScope.Children, new PropertyCondition(AutomationElement.ClassNameProperty, ChromeWindowClass));
        var candidates = new List<string>();

        foreach (AutomationElement window in windows)
        {
            var bubbles = window.FindAll(TreeScope.Descendants, new PropertyCondition(AutomationElement.ClassNameProperty, CaptionBubbleClass));
            foreach (AutomationElement bubble in bubbles)
            {
                var views = bubble.FindAll(TreeScope.Descendants, new PropertyCondition(AutomationElement.ClassNameProperty, CaptionViewClass));
                foreach (AutomationElement view in views)
                {
                    var value = Normalize(view.Current.Name);
                    if (!string.IsNullOrEmpty(value)) candidates.Add(value);
                }
            }
        }
        return candidates.OrderByDescending(x => x.Length).FirstOrDefault() ?? "";
    }

    private static string Normalize(string value) => string.IsNullOrWhiteSpace(value) ? "" : Whitespace.Replace(value.Trim(), " ");

    private static bool TryAppend(string previous, string current, out string delta)
    {
        delta = "";
        if (string.IsNullOrEmpty(previous)) { delta = current; return true; }
        if (!current.StartsWith(previous, StringComparison.Ordinal)) return false;
        delta = current[previous.Length..].TrimStart();
        return !string.IsNullOrEmpty(delta);
    }

    private static string deltaOrSnapshot(string previous, string current, string delta)
    {
        return TryAppend(previous, current, out var appended) ? appended : current;
    }

    private static int GetInt(string[] args, string name, int fallback, int minimum)
    {
        for (var i = 0; i < args.Length - 1; i++)
            if (args[i].Equals(name, StringComparison.OrdinalIgnoreCase) && int.TryParse(args[i + 1], out var value))
                return Math.Max(minimum, value);
        return fallback;
    }

    private static void Emit(object value)
    {
        var json = JsonSerializer.Serialize(value);
        Console.Out.WriteLine(json);
        Console.Out.Flush();
        try { Transport?.Publish(value); }
        catch (Exception ex) { Console.Error.WriteLine($"Signal Live Caption Bridge | publish error | {ex.Message}"); }
    }
}