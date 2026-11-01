import { expect, it } from 'vitest';
import { cleanLlmInput, MAX_LLM_QUESTION_LENGTH, prepareAlarmForLlm } from './llmAlarmInput';

it('bounds question text and removes hidden formatting without stripping diagnostic punctuation', () => {
	const input = `Check\u001b[31m disk\u202e usage; $(echo safe) ${'x'.repeat(MAX_LLM_QUESTION_LENGTH)}`;
	const cleaned = cleanLlmInput(input, MAX_LLM_QUESTION_LENGTH);
	expect(cleaned).toContain('disk usage; $(echo safe)');
	expect(cleaned).not.toContain('\u001b');
	expect(cleaned).not.toContain('\u202e');
	expect(cleaned).toHaveLength(MAX_LLM_QUESTION_LENGTH);
});

it('bounds untrusted alarm fields before they are sent to the model', () => {
	const result = prepareAlarmForLlm({
		name: `service\u200b${'x'.repeat(400)}`,
		host_name: 'host-a',
		timestamp: Date.UTC(2025, 0, 1),
		state: 16,
		state_type: 1,
		description: 'Alert\nfrom plugin',
		plugin_output: 'failure '.repeat(200),
		object_type: 2,
	});
	expect(result.service).toHaveLength(300);
	expect(result.service).not.toContain('\u200b');
	expect(result.description).toBe('Alert from plugin');
	expect(result.output).toHaveLength(500);
});
