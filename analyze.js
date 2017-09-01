'use strict';
const fs = require('fs');
const readLine = require('readline');
const async = require('async');
const _ = require('lodash');
const nconf = require('nconf');

nconf.argv();

// @todo bus these up to command line args
var percentage = nconf.get('percentage');
if (typeof percentage === 'string') {
  percentage = percentage === 'false' ? false : true;
}

var proportional = nconf.get('proportional');
if (typeof proportional === 'string') {
  proportional = proportional === 'true' ? true : false;
}

var settings = {
  amount: nconf.get('amount') || 1000,
  percentage,
  proportional,
  // percentage of amount OR static amount
  bpg: typeof nconf.get('bpg') === 'number' ? nconf.get('bpg') : 50,
  hpg: nconf.get('hpg') || 0,
  bThreshold: typeof nconf.get('bThreshold') === 'number' ? nconf.get('bThreshold') : 6500,
  hThreshold: typeof nconf.get('hThreshold') === 'number' ? nconf.get('hThreshold') : 1000,
  dataDirectory: nconf.get('dataDirectory') || 'data'
};

// @todo more test validation, added proportional and H
// @todo calculate prediction accuracy on each year
// @todo put V vs H back into data. H H underdogs when S is low
// @todo try similar logic to current but only paying attention to negative ML, not the entire S

var totalG = 0;
var gp = 0;
var gw = 0;
var minS;
var maxS;

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
        let t0ml = parseInt10(t0[5]);
        // sometimes the ML value is NaN or missing
        if (isNaN(t0ml)) {
          return;
        }
        let t1ml = parseInt10(t1[5]);
        let s = Math.abs(t0ml) + Math.abs(t1ml);

        // update s limits
        if (settings.proportional) {
          if (minS === undefined) {
            minS = s;
            maxS = s;
            settings.bpg = 50;
          } else {
            if (s < minS) {
              minS = s;
            } else if (s > maxS) {
              maxS = s;
            }
            // bpg / 100 = (s - minS) / (maxS - minS)
            settings.bpg = ((s - minS) / (maxS - minS)) * 100;
          }
        }
        // static vs percentage
        let r = settings.bpg;
        if (settings.percentage || settings.proportional) {
          r = settings.amount * (settings.bpg * .01);
        }

        // static vs percentage
        let h = settings.hpg;
        if (settings.percentage) {
          h = settings.amount * (settings.hpg * .01);
        }
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
        // W case
        if (parseInt10(fav[2]) > parseInt10(other[2])) {
          let t = r / (Math.abs(parseInt10(fav[5]))/100);
          // t
          settings.amount += t;
          // L
          settings.amount -= h;
          // count the W
          if (r > 0) {
            gw++;
          }
        }
        // L or T case
        else {
          // t
          settings.amount += h * (parseInt10(other[5]) / 100);
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
    console.log(settings);
  });
});

function parseInt10(input) {
  return parseInt(input, 10);
}
