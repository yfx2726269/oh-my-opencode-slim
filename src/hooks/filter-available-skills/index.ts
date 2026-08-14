/**
 * Filter available_skills block based on the current agent's permission.skill rules.
 * OpenCode core injects `<available_skills>` globally, so this hook rewrites that
 * block before the prompt is sent.
 */
import type { PluginInput } from '@opencode-ai/plugin';
import { getSkillPermissionsForAgent } from '../../cli/skills';
import { AGENT_ALIASES, type AgentOverrideConfig } from '../../config';
import type { RuntimeConfig } from '../../config/runtime';
import {
  isMessageWithParts,
  isUserMessageWithParts,
  type MessageWithParts,
} from '../types';

const AVAILABLE_SKILLS_BLOCK_REGEX =
  /<available_skills>\s*([\s\S]*?)\s*<\/available_skills>/g;
const SKILL_NAME_REGEX = /<name>([^<]+)<\/name>/;

type SkillRule = 'allow' | 'ask' | 'deny';

interface SkillEntry {
  name: string;
  block: string;
}

/**
 * Superpowers 执行类 skill,对 orchestrator 隔离:orchestrator 负责规划与委派,
 * 这些 skill 会把它拉入自执行工作流,由 omo 的 deepwork + 委派策略替代。
 */
const ORCHESTRATOR_ISOLATED_SKILLS = [
  'subagent-driven-development',
  'executing-plans',
  'systematic-debugging',
] as const;

/**
 * omo 的 deepwork(orchestrator-only)对非 orchestrator agent(build 模式,
 * 由 superpowers skill 驱动自执行)隔离。
 */
const BUILD_MODE_ISOLATED_SKILLS = ['deepwork'] as const;

function isOrchestratorAgent(agentName: string): boolean {
  if (agentName === 'orchestrator') {
    return true;
  }
  // 含 alias 解析:若 agentName 是某个 alias 指向的 orchestrator,视为 orchestrator
  return (
    Object.keys(AGENT_ALIASES).find(
      (aliasKey) => AGENT_ALIASES[aliasKey] === agentName,
    ) === 'orchestrator'
  );
}

/**
 * 按 agent 模式追加隔离规则。仅当用户未显式配置该 skill 时生效,
 * 用户显式配置(allow/ask/deny 任一形式)优先,不被覆盖。
 * 隔离规则显式加入 deny 条目,压过 `*` 通配放行。
 */
function applyAgentIsolationRules(
  agentName: string,
  skillList: readonly string[] | undefined,
  permissionRules: Record<string, SkillRule>,
): void {
  const isolatedSkills = isOrchestratorAgent(agentName)
    ? ORCHESTRATOR_ISOLATED_SKILLS
    : BUILD_MODE_ISOLATED_SKILLS;

  const userConfiguredSkills = new Set<string>();
  if (skillList) {
    for (const entry of skillList) {
      if (entry === '*') {
        continue;
      }
      userConfiguredSkills.add(entry.startsWith('!') ? entry.slice(1) : entry);
    }
  }

  for (const skillName of isolatedSkills) {
    if (userConfiguredSkills.has(skillName)) {
      continue;
    }
    permissionRules[skillName] = 'deny';
  }
}

function getCurrentAgent(messages: MessageWithParts[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (isUserMessageWithParts(message)) {
      return message.info.agent ?? 'orchestrator';
    }
  }

  return 'orchestrator';
}

function extractSkillEntries(blockContent: string): SkillEntry[] {
  const entries: SkillEntry[] = [];
  const skillEntryRegex = /<skill>\s*([\s\S]*?)\s*<\/skill>/g;

  for (const match of blockContent.matchAll(skillEntryRegex)) {
    const block = match[0];
    const nameMatch = block.match(SKILL_NAME_REGEX);
    if (!nameMatch) {
      continue;
    }

    entries.push({
      name: nameMatch[1].trim(),
      block,
    });
  }

  return entries;
}

function isSkillAllowed(
  skillName: string,
  permissionRules: Record<string, SkillRule>,
): boolean {
  const specificRule = permissionRules[skillName];
  if (specificRule !== undefined) {
    return specificRule === 'allow';
  }

  return permissionRules['*'] === 'allow';
}

function filterAvailableSkillsText(
  text: string,
  permissionRules: Record<string, SkillRule>,
): string {
  return text.replace(
    AVAILABLE_SKILLS_BLOCK_REGEX,
    (_fullMatch, blockContent: string) => {
      const allowedEntries = extractSkillEntries(blockContent).filter((entry) =>
        isSkillAllowed(entry.name, permissionRules),
      );

      if (allowedEntries.length === 0) {
        return '<available_skills>\nNo skills available.\n</available_skills>';
      }

      return `<available_skills>\n${allowedEntries
        .map((entry) => entry.block)
        .join('\n')}\n</available_skills>`;
    },
  );
}

/**
 * Creates the experimental.chat.messages.transform hook for filtering available skills.
 * This hook runs right before sending to API, so it doesn't affect UI display.
 */
export function createFilterAvailableSkillsHook(
  _ctx: PluginInput,
  runtime: RuntimeConfig,
) {
  const permissionRulesByAgent = new Map<string, Record<string, SkillRule>>();

  const getPermissionRules = (agentName: string): Record<string, SkillRule> => {
    const cached = permissionRulesByAgent.get(agentName);
    if (cached) {
      return cached;
    }

    const agents = runtime.agents();
    const agentConfig: AgentOverrideConfig | undefined =
      agents[agentName] ??
      agents[
        Object.keys(AGENT_ALIASES).find(
          (key) => AGENT_ALIASES[key] === agentName,
        ) ?? ''
      ];
    const permissionRules = getSkillPermissionsForAgent(
      agentName,
      agentConfig?.skills,
      runtime.disabledSkills,
    );
    // 按 agent 模式追加隔离规则(用户显式配置优先)
    applyAgentIsolationRules(agentName, agentConfig?.skills, permissionRules);
    permissionRulesByAgent.set(agentName, permissionRules);
    return permissionRules;
  };

  return {
    'experimental.chat.messages.transform': async (
      _input: Record<string, never>,
      output: { messages?: unknown },
    ): Promise<void> => {
      const messages = (
        Array.isArray(output.messages) ? output.messages : []
      ).filter(isMessageWithParts);
      if (messages.length === 0) {
        return;
      }

      const agentName = getCurrentAgent(messages);
      const permissionRules = getPermissionRules(agentName);

      for (const message of messages) {
        for (const part of message.parts) {
          if (
            part.type !== 'text' ||
            !part.text ||
            !part.text.includes('<available_skills>')
          ) {
            continue;
          }

          part.text = filterAvailableSkillsText(part.text, permissionRules);
        }
      }
    },
  };
}

export { filterAvailableSkillsText };
