$logFile = "F:\douple\vue-project\backend\spring-boot-run.log"
Set-Location "F:\douple\vue-project\backend"
mvn spring-boot:run *> $logFile 2>&1