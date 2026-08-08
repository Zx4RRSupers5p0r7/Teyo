<#
.SYNOPSIS
  Teyo.ca — Daily site stats popup.
  Run teyo-setup.ps1 once to register this as a Windows startup task.
  It will show your live viewers, total visitors, and price advice every
  time you log in to your PC.
#>

$ConfigFile = Join-Path $PSScriptRoot "teyo-config.json"

# First-run: create the config file
if (-not (Test-Path $ConfigFile)) {
    $default = [PSCustomObject]@{
        siteUrl    = "https://teyo.ca"
        ownerEmail = "YOUR_EMAIL_HERE"
        ownerKey   = "YOUR_OWNER_KEY_HERE"
    }
    $default | ConvertTo-Json | Set-Content -Path $ConfigFile -Encoding UTF8

    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "Teyo notifier installed!`n`nEdit this file and replace YOUR_EMAIL_HERE and YOUR_OWNER_KEY_HERE with your real credentials:`n`n$ConfigFile",
        "Teyo — First-Time Setup",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null
    return
}

try {
    $config  = Get-Content $ConfigFile -Raw | ConvertFrom-Json
    $headers = @{
        "x-owner-email" = $config.ownerEmail
        "x-owner-key"   = $config.ownerKey
    }

    $stats = Invoke-RestMethod `
        -Uri     "$($config.siteUrl)/api/owner/stats" `
        -Headers $headers `
        -TimeoutSec 12 `
        -ErrorAction Stop

    $currentPrice = [int]($stats.currentPriceCents / 100)
    $raise        = $stats.recommendedPriceCents -gt $stats.currentPriceCents
    $priceNote    = if ($raise) { "`n`n>>> PRICE TIP: Consider raising to $($stats.recommendedPrice)" } else { "" }

    $msg = @"
Teyo.ca — Site Stats
============================
Live right now : $($stats.liveViewers) viewer(s)
Total visitors : $($stats.totalVisitors)
Listing price  : `$$currentPrice
============================
$($stats.priceAdvice)$priceNote
"@

    Add-Type -AssemblyName System.Windows.Forms

    $notify                 = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon            = [System.Drawing.SystemIcons]::Information
    $notify.Visible         = $true
    $notify.BalloonTipTitle = "Teyo.ca Stats"
    $notify.BalloonTipText  = $msg
    $notify.BalloonTipIcon  = "Info"
    $notify.ShowBalloonTip(12000)
    Start-Sleep -Seconds 3

    # Show a separate popup if a price raise is recommended
    if ($raise) {
        [System.Windows.Forms.MessageBox]::Show(
            "Time to raise your listing price!`n`n$($stats.priceAdvice)`n`nSuggested new price: $($stats.recommendedPrice)`n`nUpdate PRICING.placement.amount in server.js when you are ready.",
            "Teyo — Price Raise Recommended",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information
        ) | Out-Null
    }

    $notify.Dispose()

} catch {
    # Fail silently if the site is unreachable or credentials are wrong
}
