'use strict';

const { get, post } = require('../util/http');

const CONFIG_PATH = '/set-agent-provider-config.json';
const SCHEMES = ['https', 'http'];
const NON_EXISTENT = [404, 405, 501];

function normalizeHost(domain) {
  let s = String(domain == null ? '' : domain).trim();
  s = s.replace(/^https?:\/\//i, '');
  s = s.replace(/[/?#].*$/, '');
  s = s.replace(/\/+$/, '');
  return s;
}

async function tryGet(url, apiKey, timeout) {
  const headers = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  try {
    return await get(url, { headers: headers, timeout: timeout || 10000 });
  } catch (e) {
    return null;
  }
}

async function tryPost(url, apiKey, timeout) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  try {
    return await post(url, { headers: headers, body: {}, timeout: timeout || 10000 });
  } catch (e) {
    return null;
  }
}

async function tryLoadConfig(host) {
  for (const scheme of SCHEMES) {
    const url = scheme + '://' + host + CONFIG_PATH;
    const res = await tryGet(url);
    if (!res) continue;
    if (res.status >= 200 && res.status < 300) {
      try {
        return JSON.parse(res.body);
      } catch (e) {
        throw new Error('Invalid JSON in ' + url + ': ' + e.message);
      }
    }
  }
  return null;
}

async function detectBase(host, apiKey) {
  for (const scheme of SCHEMES) {
    const origin = scheme + '://' + host;
    const models = await tryGet(origin + '/v1/models', apiKey);
    if (models && models.status === 200) return origin + '/v1';
    const chat = await tryPost(origin + '/v1/chat/completions', apiKey);
    if (chat && NON_EXISTENT.indexOf(chat.status) === -1) return origin + '/v1';
  }
  return null;
}

async function resolveDomain(domain, apiKey) {
  const host = normalizeHost(domain);
  if (!host) {
    throw new Error('Invalid domain: ' + domain);
  }

  const remote = await tryLoadConfig(host);
  if (remote && typeof remote === 'object' && !Array.isArray(remote)) {
    return Object.assign({}, remote, { name: remote.name || host });
  }

  const baseUrl = await detectBase(host, apiKey);
  if (!baseUrl) {
    throw new Error('Could not detect an OpenAI-compatible API at ' + host +
      ' (no /set-agent-provider-config.json, /v1/models, or /v1/chat/completions).');
  }

  return { name: host, baseUrl: baseUrl, models: undefined };
}

module.exports = { resolveDomain: resolveDomain, normalizeHost: normalizeHost };
