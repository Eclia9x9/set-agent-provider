'use strict';

const fs = require('fs');

function localTimestamp(d) {
  const p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    '_' + p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds());
}

function backupFiles(files) {
  const ts = localTimestamp(new Date());
  const backedUp = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const dest = file + '.bak-' + ts;
    fs.copyFileSync(file, dest);
    backedUp.push(dest);
  }
  return backedUp;
}

module.exports = { backupFiles };
