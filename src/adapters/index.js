'use strict';

const opencode = require('./opencode');
const claude = require('./claude');
const codex = require('./codex');
const pi = require('./pi');
const dsh = require('./dsh');

const adapters = [claude, codex, opencode, pi, dsh];

function getAdapter(id) {
  return adapters.find(function (a) { return a.id === id; }) || null;
}

module.exports = { adapters, getAdapter };
