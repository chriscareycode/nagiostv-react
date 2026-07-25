import { ChangeEventHandler } from 'react';
import { ClientSettings } from '../../types/settings';

export type SettingInputType = 'boolean' | 'number' | 'string';

export type SettingsChangeHandler = (
	propName: keyof ClientSettings,
	dataType: SettingInputType,
) => ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

interface DataSourceSettingsProps {
	hasConnectionError?: boolean;
	onChange: SettingsChangeHandler;
	settings: ClientSettings;
}

interface PollingFrequencySelectProps {
	label: string;
	onChange: ChangeEventHandler<HTMLSelectElement>;
	value: number;
}

const PollingFrequencySelect = ({ label, onChange, value }: PollingFrequencySelectProps) => (
	<tr>
		<th>{label}:</th>
		<td>
			<select aria-label={label} value={value} onChange={onChange}>
				<option value={15}>15s</option>
				<option value={30}>30s</option>
				<option value={60}>1m</option>
				<option value={300}>5m</option>
				<option value={600}>10m</option>
			</select>
			&nbsp;
			Affects server CPU. Larger interval = less CPU
		</td>
	</tr>
);

const DataSourceSettings = ({
	hasConnectionError = false,
	onChange,
	settings,
}: DataSourceSettingsProps) => (
	<table className="SettingsTable">
		<thead>
			<tr>
				<td colSpan={2} className="SettingsTableHeader">Data Source Settings</td>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th style={{ padding: '0px', height: '3px' }}></th>
				<td style={{ padding: '0px', height: '3px' }}></td>
			</tr>
			<tr>
				<th>
					{hasConnectionError && <span role="img" aria-label="error">⚠️ </span>}
					Fetch data from
				</th>
				<td>
					<select
						aria-label="Fetch data from"
						value={settings.dataSource}
						onChange={onChange('dataSource', 'string')}
					>
						<option value="cgi">Nagios cgi-bin</option>
						<option value="livestatus">MK Livestatus</option>
					</select>
				</td>
			</tr>
			{settings.dataSource === 'livestatus' && (
				<tr>
					<th>
						{hasConnectionError && <span role="img" aria-label="error">⚠️ </span>}
						livestatus.php path:
					</th>
					<td>
						<input
							aria-label="livestatus.php path"
							type="text"
							className={hasConnectionError ? 'input-error' : ''}
							value={settings.livestatusPath}
							onChange={onChange('livestatusPath', 'string')}
						/>
						<div className="Note" style={{ fontSize: '0.8em', marginTop: '10px' }}>
							This path needs to point to where the included livestatus.php file is located. default is <span style={{ color: 'lime' }}> connectors/livestatus.php</span>.
							In the connectors/ folder, copy livestatus-settings.ini.sample to livestatus-settings.ini and configure it.
							Your livestatus-settings.ini will not be overwritten when NagiosTV is updated.
						</div>
					</td>
				</tr>
			)}
			<tr>
				<th>
					{hasConnectionError && <span role="img" aria-label="error">⚠️ </span>}
					Nagios cgi-bin path:
				</th>
				<td>
					<input
						aria-label="Nagios cgi-bin path"
						type="text"
						className={hasConnectionError ? 'input-error' : ''}
						value={settings.baseUrl}
						onChange={onChange('baseUrl', 'string')}
					/>
					<div className="Note" style={{ fontSize: '0.8em', marginTop: '10px' }}>
						This path needs to point to where the cgi files are being served by the Nagios web user interface.<br />
						<br />
						A note on authentication: Nagios cgi files rely on you to be authenticated so they know which user you are accessing Nagios as.
						Nagios uses this to determine which hosts/services and other rights you have.
						If you are hosting NagiosTV in a subdirectory in the Nagios web user interface, as is the suggested installation method, then the default path
						<span style={{ color: 'lime' }}> /nagios/cgi-bin/</span> will work without additional authentication since you will already be logged in.<br />
						<br />
						<div>You can read more about how to bypass auth here at <a target="_blank" rel="noopener noreferrer" href="https://nagiostv.com/bypassing-authentication">https://nagiostv.com/bypassing-authentication</a>.</div>
					</div>
				</td>
			</tr>
			<tr>
				<th>External link cgi-bin path:</th>
				<td>
					<input
						aria-label="External link cgi-bin path"
						type="text"
						value={settings.externalLinkBaseUrl}
						onChange={onChange('externalLinkBaseUrl', 'string')}
					/>
					<div className="Note" style={{ fontSize: '0.8em', marginTop: '10px' }}>
						This path is used for external links to host and service details in the Nagios cgi-bin.<br />
						Default is <span style={{ color: 'lime' }}>/nagios/cgi-bin/</span>
					</div>
				</td>
			</tr>
			<PollingFrequencySelect
				label="Fetch hosts every"
				value={settings.fetchHostFrequency}
				onChange={onChange('fetchHostFrequency', 'number')}
			/>
			<PollingFrequencySelect
				label="Fetch services every"
				value={settings.fetchServiceFrequency}
				onChange={onChange('fetchServiceFrequency', 'number')}
			/>
			<PollingFrequencySelect
				label="Fetch alerts every"
				value={settings.fetchAlertFrequency}
				onChange={onChange('fetchAlertFrequency', 'number')}
			/>
			<tr>
				<th>Check for new version:</th>
				<td>
					<select
						aria-label="Check for new version"
						value={settings.versionCheckDays}
						onChange={onChange('versionCheckDays', 'number')}
					>
						<option value={0}>Never</option>
						<option value={1}>1 day</option>
						<option value={7}>1 week</option>
						<option value={30}>1 month</option>
					</select>
				</td>
			</tr>
		</tbody>
	</table>
);

export default DataSourceSettings;
