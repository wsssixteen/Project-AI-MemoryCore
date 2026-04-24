# Read-DocxTags.ps1 — List all content control (CC) tag values in a .docx file
# Usage: .\Read-DocxTags.ps1 -Path "C:\path\to\file.docx"

param([Parameter(Mandatory)][string]$Path)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-DocxTags([string]$path) {
    try {
        $zip     = [System.IO.Compression.ZipFile]::OpenRead($path)
        $entry   = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
        $reader  = New-Object System.IO.StreamReader($entry.Open())
        $xml     = $reader.ReadToEnd()
        $reader.Close(); $zip.Dispose()

        $matches = [regex]::Matches($xml, 'w:tag w:val="([^"]+)"')
        return ($matches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
    } catch {
        return @("ERR: $_")
    }
}

$tags = Read-DocxTags $Path
if ($tags.Count -eq 0) {
    Write-Host "(no CC tags found)"
} else {
    $tags | ForEach-Object { Write-Host $_ }
}
