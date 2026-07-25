import { ClientSettings } from '../../types/settings';
import { playSoundEffectDebounced, speakAudio } from '../../helpers/audio';
import { BooleanSettingRow } from './SettingControls';
import { SettingsChangeHandler, SettingsValueSetter } from './settingsTypes';

interface AudioVisualSettingsProps {
	onChange: SettingsChangeHandler;
	onSetValue: SettingsValueSetter;
	settings: ClientSettings;
	voices: SpeechSynthesisVoice[];
}

type SoundSettingKey = 'soundEffectCritical' | 'soundEffectOk' | 'soundEffectWarning';
type SoundState = 'critical' | 'ok' | 'warning';

interface SoundSettingRowProps {
	label: string;
	onChange: SettingsChangeHandler;
	onTest: () => void;
	property: SoundSettingKey;
	value: string;
}

const SoundSettingRow = ({
	label,
	onChange,
	onTest,
	property,
	value,
}: SoundSettingRowProps) => (
	<tr>
		<th>{label} sound:</th>
		<td>
			<input
				aria-label={`${label} sound`}
				type="text"
				value={value}
				onChange={onChange(property, 'string')}
			/>
			<button className="SettingsTestButton" onClick={onTest}>Test {label} sound</button>
		</td>
	</tr>
);

const AudioVisualSettings = ({
	onChange,
	onSetValue,
	settings,
	voices,
}: AudioVisualSettingsProps) => {
	const testSound = (state: SoundState) => {
		playSoundEffectDebounced('service', state, settings);
	};
	const testVoice = () => {
		if (settings.speakItemsVoice) {
			speakAudio('Naagios TV is cool', settings.speakItemsVoice);
		}
	};

	return (
		<table className="SettingsTable">
			<thead>
				<tr>
					<td colSpan={2} className="SettingsTableHeader">Audio and Visual</td>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Dashboard Font Size</th>
					<td>
						<input
							aria-label="Dashboard Font Size"
							type="range"
							min="0.5"
							max="4"
							step="0.1"
							value={Number.parseFloat(settings.fontSizeEm)}
							onChange={event => onSetValue('fontSizeEm', `${event.target.value}em`)}
							style={{ width: '200px', marginRight: '10px' }}
						/>
						<div style={{ fontSize: settings.fontSizeEm }}>
							Example text at {settings.fontSizeEm}
						</div>
					</td>
				</tr>
				<BooleanSettingRow
					falseLabel="Off"
					onChange={onChange}
					property="playSoundEffects"
					title="Sound Effects"
					trueLabel="On"
					value={settings.playSoundEffects}
				/>
				{settings.playSoundEffects && (
					<>
						<SoundSettingRow
							label="CRITICAL"
							onChange={onChange}
							onTest={() => testSound('critical')}
							property="soundEffectCritical"
							value={settings.soundEffectCritical}
						/>
						<SoundSettingRow
							label="WARNING"
							onChange={onChange}
							onTest={() => testSound('warning')}
							property="soundEffectWarning"
							value={settings.soundEffectWarning}
						/>
						<SoundSettingRow
							label="OK"
							onChange={onChange}
							onTest={() => testSound('ok')}
							property="soundEffectOk"
							value={settings.soundEffectOk}
						/>
						<tr>
							<th></th>
							<td>
								<div style={{ margin: '5px 0', fontSize: '0.8em' }}>
									* You can have multiple sound files for each state, and it will randomly choose one from the list. Add a semicolon between sounds like "http://example.com/sound-1.mp3;http://example.com/sound-2.mp3"
								</div>
							</td>
						</tr>
					</>
				)}
				<BooleanSettingRow
					falseLabel="Off"
					onChange={onChange}
					property="speakItems"
					title="Speak Items"
					trueLabel="On"
					value={settings.speakItems}
				/>
				<tr>
					<th>Speaking Voice:</th>
					<td>
						<select
							aria-label="Speaking Voice"
							value={settings.speakItemsVoice}
							onChange={onChange('speakItemsVoice', 'string')}
						>
							<option value="">DEFAULT</option>
							{voices.map(voice => (
								<option key={`${voice.name}-${voice.lang}`} value={voice.name}>
									{voice.name} ({voice.lang})
								</option>
							))}
						</select>
						<button className="SettingsTestButton" onClick={testVoice}>Test Speaking Voice</button>
					</td>
				</tr>
				<BooleanSettingRow
					description="Uses more CPU in the browser (with recent GPU acceleration)"
					falseLabel="Off"
					onChange={onChange}
					property="showNextCheckInProgressBar"
					title={'Animated progress bar for "Next Check In"'}
					trueLabel="On"
					value={settings.showNextCheckInProgressBar}
				/>
				<BooleanSettingRow
					falseLabel="Off"
					onChange={onChange}
					property="showEmoji"
					title="❤️ Emojis"
					trueLabel="On"
					value={settings.showEmoji}
				/>
				<BooleanSettingRow
					description="When there are many down hosts or services this will scroll the screen through all the items"
					falseLabel="Off"
					onChange={onChange}
					property="automaticScroll"
					title="Automatic Scroll"
					trueLabel="On"
					value={settings.automaticScroll}
				/>
				{settings.automaticScroll && (
					<>
						<tr>
							<th>Automatic Scroll Time Multiplier:</th>
							<td>
								<input
									aria-label="Automatic Scroll Time Multiplier"
									type="number"
									min="0.1"
									max="10"
									step="0.1"
									value={settings.automaticScrollTimeMultiplier}
									onChange={onChange('automaticScrollTimeMultiplier', 'number')}
								/>
								&nbsp;
								Slow down the scroll routine by multiplying the animation time 2 = 2x, 2.5 = 2.5x, 3 = 3x. Higher number is slower.
							</td>
						</tr>
						<tr>
							<th>Automatic Scroll Wait Time:</th>
							<td>
								<input
									aria-label="Automatic Scroll Wait Time"
									type="number"
									min="0"
									max="20"
									value={settings.automaticScrollWaitSeconds}
									onChange={onChange('automaticScrollWaitSeconds', 'number')}
								/>
								&nbsp;
								Control how long the page waits after it reaches its new location
							</td>
						</tr>
					</>
				)}
			</tbody>
		</table>
	);
};

export default AudioVisualSettings;
