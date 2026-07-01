import { describe, expect, it } from 'vitest';

import {
  hasPromptVariables,
  parsePromptVariables,
  resolvePromptVariables,
} from '../variableParser';

describe('variableParser', () => {
  it('parses variables with and without defaults', () => {
    expect(parsePromptVariables('Hello {{name:World}} and {{topic}}')).toEqual([
      { name: 'name', defaultValue: 'World' },
      { name: 'topic', defaultValue: '' },
    ]);
  });

  it('detects variables', () => {
    expect(hasPromptVariables('plain text')).toBe(false);
    expect(hasPromptVariables('{{x}}')).toBe(true);
  });

  it('resolves with user values and defaults', () => {
    const text = 'Fix {{product:shower}} with {{style:白底}}';
    const vars = parsePromptVariables(text);
    expect(
      resolvePromptVariables(text, { product: 'faucet' }, vars),
    ).toBe('Fix faucet with 白底');
  });
});
