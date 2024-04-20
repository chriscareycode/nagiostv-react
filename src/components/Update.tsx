/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2023 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useState } from 'react';
// State Management
import { useAtom, useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import { skipVersionAtom } from '../atoms/skipVersionAtom';
// React Router
import { Link } from "react-router-dom";
import Cookie from 'js-cookie';
import './Update.css';
import $ from 'jquery';
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface GithubState {
	loading: boolean;
	error: boolean;
	errorMessage: string;
	result: any;
}

interface TestPhpState {
	loading: boolean;
	error: boolean;
	errorMessage: string;
	result: {
		whoami: string | null;
		script: string | null;
	}
}

const Update = ({
	currentVersion,
	currentVersionString,
}) => {

	const [bigState, setBigState] = useAtom(bigStateAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);
	const [clickedCheckForUpdates, setClickedCheckForUpdates] = useState(false);
	const [skipVersionCookie, setSkipVersionCookie] = useAtom(skipVersionAtom);
	const [testPhpState, setTestPhpState] = useState<TestPhpState>({
		loading: false,
		error: false,
		errorMessage: '',
		result: {
			whoami: null,
			script: null,
		}
	});
	const [latestVersionState, setLatestVersionState] = useState({
		loading: false,
		error: false,
		errorMessage: '',
		result: {}
	});
	const [githubState, setGithubState] = useState<GithubState>({
		loading: false,
		error: false,
		errorMessage: '',
		result: []
	});
	const [updateState, setUpdateState] = useState({
		loading: false,
		error: false,
		errorMessage: '',
		result: ''
	});
	const [downgradeState, setDowngradeState] = useState({
		loading: false,
		error: false,
		errorMessage: '',
		result: ''
	});
	const [selected, setSelected] = useState('');

	const checkForUpdates = () => {
		testPhp();
		fetchLatestVersion();
		fetchReleasesFromGithub();

		setClickedCheckForUpdates(true);
	};

	const testPhp = () => {
		//console.log('testPhp');

		setTestPhpState(curr => ({
			...curr,
			loading: true,
		}));

		const url = 'auto-version-switch.php?testphp=true';

		$.ajax({
			method: "GET",
			url,
			dataType: "json",
			timeout: 10 * 1000
		}).done((myJson, textStatus, jqXHR) => {
			// Got data
			//console.log('testPhp result', myJson);
			setTestPhpState({
				loading: false,
				error: false,
				errorMessage: '',
				result: myJson
			});

		}).catch((err) => {
			// Error
			setTestPhpState({
				loading: false,
				error: true,
				errorMessage: 'Error testing PHP',
				result: {
					whoami: null,
					script: null,
				}
			});
		});
	};

	const fetchLatestVersion = () => {
		//console.log('latestVersion');

		setLatestVersionState(curr => ({
			...curr,
			loading: true,
		}));

		const url = 'https://nagiostv.com/version/nagiostv-react/?version=' + currentVersionString;

		$.ajax({
			method: "GET",
			url,
			dataType: "json",
			timeout: 10 * 1000
		}).done((myJson, textStatus, jqXHR) => {
			// Got data
			//console.log('latestVersion result', myJson);
			// set version into local state
			setLatestVersionState({
				loading: false,
				error: false,
				errorMessage: '',
				result: myJson
			});
			// set version into bigState
			setBigState(curr => ({
				...curr,
				latestVersion: myJson.version,
				latestVersionString: myJson.version_string,
				lastVersionCheckTime: new Date().getTime(),
			}));

		}).catch((err) => {
			// Error
			setLatestVersionState({
				loading: false,
				error: true,
				errorMessage: 'Error getting latest version from server',
				result: {}
			});
		});
	};

	const fetchReleasesFromGithub = () => {
		//console.log('fetchReleasesFromGithub');

		setGithubState(curr => ({
			...curr,
			loading: true,
		}));

		const url = 'https://api.github.com/repos/chriscareycode/nagiostv-react/releases';
		$.ajax({
			method: "GET",
			url,
			dataType: "json",
			timeout: 10 * 1000
		}).done((myJson, textStatus, jqXHR) => {
			// Got data from Github
			setGithubState({
				loading: false,
				error: false,
				errorMessage: '',
				result: myJson
			});
		}).catch((err) => {
			// Error
			setGithubState({
				loading: false,
				error: true,
				errorMessage: 'Error fetching from github',
				result: {}
			});
		});
	};

	const selectChanged = (e) => {
		//console.log(e.target.value);
		setSelected(e.target.value);
	};

	const beginUpdate = () => {
		//console.log('beginUpdate');

		const latestVersionString = bigState.latestVersionString;

		setUpdateState(curr => ({
			...curr,
			loading: true,
		}));

		const url = `auto-version-switch.php?version=v${latestVersionString}`;
		$.ajax({
			method: "GET",
			url,
			dataType: "html",
			timeout: 30 * 1000
		}).done((result, textStatus, jqXHR) => {
			// Got data from update php script
			setUpdateState({
				loading: false,
				error: false,
				errorMessage: '',
				result: result
			});
		}).catch((err) => {
			// Error
			setUpdateState({
				loading: false,
				error: true,
				errorMessage: 'Error calling auto-version-switch.php',
				result: ''
			});
		});

	};

	const beginDowngrade = () => {
		//console.log('beginDowngrade');

		setDowngradeState(curr => ({
			...curr,
			loading: true,
		}));

		const url = `auto-version-switch.php?version=${selected}`;
		$.ajax({
			method: "GET",
			url,
			dataType: "html",
			timeout: 30 * 1000
		}).done((result, textStatus, jqXHR) => {
			// Success
			setDowngradeState({
				loading: false,
				error: false,
				errorMessage: '',
				result: result
			});
		}).catch((err) => {
			// Error
			setDowngradeState({
				loading: false,
				error: true,
				errorMessage: 'Error calling auto-version-switch.php',
				result: ''
			});
		});

	};

	const clickedSkipVersion = () => {
		const latestVersion = bigState.latestVersion;
		const latestVersionString = bigState.latestVersionString;
		const skipVersionObj = {
			version: latestVersion,
			version_string: latestVersionString
		};
		Cookie.set('skipVersion', JSON.stringify(skipVersionObj));
		setSkipVersionCookie({
			version: latestVersion,
			version_string: latestVersionString,
		});
	};

	const clearSkipVersionCookie = () => {
		Cookie.remove('skipVersion');
		setSkipVersionCookie({
			version: 0,
			version_string: '',
		});
	};

	/**
	 * React Hooks
	 */

	useEffect(() => {
		// If the user does not have Check Updates disabled, then fetch now
		if (clientSettings && clientSettings.versionCheckDays !== 0) {
			checkForUpdates();
		}
	}, ['clientSettings.versionCheckDays']);

	/**
	 * Start Render
	 */

	const options = githubState.result.map((r, i) => {
		return <option key={i} value={r.tag_name}>{r.tag_name} {r.name}</option>
	});

	const latestVersion = bigState.latestVersion;
	const latestVersionString = bigState.latestVersionString;

	return (
		<div className="Update">
			<h2>NagiosTV Update Center</h2>

			<div style={{ position: 'absolute', top: 20, right: 20 }}>
				<Link to="/"><button>Back to Dashboard</button></Link>
			</div>

			<div className="update-help-message">
				There are a number of ways to update NagiosTV.<br />
				<span style={{ color: '#6fbbf3' }}>You only need to pick one of these:</span>
				<ul>
					<li>One-click update to latest</li>
					<ul>
						<li>You can use the one-click update routines inside the app here to update to the latest version. This is a button within NagiosTV UI that will trigger a PHP script to download, extract, and overwrite the old version.</li>
					</ul>
					<li>Rollback to an older version</li>
					<ul>
						<li>You can switch to a previous version if you are having problems with a newer version.  This is a button within NagiosTV UI that will trigger a PHP script to download, extract, and overwrite the old version.</li>
					</ul>
					<li>Command-line (CLI)</li>
					<ul>
						<li>You can run the autoupdate.sh file in the NagiosTV directory to upgrade or downgrade versions.</li>
					</ul>
					<li>Manual Update</li>
					<ul>
						<li>You can go through the process manually by downloading the archive from GitHub and extacting it over top the old version.</li>
					</ul>
				</ul>
				Your custom settings in <strong>client-settings.json</strong> and/or cookie files will not be overwritten
			</div>

			{/* Manual Update */}
			<h3>Manual Update</h3>

			<div className="update-help-message">Go to <a target="_blank" rel="noopener noreferrer" href="https://github.com/chriscareycode/nagiostv-react/">GitHub</a> for manual install instructions</div>

			{(clickedCheckForUpdates && latestVersionString) && <div>

				{/* Automatic Update */}
				<h3>One-click update to latest</h3>

				<div className="update-help-message">

					{/* latest version */}
					<div style={{ marginTop: '0px' }}>
						Latest version is:
						{latestVersionState.loading && <span style={{ color: 'lime' }}> Loading...</span>}
						{latestVersionState.error && <span style={{ color: 'red' }}> Error loading latest version. Try again.</span>}
						{latestVersionString && <span>
							<span style={{ color: 'lime' }}> v{latestVersionString}</span>
							&nbsp;
							<a target="_blank" rel="noopener noreferrer" href={`https://github.com/chriscareycode/nagiostv-react/releases/tag/v${latestVersionString}`}>See what's new in this version at GitHub</a>
						</span>}
					</div>

					{/* you are running version 0.0.0 */}
					<div>
						You are running: <span style={{ color: 'lime' }}>v{currentVersionString}</span>
					</div>

					{/* you are running latest version */}
					{currentVersion === latestVersion && <div style={{ color: 'lime' }}>You are running the latest version.</div>}

					{/* you are running a newer version */}
					{currentVersion > latestVersion && (
						<div className="update-server-setup-instructions">
							You are running a version newer than the latest announced release.<br />
							This is fine, and usually means we are testing out the version with a few users before announcing the new version (which notifies all users of the update).
							That being said, if you are seeing this and you notice any problems in this version, let me know in the GitHub issues! If you did notice issues which are preventing your dashboard from working, use the rollback feature to install a previous release.
						</div>
					)}

					{/* php test */}
					{testPhpState.loading && <div>Testing your server compatibility...</div>}
					{testPhpState.error && <div className="auto-update-error" style={{ marginTop: '20px' }}>
						<FontAwesomeIcon icon={faExclamationTriangle} /> Error testing PHP. One-click update disabled.  Use the manual update
						{currentVersion < latestVersion && <span>
							, or the cli <span className="auto-update-chown-command">sh autoupdate.sh {latestVersionString}</span>
						</span>}
					</div>}

					{/* test if we have write access to the folder and all the files that we need */}

					{/* update button */}
					{(!testPhpState.error && currentVersion < latestVersion) && <div style={{ marginTop: '20px' }}>
						<button disabled={updateState.loading} onClick={beginUpdate} className="auto-update-button">Begin update to latest version v{latestVersionString}</button>
					</div>}


					{/* update error */}
					{updateState.error && <div>
						<div>Update Error:</div>
						{updateState.errorMessage}
					</div>}

					{/* update is working/loading */}
					{updateState.loading && <div style={{ marginTop: '20px' }}>
						<div>Update is working - Please Wait...</div>
					</div>}

					{/* update result */}
					{updateState.result && <div style={{ marginTop: '20px' }}>
						<div>Update Result:</div>
						<textarea readOnly value={updateState.result}></textarea>
					</div>}

				</div>

				<h3>Rollback to an older version</h3>

				<div className="update-help-message">
					<div>
						You can roll back to an earlier version if you are having trouble with the latest version
					</div>

					{testPhpState.error && <div className="auto-update-error" style={{ marginTop: '20px' }}>
						<FontAwesomeIcon icon={faExclamationTriangle} /> Error testing PHP. Rollback feature is disabled. Use the manual update
						{currentVersion < latestVersion && <span>
							, or the cli <span className="auto-update-chown-command">sh autoupdate.sh {latestVersionString}</span>
						</span>}
					</div>}

					{!testPhpState.error && <div style={{ marginTop: '20px' }}>

						{githubState.error && <div>
							<div>Github Error:</div>
							{githubState.errorMessage}
						</div>}

						<div style={{ marginTop: '20px' }}>
							Select a version from Github:&nbsp;
							<select onChange={selectChanged}>
								<option></option>
								{options}
							</select>
							{githubState.loading && <span> Loading...</span>}
						</div>

						{selected && <div style={{ marginTop: '20px' }}>
							{/*<div>Selected version: {this.state.selected}</div>*/}
							<button disabled={downgradeState.loading} onClick={beginDowngrade} className="auto-update-button">Begin version change to {selected}</button>
						</div>}

						{downgradeState.error && <div>
							<div>Switch version Error:</div>
							{downgradeState.errorMessage}
						</div>}

						{/* update is working/loading */}
						{downgradeState.loading && <div style={{ marginTop: '20px' }}>
							<div>Switch version is working - Please Wait...</div>
						</div>}

						{downgradeState.result && <div style={{ marginTop: '20px' }}>
							<div>Switch version result:</div>
							<textarea readOnly value={downgradeState.result}></textarea>
						</div>}

					</div>}
				</div>


				{/* upgrade prep instructions */}
				{testPhpState.result.whoami && <div className="update-server-setup-instructions">
					One-click update or version switch requires that the nagiostv folder and all the files within it are owned by the Apache user.<br />
					Run the following command on the server to change ownership to the Apache user so the update routines can work:<br />
					<div className="auto-update-chown-command">sudo chown -R {testPhpState.result.whoami}:{testPhpState.result.whoami} {testPhpState.result.script}</div>
				</div>}

				{/* downgrading warnings */}
				{/*<div>
          <br />
          <br />
          * If you downgrade to a version before v0.6.0, this auto update page will not exist on that old version.<br />
          So, how do you get back up to a newer version? You can load this URL manually to switch again (take note of the URL or you can find it on the README at Github).
          <div className="auto-update-chown-command">{document.location.href}auto-version-switch.php?version=v{this.state.latestVersion.version_string}</div>
        </div>*/}
			</div>}

			{/* Check for Updates button */}
			<h3>Check for Updates</h3>
			<div className="update-help-message">
				<button onClick={checkForUpdates}>Check for Updates</button>

				{/* Check for updates loading */}
				{latestVersionState.loading && <span>
					<span style={{ color: 'lime' }}> Loading...</span>
				</span>}

				{/* Check for updates error */}
				{latestVersionState.error && <span>
					<span style={{ color: 'red' }}> Error loading latest version. Try again.</span>
				</span>}
			</div>

			{/* skip this version */}
			<div>
				<h3>Skip this version</h3>
				<div style={{ marginTop: 10 }} className="update-help-message">

					{bigState.latestVersionString && <div>
						<button disabled={skipVersionCookie.version === bigState.latestVersion} onClick={clickedSkipVersion}>Skip version {bigState.latestVersionString} - Stop notifying me about it</button>
					</div>}

					{!skipVersionCookie.version_string && bigState.latestVersionString === '' && <div>
						Need to "Check for Updates" first to know which version to skip
					</div>}

					{skipVersionCookie.version_string && <div style={{ color: 'yellow' }}>
						You have chosen to skip version {skipVersionCookie.version_string}. This will hide the update message until the next version is released.
						&nbsp;
						<button onClick={clearSkipVersionCookie}>Cancel skip version for {skipVersionCookie.version_string}</button>
					</div>}

				</div>

			</div>

			<br />
			<br />
			<br />
			<br />
			<br />

		</div>
	);

};

export default Update;
