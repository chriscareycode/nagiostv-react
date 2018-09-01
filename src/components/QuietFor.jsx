import React, { Component } from 'react';
import './QuietFor.css';
import { prettyDateTime } from '../helpers/moment.js';

class QuietFor extends Component {
  render() {
  	const quietForText = (date_now, date_future) => {
  		var diff = date_now - date_future;
  		var total_minutes = (diff/(60*1000)).toFixed(0);

	    // calculate days, hours, minutes, seconds
	    // get total seconds between the times
	    var delta = Math.abs(date_future - date_now) / 1000;

	    // calculate (and subtract) whole days
	    var days = Math.floor(delta / 86400);
	    delta -= days * 86400;

	    // calculate (and subtract) whole hours
	    var hours = Math.floor(delta / 3600) % 24;
	    delta -= hours * 3600;

	    // calculate (and subtract) whole minutes
	    var minutes = Math.floor(delta / 60) % 60;
	    delta -= minutes * 60;

	    // what's left is seconds
	    var seconds = parseInt((delta % 60).toFixed(0), 10);  // in theory the modulus is not required
	    
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

    return (
      <div className="QuietFor">
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
