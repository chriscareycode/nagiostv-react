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
import './BottomPanel.css';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faFilter, faTachometerAlt, faTools, faUpload, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

class BottomPanel extends Component {

  state = {
    isVisible: true
  };

  // shouldComponentUpdate(nextProps, nextState) {
  //   //console.log('shouldComponentUpdate', nextProps, nextState);
  //   if (nextProps.nowtime !== this.props.nowtime || nextProps.prevtime !== this.props.prevtime) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  clickedDashboard = () => {
    this.props.updateRootState({
      currentPage: 'dashboard'
    });
  };

  clickedSettings = () => {
    this.props.updateRootState({
      currentPage: 'settings'
    });
  };

  clickedUpdate = () => {
    this.props.updateRootState({
      currentPage: 'autoupdate'
    });
  };

  clickedInfo = () => {
    this.props.updateRootState({
      currentPage: 'help'
    });
  };


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

  clickedNagiosTv = () => {
    this.setState({
      isVisible: !this.state.isVisible
    });
  };

  render() {
    
    let settingsIconClassName = '';
    if (this.props.currentPage === 'settings') { settingsIconClassName = 'nav-sidebar-icon-selected'; }
    if (this.props.hostlistError) { settingsIconClassName = 'nav-sidebar-icon-error'; }

    return (
      <>
      <div className="BottomPanel">
                
        <div className="bottom-panel-area">
          <div className="bottom-panel-area-text">
            {/* current version */}
            <span onClick={this.clickedNagiosTv} className="current-version">NagiosTV <span className="">v{this.props.currentVersionString}</span></span>

            {/* update available */}
            {(this.props.latestVersion > this.props.currentVersion) && <span className="update-available"><a onClick={this.clickedAutoUpdate}>v{this.props.latestVersionString} available</a></span>}
          </div>
        </div>

        <div className={this.state.isVisible ? 'bottom-panel-nav-area bottom-panel-nav-area-visible' : 'bottom-panel-nav-area'}>

          <div className="nav-sidebar-icon">
            <span>
              <FontAwesomeIcon
                onClick={this.clickedDashboard}
                className={this.props.currentPage === 'dashboard' ? 'nav-sidebar-icon-selected' : ''}
                icon={faTachometerAlt}
              />
              <div className="nav-sidebar-icon-text">Dash</div>
            </span>
          </div>

          <div className="nav-sidebar-icon" onClick={this.clickedSettings}>
            <span>
              <FontAwesomeIcon
                className={settingsIconClassName}
                icon={faTools}
              />
              <div className="nav-sidebar-icon-text">Settings</div>
            </span>
          </div>

          <div className="nav-sidebar-icon" onClick={this.clickedUpdate}>
            <span>
              <FontAwesomeIcon
                className={this.props.currentPage === 'autoupdate' ? 'nav-sidebar-icon-selected' : ''}
                icon={faUpload}
              />
              <div className="nav-sidebar-icon-text">Update</div>
            </span>
          </div>

          <div className="nav-sidebar-icon" onClick={this.clickedInfo}>
            <span>
              <FontAwesomeIcon
                className={this.props.currentPage === 'help' ? 'nav-sidebar-icon-selected' : ''}
                icon={faQuestionCircle}
              />
              <div className="nav-sidebar-icon-text">Info</div>
            </span>
          </div>

          <div className="nav-sidebar-icon-spacer"></div>
              
          <div className="nav-sidebar-icon">
            <span>
              <FontAwesomeIcon onClick={this.clickedCharts} className={this.props.hideHistoryChart ? '' : 'nav-sidebar-icon-selected'} icon={faChartBar} />
              <div className="nav-sidebar-icon-text">Charts</div>
            </span>
          </div>

          <div className="nav-sidebar-icon">
            <span>
              <FontAwesomeIcon onClick={this.clickedFilter} className={this.props.hideFilters ? '' : 'nav-sidebar-icon-selected'} icon={faFilter} />
              <div className="nav-sidebar-icon-text">Filter</div>
            </span>
          </div>

        </div>

      </div>
      </>
    );
  }
}

export default BottomPanel;
