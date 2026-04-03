Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-DocxText([string]$path) {
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
        $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
        $reader = New-Object System.IO.StreamReader($entry.Open())
        $xml = $reader.ReadToEnd()
        $reader.Close(); $zip.Dispose()

        # Extract table rows (w:tr), collect text per row
        $rows = [regex]::Matches($xml, '<w:tr[ >].*?</w:tr>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $result = @()
        foreach ($row in $rows) {
            $cells = [regex]::Matches($row.Value, '<w:tc[ >].*?</w:tc>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
            $cellTexts = @()
            foreach ($cell in $cells) {
                $texts = [regex]::Matches($cell.Value, '<w:t[^>]*>([^<]*)</w:t>')
                $cellText = ($texts | ForEach-Object { $_.Groups[1].Value }) -join ''
                $cellTexts += $cellText.Trim()
            }
            $line = $cellTexts -join ' | '
            if ($line.Trim(' |') -ne '') { $result += $line }
        }
        return $result
    } catch {
        return @("ERR: $_")
    }
}

$r = 'C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\4. 246 512 - PPJK - Penambahbaikan Skrin dan Template Risalat MMKN PDT & PTG\0. Resources'

$jkkl     = Read-DocxText "$r\RINGKASAN RISALAT - JIKA ADA JKKL.docx"
$tidaJkkl = Read-DocxText "$r\RINGKASAN RISALAT - TIADA JKKL.docx"

Write-Host "=== JIKA ADA JKKL ($($jkkl.Count) rows) ==="
for ($i = 0; $i -lt $jkkl.Count; $i++) {
    Write-Host "  [$i] $($jkkl[$i])"
}

Write-Host ""
Write-Host "=== TIADA JKKL ($($tidaJkkl.Count) rows) ==="
for ($i = 0; $i -lt $tidaJkkl.Count; $i++) {
    Write-Host "  [$i] $($tidaJkkl[$i])"
}
