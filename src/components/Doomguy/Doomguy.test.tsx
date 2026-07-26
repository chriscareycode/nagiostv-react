import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { describe, expect, it } from 'vitest';
import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';
import { llmCurrentHistoryIndexAtom, llmHistoryAtom } from '../../atoms/llmAtom';
import Doomguy from './Doomguy';

const renderDoomguy = (alwaysShowGroupFilters: boolean, hideFilters: boolean) => {
	const store = createStore();
	store.set(clientSettingsAtom, {
		...store.get(clientSettingsAtom),
		alwaysShowGroupFilters,
		hideLocalLLMSection: false,
	});
	store.set(bigStateAtom, {
		...store.get(bigStateAtom),
		hideFilters,
	});
	store.set(llmHistoryAtom, [{
		content: '',
		timestamp: 0,
		emoji: '',
		model: '',
		color: 'green',
		shortResponse: 'Systems nominal',
	}]);
	store.set(llmCurrentHistoryIndexAtom, 0);

	render(
		<Provider store={store}>
			<Doomguy />
		</Provider>,
	);

	return screen.getByText('Systems nominal').closest('.doomguy-speech-balloon-wrap');
};

describe('Doomguy speech balloon position', () => {
	it('shows below Doomguy when group filters are configured to show with filters and are hidden', () => {
		expect(renderDoomguy(false, true)).toHaveClass('doomguy-speech-balloon-below');
	});

	it.each([
		[true, true],
		[false, false],
	])('shows above Doomguy when alwaysShowGroupFilters=%s and hideFilters=%s', (alwaysShowGroupFilters, hideFilters) => {
		expect(renderDoomguy(alwaysShowGroupFilters, hideFilters)).not.toHaveClass('doomguy-speech-balloon-below');
	});
});
