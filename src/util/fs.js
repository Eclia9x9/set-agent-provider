'use strict';

const fs = require('fs');
const path = require('path');

let backupFileHook = null;

function setBackupHook(fn) {
  backupFileHook = typeof fn === 'function' ? fn : null;
}

function exists(file) {
  return fs.existsSync(file);
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeText(file, text) {
  if (exists(file)) {
    let current = null;
    try { current = readText(file); } catch (e) { current = null; }
    if (current === text) return false;
    if (backupFileHook) backupFileHook(file);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
  return true;
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function writeJson(file, obj) {
  return writeText(file, JSON.stringify(obj, null, 2) + '\n');
}

module.exports = { exists, readText, writeText, readJson, writeJson, setBackupHook };
