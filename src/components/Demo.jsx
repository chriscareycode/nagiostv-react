import React, { Component } from 'react';
import { convertHostObjectToArray, convertServiceObjectToArray } from '../helpers/nagiostv';

import './Demo.css';

class Demo extends Component {

  componentDidMount() {
    setTimeout(() => {
      this.automate();
    }, 2000);
  }

  automate() {
    
    this.addHostDown();
    setTimeout(() => {
      this.removeHostDown();
    }, 5000);

    this.addServiceWarning();
    setTimeout(() => {
      this.removeServiceWarning();
    }, 6000);

    this.addServiceCritical();
    setTimeout(() => {
      this.removeServiceCritical();
    }, 7000);

  }

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

    // convert object to array
    const hostProblemsArray = convertHostObjectToArray(hostlist, this.props.hostSortOrder);

    // set state
    this.props.updateStateFromSettings({
      hostProblemsArray
    });
  }

  removeHostDown = () => {
    // loop through hostProblemsArray, set one to down, and set state
    const hostlist = {...this.props.hostlist};

    Object.keys(hostlist).some(key => {
      if (hostlist[key].status === 4) {
        hostlist[key].status = 2;
        hostlist[key].last_time_up = new Date().getTime();
        return true;
      }
      return false;
    });

    // convert object to array
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

  removeServiceWarning = () => {
    this.removeServiceStatus(4);
  }

  removeServiceCritical = () => {
    this.removeServiceStatus(16);
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

  removeServiceStatus = (status) => {
    // loop through serviceProblemsArray, set one to down, and set state
    const servicelist = {...this.props.servicelist};

    let done = false;
    Object.keys(servicelist).some(hostkey => {
      Object.keys(servicelist[hostkey]).some(key => {
        if (servicelist[hostkey][key].status === status) {
          servicelist[hostkey][key].status = 2;
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
        <div className="demo-header">NagiosTV demo mode - Try adding some fake issues!</div>
        <table>
          <tbody>
            <tr>
              <td>
                <div className="summary-label summary-label-red">Host DOWN</div>
                <button onClick={this.addHostDown}>Add</button>
                <button onClick={this.removeHostDown}>Remove</button>
              </td>
              <td>
                <div className="summary-label summary-label-yellow">Service WARNING</div>
                <button onClick={this.addServiceWarning}>Add</button>
                <button onClick={this.removeServiceWarning}>Remove</button>
              </td>
              <td>
                <div className="summary-label summary-label-red">Service CRITICAL</div>
                <button onClick={this.addServiceCritical}>Add</button>
                <button onClick={this.removeServiceCritical}>Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default Demo;
