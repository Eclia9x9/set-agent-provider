'use strict';

const { loadConfigSource } = require('./load');
const { resolveDomain } = require('../domain/resolve');
const { isInteractive, askBaseUrl } = require('../cli/prompt');

async function resolveBaseUrl(args) {
  if (args.config && args.domain) {
    throw new Error('Use either -C/--config or -D/--domain, not both.');
  }

  let config = null;
  let domainBase = null;

  if (args.config) {
    config = await loadConfigSource(args.config);
  } else if (args.domain) {
    const resolved = await resolveDomain(args.domain, {
      probe: args.baseUrl == null,
      apiKey: args.apiKey
    });
    config = resolved.config;
    domainBase = resolved.baseUrl;
  }

  let baseUrl = null;
  let source = null;
  if (args.baseUrl != null) {
    baseUrl = String(args.baseUrl).trim();
    source = 'flag';
  } else if (config && config.baseUrl) {
    baseUrl = String(config.baseUrl).trim();
    source = 'config';
  } else if (domainBase) {
    baseUrl = domainBase;
    source = 'domain';
  } else if (isInteractive()) {
    baseUrl = await askBaseUrl();
    source = 'prompt';
  }

  if (!baseUrl) {
    throw new Error('baseUrl is required. Provide -U/--baseUrl, a config source, or run interactively.');
  }

  return { baseUrl: baseUrl, config: config, source: source };
}

module.exports = { resolveBaseUrl: resolveBaseUrl };
