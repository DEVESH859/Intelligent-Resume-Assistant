@echo off
echo Starting Intelligent Resume Assistant...

echo Starting Backend (FastAPI)...
start "Backend Server" powershell -NoExit -Command "cd 'd:\Intelligent Resume Assistant\backend'; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend (Vite/React)...
start "Frontend Server" powershell -NoExit -Command "cd 'd:\Intelligent Resume Assistant\frontend'; npm run dev"

echo Both servers are launching in new windows!
echo Once they load, go to: http://localhost:5173
pause
