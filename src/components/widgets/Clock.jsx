import React, { useState, useEffect } from 'react';
import { momentFormatDateTime } from '../../helpers/moment.js';
import './Clock.css';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faClock } from '@fortawesome/free-solid-svg-icons';

const Clock = (props) => {

  const [date, setDate] = useState(new Date().getTime());

  const tick = () => {
    setDate(new Date().getTime());
  }

  useEffect(
    () => {
      //start timer
      console.log('clock start timer');
      const timer = setInterval(() => {
        tick();
      }, 15);

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
    <div className="Clock">
      {momentFormatDateTime('now', props.locale, props.clockDateFormat)}
      &nbsp;
      {momentFormatDateTime('now', props.locale, props.clockTimeFormat)}
    </div>
  );
  
}

export default Clock;
