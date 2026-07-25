import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeEvent, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import MenuSettings from './MenuSettings';
import { SettingInputType, SettingsChangeHandler } from './settingsTypes';

vi.mock('../Doomguy/Doomguy', () => ({
	default: () => <span data-testid="doomguy-preview" />,
}));

const MenuSettingsHarness = () => {
	const [settings, setSettings] = useState<ClientSettings>(clientSettingsInitial);
	const handleChange: SettingsChangeHandler = (
		propName: keyof ClientSettings,
		dataType: SettingInputType,
	) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		let value: boolean | number | string = event.target.value;
		if (dataType === 'boolean') {
			value = event.target.value === 'true';
		} else if (dataType === 'number') {
			value = Number.parseFloat(event.target.value);
		}
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return <MenuSettings settings={settings} onChange={handleChange} />;
};

describe('MenuSettings', () => {
	it('shows the custom logo URL only while the logo is enabled', () => {
		render(<MenuSettingsHarness />);
		const logoToggle = screen.getByRole('combobox', { name: 'Custom Logo' });

		expect(screen.getByRole('textbox', { name: 'Custom Logo URL' })).toHaveValue(
			clientSettingsInitial.customLogoUrl,
		);
		fireEvent.change(logoToggle, { target: { value: 'false' } });
		expect(screen.queryByRole('textbox', { name: 'Custom Logo URL' })).not.toBeInTheDocument();
	});

	it('shows and updates Doomguy thresholds only when enabled', () => {
		render(<MenuSettingsHarness />);

		expect(screen.queryByRole('spinbutton', { name: 'Doomguy angry at' })).not.toBeInTheDocument();
		fireEvent.change(screen.getByRole('combobox', { name: 'Doomguy' }), {
			target: { value: 'true' },
		});

		const angryThreshold = screen.getByRole('spinbutton', { name: 'Doomguy angry at' });
		fireEvent.change(angryThreshold, { target: { value: '7' } });
		expect(angryThreshold).toHaveValue(7);
	});

	it('updates menu visibility through shared boolean controls', () => {
		render(<MenuSettingsHarness />);
		const bottomMenu = screen.getByRole('combobox', { name: 'Bottom Menu' });

		fireEvent.change(bottomMenu, { target: { value: 'true' } });

		expect(bottomMenu).toHaveValue('true');
	});
});
