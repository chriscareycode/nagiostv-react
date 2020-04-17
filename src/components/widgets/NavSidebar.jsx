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

  clickedFilter = () => {
    this.props.updateStateFromSettings({
      hideFilters: !this.props.hideFilters
    });
  };

  clickedSettings = () => {
    this.props.updateStateFromSettings({
      showSettings: !this.props.showSettings
    });
  };

  clickedCharts = () => {
    this.props.updateStateFromSettings({
      hideHistoryChart: !this.props.hideHistoryChart
    });
  };

  render() {
    
    return (
      <div className="NavSidebar">
        
        <div className="nav-sidebar-icon">
          <span data-tip="Dashboard">
            <FontAwesomeIcon className="nav-sidebar-icon-selected" icon={faTachometerAlt} />
          </span>
        </div>

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
          <span data-tip="Filters">
            <FontAwesomeIcon onClick={this.clickedFilter} className={this.props.hideFilters ? '' : 'nav-sidebar-icon-selected'} icon={faFilter} />
          </span>
        </div>
        
        <div className="nav-sidebar-icon">
          <span data-tip="Settings">
            <FontAwesomeIcon onClick={this.props.toggleSettings} className={this.props.showSettings ? 'nav-sidebar-icon-selected' : ''} icon={faTools} />
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
