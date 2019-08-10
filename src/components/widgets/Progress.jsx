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

  componentDidMount() {
    // setInterval(() => {
    //   this.setState({
    //     progressValue: this.state.progressValue > 0 ? this.state.progressValue - 1 : this.state.progressMax
    //   });
    // }, 1000);


    setTimeout(() => {
      this.setState({ started: true });
    }, 1 * 1000);

    // setInterval(() => {
    //   this.setState({ started: false });

    //   setTimeout(() => {
    //     this.setState({ started: true });
    //   }, 1 * 1000);

    // }, 14 * 1000);
  }

  render() {

    //const progressStyle = { width: Math.floor(this.state.progressValue / this.state.progressMax * 100) + '%' };
    const progressStyle = {
      width: this.state.started ? '100%' : '0%',
      transition: this.state.started ? `width ${this.props.seconds}s linear` : 'width 0s linear'
    };

    return (
      <div className="Progress progress">
        <div className={`progress-bar ${this.props.color}`} style={progressStyle}></div>
      </div>
    );
  }
}

export default Progress;
