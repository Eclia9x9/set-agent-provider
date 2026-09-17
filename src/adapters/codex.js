'use strict';

const path = require('path');
const { home } = require('../util/paths');
const { exists, readText, writeText, readJson, writeJson } = require('../util/fs');
const { post } = require('../util/http');
const { promptChoice } = require('../models/select');

const ID = 'codex';
const ENV_KEY = 'OPENAI_API_KEY';

function configFile() { return path.join(home(), '.codex', 'config.toml'); }
function authFile() { return path.join(home(), '.codex', 'auth.json'); }

function tomlStr(s) {
  return JSON.stringify(String(s));
}

function sanitizeKey(name) {
  const k = String(name).replace(/[^A-Za-z0-9_-]/g, '-');
  return k || 'provider';
}

function headerPath(line) {
  const m = String(line).match(/^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*(?:#.*)?$/);
  return m ? m[1] : null;
}

function setTopKey(lines, key, value) {
  if (value == null || value === '') return lines;
  const re = new RegExp('^\\s*' + key + '\\s*=');
  const out = lines.filter(function (l) { return !re.test(l); });
  out.push(key + ' = ' + tomlStr(value));
  return out;
}

function removeProviderTables(lines, key) {
  const out = [];
  let skip = false;
  for (const l of lines) {
    const h = headerPath(l);
    if (h != null) {
      const norm = h.replace(/"/g, '');
      skip = norm === 'model_providers.' + key || norm.indexOf('model_providers.' + key + '.') === 0;
      if (skip) continue;
    }
    if (!skip) out.push(l);
  }
  return out;
}

async function probeEndpoint(baseUrl, apiKey) {
  const url = String(baseUrl).replace(/\/+$/, '') + '/responses';
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  try {
    const res = await post(url, { headers: headers, body: { model: '__probe__', input: 'ping' }, timeout: 10000 });
    return { exists: res.status !== 404 && res.status !== 405 && res.status !== 501, status: res.status };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}

async function probeConversation(baseUrl, apiKey, model) {
  const url = String(baseUrl).replace(/\/+$/, '') + '/responses';
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  try {
    const res = await post(url, { headers: headers, body: { model: model, input: 'ping' }, timeout: 30000 });
    return { ok: res.status >= 200 && res.status < 300, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function resolveOptions(ctx) {
  let mode = 'endpoint';
  if (ctx.interactive) {
    const idx = await promptChoice('Codex: check Responses API support?', [
      'Detect endpoint only (POST /v1/responses)',
      'Test the default model with a real request',
      'Skip detection'
    ]);
    if (idx === 1) mode = 'conversation';
    else if (idx === 2) mode = 'skip';
  }

  if (mode === 'skip') return { wireApi: 'responses' };
  if (mode === 'conversation') {
    const r = await probeConversation(ctx.baseUrl, ctx.apiKey, ctx.defaultModel);
    return { wireApi: r.ok ? 'responses' : 'chat', detection: r, detectionMode: mode };
  }
  const r = await probeEndpoint(ctx.baseUrl, ctx.apiKey);
  return { wireApi: r.exists ? 'responses' : 'chat', detection: r, detectionMode: mode };
}

function write(ctx) {
  const f = configFile();
  let text = exists(f) ? readText(f) : '';
  const key = sanitizeKey(ctx.name);
  const wireApi = ctx.wireApi || 'responses';

  const lines = text.length ? text.split(/\r?\n/) : [];
  let firstSection = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\[/.test(lines[i])) { firstSection = i; break; }
  }
  if (firstSection === -1) firstSection = lines.length;

  let top = lines.slice(0, firstSection);
  let rest = lines.slice(firstSection);

  top = setTopKey(top, 'model', ctx.defaultModel);
  top = setTopKey(top, 'model_provider', key);
  rest = removeProviderTables(rest, key);

  const section = [
    '[model_providers.' + key + ']',
    'name = ' + tomlStr(ctx.name),
    'base_url = ' + tomlStr(String(ctx.baseUrl).replace(/\/+$/, '')),
    'env_key = ' + tomlStr(ENV_KEY),
    'wire_api = ' + tomlStr(wireApi),
    'requires_openai_auth = true'
  ];

  const topText = top.join('\n').trim();
  const restText = rest.join('\n').trim();
  const parts = [];
  if (topText) parts.push(topText);
  parts.push(section.join('\n'));
  if (restText) parts.push(restText);
  let changed = writeText(f, parts.join('\n\n') + '\n');

  if (ctx.apiKey) {
    const af = authFile();
    let auth = {};
    if (exists(af)) {
      try { auth = readJson(af); } catch (e) { auth = {}; }
    }
    auth.auth_mode = auth.auth_mode || 'apikey';
    auth[ENV_KEY] = ctx.apiKey;
    if (writeJson(af, auth)) changed = true;
  }

  return changed;
}

function readStatus() {
  const f = configFile();
  if (!exists(f)) return null;
  const text = readText(f);
  const mp = (text.match(/^\s*model_provider\s*=\s*"([^"]+)"/m) || [])[1];
  const model = (text.match(/^\s*model\s*=\s*"([^"]+)"/m) || [])[1];
  if (!mp) return null;
  const re = new RegExp('\\[model_providers\\."?' + mp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"?\\][\\s\\S]*?base_url\\s*=\\s*"([^"]+)"');
  const baseUrl = (text.match(re) || [])[1];
  return { configured: true, name: mp, baseUrl: baseUrl, defaultModel: model || null };
}

module.exports = {
  id: ID,
  name: 'Codex',
  configPaths: ['~/.codex/config.toml', '~/.codex'],
  supports: { reasoning: false, limit: false },
  writeFiles: function () { return [configFile(), authFile()]; },
  resolveOptions: resolveOptions,
  probeEndpoint: probeEndpoint,
  probeConversation: probeConversation,
  write: write,
  readStatus: readStatus
};
