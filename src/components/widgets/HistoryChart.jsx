import React, { Component } from 'react';
import './HistoryChart.css';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
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
    this.updateSeriesFromPropsDelay();

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

    // check for updates each time the alert list data refreshes
    if (nextProps.alertlistLastUpdate !== this.props.alertlistLastUpdate) {

      // update the first time alerts are loaded we will see them in the new props when old props have none
      if (nextProps.alertlist.length > this.props.alertlist.length) {
        // more items
        this.updateSeriesFromPropsDelay();
      } else if (nextProps.alertlist.length < this.props.alertlist.length) {
        // less items
        this.updateSeriesFromPropsDelay();
      // else if the timestamp of the newest alert is greater than the existing one then update
      // TODO: use _.get for this just in case there are other issues with fetching the value
      } else if (nextProps.alertlist.length > 0 && nextProps.alertlist[0].timestamp > this.props.alertlist[0].timestamp) {
        this.updateSeriesFromPropsDelay();
      }
    }

    // if any filter checkboxes were toggled then we want to update as well
    if (nextProps.hideAlertSoft !== this.props.hideAlertSoft) {
      this.updateSeriesFromPropsDelay();
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
    
    // group the alerts into an object with keys that are for each day
    // this is a super awesome one liner for grouping

    // OK
    const alertOks = this.props.alertlist.filter(alert => alert.state === 1 || alert.state === 8);
    const groupedOks = _.groupBy(alertOks, (result) => moment(result.timestamp).startOf(groupBy).format('x'));

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
    const min = d.getTime() - (86400 * 1000);
    const max = d.getTime();
    //console.log('min max', min, max);

    // OK
    if (Object.keys(groupedOks).length > 0) {
      let okData = this.massageGroupByDataIntoHighchartsData(groupedOks, min, max);
      //console.log('Setting 0', okData);
      chart.series[0].setData(okData.reverse(), true);
    }

    // WARNING
    if (Object.keys(groupedWarnings).length > 0) {
      let warningData = this.massageGroupByDataIntoHighchartsData(groupedWarnings, min, max);
      //console.log('Setting 1', warningData);
      chart.series[1].setData(warningData.reverse(), true);
    }

    // UNKNOWN
    if (Object.keys(groupedUnknowns).length > 0) {
      let unknownData = this.massageGroupByDataIntoHighchartsData(groupedUnknowns, min, max);
      //console.log('Setting 1', warningData);
      chart.series[2].setData(unknownData.reverse(), true);
    }

    // CRITICAL
    if (Object.keys(groupedCriticals).length > 0) {
      let criticalData = this.massageGroupByDataIntoHighchartsData(groupedCriticals, min, max);
      //console.log('Setting 2', criticalData);
      chart.series[3].setData(criticalData.reverse(), true);
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
      chart.series[0].update({
        visible: false
      });

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
    return (
      <div className="HistoryChart" style={{ paddingRight: '10px' }}>
        <HighchartsReact
          highcharts={Highcharts}
          options={this.chartConfig}
          callback={ this.afterChartCreated }
        />
      </div>
    );
  }
}

export default HistoryChart;
