'use strict';

const os = require('os');
const path = require('path');

function home() {
  return os.homedir();
}

function expandHome(p) {
  if (p === '~') return home();
  if (typeof p === 'string' && (p.startsWith('~/') || p.startsWith('~\\'))) {
    return path.join(home(), p.slice(2));
  }
  return p;
}

module.exports = { home, expandHome };
