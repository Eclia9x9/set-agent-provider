'use strict';

const { resolveBaseUrl } = require('./baseurl');
const { resolveName } = require('./name');
const { parseModels } = require('./schema');
const { askApiKey } = require('../cli/prompt');
const { fetchModels } = require('../models/fetch');
const { multiSelect } = require('../models/select');

async function resolveConfig(args) {
  const resolved = await resolveBaseUrl(args);
  const config = resolved.config;
  const baseUrl = resolved.baseUrl;

  const apiKey = await resolveApiKey(args, config);
  const models = await resolveModels(args, config, baseUrl, apiKey);
  const name = resolveName(args, config, baseUrl);

  return {
    name: name,
    baseUrl: baseUrl,
    apiKey: apiKey,
    models: models
  };
}

async function resolveApiKey(args, config) {
  if (args.apiKey != null) return args.apiKey;
  if (config && config.apiKey) return config.apiKey;
  return askApiKey();
}

async function resolveModels(args, config, baseUrl, apiKey) {
  if (args.models != null) return parseModelsArg(args.models);
  if (config && config.models) return config.models;

  const fetched = await fetchModels(baseUrl, apiKey);
  if (!fetched.length) {
    throw new Error('No models returned from ' + baseUrl + ' (use -M/--models to provide them).');
  }
  const picked = await multiSelect(fetched);
  if (!picked.length) {
    throw new Error('No models selected.');
  }
  return parseModels(picked);
}

function parseModelsArg(str) {
  let raw;
  try {
    raw = JSON.parse(str);
  } catch (e) {
    throw new Error('Invalid JSON for --models: ' + e.message);
  }
  return parseModels(raw);
}

module.exports = { resolveConfig: resolveConfig };
