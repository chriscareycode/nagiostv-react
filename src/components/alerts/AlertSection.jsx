import React, { Component } from 'react';
import { translate } from '../../helpers/language';
//import moment from 'moment';
// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faClock, faCloudShowersHeavy, faCloudSunRain, faCloudSun, faSun } from '@fortawesome/free-solid-svg-icons';
import AlertItems from './AlertItems.jsx';
import AlertFilters from './AlertFilters.jsx';
import HistoryChart from '../widgets/HistoryChart.jsx';
import './AlertSection.css';
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

  shouldComponentUpdate(nextProps, nextState) {
    // const propsToCauseRender = [
    //   'hideFilters',
    //   'hideAlertSoft',
    //   'howManyAlertSoft'
    // ];
    // for(let i=0;i<propsToCauseRender.length;i++) {
    //   if (nextProps[propsToCauseRender[i]] !== this.props[propsToCauseRender[i]]) {
    //     return true;
    //   }
    // }
    return true;
  }

  

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

    // filter the list of alert items
    const alertlist = this.props.alertlist.filter(alert => {
      if (this.props.hideAlertSoft) {
        if (alert.state_type === 2) {
          return false;
        }
      }
      return true;
    });

    // get the alertlist for the past n hours
    const alertlistHours = alertlist.filter(a => new Date().getTime() - a.timestamp < this.props.alertHoursBack * 3600 * 1000);
    const alertlistHoursCount = alertlistHours.length;

    // TODO: move alertlistHoursCount here

    const alertlistCount = alertlist.length;

    return (
      <div className={`AlertSection`}>

        <div className="history-summary">
          {!this.props.hideHistoryTitle && <span className="service-summary-title">
            Alert History
          </span>}

          {/* alert history filters */}
          <AlertFilters
            hideFilters={this.props.hideFilters}
            handleSelectChange={this.props.handleSelectChange}
            handleCheckboxChange={this.props.handleCheckboxChange}
            hideAlertSoft={this.props.hideAlertSoft}
            howManyAlertSoft={howManyAlertSoft}
            language={this.props.language}
          />
        </div>


        {/* hourly alert chart */}

        {alertlist.length > 0 && <div>

          {(!this.props.hideHistoryTitle && !this.props.hideHistoryChart) && <div className="history-summary margin-top-10">
            <span className="service-summary-title">
              <strong>{alertlistHoursCount}</strong> {translate('alerts in the past', language)} <strong>{this.props.alertHoursBack}</strong> {translate('hours', language)}
              {/*this.state.alertlistCount > this.state.alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {this.state.alertMaxItems})</span>*/}
            </span>
          </div>}

          {(alertlist.length > 0 && !this.props.hideHistoryChart) && <HistoryChart
            alertlist={alertlistHours}
            alertlistLastUpdate={this.props.alertlistLastUpdate}
            groupBy="hour"
            alertHoursBack={24} 
            alertDaysBack={1}
            hideAlertSoft={this.props.hideAlertSoft}
          />}

        </div>}

        {/* full alert chart */}

        {alertlist.length > 0 && <div>

          {!this.props.hideHistoryTitle && <div className="history-summary margin-top-10">
            <span className="service-summary-title">
              <strong>{alertlistCount}</strong> {translate('alerts in the past', language)} <strong>{this.props.alertDaysBack}</strong> {translate('days', language)}
              {this.props.alertlistCount > this.props.alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {this.props.alertMaxItems})</span>}
            </span>
          </div>}

          {/* history chart */}
          {!this.props.hideHistoryChart && <HistoryChart
            alertlist={alertlist}
            alertlistLastUpdate={this.props.alertlistLastUpdate}
            groupBy="day"
            alertDaysBack={this.props.alertDaysBack} 
            hideAlertSoft={this.props.hideAlertSoft}
          />}

        </div>}

        {/** Show Error Message - If we are not in demo mode and there is a servicelist error (ajax fetching) then show the error message here */}
        {(!this.props.isDemoMode && this.props.alertlistError) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.props.alertlistErrorMessage}</div>}

        {/* No alerts */}
        {!this.props.alertlistError && this.props.alertlist.length === 0 && <div className="all-ok-item margin-top-10" style={{ opacity: 1, maxHeight: 'none' }}>
          <span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">No alerts</span>
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
