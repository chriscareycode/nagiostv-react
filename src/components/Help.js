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
import './Help.css';

const Help = (props) => {

  return (
    <div className="Help">
      <h2>NagiosTV Info and Help</h2>
      <br />
      <div>Website: <a href="https://nagiostv.com" target="_blank" rel="noopener noreferer">https://nagiostv.com</a></div>
      <br />
      <div>GitHub: <a href="https://github.com/chriscareycode/nagiostv-react" target="_blank" rel="noopener noreferer">https://github.com/chriscareycode/nagiostv-react</a></div>
      <br />
      <div>Follow NagiosTV on Twitter for product updates: <a href="https://twitter.com/NagiosTV" target="_blank" rel="noopener noreferer">https://twitter.com/NagiosTV</a></div>
      
      {/*
      <div className="help-bottom-area">
        <div className="help-option" onClick={clickedHotDogMenu}>Toggle the menu</div>
        <br />
        <div className="help-option" onClick={clickedDashboard}>Go to Dashboard</div>
        <div className="help-option" onClick={clickedSettings}>Go to Settings</div>
        <div className="help-option" onClick={clickedUpdate}>Go to Updates</div>
      </div>
      */}
      
    </div>
  );
  
}

export default Help;
