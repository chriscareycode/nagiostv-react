/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2024 Chris Carey https://chriscarey.com
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

import { memo, useEffect, useState } from 'react';

// State Management
import { useAtom } from 'jotai';
import { skipVersionAtom } from '../../atoms/skipVersionAtom';

// React Router
import {
	NavLink,
	useNavigate,
} from "react-router-dom";
import './BottomPanel.css';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faTools, faUpload, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { ClientSettings } from '../../types/settings';

interface BottomPanelProps {
	settingsObject: ClientSettings;
	latestVersion: number;
	latestVersionString: string;
	currentVersion: number;
	currentVersionString: string;
}

const BottomPanel = ({
	settingsObject,
	latestVersion,
	latestVersionString,
	currentVersion,
	currentVersionString,
}: BottomPanelProps) => {

	const [isVisible, setIsVisible] = useState(false);

	const [skipVersion, setSkipVersion] = useAtom(skipVersionAtom);

	const navigate = useNavigate();

	const navigateTo = (e: React.MouseEvent<HTMLElement>, pathname: string) => {
		e.preventDefault();

		// React Router 6 navigate
		navigate(pathname);

		// Close menu
		setTimeout(() => {
			setIsVisible(false);
		}, 800);
	};

	const clickedDashboard = (e: React.MouseEvent<HTMLElement>) => {
		navigateTo(e, '/');
	};

	const clickedSettings = (e: React.MouseEvent<HTMLElement>) => {
		navigateTo(e, '/settings');
	};

	const clickedUpdate = (e: React.MouseEvent<HTMLElement>) => {
		navigateTo(e, '/update');
	};

	const clickedInfo = (e: React.MouseEvent<HTMLElement>) => {
		navigateTo(e, '/help');
	};

	const clickedNagiosTv = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent it from triggering standard menu click
		setIsVisible(visible => !visible);
	};

	const clickedUpdateAvailable = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent it from triggering standard menu click
		clickedUpdate(e);
	};

	const loadSkipVersion = () => {
		const skipVersionString = localStorage.getItem('skipVersion');
		if (skipVersionString) {
			try {
				const skipVersionObj = JSON.parse(skipVersionString);
				if (skipVersionObj) {
					//console.log('Loaded skipVersion', skipVersionObj);
					setSkipVersion({
						version: skipVersionObj.version,
						version_string: skipVersionObj.version_string,
					});
				}
			} catch (e) {
				console.log('Could not parse the skipVersion');
			}
		}
	};

	const clickedSkipVersion = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent it from triggering standard menu click
		const skipVersionObj = {
			version: latestVersion,
			version_string: latestVersionString
		};
		localStorage.setItem('skipVersion', JSON.stringify(skipVersionObj));
		setSkipVersion({
			version: latestVersion,
			version_string: latestVersionString,
		});
	};

	useEffect(() => {
		loadSkipVersion();
	}, []);

	const isUpdateAvailable = latestVersion > currentVersion;

	//console.log('BottomPanel render() ' + new Date());

	return (
		<>
			<div className="BottomPanel">

				{settingsObject.hideBottomMenu && <div className="bottom-panel-nagiostv-brand">NagiosTV</div>}

				{settingsObject.hideBottomMenu === false && <div className="bottom-panel-area">
					<div className="bottom-panel-area-text">
						{/* current version */}
						<span
							className="current-version"
							onClick={clickedNagiosTv}
						>NagiosTV <span className="">v{currentVersionString}</span></span>

						{/* update available */}
						{(isUpdateAvailable && skipVersion.version !== latestVersion) && (
							<span>
								<span className="update-available">
									<a onClick={clickedUpdateAvailable}>v{latestVersionString} available</a>
									&nbsp;-&nbsp;
									<a onClick={clickedSkipVersion}>skip this version</a>
								</span>
							</span>
						)}
					</div>
				</div>}

				<div className={isVisible ? 'bottom-panel-nav-area bottom-panel-nav-area-visible' : 'bottom-panel-nav-area'}>

					<div className="nav-sidebar-icon">
						<span>
							<NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/" onClick={clickedDashboard}>
								<FontAwesomeIcon
									className="nav-sidebar-icon-icon"
									icon={faTachometerAlt}
								/>
								<div className="nav-sidebar-icon-text">Dash</div>
							</NavLink>
						</span>
					</div>

					<div className="nav-sidebar-icon" >
						<span>
							<NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/settings" onClick={clickedSettings}>
								<FontAwesomeIcon
									className="nav-sidebar-icon-icon"
									icon={faTools}
								/>
								<div className="nav-sidebar-icon-text">Settings</div>
							</NavLink>
						</span>
					</div>

					<div className="nav-sidebar-icon">
						<span>
							<NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/update" onClick={clickedUpdate}>
								<FontAwesomeIcon
									className="nav-sidebar-icon-icon"
									icon={faUpload}
								/>
								<div className="nav-sidebar-icon-text">Update</div>
							</NavLink>
						</span>
					</div>

					<div className="nav-sidebar-icon">
						<span>
							<NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/help" onClick={clickedInfo}>
								<FontAwesomeIcon
									className="nav-sidebar-icon-icon"
									icon={faQuestionCircle}
								/>
								<div className="nav-sidebar-icon-text">Info</div>
							</NavLink>
						</span>
					</div>

						{/*
          <div className="nav-sidebar-icon-spacer"></div>
              
          <div className="nav-sidebar-icon">
            <span className={this.props.hideHistoryChart ? '' : 'is-active'}>
              <FontAwesomeIcon onClick={this.clickedCharts} icon={faChartBar} />
              <div className="nav-sidebar-icon-text">Charts</div>
            </span>
          </div>

          <div className="nav-sidebar-icon">
            <span className={this.props.hideFilters ? '' : 'is-active'}>
              <FontAwesomeIcon onClick={this.clickedFilter} icon={faFilter} />
              <div className="nav-sidebar-icon-text">Filter</div>
            </span>
          </div>
          */}



				</div>

			</div>
		</>
	);

}

function arePropsEqual() {
	return true; // props equal = no update
}

export default memo(BottomPanel, arePropsEqual);
