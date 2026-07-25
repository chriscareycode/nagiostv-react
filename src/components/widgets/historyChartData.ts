import { DateTime } from 'luxon';
import { Alert } from '../../types/hostAndServiceTypes';

export type HistoryChartGroupBy = 'day' | 'hour';

export interface HistoryChartDataPoint {
	x: number;
	y: number;
	xNice: string;
}

export interface HourlyAxisRange {
	min: number;
	max: number;
	tickPositions: number[];
}

const seriesIndexByState = new Map<number, number>([
	[1, 0],
	[8, 0],
	[16, 1],
	[64, 2],
	[2, 3],
	[32, 3],
]);

export const buildHistoryChartSeries = (
	alerts: Alert[],
	groupBy: HistoryChartGroupBy,
	hideAlertSoft: boolean,
): HistoryChartDataPoint[][] => {
	const groupedCounts = Array.from({ length: 4 }, () => new Map<number, number>());

	for (const alert of alerts) {
		if (hideAlertSoft && alert.state_type === 2) {
			continue;
		}

		const seriesIndex = seriesIndexByState.get(alert.state);
		if (seriesIndex === undefined) {
			continue;
		}

		const timestamp = DateTime.fromMillis(alert.timestamp).startOf(groupBy).toMillis();
		const seriesCounts = groupedCounts[seriesIndex];
		seriesCounts.set(timestamp, (seriesCounts.get(timestamp) ?? 0) + 1);
	}

	return groupedCounts.map(seriesCounts => {
		return Array.from(seriesCounts, ([timestamp, count]) => ({
			x: timestamp,
			y: count,
			xNice: new Date(timestamp).toString(),
		})).sort((left, right) => left.x - right.x);
	});
};

export const getHourlyAxisRange = (now = Date.now()): HourlyAxisRange => {
	const currentHour = DateTime.fromMillis(now).startOf('hour');
	const sameHourYesterday = currentHour.minus({ hours: 24 });

	return {
		min: sameHourYesterday.minus({ minutes: 30 }).toMillis(),
		max: currentHour.plus({ minutes: 30 }).toMillis(),
		tickPositions: Array.from(
			{ length: 25 },
			(_, index) => sameHourYesterday.plus({ hours: index }).toMillis(),
		),
	};
};

export const getHistoryChartBarWidth = (viewportWidth: number, itemCount: number): number => {
	return Math.min(((viewportWidth + 100) / 2) / itemCount, 35);
};
