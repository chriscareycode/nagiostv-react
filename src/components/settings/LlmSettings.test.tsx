import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeEvent, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import LlmSettings from './LlmSettings';
import { SettingInputType, SettingsChangeHandler } from './settingsTypes';

vi.mock('./LlmModelSelector', () => ({
	default: ({ llmBackendType }: { llmBackendType: string }) => (
		<div data-testid="model-selector">{llmBackendType}</div>
	),
}));

const LlmSettingsHarness = () => {
	const [settings, setSettings] = useState<ClientSettings>(clientSettingsInitial);
	const handleChange: SettingsChangeHandler = (
		propName: keyof ClientSettings,
		dataType: SettingInputType,
	) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const value = dataType === 'boolean'
			? event.target.value === 'true'
			: event.target.value;
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return <LlmSettings settings={settings} onChange={handleChange} />;
};

describe('LlmSettings', () => {
	it('shows integration fields only when Local LLM is enabled', () => {
		render(<LlmSettingsHarness />);

		expect(screen.queryByRole('combobox', { name: 'LLM Backend Type' })).not.toBeInTheDocument();
		fireEvent.change(screen.getByRole('combobox', { name: 'Local LLM' }), {
			target: { value: 'false' },
		});

		expect(screen.getByRole('combobox', { name: 'LLM Backend Type' })).toBeInTheDocument();
		expect(screen.getByTestId('model-selector')).toHaveTextContent('openai-compatible');
	});

	it('updates backend, connection, and prompt settings', () => {
		render(<LlmSettingsHarness />);
		fireEvent.change(screen.getByRole('combobox', { name: 'Local LLM' }), {
			target: { value: 'false' },
		});

		fireEvent.change(screen.getByRole('combobox', { name: 'LLM Backend Type' }), {
			target: { value: 'anthropic' },
		});
		fireEvent.change(screen.getByRole('textbox', { name: 'LLM Server Base URL' }), {
			target: { value: 'http://localhost:9000' },
		});
		fireEvent.change(screen.getByRole('textbox', { name: 'Prompt (Issues)' }), {
			target: { value: 'Prioritize critical services.' },
		});

		expect(screen.getByTestId('model-selector')).toHaveTextContent('anthropic');
		expect(screen.getByRole('textbox', { name: 'LLM Server Base URL' })).toHaveValue('http://localhost:9000');
		expect(screen.getByRole('textbox', { name: 'Prompt (Issues)' })).toHaveValue('Prioritize critical services.');
	});

	it('keeps alarm-history questions disabled by default and shows the network warning', () => {
		render(<LlmSettingsHarness />);
		expect(clientSettingsInitial.llmAskQuestions).toBe(false);
		fireEvent.change(screen.getByRole('combobox', { name: 'Local LLM' }), {
			target: { value: 'false' },
		});
		const questionToggle = screen.getByRole('combobox', { name: 'Ask AI About Alarm History' });
		expect(questionToggle).toHaveValue('false');
		expect(screen.getByText(/private network where access to the LLM input is controlled/i)).toBeInTheDocument();
		fireEvent.change(questionToggle, { target: { value: 'true' } });
		expect(questionToggle).toHaveValue('true');
	});
});
