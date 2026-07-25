import { describe, expect, it } from 'vitest';
import { Alert } from '../../types/hostAndServiceTypes';
import {
	buildHistoryChartSeries,
	getHistoryChartBarWidth,
	getHourlyAxisRange,
} from './historyChartData';

const createAlert = (overrides: Partial<Alert>): Alert => ({
	name: 'alert',
	host_name: 'host',
	timestamp: new Date(2026, 6, 24, 10, 15).getTime(),
	state: 1,
	state_type: 1,
	description: 'description',
	plugin_output: 'output',
	object_type: 1,
	...overrides,
});

describe('buildHistoryChartSeries', () => {
	it('maps Nagios states into sorted OK, warning, unknown, and critical series', () => {
		const earlierTimestamp = new Date(2026, 6, 24, 9, 45).getTime();
		const laterTimestamp = new Date(2026, 6, 24, 10, 15).getTime();
		const series = buildHistoryChartSeries([
			createAlert({ state: 16, timestamp: laterTimestamp }),
			createAlert({ state: 1, timestamp: laterTimestamp }),
			createAlert({ state: 8, timestamp: laterTimestamp }),
			createAlert({ state: 16, timestamp: earlierTimestamp }),
			createAlert({ state: 64, timestamp: laterTimestamp }),
			createAlert({ state: 2, timestamp: laterTimestamp }),
			createAlert({ state: 32, timestamp: laterTimestamp }),
			createAlert({ state: 999, timestamp: laterTimestamp }),
		], 'hour', false);

		expect(series).toHaveLength(4);
		expect(series[0]).toMatchObject([{ y: 2 }]);
		expect(series[1].map(point => point.y)).toEqual([1, 1]);
		expect(series[1][0].x).toBeLessThan(series[1][1].x);
		expect(series[2]).toMatchObject([{ y: 1 }]);
		expect(series[3]).toMatchObject([{ y: 2 }]);
	});

	it('excludes soft alerts when requested', () => {
		const alerts = [
			createAlert({ state: 16, state_type: 2 }),
			createAlert({ state: 16, state_type: 1 }),
		];

		expect(buildHistoryChartSeries(alerts, 'day', false)[1]).toMatchObject([{ y: 2 }]);
		expect(buildHistoryChartSeries(alerts, 'day', true)[1]).toMatchObject([{ y: 1 }]);
	});

	it('returns empty series for an empty alert list', () => {
		expect(buildHistoryChartSeries([], 'day', false)).toEqual([[], [], [], []]);
	});
});

describe('history chart layout', () => {
	it('builds a 24-hour axis with half-hour padding', () => {
		const range = getHourlyAxisRange(new Date(2026, 6, 24, 10, 42).getTime());

		expect(range.tickPositions).toHaveLength(25);
		expect(range.min).toBe(range.tickPositions[0] - 30 * 60 * 1000);
		expect(range.max).toBe(range.tickPositions[24] + 30 * 60 * 1000);
		expect(range.tickPositions[1] - range.tickPositions[0]).toBe(60 * 60 * 1000);
	});

	it('calculates bar width and applies the existing maximum', () => {
		expect(getHistoryChartBarWidth(1_000, 10)).toBe(35);
		expect(getHistoryChartBarWidth(1_000, 50)).toBe(11);
	});
});
