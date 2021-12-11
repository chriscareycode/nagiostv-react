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
import './HistoryChart.css';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import _ from 'lodash';
import moment from 'moment';

class HistoryChart extends Component {

  state = {
    intervalHandle: null
  };

  constructor(props) {
    super(props);
    this.afterChartCreated = this.afterChartCreated.bind(this);
  }

  componentDidMount() {
    this.updateSeriesFromProps();

    const intervalHandle = setInterval(() => {
      this.updateSeriesFromPropsDelay();
    }, 3600 * 1000);

    this.setState({
      intervalHandle
    });
  }

  componentWillUnmount() {
    clearInterval(this.state.intervalHandle);
  }

  shouldComponentUpdate(nextProps, nextState) {

    //console.log('shouldComponentUpdate() nextProps, nextState', nextProps, nextState);

    // check for updates each time the alert list data refreshes
    if (nextProps.alertlistLastUpdate !== this.props.alertlistLastUpdate) {

      // update the first time alerts are loaded we will see them in the new props when old props have none
      if (nextProps.alertlist.length > this.props.alertlist.length) {
        // more items
        this.updateSeriesFromPropsDelay();
        //console.log('more items');
      } else if (nextProps.alertlist.length < this.props.alertlist.length) {
        // less items
        this.updateSeriesFromPropsDelay();
        //console.log('less items');
      // else if the timestamp of the newest alert is greater than the existing one then update
      // TODO: use _.get for this just in case there are other issues with fetching the value
      } else if (nextProps.alertlist.length > 0 && nextProps.alertlist[0].timestamp > this.props.alertlist[0].timestamp) {
        this.updateSeriesFromPropsDelay();
        //console.log('newer timestamp');
      }
      return true;
    }

    // if any filter checkboxes were toggled then we want to update as well
    if (nextProps.hideAlertSoft !== this.props.hideAlertSoft) {
      this.updateSeriesFromPropsDelay();
      return true;
    }

    // we never re-render this component since once highcharts is mounted, we don't want to re-render it over and over
    // we just want to use the update functions to update the existing chart
    return false;
  }

  afterChartCreated(chart) {
    //console.log('afterChartCreated', chart);
    this.internalChart = chart;
  }

  updateSeriesFromPropsDelay() {
    setTimeout(() => {
      this.updateSeriesFromProps();
    }, 1000);
  }

  massageGroupByDataIntoHighchartsData(groupByData, min, max) {

    let returnArray = [];

    // trying to fix highcharts bug by adding first and last hour on the hourly chart
    if (this.props.groupBy === 'hour') {
      // only if there is not already an entry for the last hour group
      if (!groupByData.hasOwnProperty(max)) {
        returnArray.push({ x: max, y: 0, xNice: new Date(max) });
      }
    }

    Object.keys(groupByData).forEach(group => {
      returnArray.push({ x: parseInt(group), y: groupByData[group].length, xNice: new Date(parseInt(group)) });
    });

    // trying to fix highcharts bug by adding first and last hour on the hourly chart
    if (this.props.groupBy === 'hour') {
      // only if there is not already an entry for the last hour group
      if (!groupByData.hasOwnProperty(min)) {
        returnArray.push({ x: min, y: 0, xNice: new Date(min) });
      }
    }

    return returnArray;
  }

  // multiple stacked charts for OK, WARNING and CRITICAL
  updateSeriesFromProps() {
    
    // chart stuff
    const chart = this.internalChart;
    //console.log('updateSeriesFromProps', chart);
    if (Object.keys(chart).length === 0) {
      console.log('No chart found. Maybe hidden.');
      return;
    }

    const groupBy = this.props.groupBy;

    //console.log('updateSeriesFromProps() this.props.alertlist', groupBy, this.props.alertlist);
    
    // group the alerts into an object with keys that are for each day
    // this is a super awesome one liner for grouping

    // OK
    const alertOks = this.props.alertlist.filter(alert => alert.state === 1 || alert.state === 8);
    const groupedOks = _.groupBy(alertOks, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
    //console.log('updateSeriesFromProps() groupedOks', groupBy, groupedOks);

    // WARNING
    const alertWarnings = this.props.alertlist.filter(alert => alert.state === 16);
    const groupedWarnings = _.groupBy(alertWarnings, (result) => moment(result.timestamp).startOf(groupBy).format('x'));

    // UNKNOWN
    const alertUnknowns = this.props.alertlist.filter(alert => alert.state === 64);
    const groupedUnknowns = _.groupBy(alertUnknowns, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
  
    // CRITICAL
    const alertCriticals = this.props.alertlist.filter(alert => alert.state === 2 || alert.state === 32);
    const groupedCriticals = _.groupBy(alertCriticals, (result) => moment(result.timestamp).startOf(groupBy).format('x'));

    var d = new Date();
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);

    // calculate min and max for hourly chart
    const min = d.getTime() - (86400 * 1000) + (3600 * 1000);
    const max = d.getTime() + (0 * 1000); // This 3600 * 1000 is an attempt to fix the spacing on the hourly chart. Without this we only saw 1/2 of the last hour.. ?
    //console.log('min max', min, max);

    // HighCharts setData
    // https://api.highcharts.com/class-reference/Highcharts.Series.html#setData
    
    // OK
    if (Object.keys(groupedOks).length > 0) {
      let okData = this.massageGroupByDataIntoHighchartsData(groupedOks, min, max);
      //console.log('Setting 0 okData', groupBy, okData);
      chart.series[0].setData(okData.reverse(), true);
    } else {
      chart.series[0].setData([], true);
    }

    // WARNING
    if (Object.keys(groupedWarnings).length > 0) {
      let warningData = this.massageGroupByDataIntoHighchartsData(groupedWarnings, min, max);
      // console.log('Setting 1', warningData);
      // console.log('chart.series', chart.series);
      chart.series[1].setData(warningData.reverse(), true);
    } else {
      chart.series[1].setData([], true);
    }

    // UNKNOWN
    if (Object.keys(groupedUnknowns).length > 0) {
      let unknownData = this.massageGroupByDataIntoHighchartsData(groupedUnknowns, min, max);
      //console.log('Setting 1', warningData);
      chart.series[2].setData(unknownData.reverse(), true);
    } else {
      chart.series[2].setData([], true);
    }

    // CRITICAL
    if (Object.keys(groupedCriticals).length > 0) {
      let criticalData = this.massageGroupByDataIntoHighchartsData(groupedCriticals, min, max);
      //console.log('Setting 2', criticalData);
      chart.series[3].setData(criticalData.reverse(), true);
    } else {
      chart.series[3].setData([], true);
    }
    
    if (this.props.groupBy === 'hour' && chart.update) {

      chart.update({
        xAxis: {
          tickInterval: 3600 * 1000,
          min: min,
          max: max
          // show 1 hr ago instead of time
          // labels: {
          //   formatter: (e) => {
          //     //console.log(e);
          //     const diff = new Date().getTime() - e.value;
          //     const hoursAgo = moment.duration(diff).asHours();
          //     return Math.floor(hoursAgo) + 'h ago';
          //   }
          // }
        }
      });

      // update pointWidth based on howManyItems
      const barWidth = (((window.innerWidth + 100) / 2) / this.props.alertHoursBack).toFixed(0);

      chart.update({
        plotOptions: {
          series: {
            pointWidth: barWidth
          }
        }
      });

      chart.redraw(false);
    }

    if (this.props.groupBy === 'day') {

      // update pointWidth based on howManyItems
      const barWidth = (((window.innerWidth + 100) / 2) / this.props.alertDaysBack).toFixed(0);

      chart.update({
        plotOptions: {
          series: {
            pointWidth: barWidth
          }
        }
      });

      chart.redraw(false);

      // turn off the UP/OK filter on the day chart
      // this will hide green items on that chart
      // chart.series[0].update({
      //   visible: false
      // });

    }

    //chart.series[0].redraw();
    //chart.series[1].redraw();
    //chart.series[2].redraw();
    //chart.series[3].redraw();
  }

  chartConfig = {
    title: '',
    credits: false,
    chart: {
      backgroundColor:'transparent',
      height: '170px'
    },

    time: {
      timezoneOffset: new Date().getTimezoneOffset()
    },

    legend:{
      enabled: true
    },

    xAxis: {
      type: 'datetime',
      lineColor: '#222',
      startOnTick: false,
      endOnTick: false
    },
    yAxis: {
      title: { text: '' },
      gridLineColor: '#222222',
      maxPadding: 0.1,
      stackLabels: {
        enabled: false
      }
    },

    plotOptions: {
      series: {
        pointPadding: 0.00
        //pointWidth: 21, // this is changed dynamically with a function above
        //pointPlacement: 'on'
      },
      column: {
        borderWidth: 0,
        stacking: 'normal',
        dataLabels: {
          enabled: false
        }
      }
    },

    series: [
    {
      type: 'column',
      name: 'UP/OK',
      color: 'lime'
    },
    {
      type: 'column',
      name: 'WARNING',
      color: 'yellow'
    },
    {
      type: 'column',
      name: 'UNKNOWN',
      color: 'orange'
    },
    {
      type: 'column',
      name: 'CRITICAL',
      color: '#FD7272'
    }]
  };

  
  render() {
    
    const debugMode = document.location.search.indexOf('debug=true') !== -1;
    const alertlistDebug = this.props.alertlist.map((al, i) => {
      //if (this.props.groupBy === 'hour') { console.log(al); }
      return (<div key={i}>{al.timestamp} - {moment(al.timestamp).locale('en').format('llll')} - {al.description} - {al.plugin_output}</div>);
    });

    return (
      <div className="HistoryChart">
        <HighchartsReact
          highcharts={Highcharts}
          options={this.chartConfig}
          callback={ this.afterChartCreated }
        />

        {(debugMode && this.props.groupBy === 'hour') && <div style={{ marginBottom: '30px' }}>{alertlistDebug}</div>}
        
      </div>
    );
  }
}

export default HistoryChart;
