<a href="README.en.md">English</a> | <a href="README.md">简体中文</a>

# set-agent-provider

Set up **every** installed AI CLI for a model provider — in one command.

Give it a provider (even just a domain) and it auto-detects the base URL and models,
then writes the native config for every AI CLI it finds — Claude Code, Codex,
OpenCode, pi, and dsh — configuring all your clients in one command:

```bash
npx set-agent-provider -D api.deepseek.com
```

Switching to any OpenAI-compatible provider is just a different domain:

```bash
npx set-agent-provider -D api.example.com -K sk-xxxxxxxx
```

## Install / Usage

```bash
npx set-agent-provider --name foo \
  --baseUrl https://api.example.com/v1 \
  --apiKey sk-xxxxxxxx \
  --models '[{"id":"gpt-5.6-sol","name":"GPT-5.6 SOL","reasoning":true,"limit":{"context":272000,"output":128000}}]'
```

Short flags work too:

```bash
npx set-agent-provider -N foo -U https://api.example.com/v1 -K sk-xxxxxxxx \
  -M '[{"id":"gpt-5.6-sol","name":"GPT-5.6 SOL","reasoning":true,"limit":{"context":272000,"output":128000}}]'
```

Run with no arguments to get an interactive English wizard:

```bash
npx set-agent-provider
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--name` | `-N` | Provider name (default: hostname of `baseUrl`) |
| `--baseUrl` | `-U` | Provider base URL (required; prompted if omitted interactively; full URL) |
| `--apiKey` | `-K` | Provider API key (optional; prompted if omitted, may be blank) |
| `--models` | `-M` | Models as strict JSON |
| `--target` | `-T` | Comma-separated targets: `claude,codex,opencode,pi,dsh` |
| `--config` | `-C` | Config source: local file, URL, or bare domain (mutually exclusive with `-D`) |
| `--domain` | `-D` | Auto-detect from a bare domain (config, then endpoint probe) |
| `--status` | | Show the current provider config for each installed CLI |
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |

### Models

`--models` takes a strict JSON array. Each entry:

| Field | Description |
|-------|-------------|
| `id` | Model id |
| `name` | Display name |
| `reasoning` | Whether the model is a reasoning model |
| `limit.context` | Context window |
| `limit.output` | Max output tokens |

If `--models` is omitted, the tool requests `{baseUrl}/v1/models` (with the API
key) and lets you pick models interactively (Space to toggle, Enter to confirm).
Any failure (including 401) or an empty list is an error — pass `-M/--models` to
provide the list directly.

### Config source

`--config` accepts:

- a local file path: `-C ./config.json`
- a full URL: `-C https://example.com/set-agent-provider-config.json`
- a bare domain: `-C example.com` → tries `https://` then `http://` at `/set-agent-provider-config.json`

The config file has the same fields as the flags:

```json
{
  "name": "example",
  "baseUrl": "https://api.example.com/v1",
  "models": [
    { "id": "gpt-5.6-sol", "name": "GPT-5.6 SOL", "reasoning": true, "limit": { "context": 272000, "output": 128000 } }
  ]
}
```

Command-line flags override config-file values (e.g. `-C example.com -K sk-other`
keeps the remote config but uses your key). `-C` and `-D` are mutually exclusive;
`-U` can be combined with either and takes precedence.

### Auto-detect from a domain

`--domain` takes just a bare domain and resolves the provider for you:

```bash
npx set-agent-provider -D api.deepseek.com
npx set-agent-provider -D api.deepseek.com -K sk-xxxxxxxx
```

It probes in this order:

1. `https://{domain}/set-agent-provider-config.json`, then `http://...` — if it
   returns a valid JSON object, that config is used directly (same shape as
   `--config`).
2. Otherwise it detects an OpenAI-compatible API by POSTing to
   `/v1/chat/completions` over `https` then `http`; if the status is not
   `404/405/501` and the body parses as JSON (**401 also counts as existing**),
   the provider name is derived from `{domain}` and the base URL is
   `{scheme}://{domain}/v1`.
3. Models are then fetched from `{baseUrl}/v1/models` and you pick them interactively.

A config reached via `-D` that is not valid JSON (e.g. a gateway HTML fallback)
is treated as absent and degrades to endpoint detection; a config explicitly
given via `-C` is still a hard error. `--domain` and `--config` are mutually
exclusive; `-U` can be combined and takes precedence.

## Supported CLIs

| Target | Config written |
|--------|----------------|
| `claude` | `~/.claude/settings.json` (`ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`) |
| `codex` | `~/.codex/config.toml` (`[model_providers.*]`, `model`, `model_provider`) + `~/.codex/auth.json` |
| `opencode` | `~/.config/opencode/opencode.json` (`provider.*`, `model`) |
| `pi` | `~/.pi/agent/models.json` (`providers.*`) |
| `dsh` | `~/.dsh/settings.yaml` (`llm-pi-ai`, `agent-default-model`) + `~/.dsh/.credentials.yaml` |

By default every installed CLI is configured. Use `--target` to limit it.

```bash
npx set-agent-provider -D api.deepseek.com -T claude
npx set-agent-provider -N foo -U https://api.example.com/v1 -T claude,codex
```

## Safety

- Every config file is backed up before it is overwritten, saved next to the
  original as `<filename>.bak-<YYYY-MM-DD_HH-mm-ss>` (local time).
- API keys are never printed — output always masks them.
- A failure on one target does not stop the others; the final summary lists what
  succeeded and what failed.

## Codex Responses detection

Codex needs to know whether an endpoint speaks the Responses API. Interactively
you are offered three choices (probe the endpoint only, test the default model
with a real request, or skip). Non-interactively the tool probes the endpoint
only. The result sets `wire_api` to `responses` or `chat`.

## Development

Zero dependencies; plain CommonJS; Node >= 14.

```bash
node bin/set-agent-provider.js --help
node bin/set-agent-provider.js --status
```

## License

MIT
