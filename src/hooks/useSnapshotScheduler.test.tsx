import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSnapshotScheduler } from './useSnapshotScheduler';

const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(promiseResolve => {
		resolve = promiseResolve;
	});
	return { promise, resolve };
};

afterEach(() => {
	vi.useRealTimers();
});

describe('useSnapshotScheduler', () => {
	it('debounces a burst of requests into one capture', async () => {
		vi.useFakeTimers();
		const capture = vi.fn().mockResolvedValue('snapshot');
		const apply = vi.fn();
		const { result } = renderHook(() => useSnapshotScheduler(capture, apply));

		act(() => {
			result.current();
			result.current();
			result.current();
			vi.advanceTimersByTime(499);
		});
		expect(capture).not.toHaveBeenCalled();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(capture).toHaveBeenCalledTimes(1);
		expect(apply).toHaveBeenCalledWith('snapshot');
	});

	it('queues instead of overlapping and discards an obsolete result', async () => {
		vi.useFakeTimers();
		const first = deferred<string | null>();
		const second = deferred<string | null>();
		const capture = vi.fn()
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);
		const apply = vi.fn();
		const { result } = renderHook(() => useSnapshotScheduler(capture, apply, 0));

		await act(async () => {
			result.current();
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(capture).toHaveBeenCalledTimes(1);

		await act(async () => {
			result.current();
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(capture).toHaveBeenCalledTimes(1);

		act(() => {
			result.current();
		});

		await act(async () => {
			first.resolve('obsolete');
			await first.promise;
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(apply).not.toHaveBeenCalled();
		expect(capture).toHaveBeenCalledTimes(2);

		await act(async () => {
			second.resolve('current');
			await second.promise;
			await vi.runAllTimersAsync();
		});
		expect(apply).toHaveBeenCalledTimes(1);
		expect(apply).toHaveBeenCalledWith('current');
		expect(capture).toHaveBeenCalledTimes(2);
	});

	it('does not apply an in-flight result after unmount', async () => {
		const pending = deferred<string | null>();
		const apply = vi.fn();
		const { result, unmount } = renderHook(
			() => useSnapshotScheduler(() => pending.promise, apply, 0),
		);

		act(() => {
			result.current();
		});
		await new Promise(resolve => setTimeout(resolve, 0));
		unmount();

		await act(async () => {
			pending.resolve('late');
			await pending.promise;
		});
		expect(apply).not.toHaveBeenCalled();
	});
});
