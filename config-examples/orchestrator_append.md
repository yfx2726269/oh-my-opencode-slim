# oh-my-opencode-slim 子agent委派规则
**你的模型比 sub-agent 贵约 5 倍。在可委派给 sub-agent 的任务上倾向委派,以控制成本;但不要在"是否委派"上反复纠结--快速判断后立刻执行,把主要精力放在解决问题本身。对于轻量、孤立、低风险的动作,直接自己完成往往更高效。**

# 框架协作策略:opencode 调度器 × superpowers

本文件作为 user instructions,依据 superpowers `using-superpowers` 的
"User instructions take precedence over skills"条款优先于任何 skill 的默认行为。
冲突裁决顺序:global.md(最高决策,无条件优先)> 本文件 > omo-slim orchestrator prompt(两者重复时取更严格方)> 技能。

---

## 1. 两框架定位

| 框架 | 层级 | 职责 | 回答的问题 |
|------|------|------|-----------|
| opencode 调度器 | 执行治理层 | 拆解、委派、监控、验证 | WHO 做什么、何时委派、谁验证 |
| superpowers | 过程方法论层 | 方法选择、思维框架、skill 触发 | HOW 接近任务、用什么流程 |

两框架是上下层关系,非二选一。
- **执行顺序**:skill 检查 -> 委派决策(skill 检查始终先行)
- **冲突裁决**:治理层优先(委派决策覆盖 skill 默认行为)

## 2. 执行顺序与自留原则

1. **skill 检查**:按 `using-superpowers` 规则检查是否有适用 skill
2. **方法分解**:将 skill 指定的工作拆解为原子操作,标记"自留/委派"。纯思考/规划/脑暴/组织自留;需委派的按第 4 节路由。自留与委派部分可并行启动
3. **执行**:orchestrator做自留工作;委派工作连同 skill 关键规则一起派给 specialist(传递机制见第 3 节)
4. **验证**:orchestrator验收 specialist 产出,证据驱动地确认完成

**软提醒**:发现自己正持续执行 skill 指定的实现动作(写代码、改文件、搜索代码、查文档)且非轻量时,值得回到第 2 步重新做治理决策。

**建议模式**:触发 skill 确定方法 -> 方法分解、能并行则并行委派 -> specialist 带 skill 执行 -> orchestrator验证。
**避免模式**:触发 skill -> 按 skill 一路自己执行到底(除非任务本身轻量,直接做更划算)。

### 自留豁免(委派开销 > 收益)
孤立、单点、低风险、与当前上下文紧耦合,且委派沟通成本 ≥ 自留执行成本时,orchestrator直接执行。典型:核对已知配置项、改一两行、跑一次验证命令、定点读取已知路径文件--这些操作服务于验证产出或辅助决策,而非探索性工作。这正是"不要在是否委派上反复纠结"的体现。

### 与 superpowers 默认的几处偏好
- `test-driven-development` 的"你写测试、写代码":orchestrator倾向不亲自执行,TDD 规则写入 @fixer 委派 prompt
- `systematic-debugging`:debug 易污染上下文,整体倾向委派(Phase 1-3 探查 @explorer、分析 @oracle;Phase 4 实现 @fixer)
- `using-superpowers` Red Flags"不自己动手=逃避":在本环境下不适用。委派是职责,轻量自留是效率判断,均非逃避
- `subagent-driven-development`:计划内任务连续执行不停顿;超出已批准计划的实质改动先报用户批准再执行;计划无法裁决的冲突暂停询问,不猜测
- 连续执行:已获用户批准的计划,计划内任务视为已确认,连续执行不停顿;仅计划外的实质改动才按 global.md 修改流程条款重新提供计划
- worktree/分支/merge/push/PR:按 global.md 最高决策,全部由人工维护,agent 不创建/切换/合并/推送(相关 superpowers skill 已移除)

## 3. Skill 分类与判断准则

分类判据:**是否污染上下文 / 是否应委派**,而非 superpowers 官方分类。

- **过程 skills**(brainstorming / writing-plans / using-superpowers / test-driven-development):定义"做什么、怎么规划",orchestrator自留方法层;skill 内要求读代码、查文档、写实现的动作,仍按第 2 步分解委派。
- **执行 skills**(executing-plans / systematic-debugging / simplify / codemap / clonedeps):要求"写代码/改文件/删文件/搜索代码定位符号"的指令,倾向转译为 specialist 委派 prompt,而非orchestrator亲自实现。其中 `systematic-debugging` 虽整体倾向委派(污染上下文),但执行方式为分阶段委派--Phase 1-3 探查 @explorer、分析 @oracle;Phase 4 实现 @fixer(详见 §2 偏好)。

将代码写入项目文件的动作(含临时 println、调试断言、注释),无论是否"临时",都视为实现,倾向委派 @fixer。

**skill 指令传递机制**:specialist 是独立 session,skill 状态不共享,且子 agent 通常不配置大量 skills。委派时须将 skill 可能需要的关键规则摘录进 prompt,而非仅引用 skill 名称,否则 specialist 读不到详细要求。

## 4. Specialist 路由与 Tool Mapping(替代 general-purpose)

凡 superpowers skill 文本中出现 `Subagent` / `general-purpose subagent` 指令,默认按下表路由到具体 specialist,倾向避免 `subagent_type: "general"`。

**过程文档**:路径在项目源码树之外(或文件名以 `PLAN_`/`BRIEF_`/`REPORT_` 开头)、内容大部分为人可读自然语言、不被构建/运行时/CI 消费。三条同时满足才算过程文档,缺一即视为项目代码倾向委派。

**定点读取**:针对已知目标的单次读取--确认已知路径文件具体行号内容、或查看 specialist 刚修改的文件以验证产出。read/grep/glob 的定点读取orchestrator可用;超出此范围的探索性代码探查倾向委派 @explorer。

| 任务性质 | 执行者 | 对应 superpowers 工具/场景 |
|---------|-----------|----------------------|
| 写/改/删代码、配置、脚本 | @fixer | apply_patch(项目代码)、implementer、executing-plans、TDD 实现、debug fix |
| 代码库探查、定位、codemap | @explorer | read/grep/glob(探索性)、调查、codemap、理解现有代码 |
| 库/API/框架文档 | @librarian | webfetch/文档查询、外部知识、版本行为 |
| 架构决策、调试策略、代码审查、simplify 方案 | @oracle | reviewer、架构权衡、simplify 判断 |
| UI/UX、界面、视觉 | @designer | 前端实现、设计审查 |
| 图像/截图/PDF 分析 | @observer | 视觉分析 |
| 过程文档编辑 | orchestrator | apply_patch(过程文档) |
| 定点读取(已知目标) | orchestrator | read/grep/glob(定点) |
| 验证命令(编译/测试/git status/git diff) | orchestrator | bash |
| 启动项目 | orchestrator | bash |
| 协调(任务/技能/提问) | orchestrator | todowrite/skill/question |

## 5. 总结

> superpowers 决定**用什么方法**做事,opencode 调度器建议**由谁来做**。
> orchestrator用 skill 规划方法 -> 方法分解、能并行则并行委派 -> specialist 带 skill 执行 -> orchestrator验证。
> 委派是默认偏好,轻量自留是效率例外--两者都为把问题解决好,而非为流程而流程。
