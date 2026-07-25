import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeEvent, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { ClientSettings } from '../../types/settings';
import AudioVisualSettings from './AudioVisualSettings';
import {
	SettingInputType,
	SettingsChangeHandler,
	SettingsValueSetter,
} from './settingsTypes';

const audioMocks = vi.hoisted(() => ({
	playSoundEffectDebounced: vi.fn(),
	speakAudio: vi.fn(),
}));

vi.mock('../../helpers/audio', () => audioMocks);

const testVoice = {
	lang: 'en-US',
	name: 'Test Voice',
} as SpeechSynthesisVoice;

const AudioVisualSettingsHarness = () => {
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
	const setValue: SettingsValueSetter = (propName, value) => {
		setSettings(current => ({ ...current, [propName]: value }));
	};

	return (
		<AudioVisualSettings
			settings={settings}
			voices={[testVoice]}
			onChange={handleChange}
			onSetValue={setValue}
		/>
	);
};

describe('AudioVisualSettings', () => {
	it('shows sound controls conditionally and invokes the sound test action', () => {
		render(<AudioVisualSettingsHarness />);

		expect(screen.queryByRole('textbox', { name: 'CRITICAL sound' })).not.toBeInTheDocument();
		fireEvent.change(screen.getByRole('combobox', { name: 'Sound Effects' }), {
			target: { value: 'true' },
		});

		expect(screen.getByRole('textbox', { name: 'CRITICAL sound' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Test CRITICAL sound' }));
		expect(audioMocks.playSoundEffectDebounced).toHaveBeenCalledWith(
			'service',
			'critical',
			expect.objectContaining({ playSoundEffects: true }),
		);
	});

	it('tests the selected speaking voice', () => {
		render(<AudioVisualSettingsHarness />);

		fireEvent.change(screen.getByRole('combobox', { name: 'Speaking Voice' }), {
			target: { value: 'Test Voice' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Test Speaking Voice' }));

		expect(audioMocks.speakAudio).toHaveBeenCalledWith('Naagios TV is cool', 'Test Voice');
	});

	it('preserves decimal automatic-scroll multipliers', () => {
		render(<AudioVisualSettingsHarness />);

		fireEvent.change(screen.getByRole('combobox', { name: 'Automatic Scroll' }), {
			target: { value: 'true' },
		});
		const multiplier = screen.getByRole('spinbutton', {
			name: 'Automatic Scroll Time Multiplier',
		});
		fireEvent.change(multiplier, { target: { value: '2.5' } });

		expect(multiplier).toHaveValue(2.5);
	});

	it('updates the font-size setting with its CSS unit', () => {
		render(<AudioVisualSettingsHarness />);
		const fontSize = screen.getByRole('slider', { name: 'Dashboard Font Size' });

		fireEvent.change(fontSize, { target: { value: '1.8' } });

		expect(fontSize).toHaveValue('1.8');
		expect(screen.getByText('Example text at 1.8em')).toBeInTheDocument();
	});
});
