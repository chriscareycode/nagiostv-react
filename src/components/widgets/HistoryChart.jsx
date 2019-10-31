import React, { Component } from 'react';
import './HistoryChart.css';
import ReactHighcharts from 'react-highcharts';
import _ from 'lodash';
import moment from 'moment';

ReactHighcharts.Highcharts.setOptions({
  time: {
    timezoneOffset: new Date().getTimezoneOffset()
  },
});

class HistoryChart extends Component {

  state = {
    intervalHandle: null
  };

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

  // UNSAFE_componentWillReceiveProps() {
  //  console.log('componentWillReceiveProps');
  // }

  shouldComponentUpdate(nextProps, nextState) {

    // check for updates each time the alert list data refreshes
    if (nextProps.alertlistLastUpdate !== this.props.alertlistLastUpdate) {

      // update the first time alerts are loaded we will see them in the new props when old props have none
      if (nextProps.alertlist.length > this.props.alertlist.length) {
        this.updateSeriesFromPropsDelay();
      // else if the timestamp of the newest alert is greater than the existing one then update
      // TODO: use _.get for this just in case there are other issues with fetching the value
      } else if (nextProps.alertlist.length > 0 && nextProps.alertlist[0].timestamp > this.props.alertlist[0].timestamp) {
        this.updateSeriesFromPropsDelay();
      }
    }
    // we never re-render this component since once highcharts is mounted, we don't want to re-render it over and over
    // we just want to use the update functions to update the existing chart
    return false;
  }

  updateSeriesFromPropsDelay() {
    setTimeout(() => {
      this.updateSeriesFromProps();
    }, 1000);
  }

  // multiple stacked charts for OK, WARNING and CRITICAL
  updateSeriesFromProps() {
    
    // chart stuff
    let chart = this.refs[`chart${this.props.groupBy}`].getChart();

    const groupBy = this.props.groupBy;
    
    const alertOks = this.props.alertlist.filter(alert => alert.state === 1 || alert.state === 8);
    const groupedOks = _.groupBy(alertOks, (result) => moment(result.timestamp).startOf(groupBy).format('x'));

    const alertWarnings = this.props.alertlist.filter(alert => alert.state === 16);
    const groupedWarnings = _.groupBy(alertWarnings, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
    
    // group the alerts into an object with keys that are for each day
    // this is a super awesome one liner for grouping
    const alertCriticals = this.props.alertlist.filter(alert => alert.state === 2 || alert.state === 32);
    const groupedCriticals = _.groupBy(alertCriticals, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
    //console.log('HistoryChart updateSeriesFromProps() groupedResults', groupedResults);

    var d = new Date();
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);

    const min = d.getTime() - (86400 * 1000);
    const max = d.getTime();

    // OK
    let okData = [];
    //okData.push({ x: max, y: 0});
    Object.keys(groupedOks).forEach(group => {
      okData.push({ x: parseInt(group), y: groupedOks[group].length });
    });
    okData.push({ x: min, y: 0});
    //console.log('Setting 0', okData);
    chart.series[0].setData(okData.reverse(), true);

    // WARNING
    let warningData = [];
    //warningData.push({ x: max, y: 0});
    Object.keys(groupedWarnings).forEach(group => {
      warningData.push({ x: parseInt(group), y: groupedWarnings[group].length });
    });
    warningData.push({ x: min, y: 0});
    //console.log('Setting 1', warningData);
    chart.series[1].setData(warningData.reverse(), true);

    // CRITICAL
    let criticalData = [];
    //criticalData.push({ x: max, y: 0});
    Object.keys(groupedCriticals).forEach(group => {
      criticalData.push({ x: parseInt(group), y: groupedCriticals[group].length });
    });
    criticalData.push({ x: min, y: 0});
    //console.log('Setting 2', criticalData);
    chart.series[2].setData(criticalData.reverse(), true);

    
    if (this.props.groupBy === 'hour') {

      chart.update({
        xAxis: {
          tickInterval: 3600 * 1000,
          min: min,
          max: max
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
    }

    //chart.series[0].redraw();
    //chart.series[1].redraw();
    //chart.series[2].redraw();
  }

  chartConfig = {
    title: '',
    credits: false,
    chart: {
      backgroundColor:'transparent',
      height: '170px'
      //spacingTop: 0
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
      //endOnTick: false,
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
          enabled: false,
          //color: (ReactHighcharts.Highcharts.theme && ReactHighcharts.Highcharts.theme.dataLabelsColor) || 'white'
        }
      }
      // column: {
      //   pointRange: 1,
      //   pointPadding: 0.2,
      //   borderWidth: 0,
      //   stacking: "normal"
      // }
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
      name: 'CRITICAL',
      color: '#FD7272'
    }]
  };

  render() {
    return (
      <div className="HistoryChart" style={{ paddingRight: '10px' }}>
        <ReactHighcharts config={this.chartConfig} ref={`chart${this.props.groupBy}`}></ReactHighcharts>
      </div>
    );
  }
}

export default HistoryChart;
