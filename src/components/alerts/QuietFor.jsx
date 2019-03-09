import React, { Component } from 'react';
import { translate } from '../../helpers/language';
import moment from 'moment';

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
        if (seconds === 1) {
            foo += seconds + ' second';
        } else {
            foo += seconds + ' seconds';
        }
        return foo;
    };

    const stars = (date_now, date_future, first) => {
        const duration = moment.duration(date_future - date_now );
        const hours = Math.abs(Math.floor(duration.asHours()));
        let ret = '';
        if (hours > 24) { // max out at 24
            ret += '❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️';
        } else {
            for(let i=0;i<hours;i++) {
                ret += '❤️';
            };
        }
        return ret;
    };

    const { language } = this.props;
    
    // TODO: it would be nice to only render this component when the props change. no need
    // to recalculate every one since they do not change (except the first)
    //console.log('quietFor render');
    return (
      <div className="QuietFor">
        {this.props.showEmoji && <div className="QuietForStars">{stars(this.props.prevtime, this.props.nowtime, this.props.first)}</div>}
        <span className="QuietForClock">⏱</span>
        {translate('Quiet for', language)} {quietForText(this.props.nowtime, this.props.prevtime)}
        {/* - {' '}
         - {prettyDateTime(this.props.nowtime)} {prettyDateTime(this.props.prevtime)}
         - Diff {this.props.nowtime - this.props.prevtime}
        */}
      </div>
    );
  }
}

export default QuietFor;
