'use strict';

exports.checkStatus = function(res) {
  /**
   * Verify if fetch response is ok
   *
   * @param {Response} res - response to verify
   * @return {Response} response obj if valid
   */
  if (res.ok) // res.status >= 200 && res.status < 300
    return res;
  else
    throw new Error(res.status);
}

exports.calcBrightness = function(fullyValue) {
  /**
   * Calculate homey dim value from Fully Browser brightnessValue
   *
   * Homey determines dim 0 - 100
   * Fully determines brightness 0 - 255
   *
   * @param {Number} fullyValue - brightness value by Fully Browser
   * @return {Number} homey dim value
   */
  const dim = (fullyValue / 255);
  return Math.round(dim * 100) / 100; // round to 2 decimal points
}
