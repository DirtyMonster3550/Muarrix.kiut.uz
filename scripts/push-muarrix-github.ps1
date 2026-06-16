# Публикация Muarrix.kiut.uz на GitHub (отдельно от STEM)
$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
$git = 'C:\Program Files\Git\cmd\git.exe'
$root = Split-Path $PSScriptRoot -Parent
$repoName = 'Muarrix.kiut.uz'

Set-Location $root

& $gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Сначала войдите: gh auth login'
  exit 1
}

$login = & $gh api user -q .login
if (-not $login) {
  Write-Host 'Не удалось определить GitHub-аккаунт'
  exit 1
}

$existing = & $gh repo view "$login/$repoName" --json name -q .name 2>$null
if (-not $existing) {
  Write-Host "Создаю репозиторий $login/$repoName ..."
  & $gh repo create $repoName --public --description 'Muarrix.kiut.uz — web platform (KIUT journal)' --source $root --remote origin --push
  if ($LASTEXITCODE -ne 0) {
    & $git remote remove origin 2>$null
    & $git remote add origin "https://github.com/$login/$repoName.git"
    & $git push -u origin main
  }
} else {
  $remote = & $git remote get-url origin 2>$null
  if (-not $remote) {
    & $git remote add origin "https://github.com/$login/$repoName.git"
  } else {
    & $git remote set-url origin "https://github.com/$login/$repoName.git"
  }
  & $git push -u origin main
}

if ($LASTEXITCODE -eq 0) {
  Write-Host "Готово: https://github.com/$login/$repoName"
}
