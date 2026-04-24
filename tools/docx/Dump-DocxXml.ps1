# Dump-DocxXml.ps1 — Dump ZIP entries + document.xml content from a .docx file
# Handles locked files (e.g. open in Word) via Copy-Locked.
# Usage: .\Dump-DocxXml.ps1 -Path "C:\path\to\file.docx" [-Chars 3000]

param(
    [Parameter(Mandatory)][string]$Path,
    [int]$Chars = 3000
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Copy-Locked([string]$src, [string]$dst) {
    $fs    = [System.IO.File]::Open($src, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]3)
    $bytes = New-Object byte[] $fs.Length
    $fs.Read($bytes, 0, $bytes.Length) | Out-Null
    $fs.Close()
    [System.IO.File]::WriteAllBytes($dst, $bytes)
}

$target = $Path
if (-not (Test-Path $target)) {
    Write-Host "File not found: $target"; exit 1
}

# If file is locked, copy to temp first
$tmp = $null
try {
    $stream = [System.IO.File]::Open($target, 'Open', 'Read', 'None')
    $stream.Close()
} catch {
    $tmp    = "$env:TEMP\ruri_docx_dump_$([System.IO.Path]::GetFileName($target))"
    Copy-Locked $target $tmp
    $target = $tmp
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($target)

Write-Host "=== ZIP ENTRIES ==="
$zip.Entries | ForEach-Object { Write-Host "  $($_.FullName) ($($_.Length) bytes)" }

$entry  = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml    = $reader.ReadToEnd()
$reader.Close(); $zip.Dispose()

Write-Host ""
Write-Host "=== XML LENGTH: $($xml.Length) ==="
Write-Host ""
Write-Host "=== FIRST $Chars CHARS ==="
Write-Host $xml.Substring(0, [Math]::Min($Chars, $xml.Length))

if ($tmp -and (Test-Path $tmp)) { Remove-Item $tmp }
