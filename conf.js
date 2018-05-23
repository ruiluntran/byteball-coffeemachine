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
exports.xPubKey = 'xpub6DSdVfdW9Un8m7sWjeEmBbnVPQ23kRH7aw1ajpDrMJJvPQWPTYrfAQhRRvmAWCMWbSTvz9P98poyid1uEo2x1EpniNv5AKpNZ2RccDa8fgY';
exports.account = 1;
exports.homeDeviceAddress = '0VTMKHXUPBSPEBDKLGZXU6TADOHX7XLNP';


console.log('finished bosch coffe machine conf');
