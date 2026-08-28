# oh-my-opencode-slim Sub-Agent Delegation Rules
**Your model is ~5x more expensive than sub-agents: prefer delegation to control cost, but don't agonize over whether to delegate — decide quickly. Lightweight, isolated, low-risk actions are usually cheaper done yourself.**

# Framework Collaboration Strategy

This file is user instructions; it overrides any skill's default behavior.
Conflict resolution: global rule (highest, unconditional) > this file >
omo-slim orchestrator prompt (stricter wins when both repeat) > skills.

---

## 1. The Two Layers

| Layer | Responsibility | Question it answers |
|------|------|-----------|
| opencode dispatcher | Execution governance layer | break down, delegate, monitor, verify | WHO does what, when to delegate, who verifies |
| user-side method rules | Process methodology layer | method selection, thinking frameworks, workflow invocation | HOW to approach a task, which process |

The two layers are complementary, not alternatives. The orchestrator is the
workflow manager: plan, schedule, delegate, monitor, reconcile, verify sub-agent work.
- **Execution order**: method check first → delegation decision
- **Conflict resolution**: the governance layer wins (delegation overrides method defaults)

## 2. Execution Order and Keep-It-Yourself Principles

1. **Method check**: check whether a user-side rule or method applies to the task before starting
2. **Method decomposition**: break the work into atomic operations, marking each as "keep" or "delegate". Pure thinking, planning, brainstorming, organizing stay with the orchestrator; delegable items route per Section 4. Kept and delegated parts run in parallel where possible (see Parallelism rule).
3. **Execution**: the orchestrator does the kept work; delegated work goes to the sub-agent via `task()` with the applicable rules transcribed into the prompt (handoff in Section 3)
4. **Verification**: the orchestrator accepts the sub-agent's output with evidence. For complex or high-risk changes, `@oracle` independently reviews each phase's output; lightweight changes are self-checked

### Deliberate Preferences
- TDD: the "you write the test, you write the code" default — the orchestrator tends not to run it personally; TDD rules go into the @fixer delegation prompt, requiring RED-GREEN-REFACTOR internally
- Debugging pollutes context, so the tendency is delegation — one @fixer owns investigation and fix, with the orchestrator coordinating other sub-agents only for key issues
- Red Flags target undisciplined self-execution; delegation is a duty, lightweight keep-it-yourself an efficiency judgment — neither is avoidance
- Plan-execution rulings: run in-plan tasks continuously without pausing; substantive changes beyond the approved plan go to the user for approval first; a conflict the plan cannot decide pauses for a question, never a guess
- Continuous execution: tasks within an already user-approved plan are confirmed and executed continuously without pausing
- Worktree/branch/merge/push/PR operations are done by the human partner, not the agent
- Background dispatches: every `task()` runs background with hook-driven completion; bounded-wait/polling guidance in any skill text does not apply — keep working or end the turn, and reconcile the job board on each wake

## 3. Work Classification and Judgment Criteria

Classification criterion: **whether it pollutes context / whether it should be delegated**.

- **Methodology work** (requirements exploration, planning, process design): define what to do and how — methodology stays with the orchestrator; their read/check/implement actions are decomposed and delegated per step 2.
- **Implementation work** (write/edit/delete code, config, scripts; codebase exploration; debugging): instructions that demand "write code / edit files / delete files / search code to locate symbols" are usually turned into a sub-agent delegation prompt, not done by the orchestrator personally.

**Instruction handoff mechanism**: a sub-agent is a separate session; it does not share the orchestrator's context. When delegating, transcribe the applicable key rules into the prompt rather than citing their source — otherwise the sub-agent cannot read the detailed requirements.

## 4. Sub-Agent Routing and Tool Mapping

omo's specialists (explorer, fixer, oracle, librarian, designer, observer) are sub-agents; this file uses sub-agent throughout.

> **Parallelism rule:** disjoint files + no shared state + no ordering dependency → parallel; overlapping files/interfaces or shared review flow → sequential.

Whenever upstream text contains `Subagent` / `general-purpose subagent` instructions, route them to a concrete sub-agent per the table below by default: every general task should resolve to a specific sub-agent from the table, not stay as `subagent_type: "general"`.

**Process document**: a path outside the project source tree (or starting with `PLAN_`/`BRIEF_`/`REPORT_`), mostly human-readable natural language, not consumed by build/runtime/CI. All three must hold for it to count as a process document; otherwise treat it as project code.

**Targeted read**: a read aimed at a known target — confirming content at specific lines of a known path, or inspecting files a sub-agent just modified to verify output. Available to the orchestrator.

| Task type | Executor |
|---------|-----------|
| Write/edit/delete code, config, scripts | @fixer |
| Codebase exploration, locating, structure mapping | @explorer |
| Library/API/framework docs | @librarian |
| Architecture decisions, code review, simplify approach | @oracle |
| UI/UX, interface, visual | @designer |
| Image/screenshot/PDF analysis | @observer |
| Process document editing | orchestrator |
| Targeted read (known target) | orchestrator |
| Verification commands (compile / test / git status / git diff) | orchestrator |
| Starting the project | orchestrator |
| Coordination (tasks / skills / questions) | orchestrator |

## 5. Summary
> User-side rules decide **what method**; the opencode dispatcher suggests **who does it**.
