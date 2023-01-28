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

import { useRecoilState } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';

import Cookie from 'js-cookie';

// Import external libraries
import ReactTooltip from 'react-tooltip';

// Import Widgets
import Flynn from '../Flynn/Flynn';
import Clock from '../widgets/Clock';
import CustomLogo from '../widgets/CustomLogo';

// Import icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faVolumeUp, faBullhorn, faChartBar, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';

// Import CSS
import './TopPanel.css';
import { ClientSettings } from 'types/settings';
import { saveCookie } from 'helpers/nagiostv';

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

  const toggleAndSaveCookie = (settingName) => {
    setClientSettings(curr => {
      const s = {
        ...curr,
        [settingName]: !curr[settingName]
      };
      saveCookie(s);
      return s;
    });
  };

  const clickedSound = () => {
    toggleAndSaveCookie('playSoundEffects');
  };

  const clickedSpeak = () => {
    toggleAndSaveCookie('speakItems');
  };

  const clickedFilter = () => {
    setBigState(curr => ({
      ...curr,
      hideFilters: !curr.hideFilters
    }));
  };

  const clickedCharts = () => {
    toggleAndSaveCookie('hideHistoryChart');
  };

  const clickedCharts24h = () => {
    toggleAndSaveCookie('hideHistory24hChart');
  };

  const clickedAutomaticScroll = () => {
    toggleAndSaveCookie('automaticScroll');
  };

  return (
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
          <FontAwesomeIcon icon={faChartBar} /> 24h
        </div>

        {/* chart icon */}
        <div
          data-tip="Show/Hide Long Charts"
          className={hideHistoryChart === false ? 'generic-icon' : 'generic-icon generic-icon-disabled'}
          onClick={clickedCharts}
        >
          <FontAwesomeIcon icon={faChartBar} /> {alertDaysBack}d
        </div>

        {/* sound effects icon */}
        <div
          data-tip="Sound Effects"
          className={playSoundEffects ? 'generic-icon' : 'generic-icon generic-icon-disabled'}
          onClick={clickedSound}
        >
          <FontAwesomeIcon icon={faVolumeUp}  />
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

        {/* flynn */}
        {clientSettings.flynnEnabled &&
            <Flynn />
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
