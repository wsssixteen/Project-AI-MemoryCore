Add-Type -AssemblyName System.IO.Compression.FileSystem

$r = 'C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\4. 246 512 - PPJK - Penambahbaikan Skrin dan Template Risalat MMKN PDT & PTG\0. Resources'
$path = "$r\RINGKASAN RISALAT - JIKA ADA JKKL.docx"

$zip = [System.IO.Compression.ZipFile]::OpenRead($path)

# List all entries to understand structure
Write-Host "=== ZIP ENTRIES ==="
$zip.Entries | ForEach-Object { Write-Host "  $($_.FullName) ($($_.Length) bytes)" }

# Read document.xml first 3000 chars
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

Write-Host ""
Write-Host "=== XML LENGTH: $($xml.Length) ==="
Write-Host ""
Write-Host "=== FIRST 3000 CHARS ==="
Write-Host $xml.Substring(0, [Math]::Min(3000, $xml.Length))
