'use strict';

const readline = require('readline');
const { isInteractive } = require('../models/select');
const { maskKey } = require('../output');

function ask(rl, question, defaultValue) {
  return new Promise(function (resolve) {
    const q = defaultValue ? question + ' [' + defaultValue + ']: ' : question + ': ';
    rl.question(q, function (ans) {
      const v = String(ans).trim();
      resolve(v || defaultValue || '');
    });
  });
}

function askYes(rl, question, def) {
  return new Promise(function (resolve) {
    rl.question(question + ' [' + (def ? 'Y/n' : 'y/N') + ']: ', function (ans) {
      const v = String(ans).trim().toLowerCase();
      if (!v) return resolve(def);
      resolve(v === 'y' || v === 'yes');
    });
  });
}

async function runWizard(cfg) {
  if (!isInteractive()) return { cancelled: false, cfg: cfg };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write('\nset-agent-provider — interactive setup\n\n');

    let name = cfg.name;
    if (!name) name = await ask(rl, 'Provider name', 'local');

    let baseUrl = cfg.baseUrl;
    while (!baseUrl) {
      baseUrl = await ask(rl, 'Base URL (e.g. https://api.example.com/v1)');
      if (!baseUrl) process.stdout.write('Base URL is required.\n');
    }

    let apiKey = cfg.apiKey;
    if (apiKey == null) {
      apiKey = await ask(rl, 'API key (optional, Enter to skip)');
    }

    const next = Object.assign({}, cfg, {
      name: name || 'local',
      baseUrl: baseUrl,
      apiKey: apiKey || undefined
    });

    process.stdout.write('\n');
    process.stdout.write('  Name   : ' + next.name + '\n');
    process.stdout.write('  BaseUrl: ' + next.baseUrl + '\n');
    process.stdout.write('  API key: ' + (next.apiKey ? maskKey(next.apiKey) : '(none)') + '\n\n');

    const ok = await askYes(rl, 'Apply this configuration?', true);
    if (!ok) return { cancelled: true, cfg: cfg };
    return { cancelled: false, cfg: next };
  } finally {
    rl.close();
  }
}

module.exports = { runWizard: runWizard };
