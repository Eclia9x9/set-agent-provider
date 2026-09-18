'use strict';

const readline = require('readline');
const { maskKey } = require('../output');

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function ask(question, defaultValue) {
  return new Promise(function (resolve) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const q = defaultValue ? question + ' [' + defaultValue + ']: ' : question + ': ';
    rl.question(q, function (ans) {
      rl.close();
      const v = String(ans).trim();
      resolve(v || defaultValue || '');
    });
  });
}

function askYes(question, def) {
  return new Promise(function (resolve) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question + ' [' + (def ? 'Y/n' : 'y/N') + ']: ', function (ans) {
      rl.close();
      const v = String(ans).trim().toLowerCase();
      if (!v) return resolve(Boolean(def));
      resolve(v === 'y' || v === 'yes');
    });
  });
}

async function askBaseUrl() {
  if (!isInteractive()) return null;
  let baseUrl = '';
  while (!baseUrl) {
    baseUrl = await ask('Base URL (e.g. https://api.example.com/v1)');
    if (!baseUrl) process.stdout.write('Base URL is required.\n');
  }
  return baseUrl;
}

async function askApiKey(reason) {
  if (!isInteractive()) return undefined;
  const label = reason
    ? 'API key (' + reason + ', optional, Enter to skip)'
    : 'API key (optional, Enter to skip)';
  const value = await ask(label);
  return value || undefined;
}

async function confirm(cfg) {
  if (!isInteractive()) return true;
  process.stdout.write('\n');
  process.stdout.write('  Name   : ' + cfg.name + '\n');
  process.stdout.write('  BaseUrl: ' + cfg.baseUrl + '\n');
  process.stdout.write('  API Key: ' + (cfg.apiKey ? maskKey(cfg.apiKey) : '(none)') + '\n\n');
  return askYes('Apply this configuration?', true);
}

module.exports = {
  isInteractive: isInteractive,
  ask: ask,
  askYes: askYes,
  askBaseUrl: askBaseUrl,
  askApiKey: askApiKey,
  confirm: confirm
};
