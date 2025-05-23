/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
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

import { useEffect, useMemo, useRef } from 'react';
import './HistoryChart.css';
import Highcharts, { PlotOptions } from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import _ from 'lodash';
import moment from 'moment';
// Types
import { Alert } from 'types/hostAndServiceTypes';

const debug = false;

interface HistoryChartProps {
	alertlistLastUpdate: number;
	alertlist: Alert[];
	hideAlertSoft: boolean;
	locale: string;
	groupBy: moment.unitOfTime.Base;
	alertHoursBack?: number;
	alertDaysBack?: number;
	triggerReflow: number;
}
interface HistoryChartState {
	intervalHandle: NodeJS.Timeout | null;
}
interface HighChartsSeriesData {
	x: number;
	y: number;
	xNice: string;
}

interface GroupByData {
	[key: string]: Alert[];
}

const HistoryChart = ({
	alertlistLastUpdate,
	alertlist,
	hideAlertSoft,
	locale,
	groupBy,
	alertHoursBack,
	alertDaysBack,
	triggerReflow,
}: HistoryChartProps) => {

	//console.log(new Date(), 'HistoryChart render');

	const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

	const chartConfig: Highcharts.Options = useMemo(() => {
		return {
			title: {
				text: ''
			},
			credits: {
				enabled: false,
			},
			accessibility: {
				enabled: false,
			},
			chart: {
				backgroundColor: 'transparent',
				height: '170px',
				type: 'column',
			},

			time: {
				timezoneOffset: new Date().getTimezoneOffset()
			},

			tooltip: {
				backgroundColor: '#222222',
				style: {
					color: 'white'
				}
			},

			legend: {
				enabled: true,
				itemStyle: {
					fontSize: '10px', // Reduce legend font size to match previous version
					fontWeight: 'normal'
				},
			},

			xAxis: {
				type: 'datetime',
				lineColor: '#222',
				startOnTick: false,
				endOnTick: false,
				labels: {
					style: {
						fontSize: '9px',
						color: '#666666',
					},
					format: groupBy === 'hour' ? '{value:%H:%M}' : undefined,
				},
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
					//pointPadding: 0.00
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
					color: 'lime',
					pointPlacement: 'on',
				},
				{
					type: 'column',
					name: 'WARNING',
					color: 'yellow',
					pointPlacement: 'on',
				},
				{
					type: 'column',
					name: 'UNKNOWN',
					color: 'orange',
					pointPlacement: 'on',
				},
				{
					type: 'column',
					name: 'CRITICAL',
					color: '#FD7272',
					pointPlacement: 'on',
				}
			]
		};
	}, [groupBy]);

	useEffect(() => {

		const massageGroupByDataIntoHighchartsData = (groupByData: GroupByData) => {

			let returnArray: HighChartsSeriesData[] = [];

			Object.keys(groupByData).forEach(group => {
				returnArray.push({
					x: parseInt(group),
					y: groupByData[group].length,
					xNice: new Date(parseInt(group)).toString() // extra data for debugging
				});
			});

			// Sort the array in ascending order by the x value
			returnArray.sort((a, b) => a.x - b.x);

			return returnArray;
		};

		// multiple stacked charts for OK, WARNING and CRITICAL
		const updateSeriesFromProps = () => {

			const chart = chartComponentRef.current?.chart;

			if (!chart) {
				console.log('No chart found. Maybe hidden.');
				return;
			}

			// group the alerts into an object with keys that are for each day
			// this is a super awesome one liner for grouping

			// OK
			const alertOks = alertlist.filter(alert => alert.state === 1 || alert.state === 8);
			const groupedOks = _.groupBy(alertOks, (result) => moment(result.timestamp).startOf(groupBy).format('x'));
			//console.log('updateSeriesFromProps() groupedOks', groupBy, groupedOks);

			// WARNING
			// Filter for only warning states
			// 16 = WARNING
			const alertWarnings = alertlist.filter(alert => alert.state === 16);
			const groupedWarnings = _.groupBy(alertWarnings, (result) => moment(result.timestamp).startOf(groupBy).format('x'));

			// UNKNOWN
			// Filter for only unknown states
			// 64 = UNKNOWN
			const alertUnknowns = alertlist.filter(alert => alert.state === 64);
			const groupedUnknowns = _.groupBy(alertUnknowns, (result) => moment(result.timestamp).startOf(groupBy).format('x'));

			// CRITICAL
			// Filter for only critical states
			// 2 = CRITICAL
			// 32 = ?
			const alertCriticals = alertlist.filter(alert => alert.state === 2 || alert.state === 32);
			const groupedCriticals = _.groupBy(alertCriticals, (result) => moment(result.timestamp).startOf(groupBy).format('x'));

			// if (debug) {
			//   console.log('alertOks', alertOks);
			//   console.log('alertWarnings', alertWarnings);
			//   console.log('alertUnknowns', alertUnknowns);
			//   console.log('alertCriticals', alertCriticals);

			//   console.log('groupedOks', groupedOks);
			//   console.log('groupedWarnings', groupedWarnings);
			//   console.log('groupedUnknowns', groupedUnknowns);
			//   console.log('groupedCriticals', groupedCriticals);
			// }

			

			// HighCharts setData
			// https://api.highcharts.com/class-reference/Highcharts.Series.html#setData

			// OK
			if (Object.keys(groupedOks).length > 0) {
				let okData = massageGroupByDataIntoHighchartsData(groupedOks);
				if (debug) {
					console.log('Setting 0 okData', groupBy, okData);
				}
				chart.series[0].setData(okData, false, false, false);
			} else {
				chart.series[0].setData([], false, false, false);
			}

			// WARNING
			if (Object.keys(groupedWarnings).length > 0) {
				let warningData = massageGroupByDataIntoHighchartsData(groupedWarnings);
				if (debug) {
					console.log('Setting 1 warningData', groupBy, warningData);
					console.log('chart.series', chart.series);
				}
				chart.series[1].setData(warningData, false, false, false);
			} else {
				chart.series[1].setData([], false, false, false);
			}

			// UNKNOWN
			if (Object.keys(groupedUnknowns).length > 0) {
				let unknownData = massageGroupByDataIntoHighchartsData(groupedUnknowns);
				if (debug) {
					console.log('Setting 2 unknownData', groupBy, unknownData);
				}
				chart.series[2].setData(unknownData, false, false, false);
			} else {
				chart.series[2].setData([], false, false, false);
			}

			// CRITICAL
			if (Object.keys(groupedCriticals).length > 0) {
				let criticalData = massageGroupByDataIntoHighchartsData(groupedCriticals);
				if (debug) {
					console.log('Setting 3 criticalData', groupBy, criticalData);
				}
				chart.series[3].setData(criticalData, false, false, false);
			} else {
				chart.series[3].setData([], false, false, false);
			}

			if (groupBy === 'hour' && alertHoursBack) {

				// calculate min and max for hourly chart XAxis configuration
				// If it is 10:12, this will return 10:00
				const currentHour = new Date();
				currentHour.setMinutes(0);
				currentHour.setSeconds(0);
				currentHour.setMilliseconds(0);

				// Go back 24 hours from the current hour to get the same hour yesterday
				// If currentHour is 10:00, this will return 10:00 yesterday
				const sameHourYesterday = moment(currentHour).subtract(24, 'hours').toDate();
				// If sameHourYesterday is 10:00 yesterday, this will return 9:30 yesterday
				const sameHourYesterdayMinusSome = moment(sameHourYesterday).subtract(30, 'minutes').toDate();
				// Set min to 30 minutes before the same hour yesterday (to add some spacing)
				const min = sameHourYesterdayMinusSome.getTime();
				;
				// Set max to 30 minutes after the current hour: ex: 10:30
				const max = currentHour.getTime() + 30 * 60 * 1000;

				if (debug) {
					console.log('min max', min, max);
					console.log(new Date(min));
					console.log(new Date(max));
				}

				// Calculate exactly 25 tick positions (one per hour)
				const tickPositions = [];
				for (let i = 0; i < 25; i++) {
					tickPositions.push(sameHourYesterday.getTime() + (i * 3600 * 1000));
				}

				chart.update({
					xAxis: {
						type: 'datetime',
						tickInterval: 3600 * 1000,
						min: min,
						max: max,
						tickPositions: tickPositions,
						// show 1 hr ago instead of time
						// labels: {
						//   formatter: (e) => {
						//     //console.log(e);
						//     const diff = new Date().getTime() - e.value;
						//     const hoursAgo = moment.duration(diff).asHours();
						//     return Math.floor(hoursAgo) + 'h ago';
						//   }
						// }
					},
					tooltip: {
						formatter: function () {
							return moment(this.x).locale(locale).format('llll') + `<br />` +
								`<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${this.y}</b>`;
						}
					}
				});

				// update pointWidth based on howManyItems
				let barWidth = (((window.innerWidth + 100) / 2) / alertHoursBack);
				if (barWidth > 35) { barWidth = 35; } // set a max width to 35

				const plotOptionsColumn: Highcharts.Options = {
					plotOptions: {
						column: {
							pointWidth: barWidth,
						},
					},
				};
				chart.update(plotOptionsColumn);
				chart.redraw(false);
			}

			if (groupBy === 'day' && alertDaysBack) {
				// update pointWidth based on howManyItems
				let barWidth = (((window.innerWidth + 100) / 2) / alertDaysBack);
				if (barWidth > 35) { barWidth = 35; } // set a max width to 35

				const plotOptionsColumn: Highcharts.Options = {
					plotOptions: {
						column: {
							pointWidth: barWidth,
						},
					},
				};
				chart.update(plotOptionsColumn);
				chart.redraw(false);

				// turn off the UP/OK filter on the day chart
				// this will hide green items on that chart
				// chart.series[0].update({
				//   visible: false
				// });
			}

			chart.reflow();
		};

		//console.log('HistoryChart useEffect running on alertlistLastUpdate change', alertlistLastUpdate);

		// Kick off an update right away
		updateSeriesFromProps();

		// trigger an update every 5m (to get the hourly chart to update columns for each hour)
		const intervalHandle = setInterval(() => {
			updateSeriesFromProps();
		}, 5 * 60 * 1000);

		return () => {
			clearInterval(intervalHandle);
		};
	}, [alertlistLastUpdate, alertlist, hideAlertSoft, locale, groupBy, alertHoursBack, alertDaysBack]);

	useEffect(() => {
		// Handler to call on window resize
		function handleResize() {
			// Set window width/height to state
			const chart = chartComponentRef.current?.chart;
			if (chart) {
				chart.reflow();
			}
		}
		// Add event listener
		window.addEventListener("resize", handleResize);
		// Call handler right away so state gets updated with initial window size
		handleResize();
		// Remove event listener on cleanup
		return () => window.removeEventListener("resize", handleResize);
	}, [triggerReflow]);

	// const debugMode = document.location.search.indexOf('debug=true') !== -1;
	// const alertlistDebug = alertlist.map((al, i) => {
	//   //if (this.props.groupBy === 'hour') { console.log(al); }
	//   return (<div key={i}>{al.timestamp} - {moment(al.timestamp).locale(locale).format('llll')} - {al.description} - {al.plugin_output}</div>);
	// });

	return (
		<div className="HistoryChart">
			<HighchartsReact
				highcharts={Highcharts}
				options={chartConfig}
				ref={chartComponentRef}
			/>
			{/* {(debugMode && groupBy === 'hour') && <div style={{ marginBottom: '30px' }}>{alertlistDebug}</div>} */}
		</div>
	);

}

export default HistoryChart;
