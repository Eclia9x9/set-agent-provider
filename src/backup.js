'use strict';

const fs = require('fs');

function localTimestamp(d) {
  const p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    '_' + p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds());
}

function backupFile(file, ts) {
  if (!fs.existsSync(file)) return null;
  const dest = file + '.bak-' + ts;
  fs.copyFileSync(file, dest);
  return dest;
}

function backupFiles(files) {
  const ts = localTimestamp(new Date());
  const backedUp = [];
  for (const file of files) {
    const dest = backupFile(file, ts);
    if (dest) backedUp.push(dest);
  }
  return backedUp;
}

module.exports = { backupFiles, backupFile, localTimestamp };
