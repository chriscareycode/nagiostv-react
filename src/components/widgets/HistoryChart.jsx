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
    let results = this.props.alertlist;
    const groupBy = 'day';

    // group the alerts into an object with keys that are for each day
    // this is a super awesome one liner for grouping
    let groupedResults = _.groupBy(results, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
    //console.log('HistoryChart updateSeriesFromProps() groupedResults', groupedResults);

    let chartData = []
    Object.keys(groupedResults).forEach(group => {
      chartData.push({ x: parseInt(group), y: groupedResults[group].length });
    });
    //console.log({chartData});
    chart.series[0].setData(chartData.reverse());

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
      maxPadding: 0.1
    },

    plotOptions: {
      series: {
        pointWidth: 21,
        //pointPlacement: 'on'
      },
      // column: {
      //   pointRange: 1,
      //   pointPadding: 0.2,
      //   borderWidth: 0,
      //   stacking: "normal"
      // }
    },

    series: [{
      type: 'column',
      name: 'alerts',
      //color: 'lightblue'
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
