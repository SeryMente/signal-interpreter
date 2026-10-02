using System.Diagnostics;
using System.Text;
using System.Text.Json;

const string Repo = "SeryMente/signal-interpreter";
const string Path = "diagnostics/latest.json";
const long MaxInputBytes = 64L * 1024 * 1024;
const long MaxDiagnosticBytes = 12L * 1024 * 1024;

try
{
    var callerOrigin = args.Length > 0 ? args[0] : "";
    ValidateCaller(callerOrigin);
    using var stdin = Console.OpenStandardInput();
    var lengthBytes = new byte[4];
    await ReadExactAsync(stdin, lengthBytes);
    var length = BitConverter.ToInt32(lengthBytes, 0);
    if (length <= 0 || length > MaxInputBytes) throw new InvalidOperationException("Mensaje nativo fuera de rango.");
    var payloadBytes = new byte[length];
    await ReadExactAsync(stdin, payloadBytes);
    using var doc = JsonDocument.Parse(Encoding.UTF8.GetString(payloadBytes));
    var root = doc.RootElement;
    if (!root.TryGetProperty("repository", out var repoProp) || repoProp.GetString() != Repo)
        throw new InvalidOperationException("Repositorio no autorizado.");
    if (!root.TryGetProperty("path", out var pathProp) || pathProp.GetString() != Path)
        throw new InvalidOperationException("Ruta de diagnóstico no autorizada.");
    if (!root.TryGetProperty("diagnostic", out var diagnostic))
        throw new InvalidOperationException("Falta el diagnóstico.");
    var diagnosticJson = JsonSerializer.Serialize(diagnostic, new JsonSerializerOptions { WriteIndented = true });
    var diagnosticBytes = Encoding.UTF8.GetBytes(diagnosticJson);
    if (diagnosticBytes.LongLength > MaxDiagnosticBytes)
        throw new InvalidOperationException("El diagnóstico excede el límite permitido.");

    var tempPayload = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "signal-observability-" + Guid.NewGuid().ToString("N") + ".json");
    try
    {
        var sha = await TryGetCurrentShaAsync();
        var request = new Dictionary<string, object?>
        {
            ["message"] = "chore: update latest development observability",
            ["content"] = Convert.ToBase64String(diagnosticBytes)
        };
        if (!string.IsNullOrWhiteSpace(sha)) request["sha"] = sha;
        await File.WriteAllTextAsync(tempPayload, JsonSerializer.Serialize(request), new UTF8Encoding(false));
        var output = await RunGhAsync($"api repos/{Repo}/contents/{Path} --method PUT --input {tempPayload}");
        using var responseDoc = JsonDocument.Parse(output);
        string? commitUrl = null;
        if (responseDoc.RootElement.TryGetProperty("commit", out var commit) &&
            commit.TryGetProperty("html_url", out var html))
            commitUrl = html.GetString();
        WriteMessage(new { ok = true, commit = commitUrl });
    }
    finally
    {
        try { File.Delete(tempPayload); } catch { }
    }
}
catch (Exception ex)
{
    Console.Error.WriteLine("SIGNAL_OBSERVABILITY_HOST_ERROR: " + ex.Message);
    try { WriteMessage(new { ok = false, error = ex.Message }); } catch { }
}

static async Task<string> TryGetCurrentShaAsync()
{
    try
    {
        var output = await RunGhAsync($"api repos/{Repo}/contents/{Path} --jq .sha");
        var sha = output.Trim();
        return sha.Length > 0 ? sha : "";
    }
    catch { return ""; }
}

static async Task<string> RunGhAsync(string arguments)
{
    var psi = new ProcessStartInfo
    {
        FileName = "gh.exe",
        UseShellExecute = false,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        CreateNoWindow = true
    };
    foreach (var argument in ParseArgs(arguments)) psi.ArgumentList.Add(argument);
    using var process = Process.Start(psi) ?? throw new InvalidOperationException("No se pudo iniciar gh.exe.");
    var stdout = await process.StandardOutput.ReadToEndAsync();
    var stderr = await process.StandardError.ReadToEndAsync();
    await process.WaitForExitAsync();
    if (process.ExitCode != 0)
        throw new InvalidOperationException(string.IsNullOrWhiteSpace(stderr) ? "gh api falló." : stderr.Trim());
    return stdout;
}

static void ValidateCaller(string origin)
{
    if (!origin.StartsWith("chrome-extension://", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Origen del llamador no autorizado.");
    var manifestPath = System.IO.Path.Combine(AppContext.BaseDirectory, "com.serymente.signal_interpreter.observability.json");
    if (!File.Exists(manifestPath)) throw new InvalidOperationException("No existe el manifiesto del host.");
    using var doc = JsonDocument.Parse(File.ReadAllText(manifestPath));
    var allowed = doc.RootElement.GetProperty("allowed_origins").EnumerateArray()
        .Select(x => x.GetString()).Where(x => x != null).ToArray();
    if (!allowed.Contains(origin, StringComparer.OrdinalIgnoreCase))
        throw new InvalidOperationException("El ID de extensión no coincide con el host instalado.");
}

static string Quote(string value) => "\"" + value.Replace("\"", "\\\\"") + "\"";

static async Task ReadExactAsync(Stream stream, byte[] buffer)
{
    var offset = 0;
    while (offset < buffer.Length)
    {
        var read = await stream.ReadAsync(buffer.AsMemory(offset, buffer.Length - offset));
        if (read == 0) throw new EndOfStreamException("Canal nativo cerrado prematuramente.");
        offset += read;
    }
}

static void WriteMessage(object value)
{
    var json = JsonSerializer.Serialize(value);
    var bytes = Encoding.UTF8.GetBytes(json);
    using var stdout = Console.OpenStandardOutput();
    stdout.Write(BitConverter.GetBytes(bytes.Length));
    stdout.Write(bytes);
    stdout.Flush();
}
