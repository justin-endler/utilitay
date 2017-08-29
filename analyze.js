'use strict';
const fs = require('fs');
const readLine = require('readline');
const async = require('async');
const _ = require('lodash');
const nconf = require('nconf');

nconf.argv();

console.info("sThreshold: nconf.get('sThreshold')", typeof nconf.get('sThreshold')); // @test

// @todo bus these up to command line args
var settings = {
  amount: nconf.get('amount') || 1000,
  percentage: nconf.get('percentage') || true,
  // percentage of amount or static amount depending on `percentage`
  bpg: typeof nconf.get('bpg') === 'number' ? nconf.get('bpg') : 50,
  hpg: nconf.get('hpg') || 0,
  sThreshold: typeof nconf.get('sThreshold') === 'number' ? nconf.get('sThreshold') : 6500,
  dataDirectory: nconf.get('dataDirectory') || 'data'
};

// @todo write tests to validate the logic,
// @todo try proportional betting based on s, higher the s, higher the bet
// @todo do this over all seasons
// @todo try with static bet amounts instead of percentage of amount
// @todo calculate odds accuracy on each season

var totalG = 0;
var gp = 0;
var gw = 0;

var biggestS = 0;

// get file names
fs.readdir(settings.dataDirectory, function(error, fileNames) {
  // get each season stats
  async.eachSeries(fileNames, function(fileName, callback) {
    console.info("settings.dataDirectory", settings.dataDirectory); // @test
    var lineReader = readLine.createInterface({
      input: fs.createReadStream(`${settings.dataDirectory}/${fileName}`)
    });
    var lineIndex = 0;
    var lastLine;
    lineReader.on('line', function (line) {
      if (lineIndex && lineIndex % 1 === 0) {
        console.info("lastLine", lastLine); // @test
        console.info("line", line); // @test
        totalG++;
        // game = lastLine vs line
        let t0 = lastLine.split(',');
        let t1 = line.split(',');
        if (settings.amount <= 0) {
          throw Error('out of money');
        }
        let r = settings.amount * (settings.bpg * .01);
        let t0ml = parseInt10(t0[5]);
        let t1ml = parseInt10(t1[5]);
        let s = Math.abs(t0ml) + Math.abs(t1ml);
        if (s > biggestS) {
          biggestS = s;
        }
        // s threshold
        if (s < settings.sThreshold) {
          r = 0;
        } else {
          gp++;
        }
        let h = settings.amount * (settings.hpg * .01);
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
    console.log(settings);
  });
});

function parseInt10(input) {
  return parseInt10(input);
}
