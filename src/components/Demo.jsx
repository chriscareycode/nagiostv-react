/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
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
import { convertHostObjectToArray, convertServiceObjectToArray } from '../helpers/nagiostv';

import './Demo.css';

/**
 * Demo
 * 
 * Now after refactoring Base.jsx and data fetching so that each section -
 * HostSection and ServiceSection fetch and store data inside themselves,
 * the data is no longer stored in Base.css so I'm including this Demo component on both HostSection and ServiceSection
 * so that it can perform it's demo magic. I'd rather not do this since its sort of messy and with some future data
 * storage global state that works better I'll refactor this again.
 */

class Demo extends Component {

  state = {
    isVisible: false
  };

  componentDidMount() {
    setTimeout(() => {
      this.automate();
    }, 2000);
  }

  automate() {
    console.log('automate');

    if (this.props.type === 'host') {

      this.addHostDown();
      this.addHostDown();
      this.addHostDown();

      setTimeout(() => {
        this.removeHostDown();
      }, 10000);

      setTimeout(() => {
        this.removeHostDown();
      }, 25000);
  
  
      setTimeout(() => {
        this.removeHostDown();

        

      }, 40000);

    }

    if (this.props.type === 'service') {

      this.addServiceWarning();
      this.addServiceWarning();
      this.addServiceCritical();
      this.addServiceCritical();

      setTimeout(() => {
        this.removeServiceWarning();
      }, 6000);

      setTimeout(() => {
        this.addServiceWarning();
      }, 12000);
  
      setTimeout(() => {
        this.removeServiceCritical();
      }, 15000);
  
      setTimeout(() => {
        this.removeServiceWarning();
      }, 20000);

      setTimeout(() => {
        this.removeServiceCritical();
      }, 30000);
  
      setTimeout(() => {
        this.removeServiceWarning();

        // now at the end of the longest part of this automation, we set isVisible to true
        // so that the interactive controls will display. We do not want people messing with them during the
        // automatic demo.
        
        // though for right now since this is broken I'm going to hide the controls completely.
        // TODO: fix this later after refactoring so we can have access to data hostlist and servicelist
        this.setState({ isVisible: true });

      }, 35000);


    }
    
  }

  addHostDown = () => {
    // loop through hostProblemsArray, set one to down, and set state
    const hostlist = {...this.props.hostlist};
    //console.log('hostlist', hostlist);

    Object.keys(hostlist).some(key => {
      // "UP" and "not SOFT"
      if (hostlist[key].status === 2) {
        // Set status to DOWN
        hostlist[key].status = 4;
        hostlist[key].last_time_up = new Date().getTime();
        return true;
      }
      return false;
    });

    // convert object to array
    const hostProblemsArray = convertHostObjectToArray(hostlist, this.props.hostSortOrder);

    // set state
    this.props.updateParentState({
      hostProblemsArray
    });
  }

  removeHostDown = () => {
    // loop through hostProblemsArray, set one to down, and set state
    const hostlist = {...this.props.hostlist};

    Object.keys(hostlist).some(key => {
      // If status is "DOWN"
      if (hostlist[key].status === 4) {
        // Set status to "UP"
        hostlist[key].status = 2;
        hostlist[key].last_time_up = new Date().getTime();
        return true;
      }
      return false;
    });

    // convert object to array
    const hostProblemsArray = convertHostObjectToArray(hostlist, this.props.hostSortOrder);

    // set state
    this.props.updateParentState({
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
    this.props.updateParentState({
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
    this.props.updateParentState({
      serviceProblemsArray
    });
  }

  render() {

    // only show the demo controls once.
    /**
     * Only show the demo controls once.
     * Since we are including the demo component twice, lets hide it for the other one.
     */
    if (this.props.type === 'host') {
      return <div className="display-none"></div>;
    }

    return (
      
      <div className={this.state.isVisible ? 'Demo' : 'Demo display-none'}>
        <div className="demo-header">NagiosTV demo mode - Try adding some fake issues!</div>
        <table>
          <tbody>
            <tr>
              {/*<td>
                <div className="summary-label summary-label-red">Host DOWN</div>
                <button onClick={this.addHostDown}>Add</button>
                <button onClick={this.removeHostDown}>Remove</button>
              </td>*/}
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
