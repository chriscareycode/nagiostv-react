import { Alert } from '../../types/hostAndServiceTypes';

export const shiftAlertsToNow = (alerts: Alert[], now = Date.now()): Alert[] => {
	if (alerts.length === 0) {
		return alerts;
	}

	const offset = now - alerts[0].timestamp;
	return alerts.map((alert) => ({
		...alert,
		timestamp: alert.timestamp + offset,
	}));
};
