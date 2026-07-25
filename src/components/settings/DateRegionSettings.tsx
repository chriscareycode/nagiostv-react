import { ClientSettings } from '../../types/settings';
import { listLocales } from '../../helpers/dates';
import { languages } from '../../helpers/language';
import { SettingsChangeHandler, SettingsValueSetter } from './settingsTypes';

type FormatSettingKey = 'clockDateFormat' | 'clockTimeFormat' | 'dateFormat';

interface DateRegionSettingsProps {
	onChange: SettingsChangeHandler;
	onSetValue: SettingsValueSetter;
	settings: ClientSettings;
}

interface FormatSettingProps {
	defaultValue: string;
	legacyValue: string;
	migrationMessage: string;
	onChange: SettingsChangeHandler;
	onSetValue: SettingsValueSetter;
	property: FormatSettingKey;
	showDocumentation?: boolean;
	title: string;
	value: string;
}

const FormatSetting = ({
	defaultValue,
	legacyValue,
	migrationMessage,
	onChange,
	onSetValue,
	property,
	showDocumentation = false,
	title,
	value,
}: FormatSettingProps) => {
	const usesLegacyFormat = value === legacyValue;

	return (
		<tr>
			<th>{title}:</th>
			<td>
				<input
					aria-label={title}
					type="text"
					value={value}
					onChange={onChange(property, 'string')}
					style={{
						width: '200px',
						border: usesLegacyFormat ? '2px solid red' : '0px solid transparent',
					}}
				/>
				{' '}
				<button onClick={() => onSetValue(property, defaultValue)}>
					Set {title} to default
				</button>
				{usesLegacyFormat && <div style={{ color: 'red' }}>{migrationMessage}</div>}
				{showDocumentation && (
					<div>
						Format options are on this page:{' '}
						<a
							style={{ color: 'white' }}
							target="_blank"
							rel="noopener noreferrer"
							href="https://github.com/moment/luxon/blob/master/docs/formatting.md#table-of-tokens"
						>
							https://github.com/moment/luxon/blob/master/docs/formatting.md#table-of-tokens
						</a>
						{' '}under "Table of tokens".
					</div>
				)}
			</td>
		</tr>
	);
};

const DateRegionSettings = ({
	onChange,
	onSetValue,
	settings,
}: DateRegionSettingsProps) => (
	<table className="SettingsTable">
		<thead>
			<tr>
				<td colSpan={2} className="SettingsTableHeader">Date and Region Settings</td>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th>Language:</th>
				<td>
					<select
						aria-label="Language"
						value={settings.language}
						onChange={onChange('language', 'string')}
					>
						{languages.map(language => (
							<option key={language.code} value={language.name}>
								{language.name} ({language.code})
							</option>
						))}
					</select>
				</td>
			</tr>
			<tr>
				<th>Date Locale:</th>
				<td>
					<select
						aria-label="Date Locale"
						value={settings.locale}
						onChange={onChange('locale', 'string')}
					>
						{listLocales().map(locale => (
							<option key={locale} value={locale}>{locale}</option>
						))}
					</select>
				</td>
			</tr>
			<FormatSetting
				defaultValue="fff"
				legacyValue="llll"
				migrationMessage={`We migrated from using the "moment" date library to "luxon". If you used the default value 'llll' before when we were using "moment" library, we suggest 'fff' now.`}
				onChange={onChange}
				onSetValue={onSetValue}
				property="dateFormat"
				showDocumentation
				title="Date Format"
				value={settings.dateFormat}
			/>
			<FormatSetting
				defaultValue="DD"
				legacyValue="ll"
				migrationMessage={`We migrated from using the "moment" date library to "luxon". If you used the default value 'll' before when we were using "moment" library, we suggest 'DD' now.`}
				onChange={onChange}
				onSetValue={onSetValue}
				property="clockDateFormat"
				title="Clock Date Format"
				value={settings.clockDateFormat}
			/>
			<FormatSetting
				defaultValue="ttt"
				legacyValue="LTS"
				migrationMessage={`We migrated from using the "moment" date library to "luxon". If you used the default value 'LTS' before when we were using "moment" library, we suggest 'ttt' for 12 hour or 'TTT' for 24 hour.`}
				onChange={onChange}
				onSetValue={onSetValue}
				property="clockTimeFormat"
				title="Clock Time Format"
				value={settings.clockTimeFormat}
			/>
		</tbody>
	</table>
);

export default DateRegionSettings;
