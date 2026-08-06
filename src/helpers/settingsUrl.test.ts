import { describe, expect, it } from 'vitest';
import {
	getClientSettingsUrlParams,
	parseClientSettingsUrlOverrides,
} from './settingsUrl';

describe('client settings URL overrides', () => {
	it('parses known settings using their declared runtime types', () => {
		const overrides = parseClientSettingsUrlOverrides(new URLSearchParams({
			doomguyConcernedAt: '15',
			hideHostUp: 'false',
			titleString: 'Wall display',
		}));

		expect(overrides).toEqual({
			doomguyConcernedAt: 15,
			hideHostUp: false,
			titleString: 'Wall display',
		});
	});

	it('ignores unknown, malformed, and out-of-range values', () => {
		const overrides = parseClientSettingsUrlOverrides(new URLSearchParams({
			unknownSetting: 'unexpected',
			doomguyConcernedAt: '-1',
			hideHostUp: 'sometimes',
		}));

		expect(overrides).toEqual({});
	});

	it('rejects security-sensitive and network destination settings', () => {
		expect(parseClientSettingsUrlOverrides(new URLSearchParams({
			baseUrl: 'https://attacker.example/nagios',
			externalLinkBaseUrl: 'https://attacker.example/',
			fetchHostFrequency: '5',
			hideLocalLLMSection: 'false',
			llmApiKey: 'stored-secret',
			llmServerBaseUrl: 'https://attacker.example/llm',
			serverSettingsTakePrecedence: 'true',
			versionCheckDays: '0',
		}))).toEqual({});
	});

	it('gives hash-router parameters precedence over search parameters', () => {
		const params = getClientSettingsUrlParams({
			search: '?titleString=Search&hideHostUp=true',
			hash: '#/settings?titleString=Hash',
		});

		expect(parseClientSettingsUrlOverrides(params)).toMatchObject({
			titleString: 'Hash',
			hideHostUp: true,
		});
	});
});
