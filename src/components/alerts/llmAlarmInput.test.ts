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
		description: `Alert\nfrom plugin${'x'.repeat(400)}`,
		plugin_output: 'failure '.repeat(200),
		object_type: 2,
	}, 'UTC');
	expect(result.service).toHaveLength(300);
	expect(result.service).toBe(result.description);
	expect(result.stateLabel).toBe('service warning');
	expect(result.stateTypeLabel).toBe('hard');
	expect(result.service).not.toContain('\u200b');
	expect(result.description).toMatch(/^Alert from plugin/);
	expect(result.description).toHaveLength(300);
	expect(result.output).toHaveLength(500);
});

it('formats alarm time in the selected local timezone with its UTC offset', () => {
	const alert = {
		name: 'docker',
		host_name: '',
		timestamp: Date.UTC(2025, 6, 1, 14, 36),
		state: 8,
		state_type: 1,
		description: 'unreachable',
		plugin_output: '',
		object_type: 1,
	};
	expect(prepareAlarmForLlm(alert, 'America/Los_Angeles').time).toBe('2025-07-01T07:36:00-07:00');
});

it('labels host and service recovery using alarm-history state codes', () => {
	const host = {
		name: 'docker', host_name: '', timestamp: Date.UTC(2025, 6, 1),
		state: 1, state_type: 1, description: '', plugin_output: '', object_type: 1,
	};
	expect(prepareAlarmForLlm(host, 'UTC').stateLabel).toBe('host up');
	expect(prepareAlarmForLlm({ ...host, state: 4 }, 'UTC').stateLabel).toBe('host unreachable');
	const service = { ...host, name: '', host_name: 'docker', description: 'Disk', object_type: 2, state: 8 };
	expect(prepareAlarmForLlm(service, 'UTC')).toMatchObject({ service: 'Disk', stateLabel: 'service ok' });
});
