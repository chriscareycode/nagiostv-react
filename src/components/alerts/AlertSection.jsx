import React, { Component } from 'react';
import { translate } from '../../helpers/language';
//import moment from 'moment';
// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faClock, faCloudShowersHeavy, faCloudSunRain, faCloudSun, faSun } from '@fortawesome/free-solid-svg-icons';
import AlertItems from './AlertItems.jsx';
import AlertFilters from './AlertFilters.jsx';
import HistoryChart from '../widgets/HistoryChart.jsx';
//import './AlertSection.css';
//import Checkbox from '../widgets/Checkbox.jsx';

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

    const { language, settingsObject } = this.props;

    // count how many soft history items
    let howManyAlertSoft = 0;
    if (this.props.alertlist) {
      this.props.alertlist.forEach(alert => {
        //console.log(alert);
        if (alert.state_type === 2) {
          howManyAlertSoft++;
        }
      });
    }

    const alertlist = this.props.alertlist.filter(alert => {
      if (this.props.hideAlertSoft) {
        if (alert.state_type === 2) {
          return false;
        }
      }
      return true;
    });
    
    return (
      <div className={`AlertSection`}>

        {/* hourly alert chart */}

        {(!this.props.hideHistoryTitle && !this.props.hideHistoryChart) && <div className="history-summary color-orange margin-top-10">
          <span className="service-summary-title">
          <strong>{this.props.alertlistHoursCount}</strong> {translate('alerts in the past', language)} <strong>{this.props.alertHoursBack}</strong> {translate('hours', language)}
            {/*this.state.alertlistCount > this.state.alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {this.state.alertMaxItems})</span>*/}
          </span>
        </div>}

        {!this.props.hideHistoryChart && <HistoryChart
          alertlist={this.props.alertlistHours}
          alertlistLastUpdate={this.props.alertlistLastUpdate}
          groupBy="hour"
          alertHoursBack={24} 
          alertDaysBack={1}
        />}

        {/* full alert chart */}

        {!this.props.hideHistoryTitle && <div className="history-summary color-orange margin-top-10">
          <span className="service-summary-title">
          <strong>{this.props.alertlistCount}</strong> {translate('alerts in the past', language)} <strong>{this.props.alertDaysBack}</strong> {translate('days', language)}
            {this.props.alertlistCount > this.props.alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {this.props.alertMaxItems})</span>}
          </span>
        </div>}

        {/* alert history filters */}
        <AlertFilters
          hideFilters={this.props.hideFilters}
          handleSelectChange={this.props.handleSelectChange}
          handleCheckboxChange={this.props.handleCheckboxChange}
          hideAlertSoft={this.props.hideAlertSoft}
          howManyAlertSoft={howManyAlertSoft}
          language={this.props.language}
        />

        {!this.props.hideHistoryChart && <HistoryChart
          alertlist={alertlist}
          alertlistLastUpdate={this.props.alertlistLastUpdate}
          groupBy="day"
          alertDaysBack={this.props.alertDaysBack} 
        />}

        {/* error area */}

        {this.props.alertlistError && <div className="margin-top-10 border-red color-yellow ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.props.alertlistErrorMessage}</div>}

        {!this.props.alertlistError && this.props.alertlist.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          No alerts
        </div>}

        {/* alert items */}

        <AlertItems
          items={alertlist}
          showEmoji={this.props.showEmoji}
          settings={settingsObject}
        />
        
      </div>
    );
  }
}

export default AlertSection;
