import React, { Component } from 'react';
import './QuietFor.css';
//import { prettyDateTime } from '../helpers/moment.js';

class QuietFor extends Component {
  render() {
  	const quietForText = (date_now, date_future) => {
  		//var diff = date_now - date_future;
  		//var total_minutes = (diff/(60*1000)).toFixed(0);

	    // calculate days, hours, minutes, seconds
	    // get total seconds between the times
	    let delta = Math.abs(date_future - date_now) / 1000;

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
  		const delta = Math.abs(date_future - date_now) / 1000;
  		let ret = '';

  		if (first) {
  			ret = '⏱'
  		} else {
  			ret = '💔'
  		}
  		if (delta > 60 * 60 * 48) { // 48 hours
  			ret = '❤️❤️❤️❤️❤️❤️❤️❤️';
  		} else if (delta > 3600 * 42) { // 42 hours
  			ret = '❤️❤️❤️❤️❤️❤️❤️';
  		} else if (delta > 3600 * 36) { // 36 hours
  			ret = '❤️❤️❤️❤️❤️❤️';
  		} else if (delta > 3600 * 30) { // 30 hours
  			ret = '❤️❤️❤️❤️❤️';
  		} else if (delta > 3600 * 24) { // 24 hours
  			ret = '❤️❤️❤️❤️';
  		} else if (delta > 3600 * 18) { // 18 hours
  			ret = '❤️❤️❤️';
  		} else if (delta > 3600 * 12) { // 12 hours
  			ret = '❤️❤️';
  		} else if (delta > 3600 * 6) { // 6 hours
  			ret = '❤️';
  		}
  		return ret;
  	};
  	// TODO: it would be nice to only render this component when the props change. no need
  	// to recalculate every one since they do not change (except the first)
  	//console.log('quietFor render');
    return (
      <div className="QuietFor">
      	{this.props.showEmoji && <div className="QuietForStars">{stars(this.props.nowtime, this.props.prevtime, this.props.first)}</div>}
      	{this.props.first && <span className="QuietForClock">⏱</span>}
      	Quiet for {quietForText(this.props.nowtime, this.props.prevtime)}
      	{/* - {' '}
         - {prettyDateTime(this.props.nowtime)} {prettyDateTime(this.props.prevtime)}
         - Diff {this.props.nowtime - this.props.prevtime}
        */}
      </div>
    );
  }
}

export default QuietFor;
