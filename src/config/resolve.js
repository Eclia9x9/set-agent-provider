'use strict';

const fs = require('fs');
const { loadFromSource } = require('./load');
const { normalizeConfig } = require('./schema');

async function resolveConfig(args) {
  let base = {};
  if (args.config) {
    base = await loadFromSource(args.config);
  }

  const merged = {
    name: args.name != null ? args.name : base.name,
    baseUrl: args.baseUrl != null ? args.baseUrl : base.baseUrl,
    apiKey: args.apiKey != null ? args.apiKey : base.apiKey,
    models: args.models != null ? parseModelsArg(args.models) : base.models
  };

  const cfg = normalizeConfig(merged);

  if (!cfg.name) {
    if (args.config && isDomainLike(args.config)) {
      cfg.name = domainOf(args.config);
    } else {
      cfg.name = 'local';
    }
  }
  return cfg;
}

function parseModelsArg(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    throw new Error('Invalid JSON for --models: ' + e.message);
  }
}

function isDomainLike(source) {
  if (/^https?:\/\//i.test(source)) return true;
  if (fs.existsSync(source)) return false;
  return /\./.test(source);
}

function domainOf(source) {
  if (/^https?:\/\//i.test(source)) {
    try { return new URL(source).hostname; } catch (e) { return source; }
  }
  return String(source).replace(/\/+$/, '').split('/')[0];
}

module.exports = { resolveConfig };
