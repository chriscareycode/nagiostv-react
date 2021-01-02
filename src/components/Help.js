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

import React from 'react';
import './Help.css';

const Help = (props) => {

  const clickedHotDogMenu = () => {
    props.updateRootState({
      isLeftPanelOpen: !props.isLeftPanelOpen
    });
  };

  const clickedDashboard = () => {
    props.updateRootState({
      currentPage: 'dashboard'
    });
  };

  const clickedSettings = () => {
    props.updateRootState({
      currentPage: 'settings'
    });
  };

  const clickedUpdate = () => {
    props.updateRootState({
      currentPage: 'autoupdate'
    });
  };

  return (
    <div className="Help">
      <h2>Help</h2>

      <div className="help-option" onClick={clickedHotDogMenu}>Toggle the menu</div>

      <div className="help-option" onClick={clickedUpdate}>Go to Updates</div>
      <div className="help-option" onClick={clickedSettings}>Go to Settings</div>
      <div className="help-option" onClick={clickedDashboard}>Go back to Dashboard</div>
    </div>
  );
  
}

export default Help;
