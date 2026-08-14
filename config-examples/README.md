# 推荐配置(config-examples)

本目录存放 omo-slim × superpowers 协作策略的**推荐配置文件模板**,供用户按需复制到自己的配置目录。

## 文件说明

| 文件 | 用途 |
|------|------|
| `orchestrator_append.md` | orchestrator 追加 prompt:子 agent 委派规则 + 框架协作策略(双模式:orchestrator 调度器 × superpowers 方法论) |

## 安装方法

复制到本机 omo-slim 配置目录:

```bash
cp config-examples/orchestrator_append.md ~/.config/opencode/oh-my-opencode-slim/orchestrator_append.md
```

插件启动时 `loadAgentPrompt` 会读取该文件,将内容追加到 orchestrator 的 system prompt 末尾(构造期一次读取,内容固定,不影响 prompt 缓存命中)。

## 与上游默认的差异(bit-self fork)

- 删除了 §4 路由表中的 `@council` 行:council 是可选 agent,未配置时提示词不应提及它(避免污染 council 相关的测试断言);council 配置存在时,omo 源码会动态注入 Council Mode 块
- §2 的 worktree 条目更新:superpowers 已移除 `using-git-worktrees` / `finishing-a-development-branch` skill,worktree/分支/merge/push/PR 全部由人工维护,agent 不执行
- §2 的 SDD 条目更新:与改造后的 SDD 裁决规则一致(计划内连续执行,计划外实质改动先报批,无法裁决时暂停询问)

## 同步注意

- 本机配置(`~/.config/opencode/oh-my-opencode-slim/orchestrator_append.md`)不会自动跟随本项目更新,如需最新推荐版本请重新复制
- 测试机若使用本插件,也需复制本文件到测试机的对应配置目录(插件包不含此配置,配置文件不属于 npm 发布内容)
