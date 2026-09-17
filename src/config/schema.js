'use strict';

function normalizeConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') {
    throw new Error('Config must be an object');
  }
  const out = {
    name: typeof cfg.name === 'string' && cfg.name ? cfg.name.trim() : null,
    baseUrl: typeof cfg.baseUrl === 'string' && cfg.baseUrl ? cfg.baseUrl.trim() : null,
    apiKey: typeof cfg.apiKey === 'string' && cfg.apiKey ? cfg.apiKey : undefined,
    models: cfg.models != null ? parseModels(cfg.models) : undefined
  };
  return out;
}

function parseModels(models) {
  let arr;
  if (Array.isArray(models)) {
    arr = models;
  } else if (typeof models === 'object') {
    arr = Object.keys(models).map(function (id) {
      const v = models[id];
      if (v && typeof v === 'object') return Object.assign({ id: id }, v);
      return { id: id, name: v };
    });
  } else {
    throw new Error('models must be an array or object');
  }
  return arr.map(normalizeModel);
}

function normalizeModel(m, i) {
  if (typeof m === 'string') return { id: m, name: m, reasoning: false, limit: undefined };
  if (!m || typeof m !== 'object') throw new Error('Invalid model at index ' + i);
  const id = m.id != null ? m.id : m.name;
  if (id == null) throw new Error('Model missing id/name at index ' + i);
  return {
    id: String(id),
    name: m.name != null ? String(m.name) : String(id),
    reasoning: m.reasoning === true,
    limit: m.limit && typeof m.limit === 'object'
      ? { context: m.limit.context, output: m.limit.output }
      : undefined
  };
}

module.exports = { normalizeConfig, parseModels };
