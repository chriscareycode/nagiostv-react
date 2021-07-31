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

// React Router
import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  NavLink,
  withRouter

} from "react-router-dom";
import Cookie from 'js-cookie';
import './BottomPanel.css';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faFilter, faTachometerAlt, faTools, faUpload, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

class BottomPanel extends Component {

  state = {
    isVisible: false,
    skipVersionCookieVersion: 0,
    skipVersionCookieVersionString: '',
  };

  componentDidMount() {
    this.loadSkipVersionCookie();
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   //console.log('shouldComponentUpdate', nextProps, nextState);
  //   if (nextProps.nowtime !== this.props.nowtime || nextProps.prevtime !== this.props.prevtime) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  

  /*
  clickedCharts = () => {
    this.props.updateRootState({
      hideHistoryChart: !this.props.hideHistoryChart
    });
  };

  clickedFilter = () => {
    this.props.updateRootState({
      hideFilters: !this.props.hideFilters
    });
  };
  */

  clickedDashboard = (e) => {
    this.navigateTo(e, '/');
  };

  clickedSettings = (e) => {
    this.navigateTo(e, '/settings');
  };

  clickedUpdate = (e) => {
    this.navigateTo(e, '/update');
  };

  clickedInfo = (e) => {
    this.navigateTo(e, '/help');
  };

  navigateTo = (e, pathname) => {
    e.preventDefault();
    
    this.props.history.push({
      pathname,
      //state: param
    });

    // Close menu
    setTimeout(() => {
      this.setState({
        isVisible: !this.state.isVisible
      });
    }, 800);
  };

  clickedNagiosTv = (e) => {
    e.preventDefault();
    this.setState({
      isVisible: !this.state.isVisible
    });
  };

  clickedUpdateAvailable = (e) => {
    e.preventDefault();
    this.clickedUpdate(e);
  };

  loadSkipVersionCookie = () => {
    const cookieString = Cookie.get('skipVersion');
    if (cookieString) {
      try {
        const skipVersionObj = JSON.parse(cookieString);
        if (skipVersionObj) {
          //console.log('Loaded skipVersion cookie', skipVersionObj);
          this.setState({
            skipVersionCookieVersion: skipVersionObj.version,
            skipVersionCookieVersionString: skipVersionObj.version_string
          });
        }
      } catch (e) {
        console.log('Could not parse the skipVersion cookie');
      }
    }
  };

  clickedSkipVersion = (e) => {
    e.preventDefault();
    const latestVersion = this.props.latestVersion;
    const latestVersionString = this.props.latestVersionString;
    const skipVersionObj = {
      version: latestVersion,
      version_string: latestVersionString
    };
    Cookie.set('skipVersion', JSON.stringify(skipVersionObj));
    this.setState({
      skipVersionCookieVersion: latestVersion,
      skipVersionCookieVersionString: latestVersionString
    });
  };

  render() {
    
    const isUpdateAvailable = this.props.latestVersion > this.props.currentVersion;

    return (
      <>
        <div className="BottomPanel">

          {this.props.settingsObject.hideBottomMenu && <div className="bottom-panel-nagiostv-brand">NagiosTV</div>}

          {this.props.settingsObject.hideBottomMenu === false && <div className="bottom-panel-area">
            <div className="bottom-panel-area-text">
              {/* current version */}
              <span className="current-version" onClick={this.clickedNagiosTv}>NagiosTV <span className="">v{this.props.currentVersionString}</span></span>

              {/* update available */}
              {(isUpdateAvailable && this.state.skipVersionCookieVersion !== this.props.latestVersion) && (
              <span>
                <span className="update-available">
                  <a onClick={this.clickedUpdateAvailable}>v{this.props.latestVersionString} available</a>
                  &nbsp;-&nbsp;
                  <a onClick={this.clickedSkipVersion}>skip this version</a>
                </span>
                
                
              </span>
              )}
            </div>
          </div>}

          <div className={this.state.isVisible ? 'bottom-panel-nav-area bottom-panel-nav-area-visible' : 'bottom-panel-nav-area'}>

            <Router>
            <div className="nav-sidebar-icon">
              <span>
                <NavLink exact={true} activeClassName='is-active' to="/" onClick={this.clickedDashboard}>
                  <FontAwesomeIcon
                    className="nav-sidebar-icon-icon"
                    icon={faTachometerAlt}
                  />
                  <div className="nav-sidebar-icon-text">Dash</div>
                </NavLink>
              </span>
            </div>

            <div className="nav-sidebar-icon" >
              <span>
                <NavLink activeClassName='is-active' to="/settings" onClick={this.clickedSettings}>
                  <FontAwesomeIcon
                    className="nav-sidebar-icon-icon"
                    icon={faTools}
                  />
                  <div className="nav-sidebar-icon-text">Settings</div>
                </NavLink>
              </span>
            </div>

            <div className="nav-sidebar-icon">
              <span>
                <NavLink activeClassName='is-active' className={isUpdateAvailable ? 'update-available-button' : ''} to="/update" onClick={this.clickedUpdate}>
                  <FontAwesomeIcon
                    className="nav-sidebar-icon-icon"
                    icon={faUpload}
                  />
                  <div className="nav-sidebar-icon-text">Update</div>
                </NavLink>
              </span>
            </div>

            <div className="nav-sidebar-icon">
              <span>
                <NavLink activeClassName='is-active' to="/help" onClick={this.clickedInfo}>
                  <FontAwesomeIcon
                    className="nav-sidebar-icon-icon"
                    icon={faQuestionCircle}
                  />
                  <div className="nav-sidebar-icon-text">Info</div>
                </NavLink>
              </span>
            </div>

            {/*
            <div className="nav-sidebar-icon-spacer"></div>
                
            <div className="nav-sidebar-icon">
              <span className={this.props.hideHistoryChart ? '' : 'is-active'}>
                <FontAwesomeIcon onClick={this.clickedCharts} icon={faChartBar} />
                <div className="nav-sidebar-icon-text">Charts</div>
              </span>
            </div>

            <div className="nav-sidebar-icon">
              <span className={this.props.hideFilters ? '' : 'is-active'}>
                <FontAwesomeIcon onClick={this.clickedFilter} icon={faFilter} />
                <div className="nav-sidebar-icon-text">Filter</div>
              </span>
            </div>
            */}

            </Router>

          </div>

        </div>
      </>
    );
  }
}

export default withRouter(BottomPanel);
