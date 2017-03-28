#!/bin/sh

while true; do
	/usr/local/bin/node /aditosnmp/app.js
	sleep $LOOPTIME
done