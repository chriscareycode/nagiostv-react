import React, { Component } from 'react';
import { translate } from '../../helpers/language';
import moment from 'moment';
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCloudShowersHeavy, faCloudSunRain, faCloudSun, faSun } from '@fortawesome/free-solid-svg-icons';

import './QuietFor.css';
//import { prettyDateTime } from '../helpers/moment.js';

class QuietFor extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    if (nextProps.nowtime !== this.props.nowtime || nextProps.prevtime !== this.props.prevtime) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    const quietForText = (date_now, date_future) => {
        //var diff = date_now - date_future;
        //var total_minutes = (diff/(60*1000)).toFixed(0);

        // calculate days, hours, minutes, seconds
        // get total seconds between the times
        let delta = Math.abs(date_future - date_now) / 1000;
        //console.log('QuietFor render() delta', delta);

        // calculate (and subtract) whole days
        const days = Math.floor(delta / 86400);
        delta -= days * 86400;

        // calculate (and subtract) whole hours
        const hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;

        // calculate (and subtract) whole minutes
        const minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;

        // what's left is seconds
        const seconds = parseInt((delta % 60).toFixed(0), 10);  // in theory the modulus is not required
        
        let foo = '';
        if (days === 1) { foo += days + ' day '; }
        if (days > 1) { foo += days + ' days '; }
        if (hours === 1) { foo += hours + ' hour '; }
        if (hours > 1) { foo += hours + ' hours '; }
        if (minutes === 1) { foo += minutes + ' minute '; }
        if (minutes > 1) { foo += minutes + ' minutes '; }
        if (days === 0 && hours === 0 && minutes === 0) {
            if (seconds === 1) {
                foo += seconds + ' second';
            } else {
                foo += seconds + ' seconds';
            }
        }
        return foo;
    };

    const stars = (date_now, date_future, first) => {
        const duration = moment.duration(date_future - date_now );
        const hours = Math.abs(Math.floor(duration.asHours()));
        
        let icon = 'faCloud';
        if (hours > 12) { icon = <FontAwesomeIcon className="color-green" icon={faSun} />; }
        else if (hours > 6 && hours <= 12) { icon = <FontAwesomeIcon className="color-yellow" icon={faCloudSun} />; }
        else if (hours > 1 && hours <= 6) { icon = <FontAwesomeIcon className="color-orange" icon={faCloudSunRain} />; }
        else { icon = <FontAwesomeIcon className="color-red" icon={faCloudShowersHeavy} />; }
        return icon;
    };

    const { language } = this.props;
    
    // TODO: it would be nice to only render this component when the props change. no need
    // to recalculate every one since they do not change (except the first)
    //console.log('quietFor render');
    return (
      <div className="QuietFor">
        <div className="QuietForIcon">{stars(this.props.prevtime, this.props.nowtime, this.props.first)}</div>
        <span className="QuietForClock"><FontAwesomeIcon className="color-white" icon={faClock} /></span>
        <span className="uppercase-first display-inline-block">{translate('quiet for', language)}</span> {quietForText(this.props.nowtime, this.props.prevtime)}
        {/* - {' '}
         - {prettyDateTime(this.props.nowtime)} {prettyDateTime(this.props.prevtime)}
         - Diff {this.props.nowtime - this.props.prevtime}
        */}
      </div>
    );
  }
}

export default QuietFor;
