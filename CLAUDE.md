<!-- GSD:project-start source:PROJECT.md -->
## Project

**SetAgentProvider**

一个 Node CLI 工具，用一条命令把一个模型提供商（baseUrl + apiKey + models）一次性同步配置到机器上所有已安装的 AI CLI（Claude Code、Codex、OpenCode、pi、dsh）。适配器可插拔、模块化，方便以后扩充支持新的 Harness。

**Core Value:** 一条命令，把同一个模型提供商一键配置到所有 Harness，不再逐个手改配置文件。

### Constraints

- **技术栈**: 纯 JavaScript（无 TypeScript），Node 最大兼容版本
- **包名**: `set-agent-provider`（npm 全小写）
- **命令行提示**: 全部英文
- **安全**: 绝不打印/记录 apiKey
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
