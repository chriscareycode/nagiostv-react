import { describe, expect, it } from 'vitest';
import {
	getClientSettingsUrlParams,
	parseClientSettingsUrlOverrides,
} from './settingsUrl';

describe('client settings URL overrides', () => {
	it('parses known settings using their declared runtime types', () => {
		const overrides = parseClientSettingsUrlOverrides(new URLSearchParams({
			fetchHostFrequency: '15',
			hideHostUp: 'false',
			titleString: 'Wall display',
		}));

		expect(overrides).toEqual({
			fetchHostFrequency: 15,
			hideHostUp: false,
			titleString: 'Wall display',
		});
	});

	it('ignores unknown, malformed, and out-of-range values', () => {
		const overrides = parseClientSettingsUrlOverrides(new URLSearchParams({
			unknownSetting: 'unexpected',
			fetchHostFrequency: '1',
			alertDaysBack: 'not-a-number',
			hideHostUp: 'sometimes',
		}));

		expect(overrides).toEqual({});
	});

	it('allows zero to disable version checks', () => {
		expect(parseClientSettingsUrlOverrides(
			new URLSearchParams({ versionCheckDays: '0' }),
		)).toEqual({ versionCheckDays: 0 });
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
