'use strict';

const _ = require('lodash');
const async = require('async');
const { spawn } = require('child_process');

var trials = [];
var proportionalTrials = [];

const amount = 100;
const settings = {
  bpg: [50] || _.range(1, amount),
  hpg: [0] || _.range(0, amount),
  bThresholds: _.range(4000, 7000, 10),
  hThresholds: [130] ||  _.range(0, 300, 10)
};



//settings.hpg = [0]; // @test temp, not totally sure, but H is not performing well

var hThresholds = settings.hThresholds;

_.each(settings.bpg, bpg => {
  _.each(settings.hpg, hpg => {
    // if (hpg >= bpg) {
    //   return; // @test temporary, don't know if this is actually bad or not
    // }
    _.each(settings.bThresholds, bThreshold => {
      if (!hpg) {
        hThresholds = [0];
      } else {
        hThresholds = settings.hThresholds;
      }
      _.each(hThresholds, hThreshold => {
        trials.push(`--bpg ${bpg} --hpg ${hpg} --bThreshold ${bThreshold} --hThreshold ${hThreshold}`);
      });
    });
  });
});

console.info("trials.length", trials.length);

var max = 0;
var duplicates = [];
var index = 0;

// total
async.eachSeries(trials, (trial, callback) => {
  var analyze = spawn('node', [
    'analyze2.js',
    '--amount',
    100
  ].concat(trial.split(' ')));
  analyze.stdout.on('data', data => {
    data = toStr(data);
    var a = parseFloat((data.match(/amount:\s'([^']+)'/) || [0,0])[1]);
    if (a > max) {
      console.log(`${trial} : ${a}`);
      max = a;
    } else if (a === max) {
      //console.log(`dupe: ${a} : ${trial}`);
    }
    if (index % 100 === 0) {
      console.log(`checkin at ${index}: ${trial} : ${a}`);
    }
    index++;
  });
  analyze.on('close', callback);
});

// avg
// async.eachSeries(trials, (trial, callback) => {
//   var analyze = spawn('node', [
//     'analyze2.js',
//     '--amount',
//     100
//   ].concat(trial.split(' ')));
//   analyze.stdout.on('data', data => {
//     data = toStr(data);
//     var a = parseFloat((data.match(/aR:\s([-\d\.]+)/) || [0,0])[1]);
//     if (a > max) {
//       //console.info("data", data); // @test
//       console.log(`${trial} : ${a}`);
//       max = a;
//     } else if (a === max) {
//       //console.log(`dupe: ${a} : ${trial}`);
//     }
//     if (index % 100 === 0) {
//       console.log(`checkin at ${index}: ${trial} : ${a}`);
//     }
//     index++;
//   });
//   analyze.on('close', callback);
// });

function toStr(data) {
  return (new Buffer(data)).toString('utf8');
}
function getTestRx(amount) {
  return new RegExp(`amount:\\s'${amount}',`);
}