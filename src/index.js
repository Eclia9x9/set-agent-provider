'use strict';

const { parseArgs } = require('./cli/args');
const { printHelp } = require('./cli/help');
const { resolveConfig } = require('./config/resolve');
const { promptDefault, isInteractive } = require('./models/select');
const { confirm } = require('./cli/prompt');
const { runStatus } = require('./status');
const { applyProvider } = require('./apply');
const { printSummary } = require('./output');

async function run(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return;
  }
  if (args.version) {
    process.stdout.write(require('../package.json').version + '\n');
    return;
  }
  if (args.status) {
    runStatus(args);
    return;
  }

  const cfg = await resolveConfig(args);

  if (isInteractive()) {
    const ok = await confirm(cfg);
    if (!ok) {
      process.stdout.write('Aborted.\n');
      return;
    }
  }

  const defaultModel = (await promptDefault(cfg.models)) || cfg.models[0].id;

  const applied = await applyProvider(cfg, {
    targetArg: args.target,
    defaultModel: defaultModel,
    interactive: isInteractive()
  });
  printSummary(cfg, applied.results);
}

module.exports = { run: run };
