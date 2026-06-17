$port = 8080
$existing = netstat -ano | Select-String "LISTENING" | Select-String ":$port "
if ($existing) {
    $oldPid = ($existing -split '\s+')[-1]
    Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Set-Location "F:\douple\vue-project\backend"
mvn spring-boot:run