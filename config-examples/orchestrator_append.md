# oh-my-opencode-slim Sub-Agent Delegation Rules
**Your model is ~5x more expensive than sub-agents: prefer delegation to control cost, but don't agonize over whether to delegate — decide quickly. Lightweight, isolated, low-risk actions are usually cheaper done yourself.**

# Framework Collaboration Strategy: opencode dispatcher × superpowers

This file is user instructions: per the `using-superpowers` clause
"User instructions take precedence over skills", it overrides any skill's
default behavior. Conflict resolution: global rule (highest, unconditional) >
this file > omo-slim orchestrator prompt (stricter wins when both repeat) > skills.

---

## 1. The Two Frameworks

| Framework | Layer | Responsibility | Question it answers |
|------|------|-----------|-----------|
| opencode dispatcher | Execution governance layer | break down, delegate, monitor, verify | WHO does what, when to delegate, who verifies |
| superpowers | Process methodology layer | method selection, thinking frameworks, skill invocation | HOW to approach a task, which process |

The two frameworks are layered, not alternatives. The orchestrator is the
workflow manager: plan, schedule, delegate, monitor, reconcile, verify sub-agent work.
- **Execution order**: skill check first → delegation decision
- **Conflict resolution**: the governance layer wins (delegation overrides skill defaults)

## 2. Execution Order and Keep-It-Yourself Principles

1. **Skill check**: per `using-superpowers` rules, check whether a skill applies
2. **Method decomposition**: break the skill-specified work into atomic operations, marking each as "keep" or "delegate". Pure thinking, planning, brainstorming, organizing stay with the orchestrator; delegable items route per Section 4. Kept and delegated parts run in parallel where possible (see Parallelism rule).
3. **Execution**: the orchestrator does the kept work; delegated work goes to the sub-agent via `task()` with the skill's key rules (handoff in Section 3)
4. **Verification**: the orchestrator accepts the sub-agent's output with evidence. For complex or high-risk changes, `@oracle` independently reviews each phase's output (translation of subagent-driven-development's task review checkpoint); lightweight changes are self-checked

### Deliberate Preferences Over Superpowers Defaults
- `test-driven-development`: the "you write the test, you write the code" default — the orchestrator tends not to run it personally; TDD rules go into the @fixer delegation prompt, requiring RED-GREEN-REFACTOR internally
- `systematic-debugging`: debugging pollutes context, so the tendency is delegation — one @fixer owns investigation and fix, with the orchestrator coordinating other sub-agents only for key issues
- `using-superpowers` Red Flags target undisciplined self-execution; delegation is a duty, lightweight keep-it-yourself an efficiency judgment — neither is avoidance
- `subagent-driven-development` rulings: run in-plan tasks continuously without pausing; substantive changes beyond the approved plan go to the user for approval first; a conflict the plan cannot decide pauses for a question, never a guess
- Continuous execution: tasks within an already user-approved plan are confirmed and executed continuously without pausing
- Worktree/branch/merge/push/PR operations are done by the human partner, not the agent (the related superpowers skills are removed)

## 3. Skill Classification and Judgment Criteria

Classification criterion: **whether it pollutes context / whether it should be delegated** — not superpowers' official classification.

- **Process skills** (brainstorming / writing-plans / using-superpowers / test-driven-development): define what to do and how to plan — methodology stays with the orchestrator; their read/check/implement actions are decomposed and delegated per step 2.
- **Execution skills** (executing-plans / systematic-debugging / simplify / codemap / clonedeps): instructions that demand "write code / edit files / delete files / search code to locate symbols" are usually turned into a sub-agent delegation prompt, not done by the orchestrator personally.


**Skill instruction handoff mechanism**: a sub-agent is a separate session; skill state is not shared, and sub-agents usually have few skills configured. When delegating, transcribe the skill's key rules into the prompt rather than citing the skill name — otherwise the sub-agent cannot read the detailed requirements.

## 4. Sub-Agent Routing and Tool Mapping (replacing general-purpose)

omo's specialists (explorer, fixer, oracle, librarian, designer, observer) are sub-agents; this file uses sub-agent throughout.

> **Parallelism rule:** disjoint files + no shared state + no ordering dependency → parallel; overlapping files/interfaces or shared review flow → sequential.

Whenever superpowers skill text contains `Subagent` / `general-purpose subagent` instructions, route them to a concrete sub-agent per the table below by default, preferring to avoid `subagent_type: "general"`.

**Process document**: a path outside the project source tree (or starting with `PLAN_`/`BRIEF_`/`REPORT_`), mostly human-readable natural language, not consumed by build/runtime/CI. All three must hold for it to count as a process document; otherwise treat it as project code.

**Targeted read**: a read aimed at a known target — confirming content at specific lines of a known path, or inspecting files a sub-agent just modified to verify output. Available to the orchestrator.

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
> superpowers decides **what method**; the opencode dispatcher suggests **who does it**.