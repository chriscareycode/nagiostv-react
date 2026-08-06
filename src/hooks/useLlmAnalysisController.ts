import { useCallback, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useAtom, useAtomValue } from 'jotai';
import { alertAtom } from '../atoms/alertAtom';
import { hostAtom } from '../atoms/hostAtom';
import {
	LLMHistoryItem,
	llmErrorAtom,
	llmIsLoadingAtom,
} from '../atoms/llmAtom';
import { serviceAtom } from '../atoms/serviceAtom';
import { clientSettingsAtom } from '../atoms/settingsState';
import {
	buildAnalysisMessages,
	buildMonitoringSignature,
	buildSystemPrompt,
	cleanLlmContentForSpeech,
	getLlmHistoryColor,
	parseLlmContent,
} from '../components/llm/llmAnalysis';
import { requestLlmChat } from '../components/llm/llmTransport';
import { speakAudio } from '../helpers/audio';
import { validateLlmEndpoint } from '../helpers/llmEndpoint';
import { filterHostStateArray, filterServiceStateArray } from '../helpers/nagiostv';
import { useLlmHistory } from './useLlmHistory';

const CONSOLE_DEBUG = false;

export function useLlmAnalysisController() {
	const alertState = useAtomValue(alertAtom);
	const hostState = useAtomValue(hostAtom);
	const serviceState = useAtomValue(serviceAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);
	const [isLoading, setIsLoading] = useAtom(llmIsLoadingAtom);
	const [error, setError] = useAtom(llmErrorAtom);
	const historyState = useLlmHistory();
	const addHistoryItem = historyState.addHistoryItem;
	const hasTriggeredAnalysisRef = useRef(false);
	const pendingReanalysisRef = useRef(false);
	const previousSignatureRef = useRef<string | null>(null);
	const debounceTimerRef = useRef<number | null>(null);
	const reanalysisTimerRef = useRef<number | null>(null);
	const requestControllerRef = useRef<AbortController | null>(null);
	const queryLlmRef = useRef<() => Promise<void>>(async () => undefined);

	const hostStateArray = useMemo(() => hostState.stateArray || [], [hostState.stateArray]);
	const serviceStateArray = useMemo(
		() => serviceState.stateArray || [],
		[serviceState.stateArray],
	);
	const currentSignature = buildMonitoringSignature(
		hostStateArray,
		serviceStateArray,
		clientSettings,
	);

	const queryLLM = useCallback(async () => {
		if (!clientSettings.llmServerBaseUrl) {
			setError('LLM server base URL is not configured. Please configure it in settings.');
			return;
		}

		const endpointValidation = validateLlmEndpoint(clientSettings.llmServerBaseUrl);
		if (!endpointValidation.ok) {
			setError(`LLM server URL is not allowed because ${endpointValidation.reason}. Please use an http(s) URL.`);
			return;
		}

		hasTriggeredAnalysisRef.current = true;
		pendingReanalysisRef.current = false;
		setIsLoading(true);
		setError('');

		requestControllerRef.current?.abort();
		const controller = new AbortController();
		requestControllerRef.current = controller;
		const requestStartedAt = performance.now();

		try {
			const filteredHostStates = filterHostStateArray(hostStateArray, clientSettings);
			const filteredServiceStates = filterServiceStateArray(serviceStateArray, clientSettings);
			const recentAlerts = (alertState.responseArray || []).slice(0, 2);
			const messages = buildAnalysisMessages(
				buildSystemPrompt(clientSettings),
				filteredHostStates,
				filteredServiceStates,
				recentAlerts,
				clientSettings,
			);

			if (CONSOLE_DEBUG) {
				console.log('LocalLLM - Sending messages to LLM:', messages);
				console.log(messages[1].content);
			}

			const parsedResponse = await requestLlmChat({
				baseUrl: clientSettings.llmServerBaseUrl,
				backendType: clientSettings.llmBackendType || 'openai-compatible',
				apiKey: clientSettings.llmApiKey,
				model: clientSettings.llmModel || 'openai/gpt-oss-20b',
				messages,
				thinkingLevel: clientSettings.llmThinkingLevel || 'medium',
				signal: controller.signal,
			});

			if (!parsedResponse) {
				setError('No response received from LLM server.');
				return;
			}

			const timestamp = Date.now();
			const {
				content,
				emoji,
				shortResponse,
				thinkingContent,
			} = parseLlmContent(
				parsedResponse.content,
				parsedResponse.thinkingContent,
				hostStateArray.length + serviceStateArray.length,
			);
			const historyItem: LLMHistoryItem = {
				content,
				timestamp,
				emoji,
				model: parsedResponse.model || clientSettings.llmModel || 'unknown',
				responseDurationMs: performance.now() - requestStartedAt,
				color: getLlmHistoryColor(filteredHostStates, filteredServiceStates),
				shortResponse,
				thinkingContent,
			};
			addHistoryItem(historyItem);

			if (clientSettings.llmSpeakResponse) {
				speakAudio(
					cleanLlmContentForSpeech(content),
					clientSettings.speakItemsVoice,
				);
			}
		} catch (requestError) {
			if (axios.isCancel(requestError)) {
				return;
			}
			if (axios.isAxiosError(requestError)) {
				if (requestError.code === 'ECONNABORTED') {
					setError('Request timeout. The LLM server took too long to respond. Try using a smaller model or reduce thinking.');
				} else if (requestError.response?.status === 401) {
					setError('Unauthorized. Please check your LLM API key.');
				} else if (requestError.response?.status === 404) {
					setError('LLM endpoint not found (404). Please check the server URL.');
				} else if (requestError.response?.status === 422) {
					setError('Unprocessable Entity (422). The request was well-formed but contained semantic errors.');
				} else if (requestError.response) {
					setError(`LLM server error: ${requestError.response.status} - ${requestError.response.statusText}`);
				} else if (requestError.request) {
					setError(`Cannot connect to LLM server at ${clientSettings.llmServerBaseUrl}. Please check the URL.`);
				} else {
					setError(`Error: ${requestError.message}`);
				}
			} else {
				setError('An unexpected error occurred.');
			}
			console.error('LocalLLM error:', requestError);
		} finally {
			if (!controller.signal.aborted) {
				setIsLoading(false);
				if (pendingReanalysisRef.current) {
					pendingReanalysisRef.current = false;
					if (reanalysisTimerRef.current) {
						window.clearTimeout(reanalysisTimerRef.current);
					}
					reanalysisTimerRef.current = window.setTimeout(() => {
						reanalysisTimerRef.current = null;
						void queryLlmRef.current();
					}, 1_000);
				}
			}
		}
	}, [
		alertState.responseArray,
		clientSettings,
		addHistoryItem,
		hostStateArray,
		serviceStateArray,
		setError,
		setIsLoading,
	]);

	useEffect(() => {
		queryLlmRef.current = queryLLM;
	}, [queryLLM]);

	const analyze = useCallback(() => {
		hasTriggeredAnalysisRef.current = true;
		void queryLlmRef.current();
	}, []);

	useEffect(() => {
		if (!clientSettings.llmServerBaseUrl) {
			return;
		}

		if (previousSignatureRef.current === null) {
			previousSignatureRef.current = currentSignature;
			return;
		}

		if (previousSignatureRef.current === currentSignature) {
			return;
		}
		previousSignatureRef.current = currentSignature;
		if (!hasTriggeredAnalysisRef.current) {
			return;
		}

		if (isLoading) {
			pendingReanalysisRef.current = true;
			if (debounceTimerRef.current) {
				window.clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}
			return;
		}

		if (debounceTimerRef.current) {
			window.clearTimeout(debounceTimerRef.current);
		}
		debounceTimerRef.current = window.setTimeout(analyze, 2_000);

		return () => {
			if (debounceTimerRef.current) {
				window.clearTimeout(debounceTimerRef.current);
			}
		};
	}, [
		analyze,
		clientSettings.llmServerBaseUrl,
		currentSignature,
		isLoading,
	]);

	useEffect(() => {
		return () => {
			requestControllerRef.current?.abort();
			if (debounceTimerRef.current) {
				window.clearTimeout(debounceTimerRef.current);
			}
			if (reanalysisTimerRef.current) {
				window.clearTimeout(reanalysisTimerRef.current);
			}
		};
	}, []);

	return {
		...historyState,
		analyze,
		clientSettings,
		error,
		isLoading,
	};
}
