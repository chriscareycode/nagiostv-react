import { act, render } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hostAtom } from '../../atoms/hostAtom';
import { Host } from '../../types/hostAndServiceTypes';
import MiniMapCanvas from './MiniMapCanvas';

const { snapdomMock, toBlobMock } = vi.hoisted(() => ({
	snapdomMock: vi.fn(),
	toBlobMock: vi.fn(),
}));

vi.mock('@zumer/snapdom', () => ({
	snapdom: snapdomMock,
}));

const host: Host = {
	name: 'web-01',
	last_time_up: 0,
	status: 4,
	is_flapping: false,
	problem_has_been_acknowledged: false,
	scheduled_downtime_depth: 0,
	state_type: 1,
	next_check: 0,
	last_check: 0,
	check_type: 0,
	notifications_enabled: true,
	current_attempt: 1,
	max_attempts: 3,
	plugin_output: 'down',
	checks_enabled: true,
};

describe('MiniMapCanvas', () => {
	const createObjectURLMock = vi.fn();
	const revokeObjectURLMock = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		toBlobMock.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
		snapdomMock.mockResolvedValue({ toBlob: toBlobMock });
		createObjectURLMock
			.mockReturnValueOnce('blob:first')
			.mockReturnValueOnce('blob:second');
		vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURLMock);
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURLMock);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('uses scaled PNG Blobs and releases replaced and unmounted URLs', async () => {
		const store = createStore();
		store.set(hostAtom, current => ({
			...current,
			stateArray: [host],
		}));

		const { unmount } = render(
			<Provider store={store}>
				<MemoryRouter>
					<div className="Dashboard" />
					<MiniMapCanvas elementToSnapshot=".Dashboard" miniMapWidth={120} />
				</MemoryRouter>
			</Provider>,
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(500);
		});

		expect(snapdomMock).toHaveBeenCalledWith(
			expect.any(HTMLElement),
			expect.objectContaining({
				cache: 'disabled',
				scale: 0.25,
			}),
		);
		expect(toBlobMock).toHaveBeenCalledWith({ type: 'png' });
		expect(document.querySelector<HTMLImageElement>('#mmimg')?.src).toContain('blob:first');

		act(() => {
			store.set(hostAtom, current => ({
				...current,
				lastUpdate: current.lastUpdate + 1,
			}));
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(600);
		});
		expect(snapdomMock).toHaveBeenCalledTimes(1);

		act(() => {
			store.set(hostAtom, current => ({
				...current,
				stateArray: [{ ...host, plugin_output: 'still down' }],
			}));
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(500);
		});

		expect(snapdomMock).toHaveBeenCalledTimes(2);
		expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:first');

		unmount();
		expect(revokeObjectURLMock).toHaveBeenLastCalledWith('blob:second');
	});

	it('does not keep capturing an unchanged dashboard after layout settles', async () => {
		const { unmount } = render(
			<MemoryRouter>
				<div className="Dashboard" />
				<MiniMapCanvas elementToSnapshot=".Dashboard" miniMapWidth={120} />
			</MemoryRouter>,
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5_500);
		});
		expect(snapdomMock).toHaveBeenCalledTimes(2);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		});
		expect(snapdomMock).toHaveBeenCalledTimes(2);

		unmount();
	});
});
