'use strict';

const path = require('path');
const { home } = require('../util/paths');
const { exists, readJson, writeJson } = require('../util/fs');

const ID = 'pi';

function file() {
  return path.join(home(), '.pi', 'agent', 'models.json');
}

function trim(s) {
  return String(s).replace(/\/+$/, '');
}

function write(ctx) {
  const f = file();
  let cfg = {};
  if (exists(f)) {
    try { cfg = readJson(f); } catch (e) { cfg = {}; }
  }
  if (!cfg.providers || typeof cfg.providers !== 'object') cfg.providers = {};

  const provider = {
    name: ctx.name,
    baseUrl: trim(ctx.baseUrl),
    api: 'openai-completions'
  };
  if (ctx.apiKey) provider.apiKey = ctx.apiKey;

  if (ctx.models && ctx.models.length) {
    provider.models = ctx.models.map(function (m) {
      const entry = { id: m.id, name: m.name };
      if (m.reasoning) entry.reasoning = true;
      if (m.limit && m.limit.context != null) entry.contextWindow = m.limit.context;
      if (m.limit && m.limit.output != null) entry.maxTokens = m.limit.output;
      return entry;
    });
  }

  cfg.providers[ctx.name] = provider;
  return writeJson(f, cfg);
}

function readStatus() {
  const f = file();
  if (!exists(f)) return null;
  let cfg;
  try { cfg = readJson(f); } catch (e) { return null; }
  const providers = (cfg && cfg.providers) || {};
  const names = Object.keys(providers);
  if (!names.length) return null;
  const name = names[names.length - 1];
  const p = providers[name];
  return {
    configured: true,
    name: name,
    baseUrl: p.baseUrl,
    defaultModel: null,
    modelCount: p.models ? p.models.length : 0
  };
}

module.exports = {
  id: ID,
  name: 'pi',
  configPaths: ['~/.pi/agent/models.json', '~/.pi'],
  supports: { reasoning: true, limit: true },
  writeFiles: function () { return [file()]; },
  write: write,
  readStatus: readStatus
};
