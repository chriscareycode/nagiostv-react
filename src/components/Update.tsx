/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { Link } from 'react-router';
import { useUpdateManager } from '../hooks/useUpdateManager';
import './Update.css';

interface UpdateProps {
	currentVersion: number;
	currentVersionString: string;
}

const Update = ({ currentVersion, currentVersionString }: UpdateProps) => {
	const {
		adminToken,
		bigState,
		capabilities,
		checkForUpdates,
		clearSkipVersion,
		clickedCheckForUpdates,
		clickedSkipVersion,
		githubState,
		installVersion,
		latestVersionState,
		selected,
		selectChanged,
		setAdminToken,
		skipVersion,
		updateState,
	} = useUpdateManager({ currentVersionString });
	const latestVersion = bigState.latestVersion;
	const latestVersionString = bigState.latestVersionString;
	const secureUpdateReady = Boolean(capabilities?.enabled && capabilities.csrfToken && adminToken);

	return (
		<div className="Update">
			<h2>NagiosTV Update Center</h2>

			<div style={{ position: 'absolute', top: 40, right: 30 }}>
				<Link to="/"><button className="border border-[#6fbbf3] rounded py-[2px] px-[6px]">Back to Dashboard</button></Link>
			</div>

			<h3>Updates</h3>
			<div className="update-help-message">
				Secure browser updates require HTTPS and a server-side <code>NAGIOSTV_ADMIN_TOKEN</code>.
				The token stays in memory for this page and is protected by same-origin and CSRF checks.
				You can alternatively download a release from{' '}
				<a
					target="_blank"
					rel="noopener noreferrer"
					href="https://github.com/chriscareycode/nagiostv-react/releases"
				>
					GitHub Releases
				</a>
				{' '}and follow the manual installation instructions.
			</div>

			{clickedCheckForUpdates && latestVersionString && (
				<div className="update-help-message">
					<div>
						Latest version: <span style={{ color: 'lime' }}>v{latestVersionString}</span>{' '}
						<a
							target="_blank"
							rel="noopener noreferrer"
							href={`https://github.com/chriscareycode/nagiostv-react/releases/tag/v${latestVersionString}`}
						>
							See what changed
						</a>
					</div>
					<div>You are running: <span style={{ color: 'lime' }}>v{currentVersionString}</span></div>
					{currentVersion === latestVersion && <div style={{ color: 'lime' }}>You are running the latest version.</div>}
					{currentVersion > latestVersion && <div>You are running a version newer than the latest announced release.</div>}
					<div style={{ marginTop: 20 }}>
						<label>
							Administrator token:{' '}
							<input
								aria-label="NagiosTV administrator token"
								type="password"
								value={adminToken}
								onChange={event => setAdminToken(event.target.value)}
								autoComplete="off"
							/>
						</label>
					</div>
					{capabilities?.httpsRequired && <div className="color-yellow">HTTPS is required for browser updates.</div>}
					{capabilities && !capabilities.enabled && !capabilities.httpsRequired && (
						<div className="color-yellow">Set NAGIOSTV_ADMIN_TOKEN on the web server to enable browser updates.</div>
					)}
					{currentVersion < latestVersion && (
						<button
							disabled={!secureUpdateReady || updateState.loading}
							onClick={() => void installVersion(latestVersionString)}
							className="auto-update-button"
						>
							{updateState.loading ? 'Installing...' : `Install v${latestVersionString}`}
						</button>
					)}

					<h3>Install a different release</h3>
					<select aria-label="NagiosTV release" value={selected} onChange={selectChanged}>
						<option value="">Select a release</option>
						{githubState.result?.map(release => (
							<option key={release.tag_name} value={release.tag_name}>{release.tag_name} {release.name}</option>
						))}
					</select>
					<button
						disabled={!secureUpdateReady || !selected || updateState.loading}
						onClick={() => void installVersion(selected)}
						className="auto-update-button"
					>
						Install selected release
					</button>
					{githubState.error && <div className="color-red">{githubState.errorMessage}</div>}
					{updateState.error && <div className="color-red">{updateState.errorMessage}</div>}
					{updateState.result && <div className="color-green">{updateState.result.message}</div>}
				</div>
			)}

			<h3>Check for Updates</h3>
			<div className="update-help-message">
				<button className="border border-[#6fbbf3] rounded py-[2px] px-[6px] text-[#6fbbf3]" onClick={checkForUpdates}>Check for Updates</button>
				{latestVersionState.loading && <span style={{ color: 'lime' }}> Loading...</span>}
				{latestVersionState.error && <span style={{ color: 'red' }}> Error loading latest version. Try again.</span>}
			</div>

			<h3>Skip this version</h3>
			<div style={{ marginTop: 10 }} className="update-help-message">
				{bigState.latestVersionString && (
					<button
						className="border border-[#6fbbf3] rounded py-[2px] px-[6px] text-[#6fbbf3]"
						disabled={skipVersion.version === bigState.latestVersion}
						onClick={clickedSkipVersion}
					>
						Skip version {bigState.latestVersionString}
					</button>
				)}
				{!skipVersion.version_string && bigState.latestVersionString === '' && (
					<div>Check for updates first to choose a version to skip.</div>
				)}
				{skipVersion.version_string && (
					<div style={{ color: 'yellow' }}>
						Version {skipVersion.version_string} is skipped.{' '}
						<button onClick={clearSkipVersion}>Cancel skip</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Update;
