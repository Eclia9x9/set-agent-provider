'use strict';

const readline = require('readline');
const { isInteractive } = require('../cli/prompt');

async function multiSelect(items) {
  if (!items.length) return [];
  if (!isInteractive()) return items.slice();
  return tuiSelect(items);
}

function tuiSelect(items) {
  return new Promise(function (resolve, reject) {
    let cursor = 0;
    const selected = new Set();
    let rendered = 0;

    const stdin = process.stdin;
    const stdout = process.stdout;
    readline.emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();

    function lineFor(i) {
      const it = items[i];
      const box = selected.has(i) ? '[x]' : '[ ]';
      const pointer = i === cursor ? '>' : ' ';
      const label = it.name && it.name !== it.id ? '  ' + it.name : '';
      return '  ' + pointer + ' ' + box + ' ' + it.id + label;
    }

    function render() {
      if (rendered > 0) stdout.write('\x1b[' + rendered + 'A');
      const lines = ['Select models (Space toggle, a=all, Enter confirm, Ctrl-C cancel):'];
      for (let i = 0; i < items.length; i++) lines.push(lineFor(i));
      let out = '';
      for (const l of lines) out += '\x1b[2K' + l + '\n';
      stdout.write(out);
      rendered = lines.length;
    }

    function cleanup() {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('keypress', onKey);
    }

    function onKey(str, key) {
      if (!key) return;
      if (key.ctrl && key.name === 'c') {
        cleanup();
        stdout.write('\n');
        return reject(new Error('Cancelled by user'));
      }
      if (key.name === 'up' || key.name === 'k') {
        cursor = (cursor - 1 + items.length) % items.length; render();
      } else if (key.name === 'down' || key.name === 'j') {
        cursor = (cursor + 1) % items.length; render();
      } else if (key.name === 'space') {
        if (selected.has(cursor)) selected.delete(cursor); else selected.add(cursor);
        render();
      } else if (key.name === 'a') {
        if (selected.size === items.length) selected.clear();
        else items.forEach(function (_v, i) { selected.add(i); });
        render();
      } else if (key.name === 'return' || key.name === 'enter') {
        if (selected.size === 0) selected.add(cursor);
        cleanup();
        stdout.write('\n');
        resolve(items.filter(function (_v, i) { return selected.has(i); }));
      }
    }

    render();
    stdin.on('keypress', onKey);
  });
}

function promptDefault(models) {
  if (!models || !models.length) return Promise.resolve(null);
  if (!isInteractive()) return Promise.resolve(models[0].id);

  return new Promise(function (resolve) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const lines = models.map(function (m, i) {
      const label = m.name && m.name !== m.id ? '  (' + m.name + ')' : '';
      return '  ' + (i + 1) + ') ' + m.id + label;
    });
    process.stdout.write('Choose the default model:\n' + lines.join('\n') + '\n');
    rl.question('Default model [1]: ', function (ans) {
      rl.close();
      const n = parseInt(String(ans).trim(), 10);
      if (!isNaN(n) && n >= 1 && n <= models.length) resolve(models[n - 1].id);
      else resolve(models[0].id);
    });
  });
}

function promptChoice(question, choices) {
  if (!choices || !choices.length) return Promise.resolve(-1);
  if (!isInteractive()) return Promise.resolve(0);
  return new Promise(function (resolve) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const lines = choices.map(function (c, i) { return '  ' + (i + 1) + ') ' + c; });
    process.stdout.write(question + '\n' + lines.join('\n') + '\n');
    rl.question('Choice [1]: ', function (ans) {
      rl.close();
      const n = parseInt(String(ans).trim(), 10);
      if (!isNaN(n) && n >= 1 && n <= choices.length) resolve(n - 1);
      else resolve(0);
    });
  });
}

module.exports = {
  multiSelect: multiSelect,
  promptDefault: promptDefault,
  promptChoice: promptChoice,
  isInteractive: isInteractive
};
