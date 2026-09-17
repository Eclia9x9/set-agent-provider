'use strict';

const { adapters } = require('./adapters');
const { resolveTargets } = require('./discover');

function pad(s, n) {
  s = String(s);
  while (s.length < n) s += ' ';
  return s;
}

function readOne(adapter) {
  try {
    return adapter.readStatus();
  } catch (e) {
    return null;
  }
}

function runStatus(args) {
  const resolved = resolveTargets(args.target);
  const showAll = !args.target;
  const lines = [];
  lines.push('');
  lines.push('Provider status:');

  const list = showAll ? adapters : resolved.selected;
  for (const a of list) {
    const s = readOne(a);
    if (s && s.configured) {
      const parts = ['name=' + (s.name || '?')];
      if (s.baseUrl) parts.push('baseUrl=' + s.baseUrl);
      if (s.defaultModel) parts.push('default=' + s.defaultModel);
      if (s.modelCount != null) parts.push('models=' + s.modelCount);
      lines.push('  ' + pad(a.name, 14) + ': ' + parts.join('  '));
    } else {
      lines.push('  ' + pad(a.name, 14) + ': (not configured)');
    }
  }

  if (!showAll) {
    for (const m of resolved.missing) {
      lines.push('  ' + pad(m, 14) + ': (unknown target)');
    }
  }

  lines.push('');
  process.stdout.write(lines.join('\n') + '\n');
}

module.exports = { runStatus: runStatus };
