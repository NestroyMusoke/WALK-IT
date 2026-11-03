param([Parameter(Mandatory=$true)][string]$CapturePath)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$python = Join-Path $root '.venv\Scripts\python.exe'
$config = Join-Path $root 'config\vision.yaml'
$capture = (Resolve-Path -LiteralPath $CapturePath).Path
$output = Join-Path $root 'eval\sessions\tomorrow-marker-preflight.json'
if (-not (Test-Path -LiteralPath $python)) { throw 'Project Python environment missing.' }
Push-Location $root
try {
    & $python -m geometry.marker_preflight --input $capture --config $config --output $output
    if ($LASTEXITCODE -ne 0) { throw "Marker preflight failed ($LASTEXITCODE)" }
    Write-Output "Private detail saved: $output"
} finally { Pop-Location }
