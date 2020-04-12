import React, { Component } from 'react';
import './NavSidebar.css';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faChartBar, faFilter, faTachometerAlt, faServer, faTools } from '@fortawesome/free-solid-svg-icons';

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

  render() {
    
    return (
      <div className="NavSidebar">
        
        <div className="nav-sidebar-icon">
          <FontAwesomeIcon className="nav-sidebar-icon-selected" icon={faTachometerAlt} />
        </div>

        <div className="nav-sidebar-icon">
          <FontAwesomeIcon className="" icon={faServer} />
        </div>

        <div className="nav-sidebar-icon">
          <FontAwesomeIcon className="" icon={faChartBar} />
        </div>

        <div className="nav-sidebar-icon">
          <FontAwesomeIcon className="" icon={faBell} />
        </div>

        <div className="nav-sidebar-bottom-float">

          <div className="nav-sidebar-icon">
            <FontAwesomeIcon onClick={this.clickedFilter} className={this.props.hideFilters ? '' : 'nav-sidebar-icon-selected'} icon={faFilter} />
          </div>
          
          <div className="nav-sidebar-icon">
            <FontAwesomeIcon onClick={this.props.toggleSettings} className={this.props.showSettings ? 'nav-sidebar-icon-selected' : ''} icon={faTools} />
          </div>

        </div>

        
        
      </div>
    );
  }
}

export default NavSidebar;
