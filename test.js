'use strict';

const { spawn } = require('child_process');

// node analyze.js --dataDirectory tests/0 --percentage false --amount 1000 --bpg 100 --hpg 0 --sThreshold 0
const test0 = spawn('node', [
  'analyze.js',
  '--dataDirectory',
  'tests/0',
  '--percentage',
  'false',
  '--amount',
  '1000',
  '--bpg',
  '100',
  '--hpg',
  '0',
  '--sThreshold',
  '0'
]);
test0.stdout.on('data', (data) => {
  data = toStr(data);
  if (!getTestRx('1007.14').test(data)) {
    throw Error('test0 fail');
  }
  console.log('test0 pass');
});

// node analyze.js --dataDirectory tests/0 --percentage false --amount 1000 --bpg 100 --hpg 0 --sThreshold 0
const test1 = spawn('node', [
  'analyze.js',
  '--dataDirectory',
  'tests/0',
  '--percentage',
  'false',
  '--amount',
  '1000',
  '--bpg',
  '100',
  '--hpg',
  '10',
  '--sThreshold',
  '0'
]);
test1.stdout.on('data', (data) => {
  data = toStr(data);
  if (!getTestRx('997.14').test(data)) {
    throw Error('test1 fail');
  }
  console.log('test1 pass');
});

function toStr(data) {
  return (new Buffer(data)).toString('utf8');
}
function getTestRx(amount) {
  return new RegExp(`amount:\\s'${amount}',`);
}