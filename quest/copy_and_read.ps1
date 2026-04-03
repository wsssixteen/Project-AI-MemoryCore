Add-Type -AssemblyName System.IO.Compression.FileSystem

$r   = 'C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\4. 246 512 - PPJK - Penambahbaikan Skrin dan Template Risalat MMKN PDT & PTG\0. Resources'
$tmp = 'C:\Temp\ruri_docx_read'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$sources = @(
    "$r\RINGKASAN RISALAT - JIKA ADA JKKL.docx",
    "$r\RINGKASAN RISALAT - TIADA JKKL.docx"
)

function Copy-Locked([string]$src, [string]$dst) {
    $fs = [System.IO.File]::Open($src, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]3)
    $bytes = New-Object byte[] $fs.Length
    $fs.Read($bytes, 0, $bytes.Length) | Out-Null
    $fs.Close()
    [System.IO.File]::WriteAllBytes($dst, $bytes)
}

function Read-DocxRows([string]$path) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)

    Write-Host "  ZIP entries:"
    $zip.Entries | ForEach-Object { Write-Host "    $($_.FullName) ($($_.Length) bytes)" }

    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = $reader.ReadToEnd()
    $reader.Close(); $zip.Dispose()

    Write-Host "  XML length: $($xml.Length)"
    Write-Host "  First 500 chars:"
    Write-Host $xml.Substring(0, [Math]::Min(500, $xml.Length))
}

foreach ($src in $sources) {
    $name = [System.IO.Path]::GetFileName($src)
    $dst  = "$tmp\$name"
    Write-Host "=== $name ==="
    try {
        Copy-Locked $src $dst
        Read-DocxRows $dst
    } catch {
        Write-Host "  ERR: $_"
    }
    Write-Host ""
}
