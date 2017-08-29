'use strict';

const { spawn } = require('child_process');
const tests = {
  //W - static - B - no H - > threshold
  '--dataDirectory tests/0 --percentage false --amount 1000 --bpg 100 --hpg 0 --sThreshold 0': '1007.14',
  // W - static - B - H - > threshold
  '--dataDirectory tests/0 --percentage false --amount 1000 --bpg 100 --hpg 10 --sThreshold 0': '997.14',
  // W - static - no B - no H - > threshold
  '--dataDirectory tests/0 --percentage false --amount 1000 --bpg 0 --hpg 0 --sThreshold 0': '1000.00',
  // W - static - no B - H - > threshold
  '--dataDirectory tests/0 --percentage false --amount 1000 --bpg 0 --hpg 100 --sThreshold 0': '900.00',
  //W - percentage - B - no H - > threshold
  '--dataDirectory tests/0 --percentage true --amount 1000 --bpg 50 --hpg 0 --sThreshold 0': '1035.71',
  // W - percentage - B - H - > threshold
  '--dataDirectory tests/0 --percentage true --amount 1000 --bpg 60 --hpg 10 --sThreshold 0': '942.86',
  // W - percentage - no B - no H - > threshold
  '--dataDirectory tests/0 --percentage true --amount 1000 --bpg 0 --hpg 0 --sThreshold 0': '1000.00',
  // W - percentage - no B - H - > threshold
  '--dataDirectory tests/0 --percentage true --amount 1000 --bpg 0 --hpg 10 --sThreshold 0': '900.00',
  // W - < threshold
  '--dataDirectory tests/0 --percentage true --amount 1000 --bpg 100 --hpg 10 --sThreshold 10000': '1000.00',
  // L - static - B - no H - > threshold
  '--dataDirectory tests/1 --percentage false --amount 1000 --bpg 100 --hpg 0 --sThreshold 0': '900.00',
  // L - static - B - H - > threshold
  '--dataDirectory tests/1 --percentage false --amount 1000 --bpg 100 --hpg 10 --sThreshold 0': '914.00',
  // L - static - no B - no H - > threshold
  '--dataDirectory tests/1 --percentage false --amount 1000 --bpg 0 --hpg 0 --sThreshold 0': '1000.00',
  // L - static - no B - H - > threshold
  '--dataDirectory tests/1 --percentage false --amount 1000 --bpg 0 --hpg 10 --sThreshold 0': '1014.00',
  // L - percentage - B - no H - > threshold
  '--dataDirectory tests/1 --percentage true --amount 1000 --bpg 50 --hpg 0 --sThreshold 0': '500.00',
  // L - percentage - B - H - > threshold
  '--dataDirectory tests/1 --percentage true --amount 1000 --bpg 50 --hpg 10 --sThreshold 0': '640.00',
  // L - percentage - no B - no H - > threshold
  '--dataDirectory tests/1 --percentage true --amount 1000 --bpg 0 --hpg 0 --sThreshold 0': '1000.00',
  // L - percentage - no B - H - > threshold
  '--dataDirectory tests/1 --percentage true --amount 1000 --bpg 0 --hpg 15 --sThreshold 0': '1210.00',
  // L - < threshold
  '--dataDirectory tests/1 --percentage false --amount 1000 --bpg 0 --hpg 15 --sThreshold 10000': '1000.00',
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