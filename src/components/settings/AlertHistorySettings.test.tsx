import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeEvent, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import AlertHistorySettings from './AlertHistorySettings';
import { SettingInputType, SettingsChangeHandler } from './settingsTypes';

const AlertHistorySettingsHarness = () => {
	const [settings, setSettings] = useState<ClientSettings>(clientSettingsInitial);
	const handleChange: SettingsChangeHandler = (
		propName: keyof ClientSettings,
		dataType: SettingInputType,
	) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const value = dataType === 'boolean'
			? event.target.value === 'true'
			: Number.parseInt(event.target.value, 10);
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return <AlertHistorySettings settings={settings} onChange={handleChange} />;
};

describe('AlertHistorySettings', () => {
	it('updates chart visibility through the shared boolean control', () => {
		render(<AlertHistorySettingsHarness />);
		const chartVisibility = screen.getByRole('combobox', {
			name: `Alert History (${clientSettingsInitial.alertDaysBack}d) Chart`,
		});

		fireEvent.change(chartVisibility, { target: { value: 'true' } });

		expect(chartVisibility).toHaveValue('true');
	});

	it('updates numeric limits and reflects days in the chart label', () => {
		render(<AlertHistorySettingsHarness />);
		const daysBack = screen.getByRole('spinbutton', { name: 'Alert History Days Back' });
		const maxItems = screen.getByRole('spinbutton', { name: 'Alert History max items' });

		fireEvent.change(daysBack, { target: { value: '14' } });
		fireEvent.change(maxItems, { target: { value: '500' } });

		expect(daysBack).toHaveValue(14);
		expect(maxItems).toHaveValue(500);
		expect(screen.getByRole('combobox', { name: 'Alert History (14d) Chart' })).toBeInTheDocument();
	});
});
