import { describe, expect, it } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { arePropsEqual } from './ScrollToSection';

const props = (overrides = {}) => ({
	clientSettings: {
		...clientSettingsInitial,
		...overrides,
	},
});

describe('ScrollToSection memoization', () => {
	it.each([
		['automaticScrollTimeMultiplier', 2],
		['automaticScrollWaitSeconds', 12],
		['hideServiceSection', true],
		['hideHostSection', true],
		['hideHistory', true],
	] as const)('rerenders when %s changes', (setting, value) => {
		expect(arePropsEqual(props(), props({ [setting]: value }))).toBe(false);
	});

	it('ignores settings that do not affect automatic scrolling', () => {
		expect(arePropsEqual(props(), props({ titleString: 'Other title' }))).toBe(true);
	});
});
