$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$CaptionTitlePattern = '(?i)(Live Caption|Subtítulos instantáneos|Subtítulos automáticos|Subtítulos en directo)'
$IgnoredControlTextPattern = '(?i)^(Minimizar|Restaurar|Cerrar|Configuración|Ajustes|Expandir|Contraer|Fijar|Desfijar|Volver a la pestaña|Back to tab|Settings|Expand|Collapse|Pin|Unpin)$'

function Send-Event([hashtable]$Data) {
  $Data['schema'] = 'signal-caption-native/v1'
  $Data['timestamp'] = (Get-Date).ToUniversalTime().ToString('o')
  $json = $Data | ConvertTo-Json -Compress -Depth 8
  Write-Output $json
  [Console]::Out.Flush()
}

function Get-CaptionWindows {
  $root = [System.Windows.Automation.AutomationElement]::RootElement
  $windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)
  foreach ($window in $windows) {
    try {
      $name = [string]$window.Current.Name
      $class = [string]$window.Current.ClassName
      if ($class -eq 'Chrome_WidgetWin_1' -and $name -match $CaptionTitlePattern -and -not $window.Current.IsOffscreen) {
        $window
      }
    } catch {}
  }
}

function Get-CaptionText([System.Windows.Automation.AutomationElement]$Window) {
  $names = New-Object System.Collections.Generic.List[string]
  try {
    $nodes = $Window.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($node in $nodes) {
      try {
        if ($node.Current.IsOffscreen) { continue }
        $type = [string]$node.Current.ControlType.ProgrammaticName
        if ($type -ne 'ControlType.Text' -and $type -ne 'ControlType.Document') { continue }
        $text = ([string]$node.Current.Name).Trim()
        if ([string]::IsNullOrWhiteSpace($text)) { continue }
        if ($text -match $IgnoredControlTextPattern) { continue }
        if ($text.Length -gt 10000) { $text = $text.Substring($text.Length - 10000) }
        if (-not $names.Contains($text)) { [void]$names.Add($text) }
      } catch {}
    }
  } catch {}
  return (($names | Select-Object -Last 16) -join [Environment]::NewLine).Trim()
}

$lastText = ''
$lastVisible = $false
$lastHeartbeat = Get-Date

while ($true) {
  $visible = $false
  $text = ''
  try {
    $captionWindows = @(Get-CaptionWindows)
    foreach ($window in $captionWindows) {
      $candidate = Get-CaptionText $window
      if ($candidate) { $text = $candidate; $visible = $true; break }
      $visible = $true
    }
  } catch {}

  if ($visible -ne $lastVisible) {
    Send-Event @{ type='status'; source='chrome-live-caption'; visible=$visible; active=[bool]$text }
    $lastVisible = $visible
  }

  if ($text -and $text -ne $lastText) {
    Send-Event @{ type='caption'; source='chrome-live-caption'; visible=$true; active=$true; text=$text }
    $lastText = $text
  }

  if (-not $text -and $lastText) { $lastText = '' }

  if (((Get-Date) - $lastHeartbeat).TotalSeconds -ge 2) {
    Send-Event @{ type='heartbeat'; source='chrome-live-caption'; visible=$visible; active=[bool]$text }
    $lastHeartbeat = Get-Date
  }

  Start-Sleep -Milliseconds 180
}
