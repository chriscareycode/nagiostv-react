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

import React, { useEffect, useRef } from 'react';
import { momentFormatDateTime } from '../../helpers/moment.js';
import './Clock.css';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faClock } from '@fortawesome/free-solid-svg-icons';

const Clock = (props) => {

  const dateRef = useRef(null);

  useEffect(
    () => {
      //start timer
      console.log('clock start timer');
      const timer = setInterval(() => {
        dateRef.current.innerHTML = 
          momentFormatDateTime('now', props.locale, props.clockDateFormat) +
          '&nbsp;' +
          momentFormatDateTime('now', props.locale, props.clockTimeFormat);
      }, 1000);

      return () => {
        //stop timer
        console.log('clock stop timer');
        if (timer) {
          clearInterval(timer);
        }
      };
    },
    []
  );

  return (
    <div className="Clock" ref={dateRef} />
  );
  
}

export default Clock;
