"use strict";

// The snmp object is the main entry point to the library.
var snmp = require('snmp-native');

function aditoSNMP(host, community, port) {
    this.host = host;
    this.community = community;
    this.port = port;
}

//get first 10 values of adito server snmp data;
aditoSNMP.prototype.getServerLimited = async function (callback) {
    var self = this;
    var serverProp = {};
    
    serverProp.serverName = await self.getOid('.1.3.6.1.4.1.42336.1.0.1.0');
    serverProp.serverFarm = await self.getOid('.1.3.6.1.4.1.42336.1.0.2.0');
    serverProp.serverVersion = await self.getOid('.1.3.6.1.4.1.42336.1.0.3.0');
    serverProp.serverlastShutdownReason = await self.getOid('.1.3.6.1.4.1.42336.1.0.4.0');
    serverProp.startUpTime = await self.getOid('.1.3.6.1.4.1.42336.1.0.5.0');
    serverProp.availableCPUs = await self.getOid('.1.3.6.1.4.1.42336.1.0.6.0');
    serverProp.memoryMax = await self.getOid('.1.3.6.1.4.1.42336.1.0.7.0');
    serverProp.memoryAllocated = await self.getOid('.1.3.6.1.4.1.42336.1.0.8.0');
    serverProp.memoryNotUsed = await self.getOid('.1.3.6.1.4.1.42336.1.0.9.0');
    serverProp.memoryFree = await self.getOid('.1.3.6.1.4.1.42336.1.0.10.0');
    
    return new Promise((resolve,reject)=>{
        return resolve (serverProp);
    })
}

aditoSNMP.prototype.getOid = async function (oidStr) {
    var self = this;
    return new Promise((resolve, reject) => {
        var oid = oidStr
            .split('.')
            .filter(function (s) { return s.length > 0; })
            .map(function (s) { return parseInt(s, 10); });
        var session = new snmp.Session({ host: self.host, community: self.community, port: self.port });
        session.get({ oid: oid }, function (error, varbinds) {
            if (error) {
                console.log('Cannot get oid: ' + oid + '. Exit');
                process.exit(1);
            } else {
                //console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + varbinds[0].type + ')');
                session.close();
                return resolve(varbinds[0].value);
            }
        });
    })
}

aditoSNMP.prototype.getServer = function (callback) {
    var self = this;
    var serverOutArr = [];
    var oidStr = '.1.3.6.1.4.1.42336.1.0';
    var oid = oidStr
        .split('.')
        .filter(function (s) { return s.length > 0; })
        .map(function (s) { return parseInt(s, 10); });

    return new Promise((resolve, reject) => {
        var session = new snmp.Session({ host: self.host, community: self.community, port: self.port });
        session.getSubtree({ oid: oid }, function (err, varbinds) {
            if (err) {
                // If there is an error, such as an SNMP timeout, we'll end up here.
                return reject(err);
            } else {
                var serverProp = {};
                for (var i = 0; i < varbinds.length; i++) {
                    var va = varbinds[i].value;

                    if (i == 0) {
                        serverProp.serverName = va;
                    }

                    if (i == 1) {
                        serverProp.serverFarm = va;
                    }

                    if (i == 2) {
                        serverProp.serverVersion = va;
                    }

                    if (i == 3) {
                        serverProp.lastShutdownReason = va;
                    }

                    if (i == 4) {
                        serverProp.startupTime = va;
                    }

                    if (i == 5) {
                        serverProp.availableCPUs = va;
                    }

                    if (i == 6) {
                        serverProp.memoryMax = va;
                    }

                    if (i == 7) {
                        serverProp.memoryAllocated = va;
                    }

                    if (i == 8) {
                        serverProp.memoryNotUsed = va;
                    }

                    if (i == 9) {
                        serverProp.memoryFree = va;
                    }

                }
            }
            session.close();
            return resolve(serverProp);
        });
    })

}

aditoSNMP.prototype.getAllClients = function (callback) {
    var self = this;
    var oidValueArr = [];

    var oidStr = '.1.3.6.1.4.1.42336.1.1.1';
    var oid = oidStr
        .split('.')
        .filter(function (s) { return s.length > 0; })
        .map(function (s) { return parseInt(s, 10); });

    return new Promise((resolve, reject) => {
        var session = new snmp.Session({ host: self.host, community: self.community, port: self.port });
        session.getSubtree({ oid: oid }, function (err, varbinds) {
            if (err) {
                // If there is an error, such as an SNMP timeout, we'll end up here.
                return reject(err);
            } else {

                var clientsNum = varbinds.length / 13;
                if (clientsNum >= 1) {

                    var clId = 1;
                    var c = 0;
                    for (var i = 0; i < varbinds.length; i++) {

                        var objc = {
                            'clientId': clId,
                            'oid': {
                                'name': '',
                                'value': varbinds[i].value
                            }
                        }

                        if (c == 0) {
                            objc.oid.name = "AditoClientId";
                        }

                        if (c == 1) {
                            objc.oid.name = "ClientHost";
                        }

                        if (c == 2) {
                            objc.oid.name = "AditoClientVersion";
                        }

                        if (c == 3) {
                            objc.oid.name = "ClientConnectionTime";
                        }

                        if (c == 4) {
                            objc.oid.name = "ClientConnectedTime";
                        }

                        if (c == 5) {
                            objc.oid.name = "ClientLoginName";
                        }

                        if (c == 6) {
                            objc.oid.name = "ClientLastAccess";
                        }

                        if (c == 7) {
                            objc.oid.name = "ClientCPUs";
                        }

                        if (c == 8) {
                            objc.oid.name = "ClientMemoryMax";
                        }

                        if (c == 9) {
                            objc.oid.name = "ClientMememoryAllocated";
                        }

                        if (c == 10) {
                            objc.oid.name = "ClientMemoryUnused";
                        }

                        if (c == 11) {
                            objc.oid.name = "ClientMemoryFree";
                        }

                        if (c == 12) {
                            objc.oid.name = "ClientRessources";
                        }

                        oidValueArr.push(objc);

                        if (clId >= clientsNum) {
                            clId = 1;
                            c++;
                        } else {
                            clId++;
                        }
                    }
                } else {

                }
            }
            session.close();
            var splittedArr = splitOutput(oidValueArr, clientsNum);
            return resolve(splittedArr);
        });
    })
}

function splitOutput(outArr, clientsNum) {
    var splittedArr = [];

    for (var i = 1; i <= clientsNum; i++) {
        var client = [];
        for (var y = 0; y < outArr.length; y++) {
            if (outArr[y].clientId == i) {
                client.push(outArr[y]);
            }
        }
        splittedArr.push(client);
    }

    return splittedArr;
}

module.exports = aditoSNMP;
