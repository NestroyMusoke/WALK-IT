$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    $imagePath = Join-Path (Get-Location) 'eval\sessions\e05-destination.png'
    if (-not (Test-Path -LiteralPath $imagePath)) { throw "Reviewed image missing: $imagePath" }
    $secureKey = Read-Host 'Paste your Meta Model API key (input is hidden)' -AsSecureString
    $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    try { $env:MODEL_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer) }
    try {
        & '.\.venv\Scripts\python.exe' -m geometry.e05_sam_smoke --image $imagePath --concept 'wooden door' --reviewed-and-masked --credit-confirmed
        if ($LASTEXITCODE -ne 0) { throw "SAM smoke failed with exit code $LASTEXITCODE" }
    } finally { Remove-Item Env:MODEL_API_KEY -ErrorAction SilentlyContinue }
} finally { Pop-Location }
