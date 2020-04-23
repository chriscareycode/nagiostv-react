import React, { Component } from 'react';
import './NavSidebar.css';
import ReactTooltip from 'react-tooltip';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faFilter, faTachometerAlt, faTools } from '@fortawesome/free-solid-svg-icons';

class NavSidebar extends Component {

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
      <div className="NavSidebar">
        
        <div className="nav-sidebar-icon">
          <span data-tip="Dashboard">
            <FontAwesomeIcon onClick={this.clickedDashboard} className={this.props.currentPage === 'dashboard' ? 'nav-sidebar-icon-selected' : ''} icon={faTachometerAlt} />
          </span>
        </div>

        <div className="nav-sidebar-icon">
          <span data-tip="Settings">
            <FontAwesomeIcon
              onClick={this.clickedSettings}
              className={settingsIconClassName}
              icon={faTools}
            />
          </span>
        </div>

        <div className="nav-sidebar-hr"></div>

        {/*
        <div className="nav-sidebar-icon">
          <FontAwesomeIcon className="" icon={faServer} />
        </div>
        */}

        <div className="nav-sidebar-icon">
          <span data-tip="Show Charts">
            <FontAwesomeIcon onClick={this.clickedCharts} className={this.props.hideHistoryChart ? '' : 'nav-sidebar-icon-selected'} icon={faChartBar} />
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
          </span>
        </div>

        <div className="nav-sidebar-bottom-float">          

        </div>

        <ReactTooltip place="right" type="dark" effect="solid"/>
        
      </div>
    );
  }
}

export default NavSidebar;
