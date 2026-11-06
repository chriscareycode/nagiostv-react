import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi, expect, it } from 'vitest';
import { createStore, Provider } from 'jotai';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { hostAtom } from '../../atoms/hostAtom';
import { serviceAtom } from '../../atoms/serviceAtom';
import { Host, Service } from '../../types/hostAndServiceTypes';
import { streamLlmChat } from '../llm/llmStream';
import AlertHistoryQuestion from './AlertHistoryQuestion';

vi.mock('../llm/llmStream', () => ({ streamLlmChat: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

const alarmEventsFromPrompt = (content: string) => JSON.parse(content.slice(
	content.indexOf('[{'),
	content.indexOf('\n\nLive status snapshot'),
));

it('sends the question with recent alarms and displays the response', async () => {
	vi.mocked(streamLlmChat).mockImplementation(async options => {
		options.onDelta({ thinkingContent: 'Checking alarms' });
		options.onDelta({ content: 'Two critical alarms.' });
		return { content: 'Two critical alarms.', thinkingContent: 'Checking alarms' };
	});
	const alerts = Array.from({ length: 105 }, (_, index) => ({
		name: '',
		host_name: 'host-a',
		timestamp: Date.UTC(2025, 0, 1) - index * 1000,
		state: 16,
		state_type: 1,
		description: `service-${index}`,
		plugin_output: 'Check failed',
		object_type: 2,
	}));
	render(<AlertHistoryQuestion alerts={alerts} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.change(screen.getByLabelText('Ask AI question'), { target: { value: 'What happened?' } });
	fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

	await waitFor(() => expect(streamLlmChat).toHaveBeenCalledOnce());
	const request = vi.mocked(streamLlmChat).mock.calls[0][0];
	expect(request.messages[1].content).toContain('What happened?');
	expect(request.messages[1].content).toContain('User timezone:');
	expect(request.messages[1].content).toContain('100 of 105');
	expect(request.messages[1].content).toContain('service-0');
	expect(request.messages[1].content).not.toContain('service-100');
	await waitFor(() => expect(document.querySelector('.alert-history-question-answer')).toHaveTextContent('Two critical alarms.'));
	expect(screen.getByText('Checking alarms')).toBeInTheDocument();
});

it('shows generation time and returned model at the lower right of the response', async () => {
	vi.mocked(streamLlmChat).mockImplementation(async options => {
		options.onDelta({ content: 'Summary' });
		return { content: 'Summary', model: 'returned-model' };
	});
	render(<AlertHistoryQuestion alerts={[]} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.click(screen.getByRole('button', { name: 'Top issue to address' }));
	expect(await screen.findByText(/^\d+s on model: returned-model$/)).toHaveClass('alert-history-question-model');
});

it('sends bounded, cleaned alarm text to the LLM', async () => {
	vi.mocked(streamLlmChat).mockResolvedValue({ content: 'Summary' });
	const alerts = [{
		name: 'service-a',
		host_name: 'host-a',
		timestamp: Date.UTC(2025, 0, 1),
		state: 16,
		state_type: 1,
		description: 'critical\u202e hidden',
		plugin_output: 'x'.repeat(1000),
		object_type: 2,
	}];
	render(<AlertHistoryQuestion alerts={alerts} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.change(screen.getByLabelText('Ask AI question'), { target: { value: 'Explain\u200b this' } });
	fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
	await waitFor(() => expect(streamLlmChat).toHaveBeenCalledOnce());
	const content = vi.mocked(streamLlmChat).mock.calls[0][0].messages[1].content;
	expect(content).toContain('Question: Explain this');
	expect(content).not.toContain('\u202e');
	expect(content).not.toContain('\u200b');
	expect(alarmEventsFromPrompt(content)[0].output).toHaveLength(500);
});

it('limits a quick ask to its time window and renders Markdown', async () => {
	vi.mocked(streamLlmChat).mockImplementation(async options => {
		options.onDelta({ content: '## Trends\n- **Critical** alerts need attention.' });
		return { content: '## Trends\n- **Critical** alerts need attention.' };
	});
	const now = Date.now();
	const alerts = [2, 18, 30].map((hours, index) => ({
		name: '',
		host_name: 'host-a',
		timestamp: now - hours * 60 * 60 * 1000,
		state: 16,
		state_type: 1,
		description: `service-${index}`,
		plugin_output: 'Check failed',
		object_type: 2,
	}));
	render(<AlertHistoryQuestion alerts={alerts} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.click(screen.getByRole('button', { name: 'Last 12 hours summary' }));

	await waitFor(() => expect(streamLlmChat).toHaveBeenCalledOnce());
	const request = vi.mocked(streamLlmChat).mock.calls[0][0];
	expect(request.messages[1].content).toContain('last 12 hours');
	expect(request.messages[1].content).toContain('1 of 1');
	expect(request.messages[1].content).toContain('service-0');
	expect(request.messages[1].content).not.toContain('service-1');
	expect(await screen.findByRole('heading', { name: 'Trends' })).toBeInTheDocument();
	expect(screen.getByRole('list')).toHaveTextContent('Critical alerts need attention.');
});

it('asks for one concise issue using the current alarm history', async () => {
	vi.mocked(streamLlmChat).mockResolvedValue({ content: 'Check host-a first.' });
	render(<AlertHistoryQuestion alerts={[]} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.click(screen.getByRole('button', { name: 'Top issue to address' }));
	await waitFor(() => expect(streamLlmChat).toHaveBeenCalledOnce());
	const prompt = vi.mocked(streamLlmChat).mock.calls[0][0].messages[1].content;
	expect(prompt).toContain('single most important issue');
	expect(prompt).toContain('one or two sentences');
	expect(prompt).toContain('Account for recoveries');
	expect(prompt).not.toContain('Time window:');
});

it('includes host recovery after a down event with correct state labels', async () => {
	vi.mocked(streamLlmChat).mockResolvedValue({ content: 'The host recovered.' });
	const baseAlert = {
		name: 'docker', host_name: '', state_type: 1, description: '',
		plugin_output: '', object_type: 1,
	};
	const alerts = [
		{ ...baseAlert, timestamp: Date.UTC(2025, 6, 1, 14, 36), state: 2 },
		{ ...baseAlert, timestamp: Date.UTC(2025, 6, 1, 15, 38), state: 1 },
	];
	render(<AlertHistoryQuestion alerts={alerts} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.click(screen.getByRole('button', { name: 'Top issue to address' }));
	await waitFor(() => expect(streamLlmChat).toHaveBeenCalledOnce());
	const request = vi.mocked(streamLlmChat).mock.calls[0][0];
	const events = alarmEventsFromPrompt(request.messages[1].content);
	expect(events.map((event: { stateLabel: string }) => event.stateLabel)).toEqual(['host up', 'host down']);
	expect(request.messages[0].content).toContain('a live OK service or UP host means that earlier failure has recovered');
});

it('includes a live OK status for a service whose last history event is UNKNOWN', async () => {
	vi.mocked(streamLlmChat).mockResolvedValue({ content: 'Recovered.' });
	const now = Date.now();
	const store = createStore();
	store.set(hostAtom, { ...store.get(hostAtom), lastUpdate: now, stateArray: [{
		name: 'zerow3-chris-work', status: 2, last_check: now,
	} as Host] });
	store.set(serviceAtom, { ...store.get(serviceAtom), lastUpdate: now, stateArray: [{
		host_name: 'zerow3-chris-work', description: 'Check APT', status: 2, last_check: now,
	} as Service] });
	const alerts = [{
		name: '', host_name: 'zerow3-chris-work', description: 'Check APT',
		timestamp: now - 60_000, state: 64, state_type: 1,
		plugin_output: 'APT UNKNOWN: timeout', object_type: 2,
	}];
	render(<Provider store={store}><AlertHistoryQuestion alerts={alerts} settings={clientSettingsInitial} /></Provider>);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.click(screen.getByRole('button', { name: 'Top issue to address' }));
	await waitFor(() => expect(streamLlmChat).toHaveBeenCalledOnce());
	const request = vi.mocked(streamLlmChat).mock.calls[0][0];
	expect(alarmEventsFromPrompt(request.messages[1].content)[0].stateLabel).toBe('service unknown');
	expect(request.messages[1].content).toContain('"service":"Check APT","status":"ok"');
	expect(request.messages[1].content).toContain('"host":"zerow3-chris-work","status":"up"');
	expect(request.messages[0].content).toContain('live status snapshot');
});

it('shows activity on the active quick ask until its request finishes', async () => {
	let finishRequest: ((value: { content: string }) => void) | undefined;
	vi.mocked(streamLlmChat).mockImplementation(() => new Promise(resolve => {
		finishRequest = resolve;
	}));
	render(<AlertHistoryQuestion alerts={[]} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	const activeButton = screen.getByRole('button', { name: 'Last 24 hours summary' });
	fireEvent.click(activeButton);

	await waitFor(() => expect(activeButton).toHaveAttribute('aria-busy', 'true'));
	expect(activeButton.querySelector('.alert-history-quick-ask-spinner')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Last 12 hours summary' })).toBeDisabled();
	finishRequest?.({ content: 'Done' });
	await waitFor(() => expect(activeButton).toHaveAttribute('aria-busy', 'false'));
	expect(activeButton.querySelector('.alert-history-quick-ask-spinner')).not.toBeInTheDocument();
});

it('shows activity on Ask when a typed question is submitted', async () => {
	let finishRequest: ((value: { content: string }) => void) | undefined;
	vi.mocked(streamLlmChat).mockImplementation(() => new Promise(resolve => {
		finishRequest = resolve;
	}));
	render(<AlertHistoryQuestion alerts={[]} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	const input = screen.getByLabelText('Ask AI question');
	fireEvent.change(input, { target: { value: 'What changed?' } });
	fireEvent.submit(input.closest('form')!);
	const stopButton = screen.getByRole('button', { name: 'Stop' });
	await waitFor(() => expect(stopButton).toHaveAttribute('aria-busy', 'true'));
	expect(stopButton.querySelector('.alert-history-quick-ask-spinner')).toBeInTheDocument();
	finishRequest?.({ content: 'Done' });
	const askButton = await screen.findByRole('button', { name: 'Ask' });
	expect(askButton).toHaveAttribute('aria-busy', 'false');
	expect(askButton.querySelector('.alert-history-quick-ask-spinner')).not.toBeInTheDocument();
});

it('stops an active quick ask immediately and keeps streamed text', async () => {
	let emitDelta: ((delta: { content: string }) => void) | undefined;
	let requestSignal: AbortSignal | undefined;
	vi.mocked(streamLlmChat).mockImplementation(options => {
		emitDelta = options.onDelta;
		requestSignal = options.signal;
		return new Promise(() => undefined);
	});
	render(<AlertHistoryQuestion alerts={[]} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.click(screen.getByRole('button', { name: 'Last 12 hours summary' }));
	await act(async () => emitDelta?.({ content: 'Partial answer' }));
	fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
	expect(requestSignal?.aborted).toBe(true);
	expect(screen.getByText('Partial answer')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Last 12 hours summary' })).toBeEnabled();
	await act(async () => emitDelta?.({ content: ' should be ignored' }));
	expect(screen.getByText('Partial answer')).toBeInTheDocument();
});

it('collapses and expands the Ask AI panel', () => {
	render(<AlertHistoryQuestion alerts={[]} settings={clientSettingsInitial} />);
	const toggle = screen.getByRole('button', { name: 'Ask AI about alarm history' });
	const panel = document.getElementById('alert-history-question-panel');
	expect(toggle).toHaveAttribute('aria-expanded', 'false');
	expect(panel).toHaveAttribute('aria-hidden', 'true');
	fireEvent.click(toggle);
	expect(toggle).toHaveAttribute('aria-expanded', 'true');
	expect(panel).toHaveAttribute('aria-hidden', 'false');
	fireEvent.click(toggle);
	expect(toggle).toHaveAttribute('aria-expanded', 'false');
	expect(panel).toHaveAttribute('aria-hidden', 'true');
});

it('follows streamed results until the user scrolls up, then resumes at the bottom', async () => {
	let emitDelta: ((delta: { content: string }) => void) | undefined;
	let finishRequest: ((value: { content: string }) => void) | undefined;
	vi.mocked(streamLlmChat).mockImplementation(options => {
		emitDelta = options.onDelta;
		return new Promise(resolve => { finishRequest = resolve; });
	});
	render(<AlertHistoryQuestion alerts={[]} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.click(screen.getByRole('button', { name: 'Last 12 hours summary' }));
	await waitFor(() => expect(emitDelta).toBeDefined());
	await act(async () => emitDelta?.({ content: 'First result' }));
	const panel = document.querySelector('.alert-history-question-scroll') as HTMLDivElement;
	let scrollHeight = 500;
	Object.defineProperty(panel, 'scrollHeight', { get: () => scrollHeight });
	Object.defineProperty(panel, 'clientHeight', { get: () => 100 });
	await act(async () => emitDelta?.({ content: ' and more' }));
	expect(panel.scrollTop).toBe(500);
	panel.scrollTop = 150;
	fireEvent.scroll(panel);
	scrollHeight = 600;
	await act(async () => emitDelta?.({ content: ' while reading' }));
	expect(panel.scrollTop).toBe(150);
	panel.scrollTop = 500;
	fireEvent.scroll(panel);
	scrollHeight = 700;
	await act(async () => emitDelta?.({ content: ' latest' }));
	expect(panel.scrollTop).toBe(700);
	await act(async () => finishRequest?.({ content: 'Done' }));
});

it('shrinks an old response to a loading line and grows with new streamed content', async () => {
	let emitDelta: ((delta: { content: string }) => void) | undefined;
	vi.mocked(streamLlmChat)
		.mockImplementationOnce(async options => {
			options.onDelta({ content: 'Previous answer' });
			return { content: 'Previous answer' };
		})
		.mockImplementationOnce(options => {
			emitDelta = options.onDelta;
			return new Promise(() => undefined);
		});
	render(<AlertHistoryQuestion alerts={[]} settings={clientSettingsInitial} />);
	fireEvent.click(screen.getByRole('button', { name: 'Ask AI about alarm history' }));
	fireEvent.click(screen.getByRole('button', { name: 'Last 12 hours summary' }));
	await screen.findByText('Previous answer');
	const previousPanel = document.querySelector('.alert-history-question-response') as HTMLDivElement;
	Object.defineProperty(previousPanel, 'clientHeight', { value: 300 });
	fireEvent.click(screen.getByRole('button', { name: 'Last 24 hours summary' }));
	const panel = document.querySelector('.alert-history-question-response') as HTMLDivElement;
	expect(panel).toBeInTheDocument();
	expect(screen.getByText('Waiting for response…')).toBeInTheDocument();
	await waitFor(() => expect(panel).toHaveStyle({ height: '44px' }));
	const content = panel.querySelector('.alert-history-question-content') as HTMLDivElement;
	let contentHeight = 180;
	Object.defineProperty(content, 'scrollHeight', { get: () => contentHeight });
	await act(async () => emitDelta?.({ content: 'New answer' }));
	expect(panel).toHaveStyle({ height: '200px' });
	contentHeight = 500;
	await act(async () => emitDelta?.({ content: ' with more detail' }));
	expect(panel).toHaveStyle({ height: '300px' });
});
