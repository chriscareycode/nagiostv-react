import { useState } from 'react';
import axios from 'axios';
import * as clipboard from 'clipboard-polyfill/text';
import { ClientSettings } from '../../types/settings';
import { SettingsValueSetter } from './settingsTypes';

interface SettingsPersistenceProps {
	isDemoMode: boolean;
	onMessage: (message: string, clearAfterMs?: number) => void;
	onSetValue: SettingsValueSetter;
	settings: ClientSettings;
}

const SettingsPersistence = ({
	isDemoMode,
	onMessage,
	onSetValue,
	settings,
}: SettingsPersistenceProps) => {
	const [showSettingsJson, setShowSettingsJson] = useState(false);

	const saveSettingsToServer = async () => {
		try {
			const response = await axios.post(
				'save-client-settings.php',
				JSON.stringify(settings, null, 2),
			);
			onMessage(
				typeof response.data === 'object' ? 'Saved to Server' : String(response.data),
				3000,
			);
		} catch {
			onMessage('Error saving to server', 3000);
		}
	};

	const copySettingsToClipboard = () => {
		void clipboard.writeText(JSON.stringify(settings, null, 2));
	};

	return (
		<table className="SettingsTable">
			<thead>
				<tr>
					<td className="SettingsTableHeader">💾 Saving these settings on the server</td>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<div style={{ margin: '5px' }}>
							<div>
								By default, settings are saved into localStorage in your browser. There is also the option to save these settings on the server
								so they can be shared with all users of NagiosTV as defaults when they load the page.
							</div>
							<br />
							<div>
								Local client settings are applied AFTER loading settings from the server, so you can think of server settings as a way to set defaults
								for all clients, but they can still be customized individually with settings saved in client settings. Delete the client settings and refresh the page to fetch server setting defaults again.
							</div>
							<br />
							<div>
								<label>
									<input
										type="checkbox"
										checked={settings.serverSettingsTakePrecedence}
										onChange={event => onSetValue(
											'serverSettingsTakePrecedence',
											event.target.checked,
										)}
									/>
									{' '}Server settings take precedence (when enabled, local settings will not override server settings)
								</label>
							</div>
							<br />
							<h4>Option 1: If you have PHP enabled on your server</h4>
							<div style={{ marginLeft: '30px' }}>
								You will need to create a file <span style={{ color: 'lime' }}>client-settings.json</span> in
								the nagiostv folder and chown 777 client-settings.json so the Apache web server has rights to write to it.
								<pre>
									sudo touch client-settings.json<br />
									sudo chmod 777 client-settings.json
								</pre>
								After those steps, you can try this button:
								<button
									disabled={isDemoMode}
									className="SettingsSaveToServerButton"
									onClick={saveSettingsToServer}
								>
									Save settings to server
								</button>
								<br />
								<br />
							</div>
							<h4>Option 2: Manually create the settings file and copy and paste the configuration in</h4>
							<div style={{ marginLeft: '30px' }}>
								Manually create the file <span style={{ color: 'lime' }}>client-settings.json</span> in the nagiostv folder and paste in this data:
								<div style={{ marginTop: 10 }}>
									<button
										className="SettingsShowJsonButton"
										onClick={() => setShowSettingsJson(current => !current)}
									>
										{showSettingsJson ? 'Hide' : 'Show'} JSON
									</button>
									<button
										className="SettingsSaveToServerButton"
										onClick={copySettingsToClipboard}
									>
										Copy settings to clipboard for manual paste
									</button>
								</div>
								{showSettingsJson && (
									<div className="raw-json-settings">
										{JSON.stringify(settings, null, 2)}
									</div>
								)}
							</div>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	);
};

export default SettingsPersistence;
