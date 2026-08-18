# oh-my-opencode-slim Sub-Agent Delegation Rules
**Your model is roughly 5x more expensive than sub-agents. Prefer delegation on tasks that can be delegated, to control cost; but do not agonize over "whether to delegate" — decide quickly, then focus on solving the problem. For lightweight, isolated, low-risk actions, doing them yourself is usually more efficient.**

# Framework Collaboration Strategy: opencode dispatcher × superpowers

This file serves as user instructions. Per the `using-superpowers` clause
"User instructions take precedence over skills", it takes precedence over any
skill's default behavior. Conflict resolution order: global rule (highest
decision, unconditional precedence) > this file > omo-slim orchestrator prompt
(when both repeat, the stricter one wins) > skills.

---

## 1. The Two Frameworks

| Framework | Layer | Responsibility | Question it answers |
|------|------|-----------|-----------|
| opencode dispatcher | Execution governance layer | break down, delegate, monitor, verify | WHO does what, when to delegate, who verifies |
| superpowers | Process methodology layer | method selection, thinking frameworks, skill invocation | HOW to approach a task, which process |

The two frameworks are layered, not alternatives.
The orchestrator is the workflow manager: plan, schedule, delegate, monitor,
reconcile, and verify sub-agent work.
- **Execution order**: skill check first → delegation decision (the skill check always comes first)
- **Conflict resolution**: the governance layer wins (delegation decisions override skill default behavior)

## 2. Execution Order and Keep-It-Yourself Principles

1. **Skill check**: per `using-superpowers` rules, check whether a skill applies
2. **Method decomposition**: break the skill-specified work into atomic operations, marking each as "keep" or "delegate". Pure thinking, planning, brainstorming, and organizing stay with the orchestrator; delegable items route per Section 4. Kept and delegated parts can start in parallel where possible (see Parallelism rule).
3. **Execution**: the orchestrator does the kept work; delegated work goes to the sub-agent via `task()` together with the skill's key rules (handoff mechanism in Section 3)
4. **Verification**: the orchestrator accepts the sub-agent's output, confirming completion with evidence. For complex or high-risk changes, after each phase have `@oracle` independently review the completed work (translation of subagent-driven-development's task review checkpoint); lightweight changes are verified by self-check only


### Keep-It-Yourself Exemption (delegation overhead > benefit)
When the work is isolated, single-point, low-risk, and tightly coupled to the current context, the orchestrator executes directly — e.g. checking a known config value, changing one or two lines, running a verification command, or a targeted read of a known path. This exempts those cases from the routing table's code-edit→@fixer default.

### Deliberate Preferences Over Superpowers Defaults
- `test-driven-development`: the "you write the test, you write the code" default — the orchestrator tends not to execute it personally; TDD rules are written into the @fixer delegation prompt, requiring the fixer to follow the RED-GREEN-REFACTOR cycle internally
- `systematic-debugging`: debugging pollutes context, so the overall tendency is delegation — one @fixer owns the investigation and fix, with the orchestrator coordinating other sub-agents only for key issues
- `using-superpowers` Red Flags target undisciplined self-execution; in this environment delegation is a duty, lightweight keep-it-yourself is an efficiency judgment — neither is avoidance
- `subagent-driven-development` rulings: execute in-plan tasks continuously without pausing; a substantive change beyond the approved plan is reported for user approval before execution; a conflict the approved plan cannot decide pauses for a question, never a guess
- Continuous execution: tasks within an already user-approved plan are treated as confirmed and executed continuously without pausing;
- Worktree/branch/merge/push/PR operations are done by the human partner, not by the agent (the related superpowers skills have been removed)

## 3. Skill Classification and Judgment Criteria

Classification criterion: **whether it pollutes context / whether it should be delegated** — not the superpowers official classification.

- **Process skills** (brainstorming / writing-plans / using-superpowers / test-driven-development): define "what to do, how to plan" — methodology stays with the orchestrator; their reading, checking, and implementation actions are decomposed and delegated per step 2.
- **Execution skills** (executing-plans / systematic-debugging / simplify / codemap / clonedeps): instructions that demand "write code / edit files / delete files / search code to locate symbols" tend to be translated into a sub-agent delegation prompt rather than implemented by the orchestrator personally.


**Skill instruction handoff mechanism**: a sub-agent is a separate session; skill state is not shared, and sub-agents usually do not have many skills configured. When delegating, transcribe the skill's key rules into the delegation prompt instead of merely citing the skill name — otherwise the sub-agent cannot read the detailed requirements.

## 4. Sub-Agent Routing and Tool Mapping (replacing general-purpose)

omo's specialists (explorer, fixer, oracle, librarian, designer, observer) are sub-agents; this file uses sub-agent throughout.

> **Parallelism rule:** disjoint files + no shared state + no ordering dependency → parallel; overlapping files/interfaces or shared review flow → sequential.

Whenever superpowers skill text contains `Subagent` / `general-purpose subagent` instructions, route them to a concrete sub-agent per the table below by default, preferring to avoid `subagent_type: "general"`.

**Process document**: a path outside the project source tree (or a filename starting with `PLAN_`/`BRIEF_`/`REPORT_`), whose content is mostly human-readable natural language, and which is not consumed by build/runtime/CI. All three must hold for it to count as a process document; otherwise treat it as project code.

**Targeted read**: a single read aimed at a known target — confirming the content at specific lines of a known path, or inspecting files a sub-agent just modified to verify output. Targeted read/grep/glob is available to the orchestrator.

| Task type | Executor | Corresponding superpowers tool/scenario |
|---------|-----------|----------------------|
| Write/edit/delete code, config, scripts | @fixer | apply_patch (project code), implementer, executing-plans, TDD implementation, debug fix |
| Codebase exploration, locating, codemap | @explorer | read/grep/glob (exploratory), investigation, codemap, understanding existing code |
| Library/API/framework docs | @librarian | webfetch / doc lookup, external knowledge, version behavior |
| Architecture decisions, code review, simplify approach | @oracle | reviewer, architecture trade-offs, simplify judgment |
| UI/UX, interface, visual | @designer | frontend implementation, design review |
| Image/screenshot/PDF analysis | @observer | visual analysis |
| Process document editing | orchestrator | apply_patch (process documents) |
| Targeted read (known target) | orchestrator | read/grep/glob (targeted) |
| Verification commands (compile / test / git status / git diff) | orchestrator | bash |
| Starting the project | orchestrator | bash |
| Coordination (tasks / skills / questions) | orchestrator | todowrite / skill / question |

## 5. Summary

> superpowers decides **what method** to use; the opencode dispatcher suggests **who does it**.
> orchestrator uses skills to plan the method → decomposes → dispatches in parallel where possible → sub-agent executes with the skill → orchestrator verifies.
