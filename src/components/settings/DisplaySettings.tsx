import { ReactNode } from 'react';
import { ClientSettings } from '../../types/settings';
import { BooleanSettingKey, SettingsChangeHandler } from './settingsTypes';
import { BooleanSettingRow } from './SettingControls';

interface DisplaySettingsProps {
	onChange: SettingsChangeHandler;
	settings: ClientSettings;
}

interface BooleanControl {
	description?: ReactNode;
	falseLabel: string;
	property: BooleanSettingKey;
	title: string;
	trueLabel: string;
}

const booleanControls: BooleanControl[] = [
	{
		property: 'hideSummarySection',
		title: 'Summary',
		trueLabel: 'Hide',
		falseLabel: 'Show',
	},
	{
		property: 'hideMostRecentAlertSection',
		title: 'Most Recent Alert',
		trueLabel: 'Hide',
		falseLabel: 'Show',
	},
	{
		property: 'hostsAndServicesSideBySide',
		title: 'Hosts and Services layout',
		trueLabel: 'Side-by-side (Column)',
		falseLabel: 'Stacked',
		description: 'Side-by-side (Column) layout reverts to stacked on smaller screens',
	},
	{
		property: 'alwaysShowGroupFilters',
		title: 'Service and HostGroup filters',
		trueLabel: 'Show Always',
		falseLabel: 'Show with Filters',
		description: 'Show Always keeps HostGroup and ServiceGroup filters visible. Show with Filters only shows them when filters are toggled on.',
	},
	{
		property: 'hideHostSection',
		title: 'Hosts',
		trueLabel: 'Hide',
		falseLabel: 'Show',
	},
	{
		property: 'hideServiceSection',
		title: 'Services',
		trueLabel: 'Hide',
		falseLabel: 'Show',
	},
	{
		property: 'hideHistory',
		title: 'Alert History',
		trueLabel: 'Hide',
		falseLabel: 'Show',
	},
	{
		property: 'showMiniMap',
		title: 'MiniMap',
		trueLabel: 'Show',
		falseLabel: 'Hide',
		description: 'Show a "MiniMap" on the right side of the screen (Experimental)',
	},
];

const DisplaySettings = ({ onChange, settings }: DisplaySettingsProps) => (
	<table className="SettingsTable">
		<thead>
			<tr>
				<td colSpan={2} className="SettingsTableHeader">Show or Hide sections</td>
			</tr>
		</thead>
		<tbody>
			{booleanControls.map(control => (
				<BooleanSettingRow
					key={control.property}
					{...control}
					value={settings[control.property]}
					onChange={onChange}
				/>
			))}
			<tr>
				<th>MiniMap width:</th>
				<td>
					<input
						aria-label="MiniMap width"
						type="text"
						style={{ maxWidth: 60 }}
						disabled={!settings.showMiniMap}
						value={settings.miniMapWidth}
						onChange={onChange('miniMapWidth', 'number')}
					/>
					px
				</td>
			</tr>
		</tbody>
	</table>
);

export default DisplaySettings;
