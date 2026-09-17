'use strict';

const SPEC = {
  '--name': 'name', '--baseUrl': 'baseUrl', '--baseurl': 'baseUrl',
  '--apiKey': 'apiKey', '--apikey': 'apiKey',
  '--models': 'models', '--target': 'target', '--config': 'config',
  '--domain': 'domain', '--status': 'status', '--help': 'help',
  '--version': 'version',
  '-N': 'name', '-U': 'baseUrl', '-K': 'apiKey', '-M': 'models',
  '-T': 'target', '-C': 'config', '-D': 'domain', '-h': 'help', '-v': 'version'
};

const FLAGS = { status: true, help: true, version: true };

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    let key = tok;
    let val = null;
    if (tok.indexOf('--') === 0 && tok.indexOf('=') !== -1) {
      const idx = tok.indexOf('=');
      key = tok.slice(0, idx);
      val = tok.slice(idx + 1);
    }
    const field = SPEC[key];
    if (!field) {
      throw new Error('Unknown option: ' + tok);
    }
    if (FLAGS[field]) {
      out[field] = true;
      continue;
    }
    if (val == null) val = argv[++i];
    if (val == null || val === '') {
      throw new Error('Missing value for ' + key);
    }
    out[field] = val;
  }
  return out;
}

module.exports = { parseArgs };
