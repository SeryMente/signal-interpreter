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
    private static AutomationElement? CachedCaptionBubble;
    private static int CachedCaptionProcessId;
    private static DateTimeOffset CachedCaptionLookupAt = DateTimeOffset.MinValue;
    private static int CachedCaptionEmptyScans;

    private static void Main(string[] args)
    {
        var intervalMs = GetInt(args, "--interval-ms", 150, 50);
        var stabilityMs = GetInt(args, "--stability-ms", 750, 250);
        var port = GetInt(args, "--port", 8787, 1024);
        var reconciler = new CaptionReconciler(TimeSpan.FromMilliseconds(stabilityMs));
        string? targetWindowTitle = null;
        string? targetOrigin = null;
        int? targetTabId = null;
        int? targetWindowId = null;
        string? targetSessionId = null;
        string? targetTraceId = null;
        var targetContextVersion = 0;
        var sequence = 0L;
        var found = false;
        var previousRawSnapshot = "";

        try
        {
            Transport = new LocalTransport(port);
            Transport.CaptionContextChanged += context =>
            {
                targetSessionId = string.IsNullOrWhiteSpace(context.SessionId) ? null : context.SessionId;
                targetTraceId = string.IsNullOrWhiteSpace(context.TraceId) ? null : context.TraceId;
                targetTabId = context.SourceTabId;
                targetWindowId = context.SourceWindowId;
                targetWindowTitle = string.IsNullOrWhiteSpace(context.SourceTitle) ? null : context.SourceTitle.Trim();
                targetOrigin = string.IsNullOrWhiteSpace(context.SourceOrigin) ? null : context.SourceOrigin.Trim();
                targetContextVersion = context.ContextVersion;
                reconciler.Reset();
                found = false;
                previousRawSnapshot = "";
                Console.Error.WriteLine($"Signal Live Caption Bridge | context | session={targetSessionId ?? "none"} | tab={targetTabId?.ToString() ?? "none"} | window={targetWindowId?.ToString() ?? "none"} | title={(targetWindowTitle ?? "none")} | origin={(targetOrigin ?? "none")}");
            };
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

        var scanSequence = 0L;
        var lastDiagnosticAt = DateTimeOffset.MinValue;

        while (true)
        {
            try
            {
                var now = DateTimeOffset.UtcNow;
                var scan = ReadCaptionDiagnostics(targetWindowTitle, targetOrigin, targetTabId, targetWindowId, targetSessionId, targetTraceId, targetContextVersion);
                var snapshot = scan.Text;

                if (now - lastDiagnosticAt >= TimeSpan.FromSeconds(5))
                {
                    Emit(new
                    {
                        type = "uia.scan",
                        chromeWindows = scan.ChromeWindows,
                        captionBubbles = scan.CaptionBubbles,
                        captionViews = scan.CaptionViews,
                        nonEmptyViews = scan.NonEmptyViews,
                        longestTextLength = scan.LongestTextLength,
                        matchedChromeWindows = scan.MatchedChromeWindows,
                        targetWindowTitle = scan.TargetWindowTitle,
                        targetOrigin = scan.TargetOrigin,
                        sessionId = scan.SessionId,
                        traceId = scan.TraceId,
                        sourceTabId = scan.SourceTabId,
                        sourceWindowId = scan.SourceWindowId,
                        contextVersion = scan.ContextVersion,
                        sequence = ++scanSequence,
                        timestamp = now
                    });
                    lastDiagnosticAt = now;
                }

                if (!string.IsNullOrWhiteSpace(snapshot))
                {
                    var normalizedSnapshot = Normalize(snapshot);
                    if (scan.MatchedChromeWindows != 1 || string.IsNullOrWhiteSpace(scan.SessionId))
                    {
                        if (scan.MatchedChromeWindows > 1 && found)
                        {
                            Emit(new { type = "caption.status", status = "ambiguous", sessionId = scan.SessionId, traceId = scan.TraceId, sourceTabId = scan.SourceTabId, sourceWindowId = scan.SourceWindowId, sourceOrigin = scan.TargetOrigin, targetWindowTitle = scan.TargetWindowTitle, timestamp = now, sequence = ++sequence });
                            found = false;
                            reconciler.Reset();
                            previousRawSnapshot = "";
                        }
                        Thread.Sleep(intervalMs);
                        continue;
                    }
                    if (!found)
                    {
                        Emit(new { type = "caption.status", status = "found", sessionId=scan.SessionId, traceId=scan.TraceId, sourceTabId=scan.SourceTabId, sourceWindowId=scan.SourceWindowId, sourceOrigin=scan.TargetOrigin, targetWindowTitle=scan.TargetWindowTitle, timestamp = now, sequence = ++sequence });
                        found = true;
                    }

                    foreach (var segment in reconciler.Observe(normalizedSnapshot, now))
                    {
                        Emit(new
                        {
                            type = "caption.segment", mode = "final", source = "live-caption", sessionId = scan.SessionId, traceId = scan.TraceId, sourceTabId = scan.SourceTabId, sourceWindowId = scan.SourceWindowId, sourceOrigin = scan.TargetOrigin, targetWindowTitle = scan.TargetWindowTitle,
                            reason = segment.Reason, text = segment.Text, snapshot = segment.Snapshot,
                            timestamp = now, sequence = ++sequence
                        });
                    }

                    if (!string.Equals(normalizedSnapshot, previousRawSnapshot, StringComparison.Ordinal))
                    {
                        var append = TryAppend(previousRawSnapshot, normalizedSnapshot, out var delta);
                        Emit(new
                        {
                            type = append ? "caption.delta" : "caption.revision", sessionId = scan.SessionId, traceId = scan.TraceId, sourceTabId = scan.SourceTabId, sourceWindowId = scan.SourceWindowId, sourceOrigin = scan.TargetOrigin,
                            mode = append ? "append" : "replace",
                            text = append ? delta : normalizedSnapshot,
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
                    Emit(new { type = "caption.status", status = "not_found", sessionId = scan.SessionId, traceId = scan.TraceId, sourceTabId = scan.SourceTabId, sourceWindowId = scan.SourceWindowId, sourceOrigin = scan.TargetOrigin, targetWindowTitle = scan.TargetWindowTitle, timestamp = DateTimeOffset.UtcNow, sequence = ++sequence });
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

    private sealed record CaptionScan(string Text, int ChromeWindows, int CaptionBubbles, int CaptionViews, int NonEmptyViews, int LongestTextLength, int MatchedChromeWindows, string? TargetWindowTitle, string? TargetOrigin, string? SessionId, string? TraceId, int? SourceTabId, int? SourceWindowId, int ContextVersion);

    private static CaptionScan ReadCaptionDiagnostics(string? targetWindowTitle, string? targetOrigin, int? sourceTabId, int? sourceWindowId, string? sessionId, string? traceId, int contextVersion)
    {
        var root = AutomationElement.RootElement;
        var windows = root.FindAll(TreeScope.Children, new PropertyCondition(AutomationElement.ClassNameProperty, ChromeWindowClass));
        var candidates = new List<string>();
        var bubbleCount = 0;
        var viewCount = 0;
        var nonEmpty = 0;
        var longest = 0;
        var matchedWindows = 0;
        var targetProcessId = 0;

        foreach (AutomationElement window in windows)
        {
            var windowName = "";
            try { windowName = NormalizeTitle(window.Current.Name); } catch { }
            if (!string.IsNullOrWhiteSpace(targetWindowTitle) && MatchesWindowTitle(windowName, targetWindowTitle))
            {
                matchedWindows++;
                try { targetProcessId = window.Current.ProcessId; } catch { targetProcessId = 0; }
                var legacyBubble = window.FindFirst(TreeScope.Descendants, new PropertyCondition(AutomationElement.ClassNameProperty, CaptionBubbleClass));
                if (legacyBubble is not null)
                {
                    CachedCaptionBubble = legacyBubble;
                    CachedCaptionProcessId = targetProcessId;
                    CachedCaptionLookupAt = DateTimeOffset.UtcNow;
                    CachedCaptionEmptyScans = 0;
                    CollectCaptionElement(legacyBubble, candidates, ref bubbleCount, ref viewCount, ref nonEmpty, ref longest);
                }
            }
        }

        if (targetProcessId == 0 || CachedCaptionProcessId != targetProcessId)
        {
            CachedCaptionBubble = null;
            CachedCaptionProcessId = targetProcessId;
            CachedCaptionLookupAt = DateTimeOffset.MinValue;
            CachedCaptionEmptyScans = 0;
        }

        var now = DateTimeOffset.UtcNow;
        if (CachedCaptionBubble is not null)
        {
            try
            {
                var bubbleProcessId = CachedCaptionBubble.Current.ProcessId;
                var bubbleName = Normalize(CachedCaptionBubble.Current.Name);
                var offscreen = CachedCaptionBubble.Current.IsOffscreen;
                if (bubbleProcessId == targetProcessId && !offscreen && !string.IsNullOrEmpty(bubbleName))
                {
                    CollectCaptionElement(CachedCaptionBubble, candidates, ref bubbleCount, ref viewCount, ref nonEmpty, ref longest);
                    CachedCaptionEmptyScans = 0;
                }
                else
                {
                    CachedCaptionEmptyScans++;
                    if (CachedCaptionEmptyScans >= 5)
                    {
                        CachedCaptionBubble = null;
                        CachedCaptionLookupAt = DateTimeOffset.MinValue;
                        CachedCaptionEmptyScans = 0;
                    }
                }
            }
            catch
            {
                CachedCaptionBubble = null;
                CachedCaptionLookupAt = DateTimeOffset.MinValue;
                CachedCaptionEmptyScans = 0;
            }
        }

        if (CachedCaptionBubble is null && targetProcessId != 0 && now - CachedCaptionLookupAt >= TimeSpan.FromMilliseconds(500))
        {
            CachedCaptionLookupAt = now;
            try
            {
                var bubbleCondition = new PropertyCondition(AutomationElement.ClassNameProperty, CaptionBubbleClass);
                var bubble = root.FindFirst(TreeScope.Descendants, bubbleCondition);
                if (bubble is not null && bubble.Current.ProcessId == targetProcessId)
                {
                    CachedCaptionBubble = bubble;
                    CachedCaptionProcessId = targetProcessId;
                    CachedCaptionEmptyScans = 0;
                    CollectCaptionElement(bubble, candidates, ref bubbleCount, ref viewCount, ref nonEmpty, ref longest);
                }
            }
            catch { }
        }

        return new CaptionScan(
            candidates.OrderByDescending(x => x.Length).FirstOrDefault() ?? "",
            windows.Count, bubbleCount, viewCount, nonEmpty, longest, matchedWindows, targetWindowTitle, targetOrigin, sessionId, traceId, sourceTabId, sourceWindowId, contextVersion);
    }
    private static void CollectCaptionElement(AutomationElement bubble, List<string> candidates, ref int bubbleCount, ref int viewCount, ref int nonEmpty, ref int longest)
    {
        bubbleCount++;
        var bubbleText = Normalize(bubble.Current.Name);
        if (!string.IsNullOrEmpty(bubbleText))
        {
            nonEmpty++;
            longest = Math.Max(longest, bubbleText.Length);
            candidates.Add(bubbleText);
            return;
        }

        var view = bubble.FindFirst(TreeScope.Descendants, new PropertyCondition(AutomationElement.ClassNameProperty, CaptionViewClass));
        if (view is not null)
        {
            viewCount++;
            var value = Normalize(view.Current.Name);
            if (!string.IsNullOrEmpty(value))
            {
                nonEmpty++;
                longest = Math.Max(longest, value.Length);
                candidates.Add(value);
            }
        }
    }
    private static string NormalizeTitle(string value)
        => string.IsNullOrWhiteSpace(value) ? "" : Regex.Replace(value.Trim(), @"\s+", " ");

    private static bool MatchesWindowTitle(string currentName, string targetName)
    {
        currentName = NormalizeTitle(currentName);
        targetName = NormalizeTitle(targetName);
        if (string.IsNullOrWhiteSpace(currentName) || string.IsNullOrWhiteSpace(targetName)) return false;
        return currentName.Equals(targetName, StringComparison.OrdinalIgnoreCase)
            || currentName.Contains(targetName, StringComparison.OrdinalIgnoreCase)
            || targetName.Contains(currentName, StringComparison.OrdinalIgnoreCase);
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
