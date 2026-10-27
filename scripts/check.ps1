$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    npm run check
    if ($LASTEXITCODE -ne 0) { throw 'WALK IT checks failed' }
} finally { Pop-Location }
