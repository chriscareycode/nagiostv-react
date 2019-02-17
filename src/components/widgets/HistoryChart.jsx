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

  shouldComponentUpdate(nextProps, nextState) {

    // check for updates each time the alert list data refreshes
    if (nextProps.alertlistLastUpdate !== this.props.alertlistLastUpdate) {

      // check if we have anything new in the alert data, otherwise skip the whole process
      // right now were checking for length, but it might make more sense to look at the timestamp of the first alert
      if (nextProps.alertlist.length !== this.props.alertlist.length) {

        // ok we passed those conditions, fire off a update to the chart
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

  //TODO: get multiple stacked charts for WARNING and CRITICAL
  updateSeriesFromProps() {
    // chart stuff
    let chart = this.refs.chart.getChart();
    //let results = this.props.alertlist;
    const groupBy = 'day';

    const alertOks = this.props.alertlist.filter(alert => alert.state === 1 || alert.state === 8);
    const groupedOks = _.groupBy(alertOks, (result) => moment(result.timestamp).startOf(groupBy).format('x'));

    const alertWarnings = this.props.alertlist.filter(alert => alert.state === 16);
    const groupedWarnings = _.groupBy(alertWarnings, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
    
    // group the alerts into an object with keys that are for each day
    // this is a super awesome one liner for grouping
    const alertCriticals = this.props.alertlist.filter(alert => alert.state === 2 || alert.state === 32);
    const groupedCriticals = _.groupBy(alertCriticals, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
    //console.log('HistoryChart updateSeriesFromProps() groupedResults', groupedResults);

    let okData = []
    Object.keys(groupedOks).forEach(group => {
      okData.push({ x: parseInt(group), y: groupedOks[group].length });
    });
    chart.series[0].setData(okData.reverse());

    let warningData = []
    Object.keys(groupedWarnings).forEach(group => {
      warningData.push({ x: parseInt(group), y: groupedWarnings[group].length });
    });
    chart.series[1].setData(warningData.reverse());

    let criticalData = []
    Object.keys(groupedCriticals).forEach(group => {
      criticalData.push({ x: parseInt(group), y: groupedCriticals[group].length });
    });
    chart.series[2].setData(criticalData.reverse());

    // update pointWidth based on howManyItems
    const howManyItems = this.props.alertDaysBack;
    const screenWidth = window.innerWidth;
    const barWidth = (screenWidth / howManyItems).toFixed(0) - 18; // this line probably needs work, I just made up the number
    chart.update({
      plotOptions: {
        series: {
          pointWidth: barWidth
        }
      }
    });

  }

  // componentDidMount() {
  // }

  // componentWillUnmount() {
  // }

  // UNSAFE_componentWillReceiveProps() {
  //  console.log('componentWillReceiveProps');
  // }

  chartConfig = {
    title: '',
    credits: false,
    chart: {
      backgroundColor:'transparent',
      height: '170px'
      //spacingTop: 0
    },

    legend:{ enabled:false },

    xAxis: {
      type: 'datetime',
      lineColor: '#222'
    },
    yAxis: {
      title: { text: '' },
      gridLineColor: '#222222',
      endOnTick: false,
      maxPadding: 0.1,
      stackLabels: {
        enabled: false
      }
    },

    plotOptions: {
      series: {
        pointWidth: 21,
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

    series: [{
      type: 'column',
      name: 'UP/OK',
      color: 'lime'
    },{
      type: 'column',
      name: 'WARNING',
      color: 'yellow'
    },{
      type: 'column',
      name: 'CRITICAL',
      color: '#FD7272'
    }]
  };

  render() {
    return (
      <div className="HistoryChart" style={{ paddingRight: '10px' }}>
        <ReactHighcharts config={this.chartConfig} ref="chart"></ReactHighcharts>
      </div>
    );
  }
}

export default HistoryChart;
