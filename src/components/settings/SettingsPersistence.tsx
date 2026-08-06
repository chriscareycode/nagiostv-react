import { useEffect, useState } from 'react';
import * as clipboard from 'clipboard-polyfill/text';
import { fetchAdminCapabilities, postAdminJson } from '../../helpers/adminApi';
import { sanitizePersistedClientSettings } from '../../helpers/persistence';
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
	const [adminToken, setAdminToken] = useState('');
	const [csrfToken, setCsrfToken] = useState('');
	const [serverSaveEnabled, setServerSaveEnabled] = useState(false);
	const [httpsRequired, setHttpsRequired] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showSettingsJson, setShowSettingsJson] = useState(false);

	useEffect(() => {
		const controller = new AbortController();
		fetchAdminCapabilities('save-client-settings.php', controller.signal)
			.then(capabilities => {
				setCsrfToken(capabilities.csrfToken);
				setServerSaveEnabled(capabilities.enabled);
				setHttpsRequired(capabilities.httpsRequired);
			})
			.catch(() => setServerSaveEnabled(false));
		return () => controller.abort();
	}, []);

	const safeSettings = sanitizePersistedClientSettings(settings);
	const copySettingsToClipboard = () => {
		void clipboard.writeText(JSON.stringify(safeSettings, null, 2));
	};

	const saveSettingsToServer = async () => {
		setIsSaving(true);
		try {
			await postAdminJson(
				'save-client-settings.php',
				safeSettings,
				adminToken,
				csrfToken,
			);
			onMessage('Saved to Server', 3000);
		} catch {
			onMessage('Server save failed. Check the administrator token and server configuration.', 5000);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<table className="SettingsTable">
			<thead>
				<tr><td className="SettingsTableHeader">💾 Saving these settings on the server</td></tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<div style={{ margin: '5px' }}>
							<p>Server settings provide shared defaults. Local settings are applied afterward unless server precedence is enabled.</p>
							<label>
								<input
									type="checkbox"
									checked={settings.serverSettingsTakePrecedence}
									onChange={event => onSetValue('serverSettingsTakePrecedence', event.target.checked)}
								/>
								{' '}Server settings take precedence
							</label>

							<h4>Option 1: Secure browser save</h4>
							<div style={{ marginLeft: '30px' }}>
								<p>
									Configure <code>NAGIOSTV_ADMIN_TOKEN</code> on the web server and use HTTPS.
									The token is kept only in memory and LLM API keys are never written to the server settings file.
								</p>
								{httpsRequired && <div className="color-yellow">HTTPS is required before secure server saves can be enabled.</div>}
								{!serverSaveEnabled && !httpsRequired && <div className="color-yellow">Secure server saves are not configured on this server.</div>}
								<input
									aria-label="NagiosTV administrator token"
									type="password"
									value={adminToken}
									onChange={event => setAdminToken(event.target.value)}
									placeholder="Administrator token"
									autoComplete="off"
								/>
								<button
									disabled={isDemoMode || !serverSaveEnabled || !csrfToken || !adminToken || isSaving}
									className="SettingsSaveToServerButton"
									onClick={() => void saveSettingsToServer()}
								>
									{isSaving ? 'Saving...' : 'Save settings to server'}
								</button>
							</div>

							<h4>Option 2: Administrator-managed file</h4>
							<div style={{ marginLeft: '30px' }}>
								<p>Create a read-only <code>client-settings.json</code> manually and paste the safe configuration below.</p>
								<button className="SettingsShowJsonButton" onClick={() => setShowSettingsJson(current => !current)}>
									{showSettingsJson ? 'Hide' : 'Show'} JSON
								</button>
								<button className="SettingsSaveToServerButton" onClick={copySettingsToClipboard}>
									Copy settings to clipboard for manual paste
								</button>
								{showSettingsJson && <div className="raw-json-settings">{JSON.stringify(safeSettings, null, 2)}</div>}
							</div>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	);
};

export default SettingsPersistence;
