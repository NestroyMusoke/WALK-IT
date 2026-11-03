$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$python = Join-Path $root '.venv\Scripts\python.exe'
$author = Join-Path $root 'eval\sessions\e11d-3l-2-aggressive-map\capture.json'
$map = Join-Path $root 'eval\sessions\e11d-3l-2-aggressive-map\capture-tracks-window3-filtered.json'
$visitor = Join-Path $root 'eval\sessions\e11d-2f-visitor-start-scan-capture.json'
$mapConfig = Join-Path $root 'config\experiments\aggressive_sift.yaml'
$captureConfig = Join-Path $root 'config\archive\vision-bc637537a3463edb1b3554da8e3d3a908acc8d96202e403430e4ad7d1ab5742f.yaml'
foreach ($path in @($python, $author, $map, $visitor, $mapConfig, $captureConfig)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Private local repro input missing: $path. No shareable capture is bundled."
    }
}
Push-Location $root
try {
    & $python -m geometry.replay_repro --author $author --map $map --visitor $visitor --map-config $mapConfig --capture-config $captureConfig
    if ($LASTEXITCODE -ne 0) { throw "Replay repro failed ($LASTEXITCODE)" }
} finally { Pop-Location }
