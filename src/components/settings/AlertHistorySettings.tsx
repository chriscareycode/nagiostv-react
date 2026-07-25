import { ClientSettings } from '../../types/settings';
import { BooleanSettingRow } from './SettingControls';
import { SettingsChangeHandler } from './settingsTypes';

interface AlertHistorySettingsProps {
	onChange: SettingsChangeHandler;
	settings: ClientSettings;
}

const AlertHistorySettings = ({ onChange, settings }: AlertHistorySettingsProps) => (
	<table className="SettingsTable">
		<thead>
			<tr>
				<td colSpan={2} className="SettingsTableHeader">Alert History Settings</td>
			</tr>
		</thead>
		<tbody>
			<BooleanSettingRow
				falseLabel="Show"
				onChange={onChange}
				property="hideHistory24hChart"
				title="Alert History (24h) Chart"
				trueLabel="Hide"
				value={settings.hideHistory24hChart}
			/>
			<BooleanSettingRow
				falseLabel="Show"
				onChange={onChange}
				property="hideHistoryChart"
				title={`Alert History (${settings.alertDaysBack}d) Chart`}
				trueLabel="Hide"
				value={settings.hideHistoryChart}
			/>
			<BooleanSettingRow
				falseLabel="Show"
				onChange={onChange}
				property="hideHistoryTitle"
				title="Alert History Titles"
				trueLabel="Hide"
				value={settings.hideHistoryTitle}
			/>
			<tr>
				<th>Alert History Days Back:</th>
				<td>
					<input
						aria-label="Alert History Days Back"
						type="number"
						min="1"
						max="100"
						value={settings.alertDaysBack}
						onChange={onChange('alertDaysBack', 'number')}
					/>
					&nbsp;
					Affects server CPU. Lower number of days = less CPU
				</td>
			</tr>
			<tr>
				<th>Alert History max # items:</th>
				<td>
					<input
						aria-label="Alert History max items"
						type="number"
						min="1"
						max="10000"
						value={settings.alertMaxItems}
						onChange={onChange('alertMaxItems', 'number')}
					/>
					&nbsp;
					This will trim the results (in the browser) to limit how many can be shown. Does not affect the server.
				</td>
			</tr>
		</tbody>
	</table>
);

export default AlertHistorySettings;
