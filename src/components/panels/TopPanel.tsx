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

import { useAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from 'atoms/settingsState';

// Import external libraries
import ReactTooltip from 'react-tooltip';

// Import Widgets
import Clock from '../widgets/Clock';
import CustomLogo from '../widgets/CustomLogo';
import { saveLocalStorage } from 'helpers/nagiostv';

// Import icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faVolumeUp, faBullhorn, faFilter, faSort, faChartSimple } from '@fortawesome/free-solid-svg-icons';

// Types
import { ClientSettings } from 'types/settings';

// Import CSS
import './TopPanel.css';

const TopPanel = () => {

	const [bigState, setBigState] = useAtom(bigStateAtom);
	const [clientSettings, setClientSettings] = useAtom(clientSettingsAtom);

	const {
		//isDoneLoading,
		isLeftPanelOpen,
		//settingsLoaded,
		hideFilters,
	} = bigState;

	const {
		alertDaysBack,
		hideHistory24hChart,
		hideHistoryChart,
		//fontSizeEm,
		playSoundEffects,
		speakItems,
		automaticScroll,
	} = clientSettings;

	const clickedHamburgerMenu = () => {
		setBigState(curr => ({
			...curr,
			isLeftPanelOpen: !curr.isLeftPanelOpen
		}));
	};

	const toggleAndSave = (settingName: keyof ClientSettings) => {
		setClientSettings(curr => {
			const s = {
				...curr,
				[settingName]: !curr[settingName]
			};
			saveLocalStorage('TopPanel', s);
			return s;
		});
	};

	const clickedSound = () => {
		toggleAndSave('playSoundEffects');
	};

	const clickedSpeak = () => {
		toggleAndSave('speakItems');
	};

	const clickedFilter = () => {
		setBigState(curr => ({
			...curr,
			hideFilters: !curr.hideFilters
		}));
	};

	const clickedCharts = () => {
		toggleAndSave('hideHistoryChart');
	};

	const clickedCharts24h = () => {
		toggleAndSave('hideHistory24hChart');
	};

	const clickedAutomaticScroll = () => {
		toggleAndSave('automaticScroll');
	};

	return (
		<>
			{/* Show the automatic scroll is enabled message */}
			{automaticScroll && (
				<div className="automatic-scroll-enabled">
					Automatic scroll is enabled{' '}
					<button onClick={() => toggleAndSave('automaticScroll')}>Disable</button>
				</div>
			)}

			{/* Top Panel */}
			<div className="TopPanel top-panel-height">
				<div className="header-right-float">

					{/* filter icon */}
					<div
						data-tip="Show/Hide Filters"
						className={hideFilters === false ? 'generic-icon filter-icon' : 'generic-icon filter-icon generic-icon-disabled'}
						onClick={clickedFilter}
					>
						<FontAwesomeIcon icon={faFilter} /> Filters
					</div>

					{/* automatic scroll icon */}
					<div
						data-tip="Automatic Scroll"
						className={automaticScroll ? 'generic-icon' : 'generic-icon generic-icon-disabled'}
						onClick={clickedAutomaticScroll}
					>
						<FontAwesomeIcon icon={faSort} />
					</div>

					{/* chart icon */}
					<div
						data-tip="Show/Hide 24h Charts"
						className={hideHistory24hChart === false ? 'generic-icon' : 'generic-icon generic-icon-disabled'}
						onClick={clickedCharts24h}
					>
						<FontAwesomeIcon icon={faChartSimple} /> 24h
					</div>

					{/* chart icon */}
					<div
						data-tip="Show/Hide Long Charts"
						className={hideHistoryChart === false ? 'generic-icon' : 'generic-icon generic-icon-disabled'}
						onClick={clickedCharts}
					>
						<FontAwesomeIcon icon={faChartSimple} /> {alertDaysBack}d
					</div>

					{/* sound effects icon */}
					<div
						data-tip="Sound Effects"
						className={playSoundEffects ? 'generic-icon' : 'generic-icon generic-icon-disabled'}
						onClick={clickedSound}
					>
						<FontAwesomeIcon icon={faVolumeUp} />
					</div>

					{/* speak items icon */}
					<div
						data-tip="Speak"
						className={speakItems ? 'generic-icon' : 'generic-icon generic-icon-disabled'}
						onClick={clickedSpeak}
					>
						<FontAwesomeIcon icon={faBullhorn} />
					</div>

					{/* clock */}
					<Clock
						locale={clientSettings.locale}
						clockDateFormat={clientSettings.clockDateFormat}
						clockTimeFormat={clientSettings.clockTimeFormat}
					/>

				</div>

				{/* header-left-spacer - this will provide left hand spacing to the menu or title string */}
				{/*<div className="header-left-spacer"></div>*/}

				{/* hamburger menu */}
				{clientSettings.hideHamburgerMenu === false && <div className={isLeftPanelOpen ? "hamburger-menu hamburger-menu-active" : 'hamburger-menu'} onClick={clickedHamburgerMenu}>
					<div className="hamburger-menu-center">
						<FontAwesomeIcon icon={faBars} />
					</div>
				</div>}

				{/* custom logo */}
				{clientSettings.customLogoEnabled &&
					<CustomLogo
						settings={clientSettings}
					/>
				}

				{/* title string */}
				<div className="header-application-name">{clientSettings.titleString}</div>

				{/* show the polling time */}
				{/*<span style={{ marginLeft: '20px' }} className=""><FontAwesomeIcon icon={faYinYang} spin /> 15s</span>*/}

				<ReactTooltip place="bottom" type="dark" effect="solid" />
			</div>
		</>
	);

}

export default TopPanel;
