'use strict';

const fs = require('fs');
const path = require('path');

function exists(file) {
  return fs.existsSync(file);
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function writeJson(file, obj) {
  writeText(file, JSON.stringify(obj, null, 2) + '\n');
}

module.exports = { exists, readText, writeText, readJson, writeJson };
