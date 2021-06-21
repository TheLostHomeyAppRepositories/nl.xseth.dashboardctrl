'use strict';

require('url');

const nutil = require('util');
const Homey = require('homey');
const fetch = require('node-fetch');
const util = require('/lib/util.js');
const template = require('/lib/template.js');

const { ManagerCloud } = require('homey');

class FullyBrowserDevice extends Homey.Device {

  onInit() {
    const settings = this.getSettings();

    // Verify URL and autofix if possible
    if(!util.validURL(settings.address)){
      settings.address = util.fixURL(settings.address);
      this.setSettings(settings);
      this.log(`Autofixing URL to: ${settings.address}`)
    }

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
    this.registerCapabilityListener('dim', this.changeBrightness.bind(this));
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

    this.log('Executing cmd=['+cmd+']');

    // cleanup old parameters
    URL.searchParams.delete('url');
    URL.searchParams.delete('key');
    URL.searchParams.delete('value');
    URL.searchParams.delete('package');

    return URL;
  }

  setupImage() {
    /**
     * Register snapshot image from FullyBrowser
     */

    this.snapshot = new Homey.Image();

    this.snapshot.setStream(async stream => {
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
     * Poll for device current status and update Homey capabilities
     */

    // Translation Fully Browser REST -> Homey capabilities
    const deviceProperties = {
      screenOn: 'onoff',
      screenBrightness: 'dim',
      batteryLevel: 'measure_battery',
    }

    this.getStatus()
      .then(stats => {
        let value = null;

        // Verify for each property if capability needs updating
        for (const [fully, homey] of Object.entries(deviceProperties)) {

          // Get value, in case of screenBrightness calculate Fully value to Homey value
          value = (fully === 'screenBrightness') ? util.calcBrightness(stats[fully]) : stats[fully];

          if (this.getCapabilityValue(homey) !== value) {
            this.log(`Setting [{homey}]: {value}`);
            this.setCapabilityValue(homey, value);
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

    this.log('Device is not reachable, pinging every 63 seconds to see if it comes online again.');

    clearInterval(this.polling);
    clearInterval(this.pinging);

    this.pinging = setInterval(() => {
      self.getStatus()
        .then(result => {
          self.log('Device reachable again, setting available, start polling again');
          self.setAvailable()
          clearInterval(self.pinging);
          self.polling = setInterval(self.poll.bind(self), 1000 * self.getSettings().polling);
        })
        .catch(error => {
          self.log('Device is not reachable, pinging every 63 seconds to see if it comes online again.');
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

    return res.json();
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

  async changeBrightness(value, opts) {
    /**
     * Turn Fully Browser on or off
     *
     * @param {Double} value - percentage to dim 0-1
     * @param {Object} opts - additional options
     */

    const url = this.getAPIUrl('setStringSetting');
    url.searchParams.set('key', 'screenBrightness');
    url.searchParams.set('value', Math.floor(value * 255));

    const res = await fetch(url);
    util.checkStatus(res);
  }

  async bringFullyToFront() {
    /**
     * Bring Fully Browser to foreground
     */
    const url = this.getAPIUrl('toForeground');
    const res = await fetch(url);
    util.checkStatus(res);
  }

  async loadStartUrl() {
    /**
     * Load start Url
     */
    const url = this.getAPIUrl('loadStartUrl');
    const res = await fetch(url);
    util.checkStatus(res);
  }

  async loadUrl(newUrl) {
    /**
     * Load start Url
     */
    const url = this.getAPIUrl('loadUrl');
    url.searchParams.set('url', newUrl);

    const res = await fetch(url);
    util.checkStatus(res);
  }

  async startApplication(pkg) {
    /**
     * Load start Url
     */

    // Validate pkg 
    const regex_id =  /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i;
    if (!regex_id.test(pkg))



    const url = this.getAPIUrl('startApplication');
    url.searchParams.set('package', pkg);

    const res = await fetch(url);
    util.checkStatus(res);
  }

  async showImage(backgroundColor, image) {
    /**
     * Show image on device
     * @param {String} backgroundColor - Color in hex format for background
     * @param {Image} image - Homey image object to show
     */

    let imgSrc = image.cloudUrl ? image.cloudUrl : image.localUrl;

    // if not URL is available in image, use stream for base64 data
    if (!imgSrc) {
      const stream = await image.getStream()
      const imgBase64 = await util.toBase64(stream);

      imgSrc = `data:image/png;base64,${imgBase64}`;
    }

    // function for handling GET requests on server
    const self = this;

    const onRequest = function onRequest(req, res) {
      self.log('Parsing request');
      const html = nutil.format(template.html_image, backgroundColor, imgSrc);

      res.write(html);
      res.end();
    };

    // Start HTTP server
    const port = util.getRandomBetween(40000, 50000); // Get random HTTP port
    util.startServer(port, onRequest);

    // Generate URL for Fully to connect to
    const local = await ManagerCloud.getLocalAddress();
    const IP = local.split(':')[0];
    const URL = `http://${IP}:${port}`

    this.log(`Image available on ${URL}`);

    return Promise.all([this.bringFullyToFront(), this.loadStartUrl(URL)]);
  }

  showDashboard() {
    /**
     * Show dashboard in Fully Browser
     */
    return Promise.all([this.bringFullyToFront(), this.loadStartUrl()]);
  }

}

module.exports = FullyBrowserDevice;
