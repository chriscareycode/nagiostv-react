import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hostAtom } from '../atoms/hostAtom';
import { clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import { Host } from '../types/hostAndServiceTypes';
import { useLlmAnalysisController } from './useLlmAnalysisController';

const transportMocks = vi.hoisted(() => ({
	requestLlmChat: vi.fn(),
}));

const audioMocks = vi.hoisted(() => ({
	speakAudio: vi.fn(),
}));

vi.mock('../components/llm/llmTransport', () => transportMocks);
vi.mock('../helpers/audio', () => audioMocks);

const createWrapper = (store: ReturnType<typeof createStore>) => {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <Provider store={store}>{children}</Provider>;
	};
};

const createHost = (status = 4): Host => ({
	name: 'web-01',
	last_time_up: 0,
	status,
	is_flapping: false,
	problem_has_been_acknowledged: false,
	scheduled_downtime_depth: 0,
	state_type: 1,
	next_check: 0,
	last_check: 0,
	check_type: 0,
	notifications_enabled: true,
	current_attempt: 3,
	max_attempts: 3,
	plugin_output: 'Host unreachable',
	checks_enabled: true,
});

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-07-24T12:00:00Z'));
	transportMocks.requestLlmChat.mockReset();
	audioMocks.speakAudio.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('useLlmAnalysisController', () => {
	it('requires explicit confirmation before sending the initial analysis', async () => {
		const store = createStore();
		transportMocks.requestLlmChat.mockResolvedValue({
			content: '✅ All systems operational.',
			model: 'test-model',
		});
		const { result } = renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});

		expect(transportMocks.requestLlmChat).not.toHaveBeenCalled();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5_000);
		});
		expect(transportMocks.requestLlmChat).not.toHaveBeenCalled();

		await act(async () => {
			result.current.analyze();
		});
		expect(transportMocks.requestLlmChat).toHaveBeenCalledOnce();
		expect(result.current.history).toHaveLength(1);
		expect(result.current.llmResponse).toBe('All systems operational.');
		expect(result.current.currentHistoryItem?.model).toBe('test-model');
		expect(result.current.isLoading).toBe(false);
	});

	it('debounces monitoring-data changes for two seconds', async () => {
		const store = createStore();
		transportMocks.requestLlmChat.mockResolvedValue({
			content: '⚠️ Host is down.',
			model: 'test-model',
		});
		const { result } = renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});
		await act(async () => {
			result.current.analyze();
		});
		transportMocks.requestLlmChat.mockClear();

		act(() => {
			store.set(hostAtom, {
				...store.get(hostAtom),
				stateArray: [createHost()],
			});
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_999);
		});
		expect(transportMocks.requestLlmChat).not.toHaveBeenCalled();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(transportMocks.requestLlmChat).toHaveBeenCalledOnce();
	});

	it('uses updated prompt settings for explicit analysis', async () => {
		const store = createStore();
		transportMocks.requestLlmChat.mockResolvedValue({
			content: '✅ Updated prompt used.',
			model: 'test-model',
		});
		const { result } = renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});

		act(() => {
			store.set(clientSettingsAtom, {
				...store.get(clientSettingsAtom),
				llmPromptAllOk: 'Use this updated all-clear prompt.',
			});
		});
		await act(async () => {
			result.current.analyze();
		});

		expect(transportMocks.requestLlmChat).toHaveBeenCalledOnce();
		expect(transportMocks.requestLlmChat.mock.calls[0][0].messages[1].content)
			.toBe('Use this updated all-clear prompt.');
	});

	it('reports missing configuration without sending a request', async () => {
		const store = createStore();
		store.set(clientSettingsAtom, {
			...clientSettingsInitial,
			llmServerBaseUrl: '',
		});
		const { result } = renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});

		await act(async () => {
			result.current.analyze();
		});

		expect(transportMocks.requestLlmChat).not.toHaveBeenCalled();
		expect(result.current.error).toMatch(/base URL is not configured/);
	});

	it('aborts an active analysis request on unmount', async () => {
		const store = createStore();
		let requestSignal: AbortSignal | undefined;
		transportMocks.requestLlmChat.mockImplementation(
			(options: { signal?: AbortSignal }) => {
				requestSignal = options.signal;
				return new Promise(() => undefined);
			},
		);
		const { result, unmount } = renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});

		await act(async () => {
			result.current.analyze();
		});
		unmount();

		expect(requestSignal?.aborted).toBe(true);
	});
});
