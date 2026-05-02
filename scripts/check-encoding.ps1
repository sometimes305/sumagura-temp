param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$targetExt = @('.html', '.css', '.js', '.json', '.md')
$files = Get-ChildItem -Path $Root -Recurse -File | Where-Object {
    $targetExt -contains $_.Extension.ToLowerInvariant() -and $_.FullName -notmatch '\\.git\\'
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false, $true)
$failed = @()

function Test-Utf8NoBom {
    param([string]$Path)

    $bytes = [System.IO.File]::ReadAllBytes($Path)

    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        return @{ Ok = $false; Reason = 'UTF-8 BOM is not allowed' }
    }

    try {
        [void]$utf8NoBom.GetString($bytes)
    }
    catch {
        return @{ Ok = $false; Reason = 'Invalid UTF-8 byte sequence' }
    }

    return @{ Ok = $true; Reason = '' }
}

foreach ($file in $files) {
    $result = Test-Utf8NoBom -Path $file.FullName
    if (-not $result.Ok) {
        $failed += [PSCustomObject]@{
            File = $file.FullName
            Reason = $result.Reason
        }
    }
}

if ($failed.Count -gt 0) {
    Write-Host 'Encoding check failed:' -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "- $($_.File): $($_.Reason)" -ForegroundColor Yellow }
    exit 1
}

Write-Host "Encoding check passed. Files checked: $($files.Count)" -ForegroundColor Green
