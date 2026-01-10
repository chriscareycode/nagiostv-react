import { useEffect, useState } from 'react';
import { formatDateTimeAgoColorQuietFor } from '../../helpers/dates';

interface QuietForSecondsProps {
	timestamp: number; // Unix timestamp in milliseconds
}

/**
 * A component that displays time since a given timestamp.
 * When less than 1 minute, it shows a per-second countdown (1s, 2s, 3s, etc.)
 * that updates every second. When 1 minute or more, it displays the
 * formatDateTimeAgoColorQuietFor output.
 */
export default function QuietForSeconds({ timestamp }: QuietForSecondsProps) {
	const [now, setNow] = useState(Date.now());

	// Ensure elapsed time is never negative (can happen with clock drift)
	const elapsedMs = Math.max(0, now - timestamp);
	const isLessThanOneMinute = elapsedMs < 60 * 1000;

	useEffect(() => {
		// Only set up a per-second interval if we're under 1 minute
		if (isLessThanOneMinute) {
			const interval = setInterval(() => {
				setNow(Date.now());
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [isLessThanOneMinute]);

	if (isLessThanOneMinute) {
		const seconds = Math.floor(elapsedMs / 1000);
		// Use color-red for under 1 minute (matching the formatDateTimeAgoColorQuietFor behavior)
		return <span className="color-red">{seconds}s</span>;
	}

	// For 1 minute or more, use the existing function
	return formatDateTimeAgoColorQuietFor(timestamp);
}
