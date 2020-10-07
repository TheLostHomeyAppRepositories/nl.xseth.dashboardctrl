'use strict';

require('url');

const Homey = require('homey');
const fetch = require('node-fetch');
const util = require('/lib/util.js');

class FullyBrowserDevice extends Homey.Device {

  onInit() {
    const settings = this.getSettings();

    const api = new URL(settings.address);
    api.searchParams.set('type', 'json');
    api.searchParams.set('password', settings.password);
    this.API = api;

    // Setup polling of device
    this.polling = setInterval(this.poll.bind(this), 1000 * settings.polling);

    // Register image from CamSnapshot
    this.setupImage();

    // Register capabilities
    this.registerCapabilityListener('onoff', this.turnOnOff.bind(this));
  }

  onDeleted() {
    clearInterval(this.polling);
    clearInterval(this.pinning);
  }

  getAPIUrl(cmd) {
    /**
     * Get URL of API as URL object
     *
     * @param {String} cmd - Command to use in API
     * @return {URL} URL of API for specific cmd
     */
    const URL = this.API;
    URL.searchParams.set('cmd', cmd);

    return URL;
  }

  setupImage() {
    /**
     * Register snapshot image from FullyBrowser
     */

    this.snapshot = new Homey.Image();

    this.snapshot.setStream(async (stream) => {
      const res = await fetch(this.getAPIUrl('getCamshot'));
      util.checkStatus(res);

      return res.body.pipe(stream);
    });

    this.snapshot.register()
      .then(() => {
        return this.setCameraImage('fully_browser', Homey.__('Live CamSnapshot'), this.snapshot);
      })
      .catch(this.error.bind(this, 'snapshot.register'));
  }

  poll() {
    /**
     * Poll for device current status
     */

    // Translation Fully Browser REST -> Homey capabilities
    const props = {
      'screenOn': 'onoff',
      'screenBrightness': 'dim',
      'batteryLevel': 'measure_battery',
    }

    this.getStatus()
      .then(stats => {
        // Verify for each property if capability needs updating
        for (const [fully, homey] of Object.entries(props)) {
          if (this.getCapabilityValue(homey) != stats[fully]){
            this.setCapabilityValue(homey, stats[fully]);
            this.log('Setting ['+homey+']: '+stats[fully]);
          }
        }

      })
      .catch(error => {
        switch (error) {
          case 'err_sensor_motion':
          case 'err_sensor_battery':
            this.setUnavailable(Homey.__(error));
            this.log(error);
            break;
          default:
            this.setUnavailable(Homey.__('Unreachable'));
            this.log(error);
            break;
        }
        this.ping();
      });
  }

  ping() {
    /**
     * Ping the device to verify availability
     */

    const self = this;

    clearInterval(this.polling);
    clearInterval(this.pinging);

    this.pinging = setInterval(() => {
      self.getStatus()
        .then(result => {
          this.setAvailable()
          clearInterval(this.pinging);
          this.polling = setInterval(this.poll, 1000 * this.getSettings('polling'));
        })
        .catch(error => {
          this.log('Device is not reachable, pinging every 63 seconds to see if it comes online again.');
        })
    }, 63000);
  }

  async getStatus() {
    /**
     * Get the deviceInfo (Status) of Fully Browser
     *
     * @return {Object} Current status of Fully Browser
     */

    const url = this.getAPIUrl('deviceInfo');
    const res = await fetch(url);

    util.checkStatus(res);
    return await res.json();
  }

  async turnOnOff(value) {
    /**
     * Turn Fully Browser on or off
     *
     * @param {Boolean} value - to turn on or off
     */
    const onoff = value ? 'screenOn' : 'screenOff'
    const url = this.getAPIUrl(onoff);

    const res = await fetch(url);
    util.checkStatus(res);
  }

  async showDashboard() {
    /**
     * Bring Fully Browser to foreground
     */
    const url = this.getAPIUrl('toForeground');
    const res = await fetch(url);
    util.checkStatus(res);
  }

}

module.exports = FullyBrowserDevice;
