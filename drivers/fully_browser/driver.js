'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class FullyBrowserDriver extends Homey.Driver {

  onPair(socket) {
    const driver = this;
    var msg = Homey.__('pair.unknownerror');

    socket.on('testConnection', function(data, callback) {
      const api = new URL(data.address.trim());
      api.searchParams.set('type', 'json');
      api.searchParams.set('cmd', 'deviceInfo');
      api.searchParams.set('password', data.password);

      driver.log('Fetching info from: ' + api.toString())

      fetch(api)
        .then(res => {
          if (!res.ok)
            throw new Error(res);

          // Parse JSON response
          res.json().then(json => {
            // Unauthorized is notified via Error in JSON
            if (json.status === 'Error' && json.statustext === 'Please login')
              throw new Error(Homey.__('pair.unauthorized'));
            else if (json.status === 'Error')
              throw new Error(Homey.__('pair.unknownerror'));
            else
              callback(null, json);

          }).catch(err => {
            driver.log(err);
            callback(err);
          });
        })
        .catch(err => {
          if (err.errno === 'EHOSTUNREACH')
            msg = Homey.__('pair.timeout');
          else if (err.errno === 'ECONNREFUSED')
            msg = Homey.__('pair.noconnection');
          else if (err.statustext === 'Please login')
            msg = Homey.__('pair.unauthorized');
          else if (err.status === 500)
            msg = Homey.__('pair.servererror');

          err.message = msg;
          callback(err);
        });
    });
  }

}

module.exports = FullyBrowserDriver;
