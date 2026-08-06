import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import SettingsPersistence from './SettingsPersistence';
import { SettingsValueSetter } from './settingsTypes';

const persistenceMocks = vi.hoisted(() => ({
	fetchAdminCapabilities: vi.fn(),
	postAdminJson: vi.fn(),
	writeText: vi.fn(),
}));

vi.mock('../../helpers/adminApi', () => ({
	fetchAdminCapabilities: persistenceMocks.fetchAdminCapabilities,
	postAdminJson: persistenceMocks.postAdminJson,
}));

vi.mock('clipboard-polyfill/text', () => ({
	writeText: persistenceMocks.writeText,
}));

beforeEach(() => {
	persistenceMocks.fetchAdminCapabilities.mockReset();
	persistenceMocks.fetchAdminCapabilities.mockResolvedValue({
		enabled: true,
		csrfToken: 'csrf-token',
		httpsRequired: false,
	});
	persistenceMocks.postAdminJson.mockReset();
	persistenceMocks.postAdminJson.mockResolvedValue({ saved: true });
	persistenceMocks.writeText.mockReset();
});

const PersistenceHarness = ({ onMessage = vi.fn() }: { onMessage?: (message: string, clearAfterMs?: number) => void }) => {
	const [settings, setSettings] = useState<ClientSettings>({
		...clientSettingsInitial,
		llmApiKey: 'must-not-be-exported',
	});
	const setValue: SettingsValueSetter = (propName, value) => {
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return (
		<SettingsPersistence
			isDemoMode={false}
			settings={settings}
			onMessage={onMessage}
			onSetValue={setValue}
		/>
	);
};

describe('SettingsPersistence', () => {
	it('updates server precedence and exposes the current JSON', () => {
		render(<PersistenceHarness />);
		const precedence = screen.getByRole('checkbox', {
			name: /Server settings take precedence/,
		});

		expect(precedence).not.toBeChecked();
		fireEvent.click(precedence);
		expect(precedence).toBeChecked();

		fireEvent.click(screen.getByRole('button', { name: 'Show JSON' }));
		expect(screen.getByText(/"serverSettingsTakePrecedence": true/)).toBeInTheDocument();
	});

	it('copies pretty-printed current settings to the clipboard', () => {
		render(<PersistenceHarness />);

		fireEvent.click(screen.getByRole('button', {
			name: 'Copy settings to clipboard for manual paste',
		}));

			expect(persistenceMocks.writeText).toHaveBeenCalledWith(
				JSON.stringify({ ...clientSettingsInitial, llmApiKey: undefined }, null, 2),
			);
		});

	it('sends safe settings with in-memory admin and CSRF tokens', async () => {
		const onMessage = vi.fn();
		render(<PersistenceHarness onMessage={onMessage} />);
		await waitFor(() => expect(persistenceMocks.fetchAdminCapabilities).toHaveBeenCalled());
		fireEvent.change(screen.getByLabelText('NagiosTV administrator token'), {
			target: { value: 'admin-token' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Save settings to server' }));

		await waitFor(() => expect(persistenceMocks.postAdminJson).toHaveBeenCalled());
		const payload = persistenceMocks.postAdminJson.mock.calls[0][1];
		expect(payload).not.toHaveProperty('llmApiKey');
		expect(persistenceMocks.postAdminJson).toHaveBeenCalledWith(
			'save-client-settings.php',
			payload,
			'admin-token',
			'csrf-token',
		);
		expect(onMessage).toHaveBeenCalledWith('Saved to Server', 3000);
	});
});
