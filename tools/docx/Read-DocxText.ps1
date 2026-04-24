# Read-DocxText.ps1 — Extract table row text from a .docx file (pipe-separated cells)
# Usage: .\Read-DocxText.ps1 -Path "C:\path\to\file.docx"

param([Parameter(Mandatory)][string]$Path)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-DocxText([string]$path) {
    try {
        $zip    = [System.IO.Compression.ZipFile]::OpenRead($path)
        $entry  = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
        $reader = New-Object System.IO.StreamReader($entry.Open())
        $xml    = $reader.ReadToEnd()
        $reader.Close(); $zip.Dispose()

        $rows   = [regex]::Matches($xml, '<w:tr[ >].*?</w:tr>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $result = @()
        foreach ($row in $rows) {
            $cells     = [regex]::Matches($row.Value, '<w:tc[ >].*?</w:tc>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
            $cellTexts = @()
            foreach ($cell in $cells) {
                $texts     = [regex]::Matches($cell.Value, '<w:t[^>]*>([^<]*)</w:t>')
                $cellTexts += (($texts | ForEach-Object { $_.Groups[1].Value }) -join '').Trim()
            }
            $line = $cellTexts -join ' | '
            if ($line.Trim(' |') -ne '') { $result += $line }
        }
        return $result
    } catch {
        return @("ERR: $_")
    }
}

$rows = Read-DocxText $Path
Write-Host "=== $([System.IO.Path]::GetFileName($Path)) ($($rows.Count) rows) ==="
for ($i = 0; $i -lt $rows.Count; $i++) {
    Write-Host "  [$i] $($rows[$i])"
}
