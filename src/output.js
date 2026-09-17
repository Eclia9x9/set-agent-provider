'use strict';

function maskKey(apiKey) {
  if (!apiKey) return null;
  const s = String(apiKey);
  if (s.length <= 6) return '****';
  return s.slice(0, 3) + '...' + s.slice(-3);
}

function printSummary(cfg, results) {
  const lines = [];
  lines.push('');
  lines.push('Provider : ' + cfg.name);
  lines.push('Base URL : ' + cfg.baseUrl);
  lines.push('API key  : ' + (cfg.apiKey ? maskKey(cfg.apiKey) : '(none)'));
  lines.push('Models   : ' + (cfg.models ? cfg.models.length : 0));
  lines.push('');

  for (const r of results) {
    if (r.ok) {
      const b = r.backedUp && r.backedUp.length ? '  [backed up ' + r.backedUp.length + ' file(s)]' : '';
      const d = r.wireApi ? '  [wire_api=' + r.wireApi + ']' : '';
      lines.push('  OK   ' + r.name + d + b);
    } else if (r.skipped) {
      lines.push('  SKIP ' + r.name + ' — ' + r.error);
    } else {
      lines.push('  FAIL ' + r.name + ' — ' + r.error);
    }
  }

  const okCount = results.filter(function (r) { return r.ok; }).length;
  const failCount = results.filter(function (r) { return !r.ok && !r.skipped; }).length;
  lines.push('');
  lines.push('Done: ' + okCount + ' configured, ' + failCount + ' failed.');

  const failed = results.filter(function (r) { return !r.ok && !r.skipped; });
  if (failed.length) {
    lines.push('');
    lines.push('Failed targets:');
    for (const f of failed) lines.push('  - ' + f.name + ': ' + f.error);
  }

  process.stdout.write(lines.join('\n') + '\n');
}

module.exports = { maskKey: maskKey, printSummary: printSummary };
