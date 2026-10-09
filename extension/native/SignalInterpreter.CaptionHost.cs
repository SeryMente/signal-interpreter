using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Windows.Automation;

internal static class SignalInterpreterCaptionHost
{
    private const string Schema = "signal-caption-native/v1";
    private const int MaxMessageBytes = 1024 * 1024;
    private static readonly string CaptionTitlePattern =
        "Live Caption|Subtítulos instantáneos|Subtítulos automáticos|Subtítulos en directo";

    private static readonly HashSet<string> IgnoredText = new HashSet<string>(
        StringComparer.OrdinalIgnoreCase)
    {
        "Minimizar", "Restaurar", "Cerrar", "Configuración", "Ajustes",
        "Expandir", "Contraer", "Fijar", "Desfijar", "Volver a la pestaña",
        "Back to tab", "Settings", "Expand", "Collapse", "Pin", "Unpin"
    };

    private static readonly object OutputLock = new object();
    private static volatile bool Running = true;
    private static string LastText = "";
    private static bool LastVisible = false;
    private static DateTime LastHeartbeat = DateTime.UtcNow;

    public static void Main(string[] args)
    {
        try
        {
            Send(new { type = "ready", schema = Schema });
        }
        catch
        {
            return;
        }

        var stdinThread = new Thread(ReadInputLoop) { IsBackground = true };
        stdinThread.Start();

        while (Running)
        {
            try
            {
                bool visible;
                string text = FindCaptionText(out visible);

                if (visible != LastVisible)
                {
                    Send(new
                    {
                        type = "status",
                        source = "chrome-live-caption",
                        visible = visible,
                        active = !string.IsNullOrWhiteSpace(text)
                    });
                    LastVisible = visible;
                }

                if (!string.IsNullOrWhiteSpace(text) && !String.Equals(text, LastText, StringComparison.Ordinal))
                {
                    Send(new
                    {
                        type = "caption",
                        source = "chrome-live-caption",
                        visible = true,
                        active = true,
                        text = text
                    });
                    LastText = text;
                }

                if (string.IsNullOrWhiteSpace(text))
                    LastText = "";

                if ((DateTime.UtcNow - LastHeartbeat).TotalSeconds >= 2)
                {
                    Send(new
                    {
                        type = "heartbeat",
                        source = "chrome-live-caption",
                        visible = visible,
                        active = !string.IsNullOrWhiteSpace(text)
                    });
                    LastHeartbeat = DateTime.UtcNow;
                }
            }
            catch (Exception error)
            {
                Send(new
                {
                    type = "status",
                    source = "chrome-live-caption",
                    visible = false,
                    active = false,
                    error = TrimError(error.Message)
                });
            }

            Thread.Sleep(180);
        }
    }

    private static void ReadInputLoop()
    {
        try
        {
            while (Running)
            {
                byte[] payload = ReadNativeMessage();
                if (payload == null)
                {
                    Running = false;
                    return;
                }

                string json = Encoding.UTF8.GetString(payload);
                if (json.IndexOf("\"type\":\"stop\"", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    Running = false;
                    return;
                }
            }
        }
        catch
        {
            Running = false;
        }
    }

    private static byte[] ReadNativeMessage()
    {
        Stream input = Console.OpenStandardInput();
        byte[] header = ReadExact(input, 4);
        if (header == null)
            return null;

        int length = BitConverter.ToInt32(header, 0);
        if (length <= 0 || length > MaxMessageBytes)
            throw new InvalidDataException("Native message size is invalid.");

        return ReadExact(input, length);
    }

    private static byte[] ReadExact(Stream input, int length)
    {
        byte[] buffer = new byte[length];
        int offset = 0;
        while (offset < length)
        {
            int read = input.Read(buffer, offset, length - offset);
            if (read <= 0)
                return null;
            offset += read;
        }
        return buffer;
    }

    private static void Send(object value)
    {
        string json = JsonSerialize(value);
        byte[] payload = Encoding.UTF8.GetBytes(json);
        if (payload.Length > MaxMessageBytes)
            return;

        byte[] header = BitConverter.GetBytes(payload.Length);
        lock (OutputLock)
        {
            Stream output = Console.OpenStandardOutput();
            output.Write(header, 0, header.Length);
            output.Write(payload, 0, payload.Length);
            output.Flush();
        }
    }

    private static string JsonSerialize(object value)
    {
        var props = new List<string>();
        foreach (var property in value.GetType().GetProperties())
        {
            object propertyValue = property.GetValue(value, null);
            props.Add("\"" + property.Name + "\":" + JsonValue(propertyValue));
        }
        return "{" + String.Join(",", props) + "}";
    }

    private static string JsonValue(object value)
    {
        if (value == null)
            return "null";
        if (value is bool)
            return ((bool)value) ? "true" : "false";
        return "\"" + JsonEscape(String.Format(System.Globalization.CultureInfo.InvariantCulture, "{0}", value)) + "\"";
    }

    private static string JsonEscape(string value)
    {
        var sb = new StringBuilder(value.Length + 16);
        foreach (char c in value)
        {
            switch (c)
            {
                case '\\': sb.Append("\\\\"); break;
                case '"': sb.Append("\\\""); break;
                case '\r': sb.Append("\\r"); break;
                case '\n': sb.Append("\\n"); break;
                case '\t': sb.Append("\\t"); break;
                case '\b': sb.Append("\\b"); break;
                case '\f': sb.Append("\\f"); break;
                default:
                    if (c < 32)
                        sb.Append("\\u").Append(((int)c).ToString("x4"));
                    else
                        sb.Append(c);
                    break;
            }
        }
        return sb.ToString();
    }

    private static string FindCaptionText(out bool visible)
    {
        visible = false;
        AutomationElement root = AutomationElement.RootElement;
        AutomationElementCollection windows =
            root.FindAll(TreeScope.Children, Condition.TrueCondition);

        foreach (AutomationElement window in windows)
        {
            try
            {
                AutomationElement.AutomationElementInformation current = window.Current;
                if (current.IsOffscreen)
                    continue;

                string name = current.Name ?? "";
                string className = current.ClassName ?? "";
                bool looksLikeCaption =
                    className.IndexOf("Chrome_WidgetWin_", StringComparison.OrdinalIgnoreCase) >= 0 &&
                    ContainsCaptionTitle(name);

                if (!looksLikeCaption)
                    continue;

                visible = true;
                string text = ReadCaptionDescendants(window);
                if (!String.IsNullOrWhiteSpace(text))
                    return text;
            }
            catch
            {
                // UI Automation can temporarily invalidate elements while Chrome rebuilds the bubble.
            }
        }

        return "";
    }

    private static bool IsCaptionTitleLabel(string text)
    {
        if (String.IsNullOrWhiteSpace(text))
            return false;
        foreach (string token in CaptionTitlePattern.Split('|'))
        {
            if (String.Equals(text.Trim(), token, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    private static bool ContainsCaptionTitle(string name)
    {
        if (String.IsNullOrWhiteSpace(name))
            return false;

        foreach (string token in CaptionTitlePattern.Split('|'))
        {
            if (name.IndexOf(token, StringComparison.OrdinalIgnoreCase) >= 0)
                return true;
        }

        return false;
    }

    private static string ReadCaptionDescendants(AutomationElement window)
    {
        var textNodes = new List<string>();
        var documentNodes = new List<string>();
        try
        {
            AutomationElementCollection nodes =
                window.FindAll(TreeScope.Descendants, Condition.TrueCondition);

            foreach (AutomationElement node in nodes)
            {
                try
                {
                    AutomationElement.AutomationElementInformation current = node.Current;
                    if (current.IsOffscreen)
                        continue;

                    string typeName = current.ControlType.ProgrammaticName ?? "";
                    bool isText = String.Equals(typeName, "ControlType.Text", StringComparison.Ordinal);
                    bool isDocument = String.Equals(typeName, "ControlType.Document", StringComparison.Ordinal);
                    if (!isText && !isDocument)
                        continue;

                    string text = (current.Name ?? "").Trim();
                    if (String.IsNullOrWhiteSpace(text) || IgnoredText.Contains(text) || IsCaptionTitleLabel(text))
                        continue;

                    if (text.Length > 4000)
                        text = text.Substring(text.Length - 4000);

                    List<string> target = isText ? textNodes : documentNodes;
                    if (target.Count == 0 || !String.Equals(target[target.Count - 1], text, StringComparison.Ordinal))
                        target.Add(text);
                }
                catch
                {
                    // Ignore an element invalidated while Chrome updates the caption tree.
                }
            }
        }
        catch
        {
            // UI Automation can temporarily fail while Chrome opens or closes the bubble.
        }

        // Prefer the last leaf text node; parent Document nodes can contain the whole transcript history.
        if (textNodes.Count > 0)
            return textNodes[textNodes.Count - 1];
        if (documentNodes.Count > 0)
            return documentNodes[documentNodes.Count - 1];
        return "";
    }

    private static string TrimError(string value)
    {
        string text = value ?? "";
        return text.Length <= 240 ? text : text.Substring(0, 240);
    }
}