import { act, renderHook } from '@testing-library/react';
import { RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getPollingIntervalMs,
	getPollingRequestTimeoutMs,
	PollingRequest,
	useCancellablePolling,
} from './useCancellablePolling';

describe('getPollingIntervalMs', () => {
	it('uses valid intervals and falls back for unsafe values', () => {
		expect(getPollingIntervalMs(30, 60)).toBe(30000);
		expect(getPollingIntervalMs(2, 60)).toBe(60000);
		expect(getPollingIntervalMs(Number.NaN, 60)).toBe(60000);
	});
});

describe('getPollingRequestTimeoutMs', () => {
	it('uses the sanitized polling interval for invalid values', () => {
		expect(getPollingRequestTimeoutMs(1, 30)).toBe(28_000);
		expect(getPollingRequestTimeoutMs(Number.NaN, 60)).toBe(58_000);
	});

	it('keeps request timeouts positive', () => {
		expect(getPollingRequestTimeoutMs(5, 30)).toBe(3_000);
	});
});

describe('useCancellablePolling', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('delays the first request and aborts it before polling again', () => {
		const request = vi.fn<PollingRequest>();
		const requestRef: RefObject<PollingRequest> = { current: request };

		renderHook(() => useCancellablePolling(requestRef, {
			fallbackIntervalSeconds: 30,
			intervalSeconds: 5,
			requestKey: 'initial',
		}));

		act(() => vi.advanceTimersByTime(999));
		expect(request).not.toHaveBeenCalled();

		act(() => vi.advanceTimersByTime(1));
		const firstSignal = request.mock.calls[0][0];
		expect(firstSignal.aborted).toBe(false);

		act(() => vi.advanceTimersByTime(4000));
		expect(firstSignal.aborted).toBe(true);
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('aborts and reschedules when the request key changes', () => {
		const request = vi.fn<PollingRequest>();
		const requestRef: RefObject<PollingRequest> = { current: request };
		const { rerender } = renderHook(
			({ requestKey }) => useCancellablePolling(requestRef, {
				fallbackIntervalSeconds: 30,
				intervalSeconds: null,
				requestKey,
			}),
			{ initialProps: { requestKey: 'old-settings' } },
		);

		act(() => vi.advanceTimersByTime(1000));
		const firstSignal = request.mock.calls[0][0];

		rerender({ requestKey: 'new-settings' });
		expect(firstSignal.aborted).toBe(true);

		act(() => vi.advanceTimersByTime(1000));
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('clears timers and aborts the active request on unmount', () => {
		const request = vi.fn<PollingRequest>();
		const requestRef: RefObject<PollingRequest> = { current: request };
		const { unmount } = renderHook(() => useCancellablePolling(requestRef, {
			fallbackIntervalSeconds: 30,
			intervalSeconds: 5,
			requestKey: 'initial',
		}));

		act(() => vi.advanceTimersByTime(1000));
		const signal = request.mock.calls[0][0];
		unmount();

		expect(signal.aborted).toBe(true);
		act(() => vi.advanceTimersByTime(10000));
		expect(request).toHaveBeenCalledTimes(1);
	});
});
