var fs = require('fs');
var path = require('path');
var logger = require('winston');

var adsnmp = require('./libs/aditoSNMP');
var icingaapi = require('./libs/icingaapi');

var icingaConf = {
    'server': process.env.MONITORING_API_URL,
    'port': process.env.MONITORING_API_PORT,
    'user': process.env.MONITORING_API_USER,
    'pass': process.env.MONITORING_API_PASS,
    'templateservice': process.env.TEMPLATESERVICE,
    'templatehost': process.env.TEMPLATEHOST,
    'group': process.env.MONITORING_GROUP
}

//enable debug
if(process.env.DEBUG == "TRUE" || process.env.DEBUG != undefined){
    winston.level = 'debug';
} else{
    winston.level = 'info';
}

//Icinga Host Config
var icingaHost = process.env.ADITO_SERVER_NAME;
var icingaHostDisp = process.env.ADITO_SERVER_DISPLAY_NAME;

var aditoServerAddrr = process.env.ADITO_SNMP_SERVER_ADDR;
var aditoSNMPCommunity = process.env.ADITO_SNMP_COMMUNITY; //snmp commmunity
var aditoSNMPPort = process.env.ADITO_SNMP_PORT;

//adito memory warn value in %
var aditoMemWarn = process.env.MEMORY_WARN_VALUE;

//adito memory error value in %
var aditomemErr = process.env.MEMORY_CRIT_VALUE;

//Output Debug info
if(debug){
    console.log("############# Icinga Config #############");
    console.log(icingaConf);
    console.log("############# Icinga Config End #########");
    console.log("");
    console.log("############# SNMP Settings #############");
    console.log("SNMP Server: "+ aditoServerAddrr);
    console.log("SNMP Community: " + aditoSNMPCommunity);
    console.log("SNMP Port: " + aditoSNMPPort);

}

var snmp = new adsnmp(aditoServerAddrr, aditoSNMPCommunity, aditoSNMPPort);
var icingaServer = new icingaapi(icingaConf.server, icingaConf.port, icingaConf.user, icingaConf.pass); //create icingaapi object

if(debug){
    logger.debug("Get host information from icinga");
}
//chech, if Adito Server host already exist on icinga server
icingaServer.getHost(icingaHost, (err, result) => {
    if (err) {
        if (err.Statuscode == "404") {

            if(debug){
                logger.debug("Host was not found in icinga, create one");
            }

            //get info
            snmp.getServerLimited()
                .then((aditoServer, err) => {

                    icingaServer.createHostCustom(JSON.stringify({
                        "templates": [icingaConf.templatehost],
                        "attrs": {
                            "display_name": icingaHostDisp,
                            "vars.group": icingaConf.group,
                            "vars.AditoServerName": aditoServer.serverName,
                            "vars.AditoServerVersion": aditoServer.serverVersion,
                            "vars.AditoStartupTime": aditoServer.startupTime,
                            "vars.CPUs": aditoServer.availableCPUs
                        }
                    }), icingaHost, function (err, output) {
                        if (err) {
                            logger.debug(err);
                        } else {

                            if(debug){
                                logger.debug("Icinga host " + icingaHost + " was created");
                            }
                            //if host exist, set state in icinga
                            icingaServer.setHostState(icingaHost, 0, "OK - Everything is going to be fine", function (err, output) {
                                if (err) {
                                    logger.debug(err);
                                }
                            })
                        }
                    })
                }, (err) => {
                    logger.error(err);
                })
        } else {
            console.error(err);
        }

    } else {
        icingaServer.setHostState(icingaHost, 0, "OK - Everything is going to be fine", function (err, output) {
            if (err) {
                logger.error(err);
            } else {

                if(debug){
                    logger.debug("Host " + icingaHost + " exist, set state OK");
                }

                //start checks 1. server stats, 2 clients stats
                snmp.getServerLimited()
                    .then((aditoStats) => {

                        if(debug){
                            logger.debug("Get information of adito host from snmp");
                        }

                        //update adito server host stats
                        icingaServer.updateHostAttr(JSON.stringify({
                            "templates": [icingaConf.templatehost],
                            "attrs": {
                                "display_name": icingaHostDisp,
                                "vars.group": icingaConf.group,
                                "vars.AditoServerName": aditoStats.serverName,
                                "vars.AditoServerVersion": aditoStats.serverVersion,
                                "vars.AditoStartupTime": aditoStats.startupTime,
                                "vars.CPUs": aditoStats.availableCPUs
                            }
                        }), icingaHost, function (err, output) {
                            if (err) {
                                logger.error(err);
                            } else {
                                //get adito cliensts info;
                                //create service "Connected Clients"
                                icingaServer.getService(icingaHost, "aditoClients", function (err, service) {
                                    if (err) {
                                        if (err.Statuscode == "404") {
                                            //service not found, create
                                            icingaServer.createService(icingaConf.templateservice, icingaHost, "aditoClients", "Adito Connected Clients", icingaConf.group, icingaHost, function (err, result) {
                                                if (err) {
                                                    logger.error(err);
                                                } else {
                                                    logger.debug("Monitoring Service aditoClients was not founde, create one");
                                                }
                                            })
                                        } else {
                                            logger.error(err);
                                        }
                                    } else {
                                        //service found
                                        //get clients info
                                        snmp.getAllClients()
                                            .then((aditoClients) => {

                                                if(debug){
                                                    logger.debug("Get Adito clients information from snmp");
                                                    logger.debug("Clients connected: " + aditoClients.length);
                                                }

                                                if (aditoClients.length <= 0) {
                                                    var clientsOut = "no clients connected";
                                                    var perfdata = ["client=" + aditoClients.length]
                                                } else {
                                                    //function (service, server, state, output, perfarr, callback) {
                                                    var perfdata = ["client=" + aditoClients.length]

                                                    //console.log(aditoClients[0][2].oid["name"]);
                                                    var clientsOut = "Client Login Name | Client Host | Client Version | Client Connection Time | Client Connected Time\n";
                                                    for (var i = 0; i < aditoClients.length; i++) {
                                                        var ov = aditoClients[i];
                                                        var hou = Math.floor(ov[4].oid.value / 360000);
                                                        var min = Math.floor(ov[4].oid.value % 360000 / 6000)
                                                        var sec = Math.floor(ov[4].oid.value % 360000 % 6000 / 100);

                                                        var timeString = hou + " hour " + min + " minutus " + sec + " seconds";

                                                        clientsOut += ov[5].oid.value + " | " + ov[1].oid.value + " | " + ov[2].oid.value + " | " + ov[3].oid.value + " | " + timeString + "\n";
                                                    }
                                                }
                                                icingaServer.setServicePerfdata("aditoClients", icingaHost, 0, clientsOut, perfdata, function (err, output) {
                                                    if (err) {
                                                        logger.error(err);
                                                    } else {
                                                        if(debug){
                                                            logger.debug("Send client information(snmp) to icinga was successfull");
                                                        }
                                                    }
                                                })
                                            }, (err) => {
                                                logger.error(err);
                                            })
                                    }
                                })
                                //get memory info of adito server
                                snmp.getServerLimited()
                                    .then((aditoStats) => {

                                        if(debug){
                                            logger.debug("Get snmp information of adito server");
                                        }

                                        var memoryFree = aditoStats.memoryFree;
                                        var memoryMax = aditoStats.memoryMax;
                                        var memoryUsed = memoryMax - memoryFree;
                                        var memUsedinPerc = Math.floor((memoryFree * 100) / memoryMax);

                                        logger.debug("MemoryFree: " + memoryFree);
                                        logger.debug("Memory Max: " + memoryMax);
                                        logger.debug("Memory Used: "+ memoryUsed);
                                        logger.debug("Memory used in percent: " + memUsedinPerc);

                                        if (memUsedinPerc < aditoMemWarn) {
                                            var state = 0; //ok
                                            var stateout = "OK - Memory usage " + memUsedinPerc + "%";
                                        } else {
                                            if (memUsedinPerc < aditomemErr) {
                                                var state = 1; //warnung
                                                var stateout = "Warning - Memory usage " + memUsedinPerc + "%";
                                            } else {
                                                var state = 2; //error
                                                var stateout = "Error - Memory usage " + memUsedinPerc + "%";
                                            }
                                        }

                                        var perfdataArr = ["Memory in %=" + memUsedinPerc + "%;" + aditoMemWarn + ";" + aditomemErr + ";0"]
                                        //create Service adito server memory usage;

                                        if(debug){
                                            logger.debug("Get information of services from icinga");
                                        }
                                        icingaServer.getService(icingaHost, "aditoServerMem", function (err, service) {
                                            if (err) {
                                                if (err.Statuscode == "404") {

                                                    if(debug){
                                                        logger.debug("Service was not found, create one");
                                                    }

                                                    //not found, create
                                                    icingaServer.createService(icingaConf.templateservice, icingaHost, "aditoServerMem", "Adito Server Memory", icingaConf.group, icingaHost, function (err, result) {
                                                        if (err) {
                                                            logger.error(err);
                                                        } else {
                                                            if(debug){
                                                                logger.debug("Create service aditoServerMem");
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    logger.error(err);
                                                }
                                            } else {
                                                //icingaServer.setServicePerfdata("aditoClients", icingaHost, 0, clientsOut, perfdata, function (err, output) {
                                                icingaServer.setServicePerfdata("aditoServerMem", icingaHost, state, stateout, perfdataArr, function (err, output) {
                                                    if (err) {
                                                        logger.error(err);
                                                    } else {
                                                        if(debug){
                                                            logger.debug("Send perdata of aditoServerMem to icinga");
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    }, (err) => {
                                        logger.error(err);
                                    })
                            }
                        })
                    }, (err) => {
                        logger.error(err);
                    })
            }
        })
    }
})