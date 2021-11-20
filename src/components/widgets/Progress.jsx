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

import React, { Component } from 'react';
import './Progress.css';

class Progress extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);

    if (nextProps.seconds < 0 && this.state.started === true) {
      this.setState({ started: false });
      //return true;
    }

    // If there is an increase in the seconds set the started flag to true
    if (nextProps.seconds > this.props.seconds && this.state.started === false) {
      this.setState({ started: true });
    }

    // we re-render when the seconds value jumps up, never when it goes down
    // the check for nextState.started !== this.state.started is for first run
    if (nextProps.seconds > this.props.seconds || nextState.started !== this.state.started) {
      return true;
    } else {
      return false;
    }

    // if (nextState.started !== this.state.started) {
    //   return true;
    // }
  }

  state = {
    //progressMax: 15,
    //progressValue: 15,
    started: false
  };

  timeoutHandle = null;

  componentDidMount() {
    // setInterval(() => {
    //   this.setState({
    //     progressValue: this.state.progressValue > 0 ? this.state.progressValue - 1 : this.state.progressMax
    //   });
    // }, 1000);


    this.timeoutHandle = setTimeout(() => {
      this.setState({ started: true });
    }, 1 * 1000);

    // setInterval(() => {
    //   this.setState({ started: false });

    //   setTimeout(() => {
    //     this.setState({ started: true });
    //   }, 1 * 1000);

    // }, 14 * 1000);
  }

  componentWillUnmount() {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
  }

  render() {

    //console.log('Progress render');
    
    const progressStyle = {
      animation: this.state.started ? `progress-keyframes ${this.props.seconds}s linear` : 'none'
    };

    return (
      <div className="Progress progress">
        <div className={`progress-bar ${this.props.color}`} style={progressStyle}></div>
      </div>
    );
  }
}

export default Progress;
