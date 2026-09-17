'use strict';

const { parseArgs } = require('./cli/args');
const { printHelp } = require('./cli/help');
const { resolveConfig } = require('./config/resolve');
const { parseModels } = require('./config/schema');
const { fetchModels } = require('./models/fetch');
const { multiSelect, promptDefault, isInteractive } = require('./models/select');
const { runWizard } = require('./cli/wizard');
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

  let cfg = await resolveConfig(args);

  const noArgs = argv.length === 0;
  if ((noArgs || !cfg.baseUrl) && isInteractive()) {
    const res = await runWizard(cfg);
    if (res.cancelled) {
      process.stdout.write('Aborted.\n');
      return;
    }
    cfg = res.cfg;
  }

  if (!cfg.baseUrl) {
    throw new Error('baseUrl is required. Provide -U/--baseUrl or a --config source.');
  }

  if (!cfg.models || !cfg.models.length) {
    const fetched = await fetchModels(cfg.baseUrl, cfg.apiKey);
    if (!fetched.length) {
      throw new Error('No models returned from ' + cfg.baseUrl + ' (use -M/--models to provide them).');
    }
    const picked = await multiSelect(fetched);
    if (!picked.length) {
      throw new Error('No models selected.');
    }
    cfg.models = parseModels(picked);
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
