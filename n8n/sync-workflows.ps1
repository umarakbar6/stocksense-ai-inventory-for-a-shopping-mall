$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"
if (-not (Test-Path -LiteralPath $envFile)) { throw "Missing local environment file: $envFile" }
foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process") }
}
if ([string]::IsNullOrWhiteSpace($env:N8N_ENCRYPTION_KEY)) { throw "N8N_ENCRYPTION_KEY is not configured." }
if ([string]::IsNullOrWhiteSpace($env:N8N_USER_FOLDER)) {
  $env:N8N_USER_FOLDER = Join-Path $PSScriptRoot "data"
}

$command = Join-Path $env:APPDATA "npm\n8n.cmd"
if (-not (Test-Path -LiteralPath $command)) {
  $command = Join-Path $PSScriptRoot "node_modules\.bin\n8n.cmd"
}
if (-not (Test-Path -LiteralPath $command)) { throw "The pinned n8n CLI is not installed locally or globally." }
foreach ($workflow in Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot "workflows") -Filter "*.json" | Sort-Object Name) {
  & $command import:workflow "--input=$($workflow.FullName)"
  if ($LASTEXITCODE -ne 0) { throw "Failed to import $($workflow.Name)." }
}
foreach ($id in @("stocksense-wf01-chat-router", "stocksense-wf02-grounded-read", "stocksense-wf03-prepare-movement", "stocksense-wf04-error-handler")) {
  & $command publish:workflow --id=$id
  if ($LASTEXITCODE -ne 0) { throw "Failed to publish workflow $id." }
  & $command update:workflow --id=$id --active=true
  if ($LASTEXITCODE -ne 0) { throw "Failed to activate workflow $id." }
}
