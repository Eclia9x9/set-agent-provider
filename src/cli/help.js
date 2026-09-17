'use strict';

function printHelp() {
  const text = [
    'set-agent-provider — configure a model provider across all installed AI CLIs',
    '',
    'Usage:',
    '  set-agent-provider [options]',
    '',
    'Options:',
    '  -N, --name <name>        Provider name (default: local, or the domain for remote config)',
    '  -U, --baseUrl <url>      Provider base URL (required)',
    '  -K, --apiKey <key>       Provider API key (optional)',
    '  -M, --models <json>      Models as strict JSON array',
    '  -T, --target <list>      Comma-separated targets (claude,codex,opencode,pi,dsh)',
    '  -C, --config <source>    Config source: file path, URL, or bare domain',
    '  -D, --domain <domain>    Auto-detect provider from a bare domain',
    '      --status             Show current provider config for each installed CLI',
    '  -h, --help               Show this help',
    '  -v, --version            Show version',
    '',
    'Examples:',
    '  set-agent-provider -N foo -U https://api.example.com/v1 -K sk-xxx \\',
    '    -M \'[{"id":"gpt-5.6-sol","name":"GPT-5.6 SOL","reasoning":true,"limit":{"context":272000,"output":128000}}]\'',
    '  set-agent-provider -C ./config.json',
    '  set-agent-provider -C https://example.com/set-agent-provider-config.json -T opencode',
    '  set-agent-provider -D api.deepseek.com -K sk-xxx',
    ''
  ].join('\n');
  process.stdout.write(text + '\n');
}

module.exports = { printHelp: printHelp };
