import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeEvent, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import DataSourceSettings from './DataSourceSettings';
import {
	SettingInputType,
	SettingsChangeHandler,
} from './settingsTypes';

const DataSourceSettingsHarness = () => {
	const [settings, setSettings] = useState<ClientSettings>(clientSettingsInitial);
	const handleChange: SettingsChangeHandler = (
		propName: keyof ClientSettings,
		dataType: SettingInputType,
	) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const value = dataType === 'number'
			? Number.parseInt(event.target.value, 10)
			: event.target.value;
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return <DataSourceSettings settings={settings} onChange={handleChange} />;
};

describe('DataSourceSettings', () => {
	it('shows the livestatus path only when livestatus is selected', () => {
		render(<DataSourceSettingsHarness />);

		expect(screen.queryByRole('textbox', { name: 'livestatus.php path' })).not.toBeInTheDocument();

		fireEvent.change(screen.getByRole('combobox', { name: 'Fetch data from' }), {
			target: { value: 'livestatus' },
		});

		expect(screen.getByRole('textbox', { name: 'livestatus.php path' })).toHaveValue(
			clientSettingsInitial.livestatusPath,
		);
	});

	it('updates connection paths and numeric polling settings', () => {
		render(<DataSourceSettingsHarness />);

		fireEvent.change(screen.getByRole('textbox', { name: 'Nagios cgi-bin path' }), {
			target: { value: '/custom/cgi-bin/' },
		});
		fireEvent.change(screen.getByRole('combobox', { name: 'Fetch hosts every' }), {
			target: { value: '300' },
		});

		expect(screen.getByRole('textbox', { name: 'Nagios cgi-bin path' })).toHaveValue('/custom/cgi-bin/');
		expect(screen.getByRole('combobox', { name: 'Fetch hosts every' })).toHaveValue('300');
	});
});
