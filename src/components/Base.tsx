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

/**
 * TODO: 
 * Handle offline - don't send ajax requests when no connection
 * 
 * net::ERR_INTERNET_DISCONNECTED
 * net::ERR_ADDRESS_UNREACHABLE
 * net::ERR_NETWORK_CHANGED
 * 
 */

// State Management
import { useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
// React Router
import {
	HashRouter as Router,
	Switch,
	Route,
} from "react-router-dom";
// Import Various
import SettingsLoad from './SettingsLoad';
import Dashboard from './Dashboard';
import Update from './Update';
import Help from './Help';
import Settings from './Settings';
import TopPanel from './panels/TopPanel';
import LeftPanel from './panels/LeftPanel';
import BottomPanel from './panels/BottomPanel';
import ScrollToTop from './widgets/ScrollToTop';
import ScrollToSection from './widgets/ScrollToSection';
// 3rd party

import { PageTransition } from "@steveeeie/react-page-transition";

// Import Polyfills
import 'url-search-params-polyfill';

// Import css
import './Base.css';
import './animation.css';

import MiniMapWrap from './widgets/MiniMapWrap';
import SettingsFakeData from './SettingsFakeData';
import { BigState, ClientSettings } from 'types/settings';

const Base = () => {

	//lets move as much state as possible up and out of this component
	const bigState = useAtomValue<BigState>(bigStateAtom);
	const clientSettings = useAtomValue<ClientSettings>(clientSettingsAtom);

	const {
		isDoneLoading,
		isLeftPanelOpen,
	} = bigState;

	const {
		automaticScroll,
		automaticScrollTimeMultiplier,
		showMiniMap,
	} = clientSettings;

	/****************************************************************************
	 * JSX
	 ***************************************************************************/
	//console.log('Base render()');

	// const {
	//   preset,
	//   enterAnimation,
	//   exitAnimation
	// } = useContext(AppContext);

	//console.log('Base preset', preset);

	const mainContent = (
		<>
			{/* wrapper around the main content */}
			<div className={`main-content ${showMiniMap ? ' right-panel-open' : ''}`}>

				{!isDoneLoading && (
					<div className="settings-not-loaded">
						Settings are not loaded yet.<br />
						Try refreshing the page.
					</div>
				)}

				<Route
					render={({ location }) => {
						let animation = 'moveToBottomScaleUp';
						const enterAnimation = '';
						const exitAnimation = '';

						return (
							<PageTransition
								preset={animation}
								transitionKey={location.pathname}
								enterAnimation={enterAnimation}
								exitAnimation={exitAnimation}
							>
								<Switch location={location}>

									<Route path="/settings">
										<div className="vertical-scroll">
											<Settings />
										</div>
									</Route>

									<Route path="/update">
										<div className="vertical-scroll">
											<Update
												//updateRootState={this.updateRootState}
												currentVersion={bigState.currentVersion}
												currentVersionString={bigState.currentVersionString}
											/>
										</div>
									</Route>

									<Route path="/help">
										<div className="vertical-scroll">
											<Help />
										</div>
									</Route>

									<Route exact path="/">
										<div className="vertical-scroll vertical-scroll-dash">

											{/* The main NagiosTV Dashboard */}
											<Dashboard />

											{/* This ScrollToTop really needs a debounce. Discovered it fires every pixel which creates a ton of work when using automatic scroll feature */}
											{automaticScroll === false && <ScrollToTop />}

											{(isDoneLoading && automaticScroll) && (
												<ScrollToSection
													clientSettings={clientSettings}
												/>
											)}
										</div>
									</Route>

								</Switch>
							</PageTransition>
						);
					}}
				/>

			</div> {/* endwrapper around the main content */}
		</>
	);

	return (
		<div id="Base" data-testid="Base" className="Base">

			<SettingsLoad />
			<SettingsFakeData />

			<Router>

				<TopPanel />

				<LeftPanel
					isLeftPanelOpen={bigState.isLeftPanelOpen}
				/>

				<BottomPanel
					settingsObject={clientSettings}
					currentVersion={bigState.currentVersion}
					currentVersionString={bigState.currentVersionString}
					latestVersion={bigState.latestVersion}
					latestVersionString={bigState.latestVersionString}
				/>

				{/*  Spacer to counteract the floating TopPanel header */}
				<div className="top-panel-height" />

				{/* minimap enabled, mainContent gets wrapped */}
				{clientSettings.showMiniMap && (
				<MiniMapWrap>
					{mainContent}
				</MiniMapWrap>
				)}

				{/* minimap disabled */}
				{!clientSettings.showMiniMap && (<>
					<div className="spacer-top" />
					{mainContent}
				</>)}

			</Router>
		</div>
	);

};

export default Base;
