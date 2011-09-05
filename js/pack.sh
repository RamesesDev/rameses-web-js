#!/bin/sh
#-----------------------------
# @author jaycverg
#-----------------------------

PACK_NAME='packed/rameses-lib-all.js'

#-- check if file exists, then remove the file
if [ -f $PACK_NAME ]; then
	rm $PACK_NAME
fi

echo 'appending rameses-ext-lib.js'
cat rameses-ext-lib.js >> $PACK_NAME

echo 'appending rameses-proxy.js'
cat rameses-proxy.js >> $PACK_NAME

echo 'appending rameses-session.js'
cat rameses-session.js >> $PACK_NAME

echo 'appending rameses-threading.js'
cat rameses-threading.js >> $PACK_NAME

echo 'appending rameses-ui.js'
cat rameses-ui.js >> $PACK_NAME

