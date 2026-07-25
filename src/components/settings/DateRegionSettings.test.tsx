import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeEvent, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import DateRegionSettings from './DateRegionSettings';
import {
	SettingInputType,
	SettingsChangeHandler,
	SettingsValueSetter,
} from './settingsTypes';

const DateRegionSettingsHarness = () => {
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
	const setValue: SettingsValueSetter = (propName, value) => {
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return (
		<DateRegionSettings
			settings={settings}
			onChange={handleChange}
			onSetValue={setValue}
		/>
	);
};

describe('DateRegionSettings', () => {
	it('updates locale and format fields as controlled settings', () => {
		render(<DateRegionSettingsHarness />);

		fireEvent.change(screen.getByRole('combobox', { name: 'Date Locale' }), {
			target: { value: 'fr' },
		});
		fireEvent.change(screen.getByRole('textbox', { name: 'Date Format' }), {
			target: { value: 'yyyy LLL dd' },
		});

		expect(screen.getByRole('combobox', { name: 'Date Locale' })).toHaveValue('fr');
		expect(screen.getByRole('textbox', { name: 'Date Format' })).toHaveValue('yyyy LLL dd');
	});

	it('warns about legacy formats and emits typed default values', () => {
		const onSetValue = vi.fn<SettingsValueSetter>();
		const settings = {
			...clientSettingsInitial,
			dateFormat: 'llll',
			clockDateFormat: 'll',
			clockTimeFormat: 'LTS',
		};

		render(
			<DateRegionSettings
				settings={settings}
				onChange={() => vi.fn()}
				onSetValue={onSetValue}
			/>,
		);

		expect(screen.getAllByText(/We migrated from using the "moment" date library/)).toHaveLength(3);

		fireEvent.click(screen.getByRole('button', { name: 'Set Date Format to default' }));
		fireEvent.click(screen.getByRole('button', { name: 'Set Clock Date Format to default' }));
		fireEvent.click(screen.getByRole('button', { name: 'Set Clock Time Format to default' }));

		expect(onSetValue).toHaveBeenNthCalledWith(1, 'dateFormat', 'fff');
		expect(onSetValue).toHaveBeenNthCalledWith(2, 'clockDateFormat', 'DD');
		expect(onSetValue).toHaveBeenNthCalledWith(3, 'clockTimeFormat', 'ttt');
	});
});
