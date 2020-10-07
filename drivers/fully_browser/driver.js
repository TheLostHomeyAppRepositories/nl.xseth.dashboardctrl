'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class FullyBrowserDriver extends Homey.Driver {

  onPair(socket) {
    socket.on('testConnection', function(data, callback) {
      fetch(data.address + '/?cmd=deviceInfo&type=json&password=' + data.password)
        .then(res => {
          if (res.ok) {
            callback(false, res.json());
          } else {
            callback(true, 'Error');
          }
        })
        .catch(err => {
          callback(true, err);
        });
    });
  }

}

module.exports = FullyBrowserDriver;
