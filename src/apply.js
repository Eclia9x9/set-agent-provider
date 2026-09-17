'use strict';

const { resolveTargets } = require('./discover');
const { backupFiles } = require('./backup');
const { expandHome } = require('./util/paths');

async function applyProvider(cfg, opts) {
  opts = opts || {};
  const resolved = resolveTargets(opts.targetArg);
  const interactive = Boolean(opts.interactive);
  const results = [];

  for (const adapter of resolved.selected) {
    try {
      const files = adapter.writeFiles().map(expandHome);
      const backedUp = backupFiles(files);

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

      adapter.write(Object.assign({
        name: cfg.name,
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        models: cfg.models,
        defaultModel: opts.defaultModel
      }, extra));

      results.push({
        id: adapter.id,
        name: adapter.name,
        ok: true,
        backedUp: backedUp,
        detection: extra.detection,
        wireApi: extra.wireApi
      });
    } catch (e) {
      results.push({ id: adapter.id, name: adapter.name, ok: false, error: e.message });
    }
  }

  for (const m of resolved.missing) {
    results.push({ id: m, name: m, ok: false, skipped: true, error: 'Not installed / unknown target' });
  }

  return { results: results, selected: resolved.selected, missing: resolved.missing };
}

module.exports = { applyProvider };
