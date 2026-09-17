'use strict';

const path = require('path');
const { home } = require('../util/paths');
const { exists, readJson, writeJson } = require('../util/fs');

const ID = 'claude';

function file() {
  return path.join(home(), '.claude', 'settings.json');
}

function stripV1(url) {
  let u = String(url).trim().replace(/\/+$/, '');
  u = u.replace(/\/v1$/i, '');
  return u + '/';
}

function write(ctx) {
  const f = file();
  let cfg = {};
  if (exists(f)) {
    try { cfg = readJson(f); } catch (e) { cfg = {}; }
  }
  if (!cfg.env || typeof cfg.env !== 'object') cfg.env = {};

  cfg.env.ANTHROPIC_BASE_URL = stripV1(ctx.baseUrl);
  if (ctx.apiKey) cfg.env.ANTHROPIC_AUTH_TOKEN = ctx.apiKey;
  if (ctx.defaultModel) {
    cfg.env.ANTHROPIC_MODEL = ctx.defaultModel;
    cfg.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = ctx.defaultModel;
    cfg.env.ANTHROPIC_DEFAULT_SONNET_MODEL = ctx.defaultModel;
    cfg.env.ANTHROPIC_DEFAULT_OPUS_MODEL = ctx.defaultModel;
  }

  return writeJson(f, cfg);
}

function readStatus() {
  const f = file();
  if (!exists(f)) return null;
  let cfg;
  try { cfg = readJson(f); } catch (e) { return null; }
  const env = cfg.env || {};
  if (!env.ANTHROPIC_BASE_URL && !env.ANTHROPIC_AUTH_TOKEN) return null;
  return {
    configured: true,
    name: 'claude',
    baseUrl: env.ANTHROPIC_BASE_URL,
    defaultModel: env.ANTHROPIC_MODEL || null,
    modelCount: env.ANTHROPIC_MODEL ? 1 : 0
  };
}

module.exports = {
  id: ID,
  name: 'Claude Code',
  configPaths: ['~/.claude/settings.json', '~/.claude.json', '~/.claude'],
  supports: { reasoning: false, limit: false },
  writeFiles: function () { return [file()]; },
  write: write,
  readStatus: readStatus,
  stripV1: stripV1
};
