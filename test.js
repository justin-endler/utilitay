'use strict';

const { spawn } = require('child_process');
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
  console.log(`stdout: ${data}`);
});

test0.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});