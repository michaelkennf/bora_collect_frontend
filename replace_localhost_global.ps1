Write-Host "🔍 Remplacement global de localhost:3000 par l'API en ligne..." -ForegroundColor Yellow

# Remplacer dans tous les fichiers frontend
$files = Get-ChildItem -Path "frontend/src" -Recurse -Include "*.tsx", "*.ts", "*.js"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "localhost:3000") {
        $newContent = $content -replace "http://localhost:3000", "https://api.collect.fikiri.co"
        Set-Content $file.FullName $newContent
        Write-Host "✅ Modifié: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "✅ Remplacement global terminé !" -ForegroundColor Green
