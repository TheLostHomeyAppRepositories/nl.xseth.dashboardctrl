'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');
const util = require('../../lib/util.js');

class FullyBrowserDriver extends Homey.Driver {


  async onPair(session) {
    let msg = this.homey.__('pair.unknownerror');
    const driver = this;

    session.setHandler('testConnection', async function(data) {
      try {
        // Validate URL and fix it
        var url = util.fixURL(data.address.trim());

        if (!url) // if URL is none it is invalid and not fixable
          throw new Error(driver.homey.__('err_url'));

        const api = new URL(url)
        api.searchParams.set('type', 'json');
        api.searchParams.set('cmd', 'deviceInfo');
        api.searchParams.set('password', data.password);
        driver.log('Fetching info from: ' + api.toString())

        const response = await fetch(api)
        const json = await response.json()

        // Unauthorized is notified via Error in JSON
        if (json.status === 'Error' && json.statustext === 'Please login')
          throw new Error(driver.homey.__('pair.unauthorized'));
        else if (json.status === 'Error')
          throw new Error(driver.homey.__('pair.unknownerror'));
        else
          return json;

      } catch (err) {

        if (err.errno === 'EHOSTUNREACH')
          msg = driver.homey.__('pair.timeout');
        else if (err.errno === 'ECONNREFUSED')
          msg = driver.homey.__('pair.noconnection');
        else if (err.statustext === 'Please login')
          msg = driver.homey.__('pair.unauthorized');
        else if (err.status === 500)
          msg = driver.homey.__('pair.servererror');
        else
          msg = err.message || err.toString();

        driver.log(err);
        return msg;
      }
    });
  }

}

module.exports = FullyBrowserDriver;
