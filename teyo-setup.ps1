<#
.SYNOPSIS
  Run this ONCE to register teyo-stats.ps1 as a Windows startup task.
  After running this, Teyo site stats will pop up every time you log in.

  Usage:  Right-click this file → Run with PowerShell
           OR open PowerShell as Administrator and run:
           .\teyo-setup.ps1
#>

$ScriptPath = Join-Path $PSScriptRoot "teyo-stats.ps1"

if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: teyo-stats.ps1 not found in: $PSScriptRoot" -ForegroundColor Red
    Write-Host "Make sure both files are in the same folder." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$TaskName  = "TeyoSiteStats"
$Action    = New-ScheduledTaskAction `
    -Execute  "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
$Trigger   = New-ScheduledTaskTrigger -AtLogOn
$Settings  = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 2) `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew
$Principal = New-ScheduledTaskPrincipal `
    -UserId   $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

    Register-ScheduledTask `
        -TaskName  $TaskName `
        -Action    $Action `
        -Trigger   $Trigger `
        -Settings  $Settings `
        -Principal $Principal | Out-Null

    Write-Host ""
    Write-Host "SUCCESS! Task '$TaskName' registered." -ForegroundColor Green
    Write-Host ""
    Write-Host "Teyo stats will pop up every time you log in to Windows." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next step: log out and back in (or restart) to trigger the first popup." -ForegroundColor Yellow
    Write-Host "On first run it will create teyo-config.json — edit that file with your owner credentials." -ForegroundColor Yellow
} catch {
    Write-Host "Failed to register task: $_" -ForegroundColor Red
    Write-Host "Try running PowerShell as Administrator." -ForegroundColor Yellow
}

Read-Host "`nPress Enter to exit"
