@echo off
title Splitora - لوحة التحكم
cd /d "%~dp0"
echo جاري تشغيل لوحة التحكم...
echo (سيبي النافذة دي مفتوحة طول ما بتستخدمي اللوحة)
echo.
call npm run panel
pause
