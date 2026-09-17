'use strict';

const path = require('path');
const { home } = require('../util/paths');
const { exists, readText, writeText } = require('../util/fs');

const ID = 'dsh';
const NAMESPACE = 'llm-pi-ai';

function settingsFile() { return path.join(home(), '.dsh', 'settings.yaml'); }
function credsFile() { return path.join(home(), '.dsh', '.credentials.yaml'); }

function yq(v) {
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function credentialRef(name) {
  let n = String(name).replace(/[^A-Za-z0-9_]/g, '_').toUpperCase();
  if (!/^[A-Za-z_]/.test(n)) n = 'P_' + n;
  return n + '_API_KEY';
}

function topKey(line) {
  const m = /^([^\s:#][^:]*):(\s|$)/.exec(line);
  return m ? m[1] : null;
}

function upsertNamespace(text, key, innerYaml) {
  const lines = (text || '').split(/\r?\n/);
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  const result = [];
  let done = false;
  let i = 0;
  while (i < lines.length) {
    if (topKey(lines[i]) === key) {
      result.push(key + ':');
      for (const bl of innerYaml.split('\n')) result.push(bl === '' ? '' : '  ' + bl);
      i++;
      while (i < lines.length && topKey(lines[i]) === null) i++;
      done = true;
      continue;
    }
    result.push(lines[i]);
    i++;
  }
  if (!done) {
    if (result.length) result.push('');
    result.push(key + ':');
    for (const bl of innerYaml.split('\n')) result.push(bl === '' ? '' : '  ' + bl);
  }
  return result.join('\n') + '\n';
}

function buildProviderYaml(ctx, ref) {
  const out = [];
  out.push('providers:');
  out.push('  ' + ctx.name + ':');
  out.push('    displayName: ' + yq(ctx.name));
  out.push('    api: ' + yq('openai-completions'));
  out.push('    baseURL: ' + yq(String(ctx.baseUrl).replace(/\/+$/, '')));
  out.push('    apiKeyEnv: ' + yq(ref));
  out.push('    models:');
  for (const m of ctx.models) {
    out.push('      - id: ' + yq(m.id));
    out.push('        name: ' + yq(m.name));
    if (m.limit && m.limit.context != null) out.push('        contextWindow: ' + Number(m.limit.context));
    if (m.limit && m.limit.output != null) out.push('        maxTokens: ' + Number(m.limit.output));
  }
  return out.join('\n');
}

function buildDefaultModelYaml(ctx) {
  return ['provider: ' + yq(ctx.name), 'model: ' + yq(ctx.defaultModel)].join('\n');
}

function unquoteScalar(s) {
  s = String(s).trim();
  if (s.length >= 2 && s[0] === "'" && s[s.length - 1] === "'") return s.slice(1, -1).replace(/''/g, "'");
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') return s.slice(1, -1);
  return s;
}

function parseCreds(text) {
  const refs = {};
  const records = [];
  let section = null;
  for (const line of (text || '').split(/\r?\n/)) {
    const k = topKey(line);
    if (k) {
      section = k;
      continue;
    }
    if (section === 'refs') {
      const m = /^\s+([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$/.exec(line);
      if (m) refs[m[1]] = unquoteScalar(m[2]);
    } else if (section === 'records') {
      records.push(line);
    }
  }
  return { refs: refs, recordsRaw: records.join('\n').replace(/^\n+|\s+$/g, '') };
}

function writeCreds(refs, recordsRaw) {
  let out = 'version: 1\nrefs:\n';
  for (const k of Object.keys(refs)) out += '  ' + k + ': ' + yq(refs[k]) + '\n';
  if (recordsRaw) out += 'records:\n' + recordsRaw + '\n';
  return out;
}

function write(ctx) {
  const sf = settingsFile();
  const cf = credsFile();
  const ref = credentialRef(ctx.name);

  let settings = exists(sf) ? readText(sf) : '';
  settings = upsertNamespace(settings, NAMESPACE, buildProviderYaml(ctx, ref));
  settings = upsertNamespace(settings, 'agent-default-model', buildDefaultModelYaml(ctx));
  writeText(sf, settings);

  if (ctx.apiKey) {
    let credsText = exists(cf) ? readText(cf) : '';
    const parsed = parseCreds(credsText);
    parsed.refs[ref] = ctx.apiKey;
    writeText(cf, writeCreds(parsed.refs, parsed.recordsRaw));
  }
}

function readStatus() {
  const sf = settingsFile();
  if (!exists(sf)) return null;
  const text = readText(sf);
  const dmMatch = text.match(/agent-default-model:\s*\n\s+provider:\s*'?([^'\n]+)'?\s*\n\s+model:\s*'?([^'\n]+)'?/);
  if (!dmMatch) return null;
  const provider = dmMatch[1].trim();
  const model = dmMatch[2].trim();
  const baseMatch = text.match(new RegExp(provider.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*\\n(?:\\s+.*\\n)*?\\s+baseURL:\\s*\'?([^\'\\n]+)'));
  return {
    configured: true,
    name: provider,
    baseUrl: baseMatch ? baseMatch[1].trim() : null,
    defaultModel: model,
    modelCount: 1
  };
}

module.exports = {
  id: ID,
  name: 'dsh',
  configPaths: ['~/.dsh/settings.yaml', '~/.dsh'],
  supports: { reasoning: false, limit: true },
  writeFiles: function () { return [settingsFile(), credsFile()]; },
  write: write,
  readStatus: readStatus,
  credentialRef: credentialRef
};
