$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    $imagePath = Join-Path (Get-Location) 'eval\sessions\e05-destination.png'
    if (-not (Test-Path -LiteralPath $imagePath)) {
        throw "Place a permitted, reviewed, masked image at $imagePath first."
    }
    $secureKey = Read-Host 'Paste your Baseten API key (input is hidden)' -AsSecureString
    $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    try {
        $env:BASETEN_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
    }
    try {
        & '.\.venv\Scripts\python.exe' -m geometry.e05_model_smoke --image $imagePath --reviewed-and-masked --credit-confirmed
        if ($LASTEXITCODE -ne 0) { throw "E05 smoke failed with exit code $LASTEXITCODE" }
    } finally {
        Remove-Item Env:BASETEN_API_KEY -ErrorAction SilentlyContinue
    }
} finally {
    Pop-Location
}
