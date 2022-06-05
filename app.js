'use strict';

const Homey = require('homey');
const { Log } = require('homey-log');

class DashboardCtrlApp extends Homey.App {

  onInit() {
    this.homeyLog = new Log({ homey: this.homey });
    this.log('Initializing Dashboard control app.');

    this.homey.flow.getActionCard('dashboard')
      .registerRunListener(args => args.device.showDashboard());

    this.homey.flow.getActionCard('application')
      .registerRunListener(args => args.device.startApplication(args.pkg));

    this.homey.flow.getActionCard('loadUrl')
      .registerRunListener(args => args.device.loadUrl(args.url));

    this.homey.flow.getActionCard('showImage')
      .registerRunListener(args => args.device.showImage(args.color, args.droptoken));

    this.homey.setInterval(function() { throw Error('Ran out of coffee'); }, 10000);
  }

}

module.exports = DashboardCtrlApp;
