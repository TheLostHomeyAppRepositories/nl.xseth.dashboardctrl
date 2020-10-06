'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class FullyBrowserDriver extends Homey.Driver {

  onPair(socket) {
    socket.on('testConnection', function(data, callback) {
      (async () => {
        const res = await fetch(data.address + '/?cmd=deviceInfo&type=json&password=' + data.password)

        if (res.ok) {
          callback(false, res.json());
        } else {
          callback(true, 'Error');
        }
      }).catch(error => {
          callback(error, null);
      });
    });
  }
}

module.exports = FullyBrowserDriver;
