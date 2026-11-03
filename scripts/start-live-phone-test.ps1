$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$node = (Get-Command node -ErrorAction Stop).Source
$tunnel = (Get-Command cloudflared -ErrorAction Stop).Source
$access = Join-Path $root 'tmp\phone-access.json'
$baseFile = Join-Path $root 'tmp\phone-link.txt'

function Test-PhoneServer {
    try { return (Invoke-WebRequest -Uri 'http://127.0.0.1:5180/live.html' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 }
    catch { return $false }
}

if (-not (Test-PhoneServer)) {
    $out = Join-Path $root 'tmp\phone-server-user-out.log'
    $err = Join-Path $root 'tmp\phone-server-user-err.log'
    Start-Process -FilePath $node -ArgumentList @('server/phone-server.ts') -WorkingDirectory $root `
        -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden | Out-Null
    $ready = $false
    for ($i=0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-PhoneServer) { $ready = $true; break }
    }
    if (-not $ready) { throw 'Phone server did not start. See tmp\phone-server-user-err.log.' }
}

if (-not (Test-Path -LiteralPath $access)) { throw 'Protected phone access file is missing.' }
$key = (Get-Content -Raw -LiteralPath $access | ConvertFrom-Json).accessKey
if ($key -notmatch '^[a-f0-9]{48}$') { throw 'Invalid protected phone access key.' }

Write-Host 'Tunnel starting. Leave this PowerShell window open while testing.'
& $tunnel tunnel --url http://127.0.0.1:5180 --no-autoupdate --protocol quic 2>&1 | ForEach-Object {
    $line = [string]$_
    if ($line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        $base = $Matches[0]
        [System.IO.File]::WriteAllText($baseFile,$base)
        Write-Host "OPEN THIS IN IPHONE SAFARI: $base/live.html#key=$key"
    }
    Write-Host $line
}
