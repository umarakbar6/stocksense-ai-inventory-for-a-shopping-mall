$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path -LiteralPath $envFile)) { throw "Missing approved local environment file: $envFile" }
foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
  }
}

if ([string]::IsNullOrWhiteSpace($env:AGENT_SERVICE_SECRET)) { throw "AGENT_SERVICE_SECRET is not configured in .env.local." }
if ([string]::IsNullOrWhiteSpace($env:N8N_ENCRYPTION_KEY)) { throw "N8N_ENCRYPTION_KEY is not configured in .env.local." }
$env:GEMINI_MODEL = if ($env:GEMINI_MODEL) { $env:GEMINI_MODEL } else { "gemini-flash-lite-latest" }
$env:BACKEND_INTERNAL_URL = "http://127.0.0.1:3000/internal/v1/agent-tools"
$env:N8N_BLOCK_ENV_ACCESS_IN_NODE = "false"
$env:N8N_COMMUNITY_PACKAGES_ENABLED = "false"
$env:N8N_PUBLIC_API_DISABLED = "true"
$env:N8N_PUBLIC_API_SWAGGERUI_DISABLED = "true"
$env:NODES_EXCLUDE = '["n8n-nodes-base.executeCommand","n8n-nodes-base.localFileTrigger","n8n-nodes-base.readWriteFile"]'
$env:N8N_DIAGNOSTICS_ENABLED = "false"
$env:N8N_VERSION_NOTIFICATIONS_ENABLED = "false"
$env:N8N_TEMPLATES_ENABLED = "false"
$env:N8N_PERSONALIZATION_ENABLED = "false"
$env:N8N_PORT = "5678"
$env:N8N_LISTEN_ADDRESS = "127.0.0.1"
$env:GENERIC_TIMEZONE = "Asia/Karachi"
$env:TZ = "Asia/Karachi"
if ([string]::IsNullOrWhiteSpace($env:N8N_USER_FOLDER)) {
  $env:N8N_USER_FOLDER = Join-Path $PSScriptRoot "data"
}

$localN8n = Join-Path $PSScriptRoot "node_modules\n8n\bin\n8n"
if (-not (Test-Path -LiteralPath $localN8n)) {
  throw "Install the pinned local n8n runtime with npm install --prefix n8n before startup."
}
& node $localN8n start
