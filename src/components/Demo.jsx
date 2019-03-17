import React, { Component } from 'react';
import { convertHostObjectToArray, convertServiceObjectToArray } from '../helpers/nagiostv';

import './Demo.css';

class Demo extends Component {

  addHostDown = () => {
    // loop through hostProblemsArray, set one to down, and set state
    const hostlist = {...this.props.hostlist};

    Object.keys(hostlist).some(key => {
      if (hostlist[key].status === 2) {
        hostlist[key].status = 4;
        hostlist[key].last_time_up = new Date().getTime();
        return true;
      }
      return false;
    });

    const hostProblemsArray = convertHostObjectToArray(hostlist, this.props.hostSortOrder);

    // set state
    this.props.updateStateFromSettings({
      hostProblemsArray
    });
  }

  addServiceWarning = () => {
    this.addServiceStatus(4);
  }

  addServiceCritical = () => {
    this.addServiceStatus(16);
  }

  addServiceStatus = (status) => {
    // loop through serviceProblemsArray, set one to down, and set state
    const servicelist = {...this.props.servicelist};

    let done = false;
    Object.keys(servicelist).some(hostkey => {
      Object.keys(servicelist[hostkey]).some(key => {
        if (servicelist[hostkey][key].status === 2) {
          servicelist[hostkey][key].status = status;
          servicelist[hostkey][key].last_time_up = new Date().getTime();
          done = true;
          return true;
        }
        return false;
      });
      if (done) { return true; }
      return false;
    });

    const serviceProblemsArray = convertServiceObjectToArray(servicelist, this.props.serviceSortOrder);

    // set state
    this.props.updateStateFromSettings({
      serviceProblemsArray
    });
  }

  render() {

    return (
      
      <div className={`Demo`}>
        Demo
        Add a fake:{' '}
        <button onClick={this.addHostDown}>Host DOWN</button>
        <button onClick={this.addServiceWarning}>Service WARNING</button>
        <button onClick={this.addServiceCritical}>Service CRITICAL</button>
      </div>
    );
  }
}

export default Demo;
