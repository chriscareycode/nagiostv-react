import { RefObject, useEffect } from 'react';

export type PollingRequest = (signal: AbortSignal) => void;

interface CancellablePollingOptions {
	enabled?: boolean;
	fallbackIntervalSeconds: number;
	initialDelayMs?: number;
	intervalSeconds: number | null;
	requestKey: string;
}

const MINIMUM_POLLING_INTERVAL_SECONDS = 5;

export const getPollingIntervalMs = (
	intervalSeconds: number,
	fallbackIntervalSeconds: number,
): number => {
	const safeIntervalSeconds = (
		typeof intervalSeconds === 'number'
		&& Number.isFinite(intervalSeconds)
		&& intervalSeconds >= MINIMUM_POLLING_INTERVAL_SECONDS
	)
		? intervalSeconds
		: fallbackIntervalSeconds;

	return safeIntervalSeconds * 1000;
};

export const useCancellablePolling = (
	requestRef: RefObject<PollingRequest>,
	{
		enabled = true,
		fallbackIntervalSeconds,
		initialDelayMs = 1000,
		intervalSeconds,
		requestKey,
	}: CancellablePollingOptions,
): void => {
	useEffect(() => {
		if (!enabled) {
			return;
		}

		let requestController: AbortController | null = null;
		const runRequest = () => {
			requestController?.abort();
			requestController = new AbortController();
			requestRef.current?.(requestController.signal);
		};

		const timeoutHandle = setTimeout(runRequest, initialDelayMs);
		const intervalHandle = intervalSeconds === null
			? null
			: setInterval(
				runRequest,
				getPollingIntervalMs(intervalSeconds, fallbackIntervalSeconds),
			);

		return () => {
			clearTimeout(timeoutHandle);
			if (intervalHandle !== null) {
				clearInterval(intervalHandle);
			}
			requestController?.abort();
		};
	}, [
		enabled,
		fallbackIntervalSeconds,
		initialDelayMs,
		intervalSeconds,
		requestKey,
		requestRef,
	]);
};
