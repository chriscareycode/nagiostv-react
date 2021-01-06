/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
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

import React, { useState, useEffect } from 'react';

// Import Widgets
import Flynn from '../Flynn/Flynn.jsx';
import Clock from '../widgets/Clock.jsx';
import CustomLogo from '../widgets/CustomLogo.jsx';

// Import icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faVolumeUp, faBullhorn } from '@fortawesome/free-solid-svg-icons';

// Import CSS
import './TopMenu.css';

const TopMenu = (props) => {

  const clickedHotDogMenu = () => {
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

  return (
    <div className="TopMenu">

        <div className="header-right-float">

        {/* sound effects icon */}
        <div className={props.settingsObject.playSoundEffects ? 'sound-icon' : 'sound-icon sound-icon-disabled'} onClick={clickedSound}><FontAwesomeIcon icon={faVolumeUp}  /></div>

        {/* speak items icon */}
        <div className={props.settingsObject.speakItems ? 'sound-icon' : 'sound-icon sound-icon-disabled'}  onClick={clickedSpeak}><FontAwesomeIcon icon={faBullhorn} /></div>

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

        {/* hot dog menu */}
        <div className={props.isLeftPanelOpen ? "hot-dog-menu hot-dog-menu-active" : 'hot-dog-menu'} onClick={clickedHotDogMenu}>
            <FontAwesomeIcon icon={faBars} />
        </div>

        {/* title string */}
        <div className="header-application-name">{props.settingsObject.titleString}</div>

        {/* show the polling time */}
        {/*<span style={{ marginLeft: '20px' }} className=""><FontAwesomeIcon icon={faYinYang} spin /> 15s</span>*/}
    </div>
  );
  
}

export default TopMenu;
