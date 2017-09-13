var adsnmp = require('./libs/aditoSNMP');

var aditoServerAddrr = 'localhost';
var aditoSNMPCommunity = 'public'; //snmp commmunity
var aditoSNMPPort = '161';

var snmp = new adsnmp(aditoServerAddrr, aditoSNMPCommunity, aditoSNMPPort);

var test = snmp.getServerLimited()
.then((result)=>{
    console.log(result);
}, (err)=>{
    console.log(err);
})