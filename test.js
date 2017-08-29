'use strict';

const { spawn } = require('child_process');

const tests = {
  '--dataDirectory tests/0 --percentage false --amount 1000 --bpg 100 --hpg 0 --sThreshold 0': '1007.14',
  '--dataDirectory tests/0 --percentage false --amount 1000 --bpg 100 --hpg 10 --sThreshold 0': '997.14',
  '--dataDirectory tests/1 --percentage true --amount 1000 --bpg 100 --hpg 0 --sThreshold 0': '0.00'
};

for (let test in tests) {
  let amount = tests[test];
  let analyze = spawn('node', [
    'analyze.js'
  ].concat(test.split(' ')));

  analyze.stdout.on('data', data => {
    data = toStr(data);
    if (!getTestRx(amount).test(data)) {
      console.info("data", data);
      console.info("amount", amount);
      throw Error(`${test} - FAIL`);
    }
    console.log(`${test} - PASS`);
  });
}

function toStr(data) {
  return (new Buffer(data)).toString('utf8');
}
function getTestRx(amount) {
  return new RegExp(`amount:\\s'${amount}',`);
}