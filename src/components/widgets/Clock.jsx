import React, { Component } from 'react';
import './Clock.css';


// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';


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
    // if (nextProps.settings.customLogoEnabled !== this.props.settings.customLogoEnabled || nextProps.settings.customLogoUrl !== this.props.settings.customLogoUrl) {
    //   return true;
    // } else {
    //   return false;
    // }
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
        {/*<FontAwesomeIcon className="" icon={faClock} />&nbsp;*/}
        {this.state.date.toLocaleDateString(this.props.locale)}
        &nbsp;
        {this.state.date.toLocaleTimeString(this.props.locale)}
      </div>
    );
  }
}

export default Clock;
