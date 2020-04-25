import React, { Component } from 'react';
import './NavBottomBar.css';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faFilter, faTachometerAlt, faTools } from '@fortawesome/free-solid-svg-icons';

class NavBottomBar extends Component {

  // shouldComponentUpdate(nextProps, nextState) {
  //   //console.log('shouldComponentUpdate', nextProps, nextState);
  //   if (nextProps.nowtime !== this.props.nowtime || nextProps.prevtime !== this.props.prevtime) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  clickedDashboard = () => {
    this.props.updateStateFromSettings({
      currentPage: 'dashboard'
    });
  };

  clickedFilter = () => {
    this.props.updateStateFromSettings({
      hideFilters: !this.props.hideFilters
    });
  };

  clickedSettings = () => {
    this.props.updateStateFromSettings({
      currentPage: 'settings'
    });
  };

  clickedCharts = () => {
    this.props.updateStateFromSettings({
      hideHistoryChart: !this.props.hideHistoryChart
    });
  };

  render() {
    
    let settingsIconClassName = '';
    if (this.props.currentPage === 'settings') { settingsIconClassName = 'nav-sidebar-icon-selected'; }
    if (this.props.hostlistError) { settingsIconClassName = 'nav-sidebar-icon-error'; }

    return (
      <div className="NavBottomBar">
        
        <div className="nav-sidebar-icon">
          <span data-tip="Dashboard">
            <FontAwesomeIcon onClick={this.clickedDashboard} className={this.props.currentPage === 'dashboard' ? 'nav-sidebar-icon-selected' : ''} icon={faTachometerAlt} />
            <div className="nav-sidebar-icon-text">Dash</div>
          </span>
        </div>

        <div className="nav-sidebar-icon">
          <span data-tip="Settings">
            <FontAwesomeIcon
              onClick={this.clickedSettings}
              className={settingsIconClassName}
              icon={faTools}
            />
            <div className="nav-sidebar-icon-text">Settings</div>
          </span>
        </div>

        
        <div className="nav-sidebar-version">
          <div className="nav-sidebar-version-text">

            <span>NagiosTV <span className="">v{this.props.currentVersionString}</span></span>

            {(this.props.latestVersion > this.props.currentVersion) && <div className="update-available"><a target="_blank" rel="noopener noreferrer" href="https://github.com/chriscareycode/nagiostv-react/releases">v{this.props.latestVersionString} available</a></div>}
          </div>
        </div>

        {/*
        <div className="nav-sidebar-icon">
          <FontAwesomeIcon className="" icon={faServer} />
        </div>
        */}

        <div className="nav-sidebar-icon">
          <span data-tip="Show Charts">
            <FontAwesomeIcon onClick={this.clickedCharts} className={this.props.hideHistoryChart ? '' : 'nav-sidebar-icon-selected'} icon={faChartBar} />
            <div className="nav-sidebar-icon-text">Charts</div>
          </span>
        </div>

        {/*
        <div className="nav-sidebar-icon">
          <FontAwesomeIcon className="" icon={faBell} />
        </div>
        */}

        <div className="nav-sidebar-icon">
          <span data-tip="Show Filters">
            <FontAwesomeIcon onClick={this.clickedFilter} className={this.props.hideFilters ? '' : 'nav-sidebar-icon-selected'} icon={faFilter} />
            <div className="nav-sidebar-icon-text">Filter</div>
          </span>
        </div>

      </div>
    );
  }
}

export default NavBottomBar;
