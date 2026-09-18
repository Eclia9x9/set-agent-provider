'use strict';

const fs = require('fs');
const { get } = require('../util/http');
const { normalizeConfig } = require('./schema');

const CONFIG_PATH = '/set-agent-provider-config.json';

async function loadConfigSource(source) {
  if (!source) return {};
  if (/^https?:\/\//i.test(source)) {
    return normalizeConfig(await fetchConfigUrl(source));
  }
  if (fs.existsSync(source)) {
    return normalizeConfig(parseJson(fs.readFileSync(source, 'utf8'), source));
  }
  const domain = String(source).replace(/\/+$/, '');
  let lastErr;
  for (const scheme of ['https', 'http']) {
    try {
      return normalizeConfig(await fetchConfigUrl(scheme + '://' + domain + CONFIG_PATH));
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error('Could not load config from "' + source + '"' + (lastErr ? ' (' + lastErr.message + ')' : ''));
}

async function fetchConfigUrl(url) {
  let res;
  try {
    res = await get(url, { headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new Error('Failed to fetch ' + url + ': ' + e.message);
  }
  if (res.status < 200 || res.status >= 300) {
    throw new Error('Config fetch returned HTTP ' + res.status + ' for ' + url);
  }
  return parseJson(res.body, url);
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON' + (label ? ' in ' + label : '') + ': ' + e.message);
  }
}

module.exports = { loadConfigSource: loadConfigSource, CONFIG_PATH: CONFIG_PATH };
