'use strict';

const { get } = require('../util/http');

function modelsUrl(baseUrl) {
  const b = String(baseUrl).replace(/\/+$/, '');
  if (/\/v1$/i.test(b)) return b + '/models';
  return b + '/v1/models';
}

async function fetchModels(baseUrl, apiKey) {
  const url = modelsUrl(baseUrl);
  const headers = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;

  let res;
  try {
    res = await get(url, { headers: headers, timeout: 15000 });
  } catch (e) {
    throw new Error('Failed to fetch models from ' + url + ': ' + e.message);
  }
  if (res.status < 200 || res.status >= 300) {
    throw new Error('Model list request returned HTTP ' + res.status + ' for ' + url);
  }

  let data;
  try {
    data = JSON.parse(res.body);
  } catch (e) {
    throw new Error('Invalid JSON from ' + url);
  }

  const list = Array.isArray(data) ? data : (data.data || data.models || []);
  return list
    .map(function (m) {
      if (typeof m === 'string') return { id: m, name: m };
      const id = m && (m.id || m.name);
      return id ? { id: String(id), name: String(m.name || id) } : null;
    })
    .filter(Boolean);
}

module.exports = { fetchModels: fetchModels, modelsUrl: modelsUrl };
