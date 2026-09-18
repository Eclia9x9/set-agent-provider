'use strict';

function hostOf(baseUrl) {
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).hostname || null;
  } catch (e) {
    return String(baseUrl).replace(/\/+$/, '') || null;
  }
}

function resolveName(args, config, baseUrl) {
  if (args.name != null) return args.name;
  if (config && config.name) return config.name;
  return hostOf(baseUrl) || 'local';
}

module.exports = { resolveName: resolveName, hostOf: hostOf };
