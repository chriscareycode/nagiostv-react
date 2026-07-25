import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import SettingsPersistence from './SettingsPersistence';
import { SettingsValueSetter } from './settingsTypes';

const persistenceMocks = vi.hoisted(() => ({
	post: vi.fn(),
	writeText: vi.fn(),
}));

vi.mock('axios', () => ({
	default: {
		post: persistenceMocks.post,
	},
}));

vi.mock('clipboard-polyfill/text', () => ({
	writeText: persistenceMocks.writeText,
}));

beforeEach(() => {
	persistenceMocks.post.mockReset();
	persistenceMocks.writeText.mockReset();
});

const PersistenceHarness = ({
	isDemoMode = false,
	onMessage = vi.fn(),
}: {
	isDemoMode?: boolean;
	onMessage?: (message: string, clearAfterMs?: number) => void;
}) => {
	const [settings, setSettings] = useState<ClientSettings>(clientSettingsInitial);
	const setValue: SettingsValueSetter = (propName, value) => {
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return (
		<SettingsPersistence
			isDemoMode={isDemoMode}
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
			JSON.stringify(clientSettingsInitial, null, 2),
		);
	});

	it('reports server-save results after the request resolves', async () => {
		const onMessage = vi.fn();
		persistenceMocks.post.mockResolvedValue({ data: { saved: true } });
		render(<PersistenceHarness onMessage={onMessage} />);

		fireEvent.click(screen.getByRole('button', { name: 'Save settings to server' }));

		await waitFor(() => {
			expect(onMessage).toHaveBeenCalledWith('Saved to Server', 3000);
		});
		expect(persistenceMocks.post).toHaveBeenCalledWith(
			'save-client-settings.php',
			JSON.stringify(clientSettingsInitial, null, 2),
		);
	});

	it('disables server saves in demo mode', () => {
		render(<PersistenceHarness isDemoMode />);

		expect(screen.getByRole('button', { name: 'Save settings to server' })).toBeDisabled();
	});
});
