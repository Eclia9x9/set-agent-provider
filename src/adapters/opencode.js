'use strict';

const path = require('path');
const { home } = require('../util/paths');
const { exists, readJson, writeJson } = require('../util/fs');

const ID = 'opencode';

function file() {
  return path.join(home(), '.config', 'opencode', 'opencode.json');
}

function write(ctx) {
  const f = file();
  let cfg = {};
  if (exists(f)) {
    try { cfg = readJson(f); } catch (e) { cfg = {}; }
  }
  if (!cfg.provider || typeof cfg.provider !== 'object') cfg.provider = {};

  const provider = {
    name: ctx.name,
    npm: '@ai-sdk/openai-compatible',
    options: { baseURL: trimTrailing(ctx.baseUrl) }
  };
  if (ctx.apiKey) provider.options.apiKey = ctx.apiKey;

  if (ctx.models && ctx.models.length) {
    const models = {};
    for (const m of ctx.models) {
      const entry = { name: m.name };
      if (m.reasoning) entry.reasoning = true;
      if (m.limit && (m.limit.context != null || m.limit.output != null)) {
        entry.limit = {};
        if (m.limit.context != null) entry.limit.context = m.limit.context;
        if (m.limit.output != null) entry.limit.output = m.limit.output;
      }
      models[m.id] = entry;
    }
    provider.models = models;
  }

  cfg.provider[ctx.name] = provider;
  if (ctx.defaultModel) cfg.model = ctx.name + '/' + ctx.defaultModel;
  return writeJson(f, cfg);
}

function readStatus() {
  const f = file();
  if (!exists(f)) return null;
  let cfg;
  try { cfg = readJson(f); } catch (e) { return null; }
  if (!cfg.model || typeof cfg.model !== 'string') return null;
  const name = cfg.model.split('/')[0];
  const p = cfg.provider && cfg.provider[name];
  if (!p) return null;
  return {
    configured: true,
    name: name,
    baseUrl: p.options && p.options.baseURL,
    defaultModel: cfg.model.split('/').slice(1).join('/'),
    modelCount: p.models ? Object.keys(p.models).length : 0
  };
}

function trimTrailing(s) {
  return String(s).replace(/\/+$/, '');
}

module.exports = {
  id: ID,
  name: 'OpenCode',
  configPaths: ['~/.config/opencode/opencode.json', '~/.config/opencode'],
  supports: { reasoning: true, limit: true },
  writeFiles: function () { return [file()]; },
  write: write,
  readStatus: readStatus
};
