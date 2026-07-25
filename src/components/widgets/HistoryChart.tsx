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
import { HighchartsReact } from 'highcharts-react-official';
import { DateTime } from 'luxon';
// Types
import { Alert } from 'types/hostAndServiceTypes';
import {
	buildHistoryChartSeries,
	getHistoryChartBarWidth,
	getHourlyAxisRange,
} from './historyChartData';

const debug = false;

export interface HistoryChartProps {
	alertlistLastUpdate: number;
	alertlist: Alert[];
	hideAlertSoft: boolean;
	locale: string;
	groupBy: "day" | "hour";
	alertHoursBack?: number;
	alertDaysBack?: number;
	triggerReflow: number;
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
		// multiple stacked charts for OK, WARNING and CRITICAL
		const updateSeriesFromProps = () => {

			const chart = chartComponentRef.current?.chart;

			if (!chart) {
				console.log('No chart found. Maybe hidden.');
				return;
			}

			// HighCharts setData
			// https://api.highcharts.com/class-reference/Highcharts.Series.html#setData
			const seriesData = buildHistoryChartSeries(alertlist, groupBy, hideAlertSoft);
			seriesData.forEach((data, index) => {
				if (debug) {
					console.log('Setting series data', index, groupBy, data);
				}
				chart.series[index].setData(data, false, false, false);
			});

			if (groupBy === 'hour' && alertHoursBack) {
				const { min, max, tickPositions } = getHourlyAxisRange();

				if (debug) {
					console.log('min max', min, max);
					console.log(new Date(min));
					console.log(new Date(max));
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
							return DateTime.fromMillis(this.x).setLocale(locale).toLocaleString(DateTime.DATETIME_FULL) + `<br />` +
								`<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${this.y}</b>`;
						}
					}
				});

				// update pointWidth based on howManyItems
				const barWidth = getHistoryChartBarWidth(window.innerWidth, alertHoursBack);

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
				const barWidth = getHistoryChartBarWidth(window.innerWidth, alertDaysBack);

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
	//   return (<div key={i}>{al.timestamp} - {DateTime.fromJSDate(new Date(al.timestamp)).setLocale(locale).toLocaleString(DateTime.DATETIME_FULL)} - {al.description} - {al.plugin_output}</div>);
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
