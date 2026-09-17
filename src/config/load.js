'use strict';

const fs = require('fs');
const { get } = require('../util/http');

const CONFIG_PATH = '/set-agent-provider-config.json';

async function loadFromSource(source) {
  if (!source) return {};
  if (/^https?:\/\//i.test(source)) {
    return fetchConfigUrl(source);
  }
  if (fs.existsSync(source)) {
    return parseJsonFile(source);
  }
  const domain = String(source).replace(/\/+$/, '');
  let lastErr;
  for (const scheme of ['https', 'http']) {
    try {
      return await fetchConfigUrl(scheme + '://' + domain + CONFIG_PATH);
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

function parseJsonFile(file) {
  return parseJson(fs.readFileSync(file, 'utf8'), file);
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON' + (label ? ' in ' + label : '') + ': ' + e.message);
  }
}

function isRemoteSource(source) {
  return /^https?:\/\//i.test(source) || (source && !fs.existsSync(source) && !/\.(json)$/i.test(source));
}

module.exports = { loadFromSource, isRemoteSource };
