import { commentlistAtom } from 'atoms/commentlistAtom';
import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hostAtom } from '../atoms/hostAtom';
import { serviceAtom } from '../atoms/serviceAtom';
import { clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import { Host, Service } from '../types/hostAndServiceTypes';
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
	it('runs the initial analysis after five seconds and stores the response', async () => {
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
		renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});

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

	it('reanalyzes acknowledged services and sends their updated acknowledgement status', async () => {
		const store = createStore();
		const services: Service[] = ['HTTP', 'Disk'].map(description => ({
			...createHost(16),
			host_name: 'web-01',
			description,
			last_time_ok: 0,
		}));
		store.set(serviceAtom, { ...store.get(serviceAtom), stateArray: services });
		store.set(clientSettingsAtom, { ...clientSettingsInitial, hideServiceAcked: false });
		transportMocks.requestLlmChat.mockResolvedValue({ content: '⚠️ Service problems.' });
		renderHook(() => useLlmAnalysisController(), { wrapper: createWrapper(store) });

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5_000);
		});
		expect(transportMocks.requestLlmChat).toHaveBeenCalledOnce();

		for (const acknowledged of [true, false]) {
			const previousCalls = transportMocks.requestLlmChat.mock.calls.length;
			act(() => {
				store.set(serviceAtom, {
					...store.get(serviceAtom),
					stateArray: services.map(service => ({
						...service,
						problem_has_been_acknowledged: acknowledged,
					})),
				});
			});
			await act(async () => {
				await vi.advanceTimersByTimeAsync(1_999);
			});
			expect(transportMocks.requestLlmChat).toHaveBeenCalledTimes(previousCalls);
			await act(async () => {
				await vi.advanceTimersByTimeAsync(1);
			});
			expect(transportMocks.requestLlmChat).toHaveBeenCalledTimes(previousCalls + 1);
			const messages = transportMocks.requestLlmChat.mock.lastCall?.[0].messages;
			expect(messages[1].content).toContain('Service Issues (2)');
			expect(messages[1].content.match(/Acknowledged: (Yes|No)/g)).toEqual([
				`Acknowledged: ${acknowledged ? 'Yes' : 'No'}`,
				`Acknowledged: ${acknowledged ? 'Yes' : 'No'}`,
			]);
		}
	});

	it('reanalyzes when acknowledgement comments arrive after the status poll', async () => {
		const store = createStore();
		store.set(hostAtom, {
			...store.get(hostAtom),
			stateArray: [{ ...createHost(), problem_has_been_acknowledged: true }],
		});
		store.set(clientSettingsAtom, { ...clientSettingsInitial, hideHostAcked: false });
		transportMocks.requestLlmChat.mockResolvedValue({ content: '⚠️ Acknowledged host.' });
		renderHook(() => useLlmAnalysisController(), { wrapper: createWrapper(store) });
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5_000);
		});

		const commentState = {
			...store.get(commentlistAtom),
			commentlistObject: {
				hosts: { 'web-01': { comments: [{
					host_name: 'web-01', service_description: '', comment_type: 1,
					author: 'Chris', entry_time: Date.now(),
					comment_data: 'Replacing the failed switch. ETA 15 minutes.',
				}] } },
				services: {},
			},
		};
		act(() => { store.set(commentlistAtom, commentState); });
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2_000);
		});
		expect(transportMocks.requestLlmChat).toHaveBeenCalledTimes(2);
		expect(transportMocks.requestLlmChat.mock.lastCall?.[0].messages[1].content)
			.toContain('Author: Chris; Comment: Replacing the failed switch. ETA 15 minutes.');

		act(() => { store.set(commentlistAtom, { ...commentState, lastUpdate: Date.now() }); });
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5_000);
		});
		expect(transportMocks.requestLlmChat).toHaveBeenCalledTimes(2);
	});

	it('uses updated prompt settings without cancelling the initial analysis', async () => {
		const store = createStore();
		transportMocks.requestLlmChat.mockResolvedValue({
			content: '✅ Updated prompt used.',
			model: 'test-model',
		});
		renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});

		act(() => {
			store.set(clientSettingsAtom, {
				...store.get(clientSettingsAtom),
				llmPromptAllOk: 'Use this updated all-clear prompt.',
			});
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5_000);
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

	it.each([
		[{ error: { message: 'Model "missing-model" not found' } }, 'Model "missing-model" not found'],
		[{ error: 'max_tokens exceeds the context window' }, 'max_tokens exceeds the context window'],
		[{}, 'Check the selected backend, model, and thinking level in settings.'],
	])('shows actionable guidance and server details for a 400 response', async (data, detail) => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		transportMocks.requestLlmChat.mockRejectedValue({
			isAxiosError: true,
			response: { status: 400, statusText: 'Bad Request', data },
		});
		const { result } = renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(createStore()),
		});

		await act(async () => {
			result.current.analyze();
		});

		expect(result.current.error).toContain('The LLM server rejected the request (400).');
		expect(result.current.error).toContain(detail);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.history).toHaveLength(0);
	});

	it.each([
		['http://10.200.0.82:1234', true],
		[window.location.origin, false],
	])('reports network failures at %s with appropriate CORS guidance', async (baseUrl, expectCors) => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const store = createStore();
		store.set(clientSettingsAtom, { ...clientSettingsInitial, llmServerBaseUrl: baseUrl });
		transportMocks.requestLlmChat.mockRejectedValue({
			isAxiosError: true,
			code: 'ERR_NETWORK',
			message: 'Network Error',
		});
		const { result } = renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});

		await act(async () => {
			result.current.analyze();
		});

		expect(result.current.error).toContain('Cannot connect to the LLM server.');
		expect(result.current.error.includes('Possible CORS error')).toBe(expectCors);
		if (expectCors) {
			expect(result.current.error).toContain(`allow this dashboard origin: ${window.location.origin}`);
			expect(result.current.error).toContain('Check the browser console for CORS details.');
		}
		expect(result.current.isLoading).toBe(false);
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
		const { unmount } = renderHook(() => useLlmAnalysisController(), {
			wrapper: createWrapper(store),
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5_000);
		});
		unmount();

		expect(requestSignal?.aborted).toBe(true);
	});
});
