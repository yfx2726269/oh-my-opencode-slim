import { describe, expect, test } from 'bun:test';
import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { RuntimeConfig } from '../../config/runtime';
import {
  createFilterAvailableSkillsHook,
  filterAvailableSkillsText,
} from './index';

const mockCtx = {} as PluginInput;
const TEST_DIRECTORY = 'runtime-test-filter-skills';

function runtimeFor(config: PluginConfig | undefined = {}) {
  RuntimeConfig.reset(TEST_DIRECTORY);
  RuntimeConfig.init(TEST_DIRECTORY, config ?? {});
  return RuntimeConfig.get(TEST_DIRECTORY);
}

function skillBlock(name: string): string {
  return `<skill>
  <name>${name}</name>
  <description>${name} description</description>
  <location>file:///tmp/${name}</location>
</skill>`;
}

function availableSkillsBlock(...names: string[]): string {
  return `<available_skills>
${names.map((name) => skillBlock(name)).join('\n')}
</available_skills>`;
}

describe('filterAvailableSkillsText', () => {
  test('keeps only allowed skills using exact skill names', () => {
    const text = availableSkillsBlock('skill1', 'skill2', 'skill3');
    const result = filterAvailableSkillsText(text, {
      '*': 'deny',
      skill1: 'allow',
      skill3: 'allow',
    });

    expect(result).toContain('<name>skill1</name>');
    expect(result).not.toContain('<name>skill2</name>');
    expect(result).toContain('<name>skill3</name>');
  });

  test('renders No skills available when nothing is allowed', () => {
    const result = filterAvailableSkillsText(availableSkillsBlock('skill1'), {
      '*': 'deny',
    });

    expect(result).toContain('No skills available.');
    expect(result).not.toContain('<name>skill1</name>');
  });
});

describe('createFilterAvailableSkillsHook', () => {
  test('ignores messages without OpenCode info or parts', async () => {
    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor());
    const output = {
      messages: [
        {},
        { info: { role: 'assistant' } },
        {
          info: { role: 'system' },
          parts: [{ type: 'text', text: availableSkillsBlock('skill1') }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output as never);

    expect(output.messages[2].parts[0].text).toContain('<name>skill1</name>');
  });

  test('filters system prompt skill blocks for explicit agent skills', async () => {
    const config: PluginConfig = {
      agents: {
        explorer: {
          skills: ['skill1', 'skill3'],
        },
      },
    };

    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor(config));
    const output = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            {
              type: 'text',
              text: availableSkillsBlock('skill1', 'skill2', 'skill3'),
            },
          ],
        },
        {
          info: { role: 'user', agent: 'explorer' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output);

    const resultText = output.messages[0].parts[0].text;
    expect(resultText).toContain('<name>skill1</name>');
    expect(resultText).not.toContain('<name>skill2</name>');
    expect(resultText).toContain('<name>skill3</name>');
  });

  test('shows no skills for agents configured with an empty skills list', async () => {
    const config: PluginConfig = {
      agents: {
        fixer: {
          skills: [],
        },
      },
    };

    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor(config));
    const output = {
      messages: [
        {
          info: { role: 'system' },
          parts: [{ type: 'text', text: availableSkillsBlock('skill1') }],
        },
        {
          info: { role: 'user', agent: 'fixer' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output);

    const resultText = output.messages[0].parts[0].text;
    expect(resultText).toContain('No skills available.');
    expect(resultText).not.toContain('<name>skill1</name>');
  });

  test('preserves orchestrator default wildcard allow', async () => {
    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor());
    const output = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            { type: 'text', text: availableSkillsBlock('skill1', 'skill2') },
          ],
        },
        {
          info: { role: 'user', agent: 'orchestrator' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output);

    const resultText = output.messages[0].parts[0].text;
    expect(resultText).toContain('<name>skill1</name>');
    expect(resultText).toContain('<name>skill2</name>');
  });

  test('supports wildcard allow with explicit exclusions', async () => {
    const config: PluginConfig = {
      agents: {
        designer: {
          skills: ['*', '!skill2'],
        },
      },
    };

    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor(config));
    const output = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            { type: 'text', text: availableSkillsBlock('skill1', 'skill2') },
          ],
        },
        {
          info: { role: 'user', agent: 'designer' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output);

    const resultText = output.messages[0].parts[0].text;
    expect(resultText).toContain('<name>skill1</name>');
    expect(resultText).not.toContain('<name>skill2</name>');
  });

  test('defaults to orchestrator when no agent is present', async () => {
    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor());
    const output = {
      messages: [
        {
          info: { role: 'system' },
          parts: [{ type: 'text', text: availableSkillsBlock('skill1') }],
        },
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output);

    expect(output.messages[0].parts[0].text).toContain('<name>skill1</name>');
  });

  test('filters multiple skill blocks across messages', async () => {
    const config: PluginConfig = {
      agents: {
        explorer: {
          skills: ['skill1'],
        },
      },
    };

    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor(config));
    const output = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            {
              type: 'text',
              text: `Intro\n${availableSkillsBlock('skill1', 'skill2')}`,
            },
          ],
        },
        {
          info: { role: 'developer' },
          parts: [
            { type: 'text', text: availableSkillsBlock('skill2', 'skill3') },
          ],
        },
        {
          info: { role: 'user', agent: 'explorer' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output);

    expect(output.messages[0].parts[0].text).toContain('<name>skill1</name>');
    expect(output.messages[0].parts[0].text).not.toContain(
      '<name>skill2</name>',
    );
    expect(output.messages[1].parts[0].text).toContain('No skills available.');
  });

  test('reuses permission rules without caching the final skills block text', async () => {
    const config: PluginConfig = {
      agents: {
        explorer: {
          skills: ['skill1', 'skill3'],
        },
      },
    };

    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor(config));
    const firstOutput = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            {
              type: 'text',
              text: availableSkillsBlock('skill1', 'skill2'),
            },
          ],
        },
        {
          info: { role: 'user', agent: 'explorer' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };
    const secondOutput = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            {
              type: 'text',
              text: availableSkillsBlock('skill2', 'skill3'),
            },
          ],
        },
        {
          info: { role: 'user', agent: 'explorer' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, firstOutput);
    await hook['experimental.chat.messages.transform']({}, secondOutput);

    expect(firstOutput.messages[0].parts[0].text).toContain(
      '<name>skill1</name>',
    );
    expect(firstOutput.messages[0].parts[0].text).not.toContain(
      '<name>skill3</name>',
    );
    expect(secondOutput.messages[0].parts[0].text).not.toContain(
      '<name>skill1</name>',
    );
    expect(secondOutput.messages[0].parts[0].text).toContain(
      '<name>skill3</name>',
    );
  });

  test('isolates superpowers execution skills from orchestrator by default', async () => {
    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor());
    const output = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            {
              type: 'text',
              text: availableSkillsBlock(
                'deepwork',
                'subagent-driven-development',
                'executing-plans',
                'systematic-debugging',
              ),
            },
          ],
        },
        {
          info: { role: 'user', agent: 'orchestrator' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output);

    const resultText = output.messages[0].parts[0].text;
    expect(resultText).toContain('<name>deepwork</name>');
    expect(resultText).not.toContain('<name>subagent-driven-development</name>');
    expect(resultText).not.toContain('<name>executing-plans</name>');
    expect(resultText).not.toContain('<name>systematic-debugging</name>');
  });

  test('isolates deepwork from non-orchestrator agents even with wildcard allow', async () => {
    const config: PluginConfig = {
      agents: {
        build: {
          skills: ['*'],
        },
      },
    };

    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor(config));
    const output = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            {
              type: 'text',
              text: availableSkillsBlock(
                'deepwork',
                'systematic-debugging',
                'simplify',
              ),
            },
          ],
        },
        {
          info: { role: 'user', agent: 'build' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({}, output);

    const resultText = output.messages[0].parts[0].text;
    expect(resultText).not.toContain('<name>deepwork</name>');
    expect(resultText).toContain('<name>systematic-debugging</name>');
    expect(resultText).toContain('<name>simplify</name>');
  });

  test('respects explicit user skill config over isolation rules', async () => {
    const config: PluginConfig = {
      agents: {
        orchestrator: {
          skills: ['systematic-debugging'],
        },
        build: {
          skills: ['deepwork'],
        },
      },
    };

    const hook = createFilterAvailableSkillsHook(mockCtx, runtimeFor(config));
    const orchestratorOutput = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            {
              type: 'text',
              text: availableSkillsBlock(
                'systematic-debugging',
                'executing-plans',
              ),
            },
          ],
        },
        {
          info: { role: 'user', agent: 'orchestrator' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };
    const buildOutput = {
      messages: [
        {
          info: { role: 'system' },
          parts: [
            {
              type: 'text',
              text: availableSkillsBlock('deepwork', 'simplify'),
            },
          ],
        },
        {
          info: { role: 'user', agent: 'build' },
          parts: [{ type: 'text', text: 'check skills' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform'](
      {},
      orchestratorOutput,
    );
    await hook['experimental.chat.messages.transform']({}, buildOutput);

    const orchestratorText = orchestratorOutput.messages[0].parts[0].text;
    expect(orchestratorText).toContain('<name>systematic-debugging</name>');
    expect(orchestratorText).not.toContain('<name>executing-plans</name>');

    const buildText = buildOutput.messages[0].parts[0].text;
    // 用户显式 allow deepwork,隔离规则不覆盖;显式列表下 simplify 保持 deny
    expect(buildText).toContain('<name>deepwork</name>');
    expect(buildText).not.toContain('<name>simplify</name>');
  });
});
