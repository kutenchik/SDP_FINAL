$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimePath = Join-Path $projectRoot '.runtime'
foreach ($entry in @(@('frontend.pid','node_modules/vite/bin/vite.js'),@('backend.pid','.runtime/hub-live.jar'))) {
    $pidFile = Join-Path $runtimePath $entry[0]
    if (Test-Path -LiteralPath $pidFile) {
        $ownedId = [int](Get-Content -LiteralPath $pidFile)
        $process = Get-CimInstance Win32_Process -Filter "ProcessId=$ownedId"
        if ($process -and $process.CommandLine.Contains($entry[1])) { Stop-Process -Id $ownedId; Write-Output "Stopped $($entry[0])." }
    }
}
$clusterPath = Join-Path $runtimePath 'pgdata'
if (Test-Path -LiteralPath (Join-Path $clusterPath 'postmaster.pid')) {
    $pgCommand = Get-Command pg_ctl.exe -ErrorAction SilentlyContinue
    $pgBin = if ($pgCommand) { Split-Path $pgCommand.Source } else { Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles 'PostgreSQL') -Directory | Sort-Object { [int]$_.Name } -Descending | Select-Object -First 1 | ForEach-Object { Join-Path $_.FullName 'bin' } }
    & (Join-Path $pgBin 'pg_ctl.exe') -D $clusterPath -m fast stop
}
Write-Output 'Local app stopped. PostgreSQL data has been preserved.'
