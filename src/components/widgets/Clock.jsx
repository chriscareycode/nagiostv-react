import React, { Component } from 'react';
import { momentFormatDateTime } from '../../helpers/moment.js';
import './Clock.css';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faClock } from '@fortawesome/free-solid-svg-icons';

class Clock extends Component {

  timer = null;

  constructor(props) {
    super(props);
    this.state = { date: new Date() };
  }

  componentDidMount() {
    //start timer
    this.timer = setInterval(() => {
      this.tick();
    }, 15);
  }

  componentWillUnmount() {
    //stop timer
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    return true;
  }

  tick() {
    this.setState({
      date: new Date()
    });
  }

  render() {
    return (
      <div className="Clock">
        {momentFormatDateTime('now', this.props.locale, this.props.clockDateFormat)}
        &nbsp;
        {momentFormatDateTime('now', this.props.locale, this.props.clockTimeFormat)}
      </div>
    );
  }
}

export default Clock;
