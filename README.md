# set-agent-provider

Configure one model provider across **all** installed AI CLIs with a single command.

Point it at a provider (base URL + API key + models) and it writes the native
config for every AI CLI it finds — Claude Code, Codex, OpenCode, pi, and dsh —
so you never hand-edit five different config files again.

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
| `--name` | `-N` | Provider name (default `local`; a remote config source uses the domain) |
| `--baseUrl` | `-U` | Provider base URL (required) |
| `--apiKey` | `-K` | Provider API key (optional — omit for keyless local servers) |
| `--models` | `-M` | Models as strict JSON |
| `--target` | `-T` | Comma-separated targets: `claude,codex,opencode,pi,dsh` |
| `--config` | `-C` | Config source: local file, URL, or bare domain |
| `--domain` | `-D` | Auto-detect a provider from a bare domain |
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
  "apiKey": "sk-xxxxxxxx",
  "models": [
    { "id": "gpt-5.6-sol", "name": "GPT-5.6 SOL", "reasoning": true, "limit": { "context": 272000, "output": 128000 } }
  ]
}
```

Command-line flags override config-file values (e.g. `-C example.com -K sk-other`
keeps the remote config but uses your key).

### Auto-detect from a domain

`--domain` takes just a bare domain and resolves the provider for you:

```bash
npx set-agent-provider -D api.deepseek.com
npx set-agent-provider -D api.deepseek.com -K sk-xxxxxxxx
```

It probes in this order:

1. `https://{domain}/set-agent-provider-config.json`, then `http://...` — if found,
   the config is used directly (same shape as `--config`).
2. Otherwise it detects an OpenAI-compatible API by checking
   `GET /v1/models` (HTTP 200) and `POST /v1/chat/completions` over `https` then
   `http`, and uses `{domain}` as the provider name with base URL
   `{scheme}://{domain}/v1`.
3. Models are then fetched from `/v1/models` and you pick them interactively.

A present-but-malformed config file is a hard error — only a missing config
degrades to endpoint detection. `--domain` and `--config` are mutually exclusive.

## Supported CLIs

| Target | Config written |
|--------|----------------|
| `claude` | `~/.claude/settings.json` (`ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`) |
| `codex` | `~/.codex/config.toml` (`[model_providers.*]`, `model`, `model_provider`) + `~/.codex/auth.json` |
| `opencode` | `~/.config/opencode/opencode.json` (`provider.*`, `model`) |
| `pi` | `~/.pi/agent/models.json` (`providers.*`) |
| `dsh` | `~/.dsh/settings.yaml` (`llm-pi-ai`, `agent-default-model`) + `~/.dsh/.credentials.yaml` |

By default every installed CLI is configured. Use `--target` to limit it.

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
