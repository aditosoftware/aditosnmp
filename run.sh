#!/bin/sh

while true; do
	/usr/bin/node /aditosnmp/app.js
	sleep $LOOPTIME
done