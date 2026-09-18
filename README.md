<a href="README.en.md">English</a> | <a href="README.md">简体中文</a>

# set-agent-provider

为某个模型提供商，一键设置机器上**所有**已安装的 AI CLI。

给一个提供商（哪怕只是一个域名），它就会自动探测出 base URL 与模型，
并为每个检测到的 AI CLI 写入各自的原生配置 —— Claude Code、Codex、OpenCode、
pi 和 dsh —— 一键完成所有客户端的配置：

```bash
npx set-agent-provider -D api.deepseek.com
```

换任何 OpenAI 兼容的提供商，也只需换一个域名：

```bash
npx set-agent-provider -D api.example.com -K sk-xxxxxxxx
```

## 安装 / 使用

```bash
npx set-agent-provider --name foo \
  --baseUrl https://api.example.com/v1 \
  --apiKey sk-xxxxxxxx \
  --models '[{"id":"gpt-5.6-sol","name":"GPT-5.6 SOL","reasoning":true,"limit":{"context":272000,"output":128000}}]'
```

也支持短选项：

```bash
npx set-agent-provider -N foo -U https://api.example.com/v1 -K sk-xxxxxxxx \
  -M '[{"id":"gpt-5.6-sol","name":"GPT-5.6 SOL","reasoning":true,"limit":{"context":272000,"output":128000}}]'
```

不带任何参数运行，会进入交互式英文向导：

```bash
npx set-agent-provider
```

## 选项

| 选项 | 短选项 | 说明 |
|------|--------|------|
| `--name` | `-N` | 提供商名称（默认取 `baseUrl` 的主机名） |
| `--baseUrl` | `-U` | 提供商 base URL（必填；交互模式下缺省会提示输入；需完整 URL） |
| `--apiKey` | `-K` | 提供商 API key（可选；缺省时交互式提示，可留空） |
| `--models` | `-M` | 模型列表，严格 JSON |
| `--target` | `-T` | 逗号分隔的目标：`claude,codex,opencode,pi,dsh` |
| `--config` | `-C` | 配置来源：本地文件、URL 或裸域名（与 `-D` 互斥） |
| `--domain` | `-D` | 从裸域名自动探测提供商（先配置，再端点探测） |
| `--status` | | 显示每个已安装 CLI 当前的提供商配置 |
| `--help` | `-h` | 显示帮助 |
| `--version` | `-v` | 显示版本 |

### 模型

`--models` 接收严格的 JSON 数组。每一项：

| 字段 | 说明 |
|------|------|
| `id` | 模型 id |
| `name` | 显示名称 |
| `reasoning` | 是否为推理模型 |
| `limit.context` | 上下文窗口 |
| `limit.output` | 最大输出 token 数 |

如果省略 `--models`，工具会携带 API key 请求 `{baseUrl}/v1/models`，
并让你交互式选择（空格切换、回车确认）。任何失败（含 401）或空列表都会报错，
此时请用 `-M/--models` 直接提供模型列表。

### 配置来源

`--config` 支持：

- 本地文件路径：`-C ./config.json`
- 完整 URL：`-C https://example.com/set-agent-provider-config.json`
- 裸域名：`-C example.com` → 依次尝试 `https://` 和 `http://` 下的 `/set-agent-provider-config.json`

配置文件字段与命令行选项一致：

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

命令行选项会覆盖配置文件中的值（例如 `-C example.com -K sk-other`
会保留远程配置但使用你自己的 key）。`-C` 与 `-D` 互斥，`-U` 可与二者叠加并优先生效。

### 从域名自动探测

`--domain` 只接收一个裸域名，自动解析出提供商：

```bash
npx set-agent-provider -D api.deepseek.com
npx set-agent-provider -D api.deepseek.com -K sk-xxxxxxxx
```

探测顺序如下：

1. 先请求 `https://{domain}/set-agent-provider-config.json`，失败再试 `http://...`
   —— 若返回合法 JSON 对象，则直接使用该配置（格式与 `--config` 相同）。
2. 否则检测是否为 OpenAI 兼容 API：依次通过 `https`、`http` 对
   `POST /v1/chat/completions` 发起请求；只要状态不是 `404/405/501` 且响应体可解析为
   JSON（**401 也视为端点存在**），即以 `{domain}` 派生名称，base URL 为
   `{scheme}://{domain}/v1`。
3. 随后从 `{baseUrl}/v1/models` 获取模型，由你交互式选择。

`-D` 探测到的配置若为非法 JSON（例如网关返回 HTML 兜底页）会被视为不存在并降级为端点
探测；而 `-C` 显式指定的配置若非法 JSON 仍属硬错误。`--domain` 与 `--config` 互斥，
`-U` 可与二者叠加并优先。

## 支持的 CLI

| 目标 | 写入的配置 |
|------|-----------|
| `claude` | `~/.claude/settings.json`（`ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_MODEL`、`ANTHROPIC_DEFAULT_HAIKU_MODEL`、`ANTHROPIC_DEFAULT_SONNET_MODEL`、`ANTHROPIC_DEFAULT_OPUS_MODEL`） |
| `codex` | `~/.codex/config.toml`（`[model_providers.*]`、`model`、`model_provider`）+ `~/.codex/auth.json` |
| `opencode` | `~/.config/opencode/opencode.json`（`provider.*`、`model`） |
| `pi` | `~/.pi/agent/models.json`（`providers.*`） |
| `dsh` | `~/.dsh/settings.yaml`（`llm-pi-ai`、`agent-default-model`）+ `~/.dsh/.credentials.yaml` |

默认会配置所有已安装的 CLI。可用 `--target` 限定范围。

## 安全

- 每个配置文件在覆盖前都会备份，保存在原文件旁，命名为
  `<文件名>.bak-<YYYY-MM-DD_HH-mm-ss>`（本地时间）。
- API key 永不打印 —— 输出一律做脱敏处理。
- 某个目标失败不会中断其他目标；最后的汇总会列出成功与失败项。

## Codex Responses 探测

Codex 需要知道某个端点是否使用 Responses API。交互模式下会提供三种选择
（仅探测端点、用默认模型发一次真实请求测试、或跳过）。非交互模式下仅探测端点。
结果决定 `wire_api` 为 `responses` 还是 `chat`。

## 开发

零依赖；纯 CommonJS；Node >= 14。

```bash
node bin/set-agent-provider.js --help
node bin/set-agent-provider.js --status
```

## 许可证

MIT
