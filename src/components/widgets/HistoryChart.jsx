import React, { Component } from 'react';
import './HistoryChart.css';
import ReactHighcharts from 'react-highcharts';
import _ from 'lodash';
import moment from 'moment';

class HistoryChart extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    // if (nextProps.nowtime !== this.props.nowtime || nextProps.prevtime !== this.props.prevtime) {
    //   return true;
    // } else {
    //   return false;
    // }
    if (nextProps.alertlistLastUpdate !== 0 || (nextProps.alertlistLastUpdate !== this.props.alertlistLastUpdate)) {
      //console.log('HistoryChart shouldComponentUpdate() alertlistLastUpdate changed');
      //this.updateSeriesFromProps();
      this.updateSeriesFromPropsDelay();
      //return true;
    }
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
    //const groupBy = 'hour';
    const groupBy = 'day';
    let groupedResults = _.groupBy(results, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
    //console.log('HistoryChart updateSeriesFromProps() groupedResults', groupedResults);

    let chartData = []
    Object.keys(groupedResults).forEach(group => {
      chartData.push({ x: parseInt(group), y: groupedResults[group].length });
    });
    console.log({chartData});
    chart.series[0].setData(chartData.reverse());

    //TODO: update pointWidth based on howManyItems
    const howManyItems = this.props.alertDaysBack;
    const screenWidth = window.innerWidth;
    const barWidth = (screenWidth / howManyItems).toFixed(0) - 10; // this line probably needs work, I just made up the -10
    chart.update({
      plotOptions: {
        series: {
          pointWidth: barWidth
        }
      }
    });
    //chart.reflow();

    // console.log('updateSeriesFromProps() alertlist', this.props.alertlist);
    // this.props.alertlist.forEach(alert => {
    //  console.log('alert', alert);
    //  chart.series[0].addPoint({x: alert.timestamp, y: alert.host_name + alert.description});
    // });
  }

  componentDidMount() {

    

    // chart.series[0].addPoint({x: 10, y: 12});
    // chart.series[0].addPoint({x: 11, y: 14});
    // chart.series[0].addPoint({x: 12, y: 16});
  }

  componentWillUnmount() {

  }

  // UNSAFE_componentWillReceiveProps() {
  //  console.log('componentWillReceiveProps');
  // }

  chartConfig = {
    title: '',
    credits: false,
    chart: {
      backgroundColor:'transparent',
      height: '170px',
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
    // xAxis: [{
    //   type: 'datetime',
    //   tickInterval: 1000 * 3600,
    //   labels: {
        
    //     enabled: false
    //   },
    //   tickPositioner: function () {
    //     const previousAxisTicks = this.chart.xAxis[0].tickPositions
    //     const ticks = previousAxisTicks.map(tick => tick + 36e5 / 2)
        
    //     ticks.push(ticks[ticks.length - 1] + 36e5)
    //     ticks.info = previousAxisTicks.info
        
    //     return ticks
    //   },
    //   offset: 0,
    // }, {
    //   linkedTo: 0,
    //   type: 'datetime',
    //   tickLength: 0,
    //   lineWidth: 0,
    //   labels: {
    //     // formatter: function() {
    //    //     return ReactHighcharts.dateFormat('%H:%M', this.value)
    //    //  }
    //   }
    // }],

    plotOptions: {
      series: {
        pointWidth: 21,
        pointPlacement: 'on'
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
