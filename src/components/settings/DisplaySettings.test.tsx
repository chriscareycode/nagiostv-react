import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeEvent, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import DisplaySettings from './DisplaySettings';
import { SettingInputType, SettingsChangeHandler } from './settingsTypes';

const DisplaySettingsHarness = () => {
	const [settings, setSettings] = useState<ClientSettings>(clientSettingsInitial);
	const handleChange: SettingsChangeHandler = (
		propName: keyof ClientSettings,
		dataType: SettingInputType,
	) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		let value: boolean | number | string = event.target.value;
		if (dataType === 'boolean') {
			value = event.target.value === 'true';
		} else if (dataType === 'number') {
			value = Number.parseInt(event.target.value, 10);
		}
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return <DisplaySettings settings={settings} onChange={handleChange} />;
};

describe('DisplaySettings', () => {
	it('updates typed boolean visibility settings', () => {
		render(<DisplaySettingsHarness />);
		const summary = screen.getByRole('combobox', { name: 'Summary' });

		expect(summary).toHaveValue('false');
		fireEvent.change(summary, { target: { value: 'true' } });
		expect(summary).toHaveValue('true');
	});

	it('enables and updates MiniMap width only when MiniMap is shown', () => {
		render(<DisplaySettingsHarness />);
		const miniMap = screen.getByRole('combobox', { name: 'MiniMap' });
		const width = screen.getByRole('textbox', { name: 'MiniMap width' });

		expect(width).toBeDisabled();
		fireEvent.change(miniMap, { target: { value: 'true' } });
		expect(width).toBeEnabled();

		fireEvent.change(width, { target: { value: '240' } });
		expect(width).toHaveValue('240');
	});
});
