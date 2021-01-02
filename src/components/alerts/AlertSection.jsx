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
import { translate } from '../../helpers/language';
import AlertItems from './AlertItems.jsx';
import AlertFilters from './AlertFilters.jsx';
import HistoryChart from '../widgets/HistoryChart.jsx';
import './AlertSection.css';
import $ from 'jquery';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';

class AlertSection extends Component {

  state = {
    isFetching: false,
    alertlistError: false,
    alertlistErrorMessage: '',
    alertlistLastUpdate: 0,
    alertlist: [],
    alertlistCount: 0
  };

  timeoutHandle = null;
  intervalHandle = null;

  componentDidMount() {

    this.timeoutHandle = setTimeout(() => {
      this.fetchAlertData();
    }, 1000);

    if (this.props.isDemoMode === false) {
      this.intervalHandle = setInterval(() => {
        this.fetchAlertData();
      }, this.props.fetchAlertFrequency * 1000);
    }
  }

  componentWillUnmount() {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   const propsToCauseRender = [
  //     'alertDaysBack',
  //     'alertHoursBack',
  //     'alertMaxItems',
  //     'showEmoji'
  //   ];
  //   for(let i=0;i<propsToCauseRender.length;i++) {
  //     if (nextProps[propsToCauseRender[i]] !== this.props[propsToCauseRender[i]]) {
  //       return true;
  //     }
  //   }
  //   const stateToCauseRender = [
  //     'alertlistError',
  //     'alertlistErrorMessage',
  //     'alertlistLastUpdate'
  //   ];
  //   for(let i=0;i<stateToCauseRender.length;i++) {
  //     if (nextState[stateToCauseRender[i]] !== this.state[stateToCauseRender[i]]) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  fetchAlertData() {
    const starttime = this.props.alertDaysBack * 60 * 60 * 24;
    
    let url;
    if (this.props.useFakeSampleData) {
      url = './sample-data/alertlist.json';
    } else if (this.props.settingsObject.dataSource === 'livestatus') {
      url = this.props.settingsObject.livestatusPath + `?query=alertlist&starttime=-${starttime}&endtime=%2B`;
      if (this.props.hostgroupFilter) { url += `&hostgroup=${his.props.hostgroupFilter}`; }
    } else {
      url = `${this.props.baseUrl}archivejson.cgi?query=alertlist&starttime=-${starttime}&endtime=%2B0`;
      if (this.props.hostgroupFilter) { url += `&hostgroup=${his.props.hostgroupFilter}`; }
    }

    this.setState({ isFetching: true });

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: (this.props.fetchAlertFrequency - 2) * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchAlertData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          isFetching: false,
          alertlistError: true,
          alertlistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }

      // Make an array from the object
      const alertlist = _.get(myJson.data, 'alertlist', []).reverse();

      // store the actual count of alert list items before we trim
      const alertlistCount = alertlist.length;

      // trim
      if (alertlist.length > this.props.alertMaxItems) {
        alertlist.length = this.props.alertMaxItems;
      }

      this.setState({
        isFetching: false,
        alertlistError: false,
        alertlistErrorMessage: '',
        alertlistLastUpdate: new Date().getTime(),
        alertlist, // it's already an array
        alertlistCount
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      
      this.props.handleFetchFail(this, jqXHR, textStatus, errorThrown, url, 'alertlistError', 'alertlistErrorMessage');

      this.setState({ isFetching: false });

    });
  }

  render() {

    const { language, settingsObject } = this.props;

    // count how many soft history items
    let howManyAlertSoft = 0;
    if (this.state.alertlist) {
      this.state.alertlist.forEach(alert => {
        //console.log(alert);
        if (alert.state_type === 2) {
          howManyAlertSoft++;
        }
      });
    }

    // filter the list of alert items
    const alertlist = this.state.alertlist.filter(alert => {
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
    const alertlistCount = alertlist.length;

    return (
      <div className={`AlertSection`}>

        <div className="history-summary">
          {!this.props.hideHistoryTitle && <span className="service-summary-title">
            Alert History{' '}
            {settingsObject.hostgroupFilter && <span>({settingsObject.hostgroupFilter})</span>}
          </span>}

          {/* alert history filters */}
          <AlertFilters
            hideFilters={this.props.hideFilters}
            handleSelectChange={this.props.handleSelectChange}
            handleCheckboxChange={this.props.handleCheckboxChange}
            hideAlertSoft={this.props.hideAlertSoft}
            howManyAlerts={this.state.alertlist.length}
            howManyAlertSoft={howManyAlertSoft}
            language={this.props.language}
          />

          {/* loading spinner */}
          <span className={this.state.isFetching ? 'loading-spinner' : 'loading-spinner loading-spinner-fadeout'}><FontAwesomeIcon icon={faSync} /> {this.props.fetchAlertFrequency}s</span>

        </div>


        {/* hourly alert chart */}

        {alertlist.length > 0 && <div>

          {(!this.props.hideHistoryTitle && !this.props.hideHistoryChart) && <div className="history-chart-title margin-top-10">
            <span className="">
              <strong>{alertlistHoursCount}</strong> {this.props.hideAlertSoft ? <span>hard</span> : <span>hard and soft</span>} {translate('alerts in the past', language)} <strong>{this.props.alertHoursBack}</strong> {translate('hours', language)}
              {/*this.state.alertlistCount > this.state.alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {this.state.alertMaxItems})</span>*/}
            </span>
          </div>}

          {(alertlist.length > 0 && !this.props.hideHistoryChart) && <HistoryChart
            alertlist={alertlistHours}
            alertlistLastUpdate={this.state.alertlistLastUpdate}
            groupBy="hour"
            alertHoursBack={24} 
            alertDaysBack={1}
            hideAlertSoft={this.props.hideAlertSoft}
          />}

        </div>}

        {/* full alert chart */}

        {alertlist.length > 0 && <div>

          {(!this.props.hideHistoryTitle && !this.props.hideHistoryChart) && <div className="history-chart-title margin-top-10">
            <span className="">
              <strong>{alertlistCount}</strong> {this.props.hideAlertSoft ? <span>hard</span> : <span>hard and soft</span>} {translate('alerts in the past', language)} <strong>{this.props.alertDaysBack}</strong> {translate('days', language)}
              {this.state.alertlistCount > alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {this.props.alertMaxItems})</span>}
            </span>
          </div>}

          {/* history chart */}
          {!this.props.hideHistoryChart && <HistoryChart
            alertlist={alertlist}
            alertlistLastUpdate={this.state.alertlistLastUpdate}
            groupBy="day"
            alertDaysBack={this.props.alertDaysBack} 
            hideAlertSoft={this.props.hideAlertSoft}
          />}

        </div>}

        {/** Show Error Message - If we are not in demo mode and there is a alertlist error (ajax fetching) then show the error message here */}
        {(!this.props.isDemoMode && this.state.alertlistError) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.state.alertlistErrorMessage}</div>}

        {/* No alerts */}
        {!this.state.alertlistError && alertlist.length === 0 && <div className="all-ok-item margin-top-10" style={{ opacity: 1, maxHeight: 'none' }}>
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
