# aditosnmp
Monitor Adito (Clients and Server) through SNMP

Show the example - docker-compose.yml for the docker environment variables.

## environment variables

Send interval:
- LOOPTIME=2m

Icinga API user:
- MONITORING_API_USER=APIUSER

Icinga API user password:
- MONITORING_API_PASS=API_PASS

Icinga API Port (optional, default 5665)
- MONITORING_API_PORT=5665

Icinga Host template:
- TEPLATEHOST=passive-host

Icinga Service template:
- TEMPLATESERVICE=passive-service

Icinga Group (Server and Host):
- MONITORING_GROUP=adito

Icinga API URL(without https):
- MONITORING_API_URL=monitoring.example.com

Adito server name in icinga (optional, default "aditoServer"):
- ADITO_SERVER_NAME=aditoServer

Adito server display name in icinga (optional, default "Adito Server):
- ADITO_SERVER_DISPLAY_NAME=Adito Server

Adato server memory warning value in percent (optional, default 95%):
- MEMORY_WARN_VALUE=95 

Adito server memory error value in percent (optional, default 99%):
- MEMORY_CRIT_VALUE=99

Adito SNMP community:
- ADITO_SNMP_COMMUNITY=public

Adito server SNMP port (optinal, default 161):
- ADITO_SNMP_PORT=161

Adito Server address (dns or ip):
- ADITO_SNMP_SERVER_ADDR=adito_address_SNMP