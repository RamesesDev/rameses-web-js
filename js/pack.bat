@echo off

REM -----------------------------
REM @author jaycverg
REM -----------------------------

set PACK_NAME=packed\rameses-lib-all.js

if exist %PACK_NAME% del %PACK_NAME%


echo appending rameses-ext-lib.js
copy rameses-ext-lib.js %PACK_NAME%

echo appending rameses-proxy.js
copy /b %PACK_NAME% + rameses-proxy.js %PACK_NAME%

echo appending rameses-session.js
copy /b %PACK_NAME% + rameses-session.js %PACK_NAME%

echo appending rameses-threading.js
copy /b %PACK_NAME% + rameses-threading.js %PACK_NAME%

echo appending rameses-ui.js
copy /b %PACK_NAME% + rameses-ui.js %PACK_NAME%

