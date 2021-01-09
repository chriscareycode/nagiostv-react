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

// Import external libraries
import ReactTooltip from 'react-tooltip';

// Import Widgets
import Flynn from '../Flynn/Flynn.jsx';
import Clock from '../widgets/Clock.jsx';
import CustomLogo from '../widgets/CustomLogo.jsx';

// Import icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faVolumeUp, faBullhorn, faChartBar, faFilter } from '@fortawesome/free-solid-svg-icons';

// Import CSS
import './TopPanel.css';

const TopPanel = (props) => {

  const clickedHamburgerMenu = () => {
    props.updateRootState({
      isLeftPanelOpen: !props.isLeftPanelOpen
    });
  };

  const clickedSound = () => {
    props.updateRootState({
      playSoundEffects: !props.settingsObject.playSoundEffects
    });
  };

  const clickedSpeak = () => {
    props.updateRootState({
      speakItems: !props.settingsObject.speakItems
    });
  };

  const clickedFilter = () => {
    props.updateRootState({
      hideFilters: !props.hideFilters
    });
  };

  const clickedCharts = () => {
    props.updateRootState({
      hideHistoryChart: !props.settingsObject.hideHistoryChart
    });
  };

  return (
    <div className="TopPanel">

        <div className="header-right-float">

        {/* filter icon */}
        <div data-tip="Show/Hide Filters" className={props.hideFilters === false ? 'sound-icon' : 'sound-icon sound-icon-disabled'} onClick={clickedFilter}>
          <FontAwesomeIcon icon={faFilter} />
        </div>

        {/* chart icon */}
        <div data-tip="Show/Hide Charts" className={props.settingsObject.hideHistoryChart === false ? 'sound-icon' : 'sound-icon sound-icon-disabled'} onClick={clickedCharts}>
          <FontAwesomeIcon icon={faChartBar} />
        </div>

        {/* sound effects icon */}
        <div data-tip="Sound Effects" className={props.settingsObject.playSoundEffects ? 'sound-icon' : 'sound-icon sound-icon-disabled'} onClick={clickedSound}>
          <FontAwesomeIcon icon={faVolumeUp}  />
        </div>

        {/* speak items icon */}
        <div data-tip="Speak" className={props.settingsObject.speakItems ? 'sound-icon' : 'sound-icon sound-icon-disabled'} onClick={clickedSpeak}>
          <FontAwesomeIcon icon={faBullhorn} />
        </div>

        {/* clock */}
        <Clock
            locale={props.settingsObject.locale}
            clockDateFormat={props.settingsObject.clockDateFormat}
            clockTimeFormat={props.settingsObject.clockTimeFormat}
        />

        {/* flynn */}
        {props.settingsObject.flynnEnabled &&
            <Flynn
              howManyDown={0}
              flynnConcernedAt={props.settingsObject.flynnConcernedAt}
              flynnAngryAt={props.settingsObject.flynnAngryAt}
              flynnBloodyAt={props.settingsObject.flynnBloodyAt}
              flynnCssScale={props.settingsObject.flynnCssScale}
            />
        }
        
        {/* custom logo */}
        {props.settingsObject.customLogoEnabled &&
            <CustomLogo
            settings={props.settingsObject}
            />
        }
        </div>

        {/* header-left-spacer - this will provide left hand spacing to the menu or title string */}
        {/*<div className="header-left-spacer"></div>*/}

        {/* hamburger menu */}
        {props.settingsObject.hideHamburgerMenu === false && <div className={props.isLeftPanelOpen ? "hamburger-menu hamburger-menu-active" : 'hamburger-menu'} onClick={clickedHamburgerMenu}>
            <div className="hamburger-menu-center">
              <FontAwesomeIcon icon={faBars} />
            </div>
        </div>}

        {/* title string */}
        <div className="header-application-name">{props.settingsObject.titleString}</div>

        {/* show the polling time */}
        {/*<span style={{ marginLeft: '20px' }} className=""><FontAwesomeIcon icon={faYinYang} spin /> 15s</span>*/}

        <ReactTooltip place="bottom" type="dark" effect="solid"/>
    </div>
  );
  
}

export default TopPanel;
