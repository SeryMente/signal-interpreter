using System.Text.RegularExpressions;

internal sealed record CaptionSegment(string Text, string Snapshot, string Reason);

internal sealed class CaptionReconciler
{
    private static readonly Regex WhitespacePattern = new(@"\s+", RegexOptions.Compiled);
    private readonly TimeSpan _stabilityWindow;
    private string _pendingSnapshot = "";
    private DateTimeOffset _pendingSince = DateTimeOffset.MinValue;
    private string _lastEmittedSnapshot = "";

    public CaptionReconciler(TimeSpan stabilityWindow)
    {
        if (stabilityWindow < TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(stabilityWindow));
        _stabilityWindow = stabilityWindow;
    }

    public void Reset()
    {
        _pendingSnapshot = "";
        _pendingSince = DateTimeOffset.MinValue;
        _lastEmittedSnapshot = "";
    }

    public IReadOnlyList<CaptionSegment> Observe(string snapshot, DateTimeOffset now)
    {
        snapshot = Normalize(snapshot);
        if (string.IsNullOrEmpty(snapshot)) return Array.Empty<CaptionSegment>();
        if (!string.Equals(snapshot, _pendingSnapshot, StringComparison.Ordinal))
        {
            _pendingSnapshot = snapshot;
            _pendingSince = now;
            return Array.Empty<CaptionSegment>();
        }
        if (now - _pendingSince < _stabilityWindow) return Array.Empty<CaptionSegment>();
        return EmitStable(snapshot, "stable");
    }

    public IReadOnlyList<CaptionSegment> Flush(DateTimeOffset now, string reason)
    {
        if (string.IsNullOrEmpty(_pendingSnapshot)) return Array.Empty<CaptionSegment>();
        return EmitStable(_pendingSnapshot, reason);
    }

    private IReadOnlyList<CaptionSegment> EmitStable(string snapshot, string reason)
    {
        if (string.Equals(snapshot, _lastEmittedSnapshot, StringComparison.Ordinal)) return Array.Empty<CaptionSegment>();
        if (!string.IsNullOrEmpty(_lastEmittedSnapshot) && _lastEmittedSnapshot.StartsWith(snapshot, StringComparison.Ordinal))
        {
            _pendingSnapshot = snapshot;
            _pendingSince = DateTimeOffset.MaxValue;
            return Array.Empty<CaptionSegment>();
        }
        var text = snapshot;
        var finalReason = reason;
        if (!string.IsNullOrEmpty(_lastEmittedSnapshot) && snapshot.StartsWith(_lastEmittedSnapshot, StringComparison.Ordinal))
        {
            text = snapshot[_lastEmittedSnapshot.Length..].TrimStart();
            finalReason = reason == "stable" ? "stable-append" : reason;
        }
        else if (!string.IsNullOrEmpty(_lastEmittedSnapshot))
        {
            finalReason = reason == "stable" ? "stable-revision" : reason;
        }
        _lastEmittedSnapshot = snapshot;
        _pendingSnapshot = snapshot;
        _pendingSince = DateTimeOffset.MaxValue;
        return string.IsNullOrWhiteSpace(text) ? Array.Empty<CaptionSegment>() : new[] { new CaptionSegment(text, snapshot, finalReason) };
    }

    private static string Normalize(string value)
        => string.IsNullOrWhiteSpace(value) ? "" : WhitespacePattern.Replace(value.Trim(), " ");
}
