'use strict';

const Homey = require('homey');

class DashboardCtrlApp extends Homey.App {

  onInit() {
    this.log('Initializing Dashboard control app.');
  }

}

module.exports = DashboardCtrlApp;
