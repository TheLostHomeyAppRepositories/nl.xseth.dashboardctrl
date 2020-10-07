'use strict';

const url = require('url');
const Homey = require('homey');

class FullyBrowserDevice extends Homey.Device {

  onInit() {

    const api = new URL(this.getSettings('address'));
    api.searchParams.set('type', 'json');
    api.searchParams.set('password', this.getSetting('password'));
    this.API = api;

    // Setup polling of device
    this.polling = setInterval(poll, 1000 * this.getSettings('polling');

    // Register image from CamSnapshot
    this.setupImage();

    // Register capabilities
    this.registerCapabilityListener('onoff', this.turnOnOff);
  }

  onDeleted() {
    clearInterval(this.polling);
    clearInterval(this.pinning);
  }

  function getAPIUrl(cmd) {
    /**
     * Get URL of API as URL object
     *
     * @param {String} cmd - Command to use in API
     * @return {URL} URL of API for specific cmd
     */
    const URL = Object.assign({}, this.API);
    URL.searchParams.set('cmd', cmd);

    return URL;
  }

  function setupImage() {
    /** 
     * Register snapshot image from FullyBrowser
     */

    this.snapshot = new Homey.Image();

    this.snapshot.setStream(async (stream) => {
      this.API.searchParams.set('cmd', 'getCamshot'); // Generate API URL
      const res = await util.getStreamSnapshot(this.API.toString());
      if(!res.ok)
        throw new Error('Invalid Response');

      return res.body.pipe(stream);
    });

    this.snapshot.register()
      .then(() => {
        return this.setCameraImage('fully_browser', Homey.__('Live CamSnapshot'), this.snapshot);
      })
      .catch(this.error.bind(this, 'snapshot.register'));
  }

  function poll() {
    /**
     * Poll for device current status
     */

    this.getStatus()
    .then(stats => {
      this.log(stats)
      
    })
    .catch(error => {
      switch (error) {
        case 'err_sensor_motion':
        case 'err_sensor_battery':
          this.setUnavailable(Homey.__(error));
          break;
        default:
          this.setUnavailable(Homey.__('Unreachable'));
          break;
      }
      this.ping();
    });
  }

  function ping() {
    /**
     * Ping the device to verify availability
     */

    clearInterval(this.polling);
    clearInterval(this.pinging);

    this.pinging = setInterval(() => {
      this.getStatus()
      .then(result => {
        this.setAvailable();
        clearInterval(this.pinging);
        this.polling = setInterval(pollDevice, 1000 * this.getSettings('polling');
      })
      .catch(error => {
        this.log('Device is not reachable, pinging every 63 seconds to see if it comes online again.');
      })
    }, 63000);
  }

  async function getStatus() {
    /**
     * Get the deviceInfo (Status) of Fully Browser
     *
     * @return {Object} Current status of Fully Browser
     */

      const url = getAPIUrl('deviceInfo');

      fetch(url.toString())
      .then(utils.checkStatus)
      .then(res => return(res.json())
      .catch(err => {
        throw new Error(err);
      });
    });
  }

  async function turnOnOff(value) {
    /**
     * Turn Fully Browser on or off
     *
     * @param {Boolean} value - to turn on or off
     */
    const onoff = value ? 'screenOn' : 'screenOff'
    const url = getAPIUrl(onoff);

    fetch(url.toString())
    .then(utils.checkStatus)
    .catch(err => {
      return reject(err);
    });
  }

  async function showDashboard() {
    /**
     * Bring Fully Browser to foreground
     */
    const url = getAPIUrl('toForeground');

    fetch(url.toString())
    .then(utils.checkStatus)
    .catch(err => {
      return reject(err);
    });
  }
}

module.exports = FullyBrowserDevice;
