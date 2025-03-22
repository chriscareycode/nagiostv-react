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
	Route,
	Routes,
	useLocation,
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

// Import Polyfills
import 'url-search-params-polyfill';

// Import css
import './Base.css';
import './animation.css';

import MiniMapWrap from './widgets/MiniMapWrap';
import SettingsFakeData from './SettingsFakeData';
import { BigState, ClientSettings } from 'types/settings';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode } from 'react';

const pageVariants = {
	initial: { opacity: 0, x: 0 },
	animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
	exit: { opacity: 0, x: 0, transition: { duration: 0.3 } }
};

// Wrapper for page transitions


const PageWrapper = ({ children }: { children: ReactNode }) => (
	<motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
	  {children}
	</motion.div>
);

const AnimatedRoutes = () => {

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

	//=============================================================================
	// Routes
	//=============================================================================
	
	const settingsRoute = (
		<div className="vertical-scroll">
			<Settings />
		</div>
	);

	const updateRoute = (
		<div className="vertical-scroll">
			<Update
				//updateRootState={this.updateRootState}
				currentVersion={bigState.currentVersion}
				currentVersionString={bigState.currentVersionString}
			/>
		</div>
	);

	const helpRoute = (
		<div className="vertical-scroll">
			<Help />
		</div>
	);

	const rootRoute = (
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
	);

	//=============================================================================
	// mainContent
	//=============================================================================

	const location = useLocation();

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

				<AnimatePresence mode="wait">
					<Routes location={location} key={location.pathname}>
						<Route path="/settings" element={<PageWrapper>{settingsRoute}</PageWrapper>} />
						<Route path="/update" element={<PageWrapper>{updateRoute}</PageWrapper>} />
						<Route path="/help" element={<PageWrapper>{helpRoute}</PageWrapper>} />
						<Route path="/" element={<PageWrapper>{rootRoute}</PageWrapper>} />
					</Routes>
				</AnimatePresence>

			</div> {/* endwrapper around the main content */}
		</>
	);

	return (
		<>
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
		</>
	);
};

const Base = () => {
	return (
		<div id="Base" data-testid="Base" className="Base">

			<SettingsLoad />
			<SettingsFakeData />

			<Router>
				<AnimatedRoutes />
			</Router>
		</div>
	);
};

export default Base;
