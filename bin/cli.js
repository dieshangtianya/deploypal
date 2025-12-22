#!/usr/bin/env node

'use strict';

const { run } = require('../lib/cli');

run().catch(error => {
  console.error('Deploy failed:', error);
  process.exit(1);
});