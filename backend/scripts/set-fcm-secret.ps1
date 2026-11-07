# Stores the Firebase service-account key as the FCM_SERVICE_ACCOUNT_B64
# Supabase secret, so the server can send push notifications.
#
#   powershell -ExecutionPolicy Bypass -File backend\scripts\set-fcm-secret.ps1 -Path "C:\Users\you\Downloads\revyne-234e1-firebase-adminsdk-xxxx.json"
#
# The key never appears on screen: it is read from the file, base64-encoded and
# handed straight to the Supabase CLI. Delete the downloaded file afterwards.
param([Parameter(Mandatory = $true)][string]$Path)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $Path)) { throw "File not found: $Path" }

$json = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8) | ConvertFrom-Json
if ($json.type -ne "service_account" -or -not $json.private_key -or -not $json.client_email) {
  throw "This doesn't look like a Firebase service-account key file."
}

$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($Path))
Push-Location (Join-Path $PSScriptRoot "..")
try {
  npx --no-install supabase secrets set "FCM_SERVICE_ACCOUNT_B64=$b64" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "supabase secrets set failed" }
} finally {
  Pop-Location
}
Write-Host "Saved FCM key for $($json.client_email) (project $($json.project_id))."
Write-Host "You can now delete $Path"
