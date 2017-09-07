'use strict';

const _ = require('lodash');
const async = require('async');
const { spawn } = require('child_process');

// amount pegged at 100
// percentage vs static
// proportional vs not
// bpg
// hpg
// bThreshold
// hThreshold

var trials = [];
var proportionalTrials = [];

const amount = 100;
const settings = {
  percentage: [
    true,
    //false // @test algorithm not ready for this yet. it needs a system to keep track of losses vs gains in order to use this, same goes for Bs over 100%
  ],
  bpg: _.range(37, 50),
  hpg: _.range(0, amount * 2 + 1, 5),
  bThresholds: _.range(5300, 5700, 10),
  hThresholds: _.range(500, 17000, 500)
};

const knownFails = [
  {
    bpg: 5,
    hpg: 5
  },
  {
    bpg: 5,
    hpg: 10
  },
  {
    bpg: 5,
    hpg: 15
  }
];

settings.hpg = [0]; // @test temp, not totally sure, but H is not performing well

var hThresholds = settings.hThresholds;

_.each(settings.bpg, bpg => {
  _.each(settings.hpg, hpg => {
    if (hpg >= bpg) {
      return; // @test temporary, don't know if this is actually bad or not
    }
    // var knownFail = _.find(knownFails, {
    //   bpg,
    //   hpg
    // });
    // if (knownFail) {
    //   return;
    // }
    _.each(settings.percentage, percentage => {
      _.each(settings.bThresholds, bThreshold => {
        if (!hpg) {
          hThresholds = [0];
        } else {
          hThresholds = settings.hThresholds;
        }
        _.each(hThresholds, hThreshold => {
          trials.push(`--percentage ${percentage} --bpg ${bpg} --hpg ${hpg} --bThreshold ${bThreshold} --hThreshold ${hThreshold}`);
        });
      });
    });
  });
});

// settings.percentage.forEach(percentage => {
//   settings.bThresholds.forEach(bThreshold => {
//     settings.hThresholds.forEach(hThreshold => {
//       proportionalTrials.push(`--percentage ${percentage} --bThreshold ${bThreshold} --hThreshold ${hThreshold}`);
//     });
//   });
// });

console.info("trials.length", trials.length);
//throw Error(); // @test
// console.info("proportionalTrials.length", proportionalTrials.length); // @test

var max = 0;
var duplicates = [];
var index = 0;

async.eachSeries(trials, (trial, callback) => {
  var analyze = spawn('node', [
    'analyze.js',
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
      console.log(`dupe: ${a} : ${trial}`);
    }
    // if (index % 100 === 0) {
    //   console.log(`check in at ${index}`);
    //   console.log(`${trial} : ${a}`);
    //   console.log();
    // }
    index++;
  });
  analyze.on('close', callback);
});

// async.eachSeries(proportionalTrials, (trial, callback) => {
//   var analyze = spawn('node', [
//     'analyze.js',
//     '--amount',
//     100,
//     '--proportional',
//     'true'
//   ].concat(trial.split(' ')));
//   analyze.stdout.on('data', data => {
//     data = toStr(data);
//     console.info("data", data);
//   });
//   analyze.on('close', callback);
// });

function toStr(data) {
  return (new Buffer(data)).toString('utf8');
}
function getTestRx(amount) {
  return new RegExp(`amount:\\s'${amount}',`);
}