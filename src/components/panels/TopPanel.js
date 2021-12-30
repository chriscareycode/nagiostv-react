/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2021 Chris Carey https://chriscarey.com
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

import React from 'react';

import { useRecoilState } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';

// Import external libraries
import ReactTooltip from 'react-tooltip';

// Import Widgets
import Flynn from '../Flynn/Flynn.jsx';
import Clock from '../widgets/Clock.jsx';
import CustomLogo from '../widgets/CustomLogo.jsx';

// Import icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faVolumeUp, faBullhorn, faChartBar, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';

// Import CSS
import './TopPanel.css';

const TopPanel = (props) => {

  const [bigState, setBigState] = useRecoilState(bigStateAtom);
  const [clientSettings, setClientSettings] = useRecoilState(clientSettingsAtom);

  const {
    //isDoneLoading,
    isLeftPanelOpen,
    //settingsLoaded,
    hideFilters,
  } = bigState;

  const {
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

  const clickedSound = () => {
    setClientSettings(curr => ({
      ...curr,
      playSoundEffects: !curr.playSoundEffects
    }));
  };

  const clickedSpeak = () => {
    setClientSettings(curr => ({
      ...curr,
      speakItems: !curr.speakItems
    }));
  };

  const clickedFilter = () => {
    setBigState(curr => ({
      ...curr,
      hideFilters: !curr.hideFilters
    }));
  };

  const clickedCharts = () => {
    setClientSettings(curr => ({
      ...curr,
      hideHistoryChart: !curr.hideHistoryChart
    }));
  };

  const clickedCharts24h = () => {
    setClientSettings(curr => ({
      ...curr,
      hideHistory24hChart: !curr.hideHistory24hChart
    }));
  };

  const clickedAutomaticScroll = () => {
    setClientSettings(curr => ({
      ...curr,
      automaticScroll: !curr.automaticScroll
    }));
  };

  return (
    <div className="TopPanel top-panel-height">

        <div className="header-right-float">

        {/* filter icon */}
        <div
          data-tip="Show/Hide Filters"
          className={hideFilters === false ? 'sound-icon' : 'sound-icon sound-icon-disabled'}
          onClick={clickedFilter}
        >
          <FontAwesomeIcon icon={faFilter} />
        </div>

        {/* automatic scroll icon */}
        <div
          data-tip="Automatic Scroll"
          className={automaticScroll ? 'sound-icon' : 'sound-icon sound-icon-disabled'}
          onClick={clickedAutomaticScroll}
        >
          <FontAwesomeIcon icon={faSort} />
        </div>

        {/* chart icon */}
        <div
          data-tip="Show/Hide 24h Charts"
          className={hideHistory24hChart === false ? 'sound-icon' : 'sound-icon sound-icon-disabled'}
          onClick={clickedCharts24h}
        >
          <FontAwesomeIcon icon={faChartBar} />
        </div>

        {/* chart icon */}
        <div
          data-tip="Show/Hide Long Charts"
          className={hideHistoryChart === false ? 'sound-icon' : 'sound-icon sound-icon-disabled'}
          onClick={clickedCharts}
        >
          <FontAwesomeIcon icon={faChartBar} />
        </div>

        {/* sound effects icon */}
        <div
          data-tip="Sound Effects"
          className={playSoundEffects ? 'sound-icon' : 'sound-icon sound-icon-disabled'}
          onClick={clickedSound}
        >
          <FontAwesomeIcon icon={faVolumeUp}  />
        </div>

        {/* speak items icon */}
        <div
          data-tip="Speak"
          className={speakItems ? 'sound-icon' : 'sound-icon sound-icon-disabled'}
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

        {/* flynn */}
        {clientSettings.flynnEnabled &&
            <Flynn
              howManyDown={0}
              flynnConcernedAt={clientSettings.flynnConcernedAt}
              flynnAngryAt={clientSettings.flynnAngryAt}
              flynnBloodyAt={clientSettings.flynnBloodyAt}
              flynnCssScale={clientSettings.flynnCssScale}
            />
        }
        
        {/* custom logo */}
        {clientSettings.customLogoEnabled &&
            <CustomLogo
            settings={clientSettings}
            />
        }
        </div>

        {/* header-left-spacer - this will provide left hand spacing to the menu or title string */}
        {/*<div className="header-left-spacer"></div>*/}

        {/* hamburger menu */}
        {clientSettings.hideHamburgerMenu === false && <div className={isLeftPanelOpen ? "hamburger-menu hamburger-menu-active" : 'hamburger-menu'} onClick={clickedHamburgerMenu}>
            <div className="hamburger-menu-center">
              <FontAwesomeIcon icon={faBars} />
            </div>
        </div>}

        {/* title string */}
        <div className="header-application-name">{clientSettings.titleString}</div>

        {/* show the polling time */}
        {/*<span style={{ marginLeft: '20px' }} className=""><FontAwesomeIcon icon={faYinYang} spin /> 15s</span>*/}

        <ReactTooltip place="bottom" type="dark" effect="solid"/>
    </div>
  );
  
}

export default TopPanel;
