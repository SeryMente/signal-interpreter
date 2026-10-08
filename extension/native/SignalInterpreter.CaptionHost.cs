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
                string name = current.Name ?? "";
                string className = current.ClassName ?? "";

                bool looksLikeCaption =
                    className.IndexOf("Chrome_WidgetWin_", StringComparison.OrdinalIgnoreCase) >= 0 &&
                    ContainsCaptionTitle(name);

                if (!looksLikeCaption || current.IsOffscreen)
                    continue;

                visible = true;
                string text = ReadCaptionDescendants(window);
                if (!string.IsNullOrWhiteSpace(text))
                    return text;
            }
            catch
            {
            }
        }

        return "";
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
        var lines = new List<string>();
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
                    if (!String.Equals(typeName, "ControlType.Text", StringComparison.Ordinal) &&
                        !String.Equals(typeName, "ControlType.Document", StringComparison.Ordinal))
                        continue;

                    string text = (current.Name ?? "").Trim();
                    if (String.IsNullOrWhiteSpace(text) || IgnoredText.Contains(text))
                        continue;

                    if (text.Length > 10000)
                        text = text.Substring(text.Length - 10000);

                    if (!lines.Contains(text))
                        lines.Add(text);
                }
                catch
                {
                }
            }
        }
        catch
        {
        }

        int start = Math.Max(0, lines.Count - 16);
        return String.Join(Environment.NewLine, lines.GetRange(start, lines.Count - start)).Trim();
    }

    private static string TrimError(string value)
    {
        string text = value ?? "";
        return text.Length <= 240 ? text : text.Substring(0, 240);
    }
}