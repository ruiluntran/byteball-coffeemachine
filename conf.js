/*jslint node: true */
"use strict";

exports.port = null;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = true;
exports.bIgnoreUnpairRequests = true;


exports.storage = 'sqlite';

exports.hub = 'byteball.org/bb';
exports.deviceName = 'Bosch Coffeemachine';
exports.permanent_pairing_secret = '0000';
exports.KEYS_FILENAME = 'keys.json';

// home wallet (replace these values with the properties of your wallet that is to collect the revenue from sales)
exports.xPubKey = 'xpub6Bi62aDKU7keBAEs2azB7J4kFHfX6ZgTTKehVgxPJBy2wcZtrySCK1D395W523Y93wPfvWs2Xbna4tpy8eV1yw3vDVnUWhAcrdYP6Co8y8m';
exports.account = 2;
exports.homeDeviceAddress = '073BIUYNKEKYXSJCUAKKXZPXMMVAOX3YN';


console.log('finished merchant conf');
