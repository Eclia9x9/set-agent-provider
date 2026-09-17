#!/usr/bin/env node
'use strict';

require('../src/index.js').run(process.argv.slice(2)).catch(function (err) {
  process.stderr.write('\nError: ' + err.message + '\n');
  process.exit(1);
});
