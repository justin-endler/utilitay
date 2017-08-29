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

var settings = {
  amount: nconf.get('amount') || 1000,
  percentage,
  // percentage of amount or static amount depending on `percentage`
  bpg: typeof nconf.get('bpg') === 'number' ? nconf.get('bpg') : 50,
  hpg: nconf.get('hpg') || 0,
  sThreshold: typeof nconf.get('sThreshold') === 'number' ? nconf.get('sThreshold') : 6500,
  dataDirectory: nconf.get('dataDirectory') || 'data'
};

// @todo try proportional Bs based on s, higher the s, higher the B
// @todo do this over all years
// @todo calculate prediction accuracy on each year
// @todo H if S is low enough

var totalG = 0;
var gp = 0;
var gw = 0;

var biggestS = 0;

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
          throw Error('out');
        }
        // static vs percentage
        let r = settings.bpg;
        if (settings.percentage) {
          r = settings.amount * (settings.bpg * .01);
        }
        let t0ml = parseInt10(t0[5]);
        let t1ml = parseInt10(t1[5]);
        let s = Math.abs(t0ml) + Math.abs(t1ml);
        if (s > biggestS) {
          biggestS = s;
        }
        // static vs percentage
        let h = settings.hpg;
        if (settings.percentage) {
          h = settings.amount * (settings.hpg * .01);
        }
        // s threshold
        if (s < settings.sThreshold) {
          r = 0;
          h = 0;
        } else {
          gp++;
        }
        // results
        // skip ones with no ML
        if (t0[5] !== 'NL') {
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
