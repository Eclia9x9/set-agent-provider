'use strict';

const { adapters } = require('./adapters');
const { expandHome } = require('./util/paths');
const { exists } = require('./util/fs');

function detectInstalled() {
  const out = [];
  for (const a of adapters) {
    const installed = (a.configPaths || []).some(function (p) {
      return exists(expandHome(p));
    });
    if (installed) out.push(a);
  }
  return out;
}

function resolveTargets(targetArg) {
  const installed = detectInstalled();
  const byId = new Map(installed.map(function (a) { return [a.id, a]; }));
  if (targetArg) {
    const wanted = String(targetArg).split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    const selected = [];
    const missing = [];
    for (const w of wanted) {
      if (byId.has(w)) selected.push(byId.get(w));
      else missing.push(w);
    }
    return { selected: selected, missing: missing, all: installed };
  }
  return { selected: installed, missing: [], all: installed };
}

module.exports = { detectInstalled, resolveTargets };
