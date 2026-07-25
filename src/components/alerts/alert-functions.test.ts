import { describe, expect, it } from 'vitest';
import { Alert } from '../../types/hostAndServiceTypes';
import { shiftAlertsToNow } from './alert-functions';

describe('shiftAlertsToNow', () => {
	it('handles an empty response', () => {
		expect(shiftAlertsToNow([], 10_000)).toEqual([]);
	});

	it('shifts timestamps without mutating the response objects', () => {
		const alerts = [
			{ timestamp: 1_000 },
			{ timestamp: 500 },
		] as Alert[];

		const shifted = shiftAlertsToNow(alerts, 10_000);

		expect(shifted.map((alert) => alert.timestamp)).toEqual([10_000, 9_500]);
		expect(alerts.map((alert) => alert.timestamp)).toEqual([1_000, 500]);
	});
});
