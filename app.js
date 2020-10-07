'use strict';

const Homey = require('homey');

class DashboardCtrlApp extends Homey.App {

  onInit() {
    this.log('Initializing Dashboard control app.');

    new Homey.FlowCardAction('dashboard')
      .register()
      .registerRunListener(args.device.showDashboard);
  }
}

module.exports = DashboardCtrlApp;
