'use strict';

const { get, post } = require('../util/http');
const { normalizeConfig } = require('../config/schema');

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

async function getSafe(url, apiKey) {
  const headers = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  try {
    return await get(url, { headers: headers, timeout: 10000 });
  } catch (e) {
    return null;
  }
}

async function postSafe(url, apiKey) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  try {
    return await post(url, { headers: headers, body: {}, timeout: 10000 });
  } catch (e) {
    return null;
  }
}

async function probeConfig(host) {
  for (const scheme of SCHEMES) {
    const url = scheme + '://' + host + CONFIG_PATH;
    const res = await getSafe(url);
    if (!res || res.status < 200 || res.status >= 300) continue;
    let raw;
    try {
      raw = JSON.parse(res.body);
    } catch (e) {
      continue;
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    try {
      return normalizeConfig(raw);
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function probeChat(host, apiKey) {
  for (const scheme of SCHEMES) {
    const origin = scheme + '://' + host;
    const res = await postSafe(origin + '/v1/chat/completions', apiKey);
    if (!res) continue;
    if (NON_EXISTENT.indexOf(res.status) !== -1) continue;
    try {
      JSON.parse(res.body);
    } catch (e) {
      continue;
    }
    return origin + '/v1';
  }
  return null;
}

async function resolveDomain(domain, opts) {
  opts = opts || {};
  const host = normalizeHost(domain);
  if (!host) {
    throw new Error('Invalid domain: ' + domain);
  }

  const config = await probeConfig(host);
  if (config) {
    return { config: config, baseUrl: config.baseUrl || null };
  }

  if (opts.probe === false) {
    return { config: null, baseUrl: null };
  }

  const baseUrl = await probeChat(host, opts.apiKey);
  if (!baseUrl) {
    throw new Error('Could not detect an OpenAI-compatible API at ' + host +
      ' (no /set-agent-provider-config.json or POST /v1/chat/completions).');
  }
  return { config: null, baseUrl: baseUrl };
}

module.exports = { resolveDomain: resolveDomain, normalizeHost: normalizeHost };
