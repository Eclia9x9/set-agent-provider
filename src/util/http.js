'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

function request(method, url, opts) {
  opts = opts || {};
  const headers = opts.headers || {};
  const body = opts.body == null ? null : (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
  const timeout = opts.timeout || 15000;
  const maxRedirects = opts.maxRedirects == null ? 5 : opts.maxRedirects;

  return new Promise(function (resolve, reject) {
    let u;
    try {
      u = new URL(url);
    } catch (e) {
      return reject(new Error('Invalid URL: ' + url));
    }
    const lib = u.protocol === 'https:' ? https : http;
    const reqHeaders = Object.assign({}, headers);
    if (body != null) {
      if (reqHeaders['Content-Length'] == null) reqHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: method,
      headers: reqHeaders
    }, function (res) {
      const code = res.statusCode;
      if ([301, 302, 303, 307, 308].indexOf(code) !== -1 && res.headers.location && maxRedirects > 0) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        return resolve(request(method, next, {
          headers: headers,
          body: opts.body,
          timeout: timeout,
          maxRedirects: maxRedirects - 1
        }));
      }
      const chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () {
        resolve({ status: code, body: Buffer.concat(chunks).toString('utf8'), headers: res.headers });
      });
    });

    req.on('error', reject);
    req.setTimeout(timeout, function () { req.destroy(new Error('Request timeout')); });
    if (body != null) req.write(body);
    req.end();
  });
}

function get(url, opts) { return request('GET', url, opts); }
function post(url, opts) { return request('POST', url, opts); }

module.exports = { request, get, post };
