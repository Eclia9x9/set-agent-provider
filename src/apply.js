'use strict';

const { resolveTargets } = require('./discover');
const { backupFile, localTimestamp } = require('./backup');
const { setBackupHook } = require('./util/fs');

async function applyProvider(cfg, opts) {
  opts = opts || {};
  const resolved = resolveTargets(opts.targetArg);
  const interactive = Boolean(opts.interactive);
  const results = [];

  for (const adapter of resolved.selected) {
    try {
      let extra = {};
      if (typeof adapter.resolveOptions === 'function') {
        extra = (await adapter.resolveOptions({
          baseUrl: cfg.baseUrl,
          apiKey: cfg.apiKey,
          models: cfg.models,
          defaultModel: opts.defaultModel,
          interactive: interactive
        })) || {};
      }

      const ts = localTimestamp(new Date());
      const backedUp = [];
      setBackupHook(function (file) {
        const dest = backupFile(file, ts);
        if (dest) backedUp.push(dest);
      });

      let changed;
      try {
        changed = adapter.write(Object.assign({
          name: cfg.name,
          baseUrl: cfg.baseUrl,
          apiKey: cfg.apiKey,
          models: cfg.models,
          defaultModel: opts.defaultModel
        }, extra));
      } finally {
        setBackupHook(null);
      }

      results.push({
        id: adapter.id,
        name: adapter.name,
        ok: true,
        changed: changed !== false,
        backedUp: backedUp,
        detection: extra.detection,
        wireApi: extra.wireApi
      });
    } catch (e) {
      setBackupHook(null);
      results.push({ id: adapter.id, name: adapter.name, ok: false, error: e.message });
    }
  }

  for (const m of resolved.missing) {
    results.push({ id: m, name: m, ok: false, skipped: true, error: 'Not installed / unknown target' });
  }

  return { results: results, selected: resolved.selected, missing: resolved.missing };
}

module.exports = { applyProvider };
