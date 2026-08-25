# @dragon-talon/dsh-openspec

[English](README.md) | 中文

> 面向 DeepSeek Harness (DSH) 的 OpenSpec 工作流技能与 `/opsx-*` 命令别名。

[![GitHub](https://img.shields.io/badge/GitHub-dragonTalon%2Fdsh--openspec-181717?logo=github)](https://github.com/dragonTalon/dsh-openspec)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![OpenSpec](https://img.shields.io/badge/OpenSpec-1.10.0-6e56cf)](https://github.com/Fission-AI/OpenSpec)

这是一个面向 DeepSeek Harness 的 [Cordis](https://github.com/cordiverse/cordis) 插件,负责注册 12 个规范的 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 工作流技能(使用其 kebab-case 名称)——从而 `/openspec-new-change` 可以通过 DSH 的用户指令注入和 `skill` 工具原生工作——同时提供 Claude 风格的 `/opsx-<id>` 命令别名(仅用户可调用,解析到对应规范技能的正文)。

- 12 个规范 `openspec-*` 技能(模型 **和** 用户均可调用)
- 12 个 `/opsx-<id>` 命令别名(仅用户可调用,内容与其规范技能一致)
- 无运行时状态:技能通过 DSH 的技能注册表登记,唯一性与生命周期由注册表负责

## 对应的 OpenSpec 版本

本包将 OpenSpec 工作流技能固定在 **OpenSpec 1.10.0**([`@fission-ai/openspec`](https://www.npmjs.com/package/@fission-ai/openspec),源码:[`Fission-AI/OpenSpec`](https://github.com/Fission-AI/OpenSpec))。

技能正文由 [`scripts/sync-openspec-skills.mjs`](scripts/sync-openspec-skills.mjs) 从 OpenSpec 仓库的 `skills/*/SKILL.md` 文件生成。详见[同步技能](#同步技能)。

## 技能列表

| 规范技能 | `/opsx-*` 别名 | 说明 |
| --- | --- | --- |
| `openspec-explore` | `/opsx-explore` | 进入探索模式——用于探索想法、调查问题、澄清需求。 |
| `openspec-new-change` | `/opsx-new` | 使用实验性的工件工作流新建一个 OpenSpec 变更。 |
| `openspec-continue-change` | `/opsx-continue` | 继续处理一个 OpenSpec 变更,创建下一个工件。 |
| `openspec-apply-change` | `/opsx-apply` | 实现一个 OpenSpec 变更中的任务。 |
| `openspec-update-change` | `/opsx-update` | 修订变更已有的规划工件并保持彼此一致。 |
| `openspec-ff-change` | `/opsx-ff` | 快速完成 OpenSpec 工件的创建。 |
| `openspec-propose` | `/opsx-propose` | 一步生成完整提案(设计、规格、任务)。 |
| `openspec-sync-specs` | `/opsx-sync` | 将变更中的增量规格同步到主规格。 |
| `openspec-archive-change` | `/opsx-archive` | 归档一个已完成的变更。 |
| `openspec-bulk-archive-change` | `/opsx-bulk-archive` | 一次性归档多个已完成的变更。 |
| `openspec-verify-change` | `/opsx-verify` | 校验实现是否与变更工件一致。 |
| `openspec-onboard` | `/opsx-onboard` | OpenSpec 引导式上手教程。 |

## 安装

本包面向 DeepSeek Harness,由宿主提供其 peer 依赖(`@deepseek-ai/cordis`、`@deepseek-ai/dsh-invariants`、`@deepseek-ai/dsh-skill`)。

从本仓库将插件安装到 DSH profile:

```bash
dsh plugin --profile <name> add github:dragonTalon/dsh-openspec
```

或添加到普通 Node 项目:

```bash
npm install github:dragonTalon/dsh-openspec
```

> `dsh plugin add` 会转发给 `pnpm add`,因此任何 pnpm 安装参数都可用——`github:owner/repo`、`git+https://…`、tarball 或本地路径。
>
> 从 git 安装时,会通过本包的 `prepare` 脚本在安装阶段构建。`pnpm` 默认会拦截 git 依赖的构建脚本——如果它拒绝执行构建,请把本包加入 profile 目录下 `pnpm-workspace.yaml` 的 `allowBuilds` 后重试:
>
> ```yaml
> allowBuilds:
>   - "@dragon-talon/dsh-openspec"
> ```

## 使用

注册后,两种形式在 DSH 中均可用:

- 规范形式:`/openspec-new-change`、`/openspec-apply-change` …
- 别名形式:`/opsx-new`、`/opsx-apply` …(解析到相同正文)

### 配置

```ts
import * as dshOpenspec from '@dragon-talon/dsh-openspec'

ctx.plugin(dshOpenspec, { aliases: false }) // 关闭 /opsx-* 别名
```

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `aliases` | `boolean` | `true` | 是否将 `/opsx-*` 命令别名注册为仅用户可调用技能(`modelInvocable: false`)。设为 `false` 时仅注册 12 个规范 `openspec-*` 名称。 |

## 开发

```bash
npm install

npm run build   # tsc + tsdown → lib/
npm test        # vitest
```

### 同步技能

`src/skills.ts` 由本地 OpenSpec checkout 自动生成。上游技能变化时重新生成:

```bash
npm run sync:skills         # 重新生成 src/skills.ts
npm run sync:skills:check   # CI 校验:内容过期时以非零码退出
```

脚本从 OpenSpec checkout 读取 `skills/*/SKILL.md`——默认路径 `~/Documents/github/OpenSpec`,可通过 `--openspec <path>` 或环境变量 `OPENSPEC_REPO` 覆盖。

## 许可证

[MIT](LICENSE) © 2026 dragonTalon

OpenSpec 技能内容版权归 [OpenSpec Contributors](https://github.com/Fission-AI/OpenSpec) 所有,MIT 许可。
