import React, { Component } from 'react';
import { translate } from '../../helpers/language';
//import moment from 'moment';
// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faClock, faCloudShowersHeavy, faCloudSunRain, faCloudSun, faSun } from '@fortawesome/free-solid-svg-icons';
import AlertItems from './AlertItems.jsx';
import HistoryChart from '../widgets/HistoryChart.jsx';
//import './AlertSection.css';


class AlertSection extends Component {

  // shouldComponentUpdate(nextProps, nextState) {
  //   console.log('shouldComponentUpdate', nextProps, nextState);
  //   // if (nextProps.nowtime !== this.props.nowtime || nextProps.prevtime !== this.props.prevtime) {
  //   //   return true;
  //   // } else {
  //   //   return false;
  //   // }
  //   return true;
  // }

  render() {

    // populate settingsObject with all the settingsFields values (essentially, a subset of all the items in react state)
    // const settingsObject = {};
    // this.props.settingsFields.forEach(field => settingsObject[field] = this.state[field]);
    const { language, settingsObject } = this.props;

    //const { language } = this.state;
    
    //console.log('quietFor render');
    return (
      <div className={`AlertSection`}>

        {!this.props.hideHistoryChart && <HistoryChart
          alertlist={this.props.alertlistHours}
          alertlistLastUpdate={this.props.alertlistLastUpdate}
          groupBy="hour"
          alertHoursBack={24} 
          alertDaysBack={1}
        />}

        {!this.props.hideHistoryTitle && <div className="history-summary color-orange margin-top-10">
          <span className="service-summary-title">
          <strong>{this.props.alertlistCount}</strong> {translate('alerts in the past', language)} <strong>{this.props.alertDaysBack}</strong> {translate('days', language)}
            {this.props.alertlistCount > this.props.alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {this.props.alertMaxItems})</span>}
          </span>
        </div>}

        {!this.props.hideHistoryChart && <HistoryChart
          alertlist={this.props.alertlist}
          alertlistLastUpdate={this.props.alertlistLastUpdate}
          groupBy="day"
          alertDaysBack={this.props.alertDaysBack} 
        />}

        {this.props.alertlistError && <div className="margin-top-10 border-red color-yellow ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.props.alertlistErrorMessage}</div>}

        {!this.props.alertlistError && this.props.alertlist.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          No alerts
        </div>}

        <AlertItems
          items={this.props.alertlist}
          showEmoji={this.props.showEmoji}
          settings={settingsObject}
        />
        
      </div>
    );
  }
}

export default AlertSection;
