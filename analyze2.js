'use strict';

/*
Percentage only
No proportional
Only H if O is at H
Only B if fav is at H
*/

const fs = require('fs');
const readLine = require('readline');
const async = require('async');
const _ = require('lodash');
const nconf = require('nconf');

nconf.argv();

var settings = {
  amount: nconf.get('amount') || 100,
  sAmount: nconf.get('amount') || 100,
  bpg: typeof nconf.get('bpg') === 'number' ? nconf.get('bpg') : 50,
  hpg: nconf.get('hpg') || 0,
  bThreshold: typeof nconf.get('bThreshold') === 'number' ? nconf.get('bThreshold') : 6500,
  hThreshold: typeof nconf.get('hThreshold') === 'number' ? nconf.get('hThreshold') : 1000,
  dataDirectory: nconf.get('dataDirectory') || 'data',
  logYears: nconf.get('logYears') === 'true' ? true : false,
  logDetails: nconf.get('logDetails') === 'true' ? true : false
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
var Rs = [];
var lastD;

// get file names
fs.readdir(settings.dataDirectory, function(error, fileNames) {
  async.eachSeries(fileNames, function(fileName, callback) {
    // if (fileName !== '07-08.csv') {
    //   return callback(); // @test
    // }
    if (fileName.indexOf('.') === 0) {
      return callback();
    }
    settings.sAmount = nconf.get('amount') || 100;
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
          return lineReader.close();
        }
        let currentD = t0[0];
        let t0ml = parseInt10(t0[6]);
        let t1ml = parseInt10(t1[6]);
        let s = Math.abs(t0ml) + Math.abs(t1ml);
        let r = settings.amount * (settings.bpg * .01);
        let h = settings.amount * (settings.hpg * .01);

        // sometimes the ML value is NaN or missing, skip
        if (isNaN(t0ml)) {
          r = 0;
          h = 0;
        }

        // b threshold
        if (s < settings.bThreshold) {
          r = 0;
        }
        // h threshold
        if (s >= settings.hThreshold) {
          h = 0;
        }
        if (r || h) {
          if (currentD !== lastD) {
            lastD = currentD;
          } else {
            r = r / 2;
            h = h / 2;
          }
        }
        // results
        let fav = t0ml <= 0 ? t0 : t1;
        let other = t0ml > 0 ? t0 : t1;
        let favT = parseInt10(fav[3]);
        let otherT = parseInt10(other[3]);
        let oH = other[2] === 'H';
        // record other at H
        if (oH && h) {
          ohgp++;
        } else {
          h = 0;
        }
        // only r if fav is H
        if (fav[2] !== 'H') {
          r = 0;
        }
        // W case
        if (favT > otherT) {
          let t = r / (Math.abs(parseInt10(fav[6]))/100);
          if (settings.logDetails && r) {
            console.info("r", r); // @test
            console.info("fav", fav); // @test
            console.info("other", other); // @test
            console.info("t", t); // @test
          }
          // t
          if (settings.logDetails && t) {
            console.log(`W from B: ${t}`);
          }
          settings.amount += t;
          settings.sAmount += t;
          // L
          if (settings.logDetails && h) {
            console.log(`L from H: ${h}`);
          }
          settings.amount -= h;
          settings.sAmount -= h;
          // count the W
          if (r > 0) {
            gw++;
          }
        }
        // L case
        else if (otherT > favT) {
          let t = h * (parseInt10(other[6]) / 100);
          // W for H other
          if (oH && h) {
            ohgw++;
          }
          // t
          if (settings.logDetails && t) {
            console.log(`W from H: ${t}`);
          }
          settings.amount += t;
          settings.sAmount += t;
          // L
          if (settings.logDetails && r) {
            console.log(`L from B: ${r}`);
          }
          settings.amount -= r;
          settings.sAmount -= r;
        }
        // T case, currently doesn't exist
        else {
          // t
          settings.amount -= h;
          settings.sAmount -= h;
          // L
          settings.amount -= r;
          settings.sAmount -= r;
        }
        if (r) {
          gp++;
        }
      }
      //console.log(`incrementing to ${lineIndex + 1}`); // @test
      lineIndex++;
      lastLine = line;
    });
    lineReader.on('close', function() {
      Rs.push(settings.sAmount - (nconf.get('amount') || 100));
      if (settings.logYears) {
        console.log(`s amount for ${fileName}: ${settings.sAmount}`);
        console.log(`amount end of ${fileName}: ${settings.amount}`);
        console.log();
      }
      callback();
    });
  }, function () {
    settings.amount = settings.amount.toFixed(2);
    settings.totalG = totalG;
    settings.gp = gp;
    settings.gw = gw;
    settings.ohgp = ohgp;
    settings.ohgw = ohgw;
    var sRs = 0;
    Rs.forEach(r => {
      sRs += r;
    });
    settings.aR = sRs / Rs.length;
    console.log(settings);
  });
});

function parseInt10(input) {
  return parseInt(input, 10);
}
