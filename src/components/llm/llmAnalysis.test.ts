import { describe, expect, it } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { Alert, Host, Service } from '../../types/hostAndServiceTypes';
import {
	buildAnalysisMessages,
	buildMonitoringSignature,
	buildSystemPrompt,
	cleanLlmContentForSpeech,
	formatResponseDuration,
	getLlmHistoryColor,
	MAX_HOST_PROBLEMS_FOR_LLM,
	parseLlmContent,
	parseThinkingContent,
} from './llmAnalysis';

const createHost = (overrides: Partial<Host> = {}): Host => ({
	name: 'web-01',
	last_time_up: 0,
	status: 4,
	is_flapping: false,
	problem_has_been_acknowledged: false,
	scheduled_downtime_depth: 0,
	state_type: 1,
	next_check: 0,
	last_check: 0,
	check_type: 0,
	notifications_enabled: true,
	current_attempt: 3,
	max_attempts: 3,
	plugin_output: 'Host unreachable',
	checks_enabled: true,
	...overrides,
});

const createService = (overrides: Partial<Service> = {}): Service => ({
	host_name: 'web-01',
	description: 'HTTP',
	last_time_ok: 0,
	problem_has_been_acknowledged: false,
	scheduled_downtime_depth: 0,
	status: 16,
	is_flapping: false,
	state_type: 1,
	notifications_enabled: true,
	next_check: 0,
	last_check: 0,
	check_type: 0,
	current_attempt: 3,
	max_attempts: 3,
	plugin_output: 'Connection refused',
	checks_enabled: true,
	...overrides,
});

const createAlert = (overrides: Partial<Alert> = {}): Alert => ({
	name: 'web-01',
	host_name: 'web-01',
	timestamp: new Date('2026-07-24T10:00:00Z').getTime(),
	state: 32,
	state_type: 1,
	description: 'HTTP',
	plugin_output: 'Connection refused',
	object_type: 2,
	...overrides,
});

describe('LocalLLM prompt preparation', () => {
	it('substitutes prompt variables and appends enabled instructions', () => {
		const settings = {
			...clientSettingsInitial,
			llmSystemPrompt: 'Today is {{DATE}}, {{DAY_OF_WEEK}} at {{TIME}}.',
			llmThinkingLevel: 'off' as const,
			doomguyEnabled: true,
			llmDoomguyPrompt: 'Include Doomguy.',
		};
		const prompt = buildSystemPrompt(settings, new Date('2026-07-24T12:34:56Z'));

		expect(prompt).toContain('2026-07-24');
		expect(prompt).not.toMatch(/\{\{.+\}\}/);
		expect(prompt).toContain('no chain-of-thought');
		expect(prompt).toContain('Include Doomguy.');
	});

	it('builds a stable signature that changes with status and filters', () => {
		const alpha = createHost({ name: 'alpha' });
		const bravo = createHost({ name: 'bravo' });
		const first = buildMonitoringSignature(
			[bravo, alpha],
			[createService()],
			clientSettingsInitial,
		);
		const reordered = buildMonitoringSignature(
			[alpha, bravo],
			[createService()],
			clientSettingsInitial,
		);
		const changed = buildMonitoringSignature(
			[alpha, createHost({ name: 'bravo', status: 8 })],
			[createService()],
			{ ...clientSettingsInitial, hideServiceCritical: true },
		);

		expect(reordered).toBe(first);
		expect(changed).not.toBe(first);
	});

	it('uses the all-clear prompt when there are no problems', () => {
		const messages = buildAnalysisMessages(
			'system',
			[],
			[],
			[],
			{ ...clientSettingsInitial, llmPromptAllOk: 'Everything is fine.' },
		);

		expect(messages).toEqual([
			{ role: 'system', content: 'system' },
			{ role: 'user', content: 'Everything is fine.' },
		]);
	});

	it('protects context size and omits detailed problem payloads', () => {
		const hosts = Array.from(
			{ length: MAX_HOST_PROBLEMS_FOR_LLM + 1 },
			(_, index) => createHost({ name: `host-${index}` }),
		);
		const messages = buildAnalysisMessages(
			'system',
			hosts,
			[],
			[],
			clientSettingsInitial,
		);

		expect(messages[1].content).toContain('21 host problems (limit is 20)');
		expect(messages[1].content).not.toContain('Host unreachable');
	});

	it('serializes problems and conditionally includes recent alerts', () => {
		const visible = buildAnalysisMessages(
			'system',
			[createHost()],
			[createService()],
			[createAlert()],
			{ ...clientSettingsInitial, hideMostRecentAlertSection: false },
		);
		const hidden = buildAnalysisMessages(
			'system',
			[createHost()],
			[createService()],
			[createAlert()],
			{ ...clientSettingsInitial, hideMostRecentAlertSection: true },
		);

		expect(visible[1].content).toContain('Host Issues (1)');
		expect(visible[1].content).toContain('Service Issues (1)');
		expect(visible[1].content).toContain('Recent Alerts (1)');
		expect(hidden[1].content).not.toContain('Recent Alerts');
	});
});

describe('LocalLLM response parsing', () => {
	it('extracts tagged and closing-tag-only reasoning', () => {
		expect(parseThinkingContent('<think>reasoning</think>Answer')).toEqual({
			thinkingContent: 'reasoning',
			mainContent: 'Answer',
		});
		expect(parseThinkingContent('reasoning only</think>Answer')).toEqual({
			thinkingContent: 'reasoning only',
			mainContent: 'Answer',
		});
	});

	it('extracts emoji and Doomguy speech while combining reasoning', () => {
		const parsed = parseLlmContent(
			'<think>tagged</think>🚨 Fix `HTTP`. Doomguy says: “Check web-01.”',
			'backend reasoning',
			2,
		);

		expect(parsed).toEqual({
			content: 'Fix `HTTP`.',
			emoji: '🚨',
			shortResponse: 'Check web-01.',
			thinkingContent: 'backend reasoning\n\ntagged',
		});
	});

	it('selects fallback emoji and severity colors from issue state', () => {
		expect(parseLlmContent('All good', undefined, 0).emoji).toBe('✅');
		expect(parseLlmContent('Some issues', undefined, 1).emoji).toBe('⚠️');
		expect(parseLlmContent('Many issues', undefined, 11).emoji).toBe('🚨');
		expect(getLlmHistoryColor([], [createService({ status: 8 })])).toBe('orange');
		expect(getLlmHistoryColor([], [createService({ status: 4 })])).toBe('yellow');
		expect(getLlmHistoryColor([createHost({ status: 4 })], [])).toBe('red');
	});

	it('formats duration and strips display markup for speech', () => {
		expect(formatResponseDuration(100)).toBe('1s');
		expect(formatResponseDuration(2_600)).toBe('3s');
		expect(cleanLlmContentForSpeech('🚨 **Fix** `HTTP`\n- now')).toBe(' Fix HTTP\nnow');
	});
});
