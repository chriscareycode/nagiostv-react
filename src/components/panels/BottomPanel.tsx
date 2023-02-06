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

import React, { useEffect, useState } from 'react';

// Recoil
import { useRecoilState } from 'recoil';
import { skipVersionAtom } from '../../atoms/skipVersionAtom';

// React Router
import {
	HashRouter as Router,
	NavLink,
	withRouter
} from "react-router-dom";
import Cookie from 'js-cookie';
import './BottomPanel.css';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faTools, faUpload, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

const BottomPanel = ({
	history,
	settingsObject,
	latestVersion,
	latestVersionString,
	currentVersion,
	currentVersionString,
}) => {

	const [isVisible, setIsVisible] = useState(false);

	const [skipVersionCookie, setSkipVersionCookie] = useRecoilState(skipVersionAtom);

	const navigateTo = (e, pathname) => {
		e.preventDefault();

		history.push({
			pathname,
			//state: param
		});

		// Close menu
		setTimeout(() => {
			setIsVisible(visible => !visible);
		}, 800);
	};

	const clickedDashboard = (e) => {
		navigateTo(e, '/');
	};

	const clickedSettings = (e) => {
		navigateTo(e, '/settings');
	};

	const clickedUpdate = (e) => {
		navigateTo(e, '/update');
	};

	const clickedInfo = (e) => {
		navigateTo(e, '/help');
	};

	const clickedNagiosTv = (e) => {
		e.preventDefault();
		setIsVisible(visible => !visible);
	};

	const clickedUpdateAvailable = (e) => {
		e.preventDefault();
		clickedUpdate(e);
	};

	const loadSkipVersionCookie = () => {
		const cookieString = Cookie.get('skipVersion');
		if (cookieString) {
			try {
				const skipVersionObj = JSON.parse(cookieString);
				if (skipVersionObj) {
					//console.log('Loaded skipVersion cookie', skipVersionObj);
					setSkipVersionCookie({
						version: skipVersionObj.version,
						version_string: skipVersionObj.version_string,
					});
				}
			} catch (e) {
				console.log('Could not parse the skipVersion cookie');
			}
		}
	};

	const clickedSkipVersion = (e) => {
		e.preventDefault();
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

	useEffect(() => {
		loadSkipVersionCookie();
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
						{(isUpdateAvailable && skipVersionCookie.version !== latestVersion) && (
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

					<Router>
						<div className="nav-sidebar-icon">
							<span>
								<NavLink exact={true} activeClassName='is-active' to="/" onClick={clickedDashboard}>
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
								<NavLink activeClassName='is-active' to="/settings" onClick={clickedSettings}>
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
								<NavLink activeClassName='is-active' className={isUpdateAvailable ? 'update-available-button' : ''} to="/update" onClick={clickedUpdate}>
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
								<NavLink activeClassName='is-active' to="/help" onClick={clickedInfo}>
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

					</Router>

				</div>

			</div>
		</>
	);

}

function memoFn(prev, next) {
	//console.log('memoFn', prev, next);
	return false; // update
}

export default withRouter(React.memo(BottomPanel, memoFn));
