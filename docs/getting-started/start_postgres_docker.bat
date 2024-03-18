@echo off

setlocal ENABLEEXTENSIONS
set port=%1

echo Checking if PGPASSWORD is set.
if "%PGPASSWORD%"=="" (
  echo Error: PGPASSWORD is not set.
  exit /b 1
)

echo Start Postgres in a local Docker container
docker run --rm --name=dbos-db --env=POSTGRES_PASSWORD=%PGPASSWORD% --env=PGDATA=/var/lib/postgresql/data --volume=/var/lib/postgresql/data -p 5432:5432 -d postgres:16.1

	if %errorlevel% == 125 (
		echo Error: Check if Docker container already exist
		exit /b 1
		) else (
		goto :start
		)
		
:start
echo Waiting for PostgreSQL to start...
for /l %%i in (1,1,40) do (
  docker exec dbos-db psql -U postgres -c "SELECT 1;" >NUL 2>&1

if %errorlevel% equ 0 (
(
    echo PostgreSQL started!
    goto :break
  )
  timeout /t 1 /nobreak
)
  netstat -ano | findstr ":5432" >nul 2>nul
  )
:break
