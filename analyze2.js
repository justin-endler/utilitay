'use strict';

/*
Percentage only
No proportional
Only H if O is at H
*/

const fs = require('fs');
const readLine = require('readline');
const async = require('async');
const _ = require('lodash');
const nconf = require('nconf');

nconf.argv();

var settings = {
  amount: nconf.get('amount') || 1000,
  bpg: typeof nconf.get('bpg') === 'number' ? nconf.get('bpg') : 50,
  hpg: nconf.get('hpg') || 0,
  bThreshold: typeof nconf.get('bThreshold') === 'number' ? nconf.get('bThreshold') : 6500,
  hThreshold: typeof nconf.get('hThreshold') === 'number' ? nconf.get('hThreshold') : 1000,
  dataDirectory: nconf.get('dataDirectory') || 'data'
};

// @todo calculate prediction accuracy on each year
// @todo try similar logic to current but only paying attention to negative ML, not the entire S

var totalG = 0;
var gp = 0;
var gw = 0;
var minS;
var maxS;
var ohgp = 0;
var ohgw = 0;

// get file names
fs.readdir(settings.dataDirectory, function(error, fileNames) {
  async.eachSeries(fileNames, function(fileName, callback) {
    var lineReader = readLine.createInterface({
      input: fs.createReadStream(`${settings.dataDirectory}/${fileName}`)
    });
    var lineIndex = 1;
    var lastLine;
    lineReader.on('line', function (line) {
      if (lineIndex % 2 === 0) {
        totalG++;
        // g = lastLine vs line
        let t0 = lastLine.split(',');
        let t1 = line.split(',');
        if (settings.amount <= 0) {
          return;
        }
        let t0ml = parseInt10(t0[6]);
        // sometimes the ML value is NaN or missing
        if (isNaN(t0ml)) {
          return;
        }
        let t1ml = parseInt10(t1[6]);
        let s = Math.abs(t0ml) + Math.abs(t1ml);
        let r = settings.amount * (settings.bpg * .01);
        let h = settings.amount * (settings.hpg * .01);

        // b threshold
        if (s < settings.bThreshold) {
          r = 0;
        } else {
          gp++;
        }
        // h threshold
        if (s >= settings.hThreshold) {
          h = 0;
        }
        // results
        let fav = t0ml <= 0 ? t0 : t1;
        let other = t0ml > 0 ? t0 : t1;
        let favT = parseInt10(fav[3]);
        let otherT = parseInt10(other[3]);
        let oH = other[2] === 'H';
        // record other at H
        if (oH) {
          ohgp++;
        } else {
          h = 0;
        }
        // W case
        if (favT > otherT) {
          let t = r / (Math.abs(parseInt10(fav[6]))/100);
          // t
          settings.amount += t;
          // L
          settings.amount -= h;
          // count the W
          if (r > 0) {
            gw++;
          }
        }
        // L case
        else if (otherT > favT) {
          // W for H other
          if (oH) {
            ohgw++;
          }
          // t
          settings.amount += h * (parseInt10(other[6]) / 100);
          // L
          settings.amount -= r;
        }
        // T case
        else {
          // t
          settings.amount += h * (parseInt10(other[6]) / 100);
          // L
          settings.amount -= r;
        }
      }
      lineIndex++;
      lastLine = line;
    });
    lineReader.on('close', callback);
  }, function () {
    settings.amount = settings.amount.toFixed(2);
    settings.totalG = totalG;
    settings.gp = gp;
    settings.gw = gw;
    settings.ohgp = ohgp;
    settings.ohgw = ohgw;
    console.log(settings);
  });
});

function parseInt10(input) {
  return parseInt(input, 10);
}
