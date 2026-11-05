param([int]$DatabasePort = 55432, [switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $projectRoot
$runtimePath = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Force -Path $runtimePath | Out-Null

function Assert-NativeSuccess([string]$Step) {
    if ($LASTEXITCODE -ne 0) { throw "$Step failed (exit $LASTEXITCODE)." }
}
function Stop-OwnedProcess([string]$PidFile, [string]$Signature) {
    if (!(Test-Path -LiteralPath $PidFile)) { return }
    $ownedId = [int](Get-Content -LiteralPath $PidFile)
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$ownedId"
    if ($process -and $process.CommandLine.Contains($Signature)) {
        Stop-Process -Id $ownedId
        Wait-Process -Id $ownedId -Timeout 10 -ErrorAction SilentlyContinue
    }
}

$pgCommand = Get-Command pg_ctl.exe -ErrorAction SilentlyContinue
if ($pgCommand) { $pgBin = Split-Path $pgCommand.Source }
else {
    $pgInstall = Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles 'PostgreSQL') -Directory -ErrorAction SilentlyContinue |
        Sort-Object { [int]$_.Name } -Descending | Select-Object -First 1
    if (!$pgInstall) { throw 'Install PostgreSQL, or use the Docker Compose instructions in README.md.' }
    $pgBin = Join-Path $pgInstall.FullName 'bin'
}
$clusterPath = Join-Path $runtimePath 'pgdata'
if (!(Test-Path -LiteralPath (Join-Path $clusterPath 'PG_VERSION'))) {
    & (Join-Path $pgBin 'initdb.exe') -D $clusterPath -U hackathon -A trust --encoding=UTF8 --locale=C
    Assert-NativeSuccess 'Database initialization'
}
& (Join-Path $pgBin 'pg_ctl.exe') -D $clusterPath status *> $null
if ($LASTEXITCODE -ne 0) {
    & (Join-Path $pgBin 'pg_ctl.exe') -D $clusterPath -l (Join-Path $runtimePath 'postgres.log') -o "-p $DatabasePort -h 127.0.0.1" start
    Assert-NativeSuccess 'PostgreSQL startup'
}
$existingDb = & (Join-Path $pgBin 'psql.exe') -h 127.0.0.1 -p $DatabasePort -U hackathon -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='hackathon_hub'"
Assert-NativeSuccess 'PostgreSQL connection'
if ($existingDb -notcontains '1') {
    & (Join-Path $pgBin 'createdb.exe') -h 127.0.0.1 -p $DatabasePort -U hackathon hackathon_hub
    Assert-NativeSuccess 'Database creation'
}

if (!$SkipBuild) {
    & (Join-Path $projectRoot 'mvnw.cmd') -B -q verify
    Assert-NativeSuccess 'Backend verification'
    Push-Location (Join-Path $projectRoot 'frontend')
    try {
        if (!(Test-Path -LiteralPath 'node_modules')) { npm ci; Assert-NativeSuccess 'Frontend dependency installation' }
        npm test
        Assert-NativeSuccess 'Frontend component tests'
        npm run build
        Assert-NativeSuccess 'Frontend build'
    } finally { Pop-Location }
}
if (!(Test-Path -LiteralPath 'backend/target/backend-1.0.0.jar')) { throw 'Build the backend first, or omit -SkipBuild.' }
if (!(Test-Path -LiteralPath 'frontend/node_modules/vite/bin/vite.js')) { throw 'Run npm ci in frontend, or omit -SkipBuild.' }

Stop-OwnedProcess (Join-Path $runtimePath 'backend.pid') '.runtime/hub-live.jar'
Stop-OwnedProcess (Join-Path $runtimePath 'frontend.pid') 'node_modules/vite/bin/vite.js'
foreach ($appPort in @(8080, 5173)) {
    if (Get-NetTCPConnection -LocalPort $appPort -State Listen -ErrorAction SilentlyContinue) { throw "Port $appPort is already in use by another process." }
}
Copy-Item -LiteralPath 'backend/target/backend-1.0.0.jar' -Destination (Join-Path $runtimePath 'hub-live.jar')
$env:DB_URL = "jdbc:postgresql://127.0.0.1:$DatabasePort/hackathon_hub"
$env:DB_USER = 'hackathon'
$env:DB_PASSWORD = 'hackathon'
$env:PORT = '8080'
$env:FRONTEND_ORIGIN = 'http://127.0.0.1:5173,http://localhost:5173'
$env:API_PROXY_TARGET = 'http://127.0.0.1:8080'
$backend = Start-Process -FilePath 'java' -ArgumentList '-jar','.runtime/hub-live.jar' -WorkingDirectory $projectRoot -RedirectStandardOutput (Join-Path $runtimePath 'backend.log') -RedirectStandardError (Join-Path $runtimePath 'backend-error.log') -WindowStyle Hidden -PassThru
$backend.Id | Set-Content -LiteralPath (Join-Path $runtimePath 'backend.pid')
$frontend = Start-Process -FilePath 'node' -ArgumentList 'node_modules/vite/bin/vite.js','--host','127.0.0.1' -WorkingDirectory (Join-Path $projectRoot 'frontend') -RedirectStandardOutput (Join-Path $runtimePath 'frontend.log') -RedirectStandardError (Join-Path $runtimePath 'frontend-error.log') -WindowStyle Hidden -PassThru
$frontend.Id | Set-Content -LiteralPath (Join-Path $runtimePath 'frontend.pid')
$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try { $null = Invoke-RestMethod 'http://127.0.0.1:8080/api/dashboard' -TimeoutSec 1; $null = Invoke-WebRequest 'http://127.0.0.1:5173' -TimeoutSec 1; $ready = $true; break } catch { Start-Sleep -Seconds 1 }
}
if (!$ready) { throw 'Startup did not complete. Check .runtime/backend.log and .runtime/frontend-error.log.' }
Write-Output 'Hackathon Hub is ready: http://127.0.0.1:5173'
Write-Output 'Data is stored in .runtime/pgdata. Stop with: .\scripts\stop-local.ps1'
