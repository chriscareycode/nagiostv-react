import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';

// State Management
import { useAtom, useAtomValue } from 'jotai';
import { alertAtom } from '../../atoms/alertAtom';
import { hostAtom } from '../../atoms/hostAtom';
import { serviceAtom } from '../../atoms/serviceAtom';
import { clientSettingsAtom } from '../../atoms/settingsState';
import { 
	LLMHistoryItem,
	llmIsLoadingAtom,
	llmErrorAtom,
} from '../../atoms/llmAtom';

// Components
import LLMMarkup from './LLMMarkup';

// Helpers
import { speakAudio } from '../../helpers/audio';
import { formatDateTimeAgo, formatDateTimeLocale } from '../../helpers/dates';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBrain, faChevronDown, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// CSS (kept for complex styles like animations and grid layout)
import './LocalLLM.css';
import { filterHostStateArray, filterServiceStateArray } from 'helpers/nagiostv';
import {
	buildAnalysisMessages,
	buildMonitoringSignature,
	buildSystemPrompt,
	cleanLlmContentForSpeech,
	formatResponseDuration,
	getLlmHistoryColor,
	parseLlmContent,
} from './llmAnalysis';
import { requestLlmChat } from './llmTransport';
import { useLlmHistory } from '../../hooks/useLlmHistory';

const CONSOLE_DEBUG = false;

export default function LocalLLM() {
	// State Management
	const alertState = useAtomValue(alertAtom);
	const hostState = useAtomValue(hostAtom);
	const serviceState = useAtomValue(serviceAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);

	// All state persisted in atoms
	const [isLoading, setIsLoading] = useAtom(llmIsLoadingAtom);
	const [error, setError] = useAtom(llmErrorAtom);
	const {
		addHistoryItem,
		currentHistoryIndex,
		currentHistoryItem,
		history,
		lastResponseTime,
		llmResponse,
		navigateToNext,
		navigateToPrevious,
		responseEmoji,
	} = useLlmHistory();

	// Tracks whether we've already triggered an analysis this page load (manual or auto)
	const hasTriggeredAnalysisRef = useRef<boolean>(false);

	// Tracks if a change occurred while we were loading - if so, we need to re-analyze after loading completes
	const pendingReanalysisRef = useRef<boolean>(false);
	const reanalysisTimerRef = useRef<number | null>(null);
	// Store the signature that was used when we started loading, to compare against when done
	const loadingSignatureRef = useRef<string | null>(null);

	// Ref and state for measuring content height for smooth animation
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState<number>(0);

	// State for expanded thinking section
	const [isThinkingExpanded, setIsThinkingExpanded] = useState<boolean>(false);

	// Define state arrays early so they can be used by buildSignature and queryLLM
	const hostStateArray = hostState.stateArray || [];
	const serviceStateArray = serviceState.stateArray || [];

	// Build a simple signature: sorted list of problem identifiers with their status plus filter settings
	// Triggers on actual problem additions/removals, state changes (e.g. WARNING to CRITICAL), and filter changes
	// Function to query the LLM
	const queryLLM = async () => {
		// Check if LLM settings are configured
		if (!clientSettings.llmServerBaseUrl) {
			setError('LLM server base URL is not configured. Please configure it in settings.');
			return;
		}

		hasTriggeredAnalysisRef.current = true;
		
		// Capture the signature at the moment we start loading
		// This allows us to detect if data changed while we were loading
		loadingSignatureRef.current = buildMonitoringSignature(hostStateArray, serviceStateArray, clientSettings);
		pendingReanalysisRef.current = false; // Reset pending flag

		setIsLoading(true);
		setError('');
		// Don't clear llmResponse - keep previous results visible while loading
		// setLlmResponse('');

		const systemPrompt = buildSystemPrompt(clientSettings);
		const llmThinkingLevel = clientSettings.llmThinkingLevel || 'medium';

		const requestStartedAt = performance.now();

		try {
			// Get the host and service problems
			const hostStateArray = hostState.stateArray || [];
			const serviceStateArray = serviceState.stateArray || [];

			// Filter the problems according to the client settings for filters
			// use filterHostStateArray and filterServiceStateArray from nagiostv.ts
			const filteredHostStates = filterHostStateArray(hostStateArray, clientSettings);
			const filteredServiceStates = filterServiceStateArray(serviceStateArray, clientSettings);

			// Get the most recent 2 alerts
			const recentAlerts = (alertState.responseArray || []).slice(0, 2);

			const messages = buildAnalysisMessages(
				systemPrompt,
				filteredHostStates,
				filteredServiceStates,
				recentAlerts,
				clientSettings,
			);

			// Output the messages to console for debugging
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
				thinkingLevel: llmThinkingLevel,
			});

			if (parsedResponse) {
				const timestamp = Date.now();
				const responseDurationMs = performance.now() - requestStartedAt;
				const {
					content,
					emoji: selectedEmoji,
					shortResponse: doomguySays,
					thinkingContent,
				} = parseLlmContent(
					parsedResponse.content,
					parsedResponse.thinkingContent,
					hostStateArray.length + serviceStateArray.length,
				);
				const color = getLlmHistoryColor(filteredHostStates, filteredServiceStates);

				// Add to history
				const newHistoryItem: LLMHistoryItem = {
					content,
					timestamp,
					emoji: selectedEmoji,
					model: parsedResponse.model || clientSettings.llmModel || 'unknown',
					responseDurationMs,
					color,
					shortResponse: doomguySays,
					thinkingContent,
				};

				addHistoryItem(newHistoryItem);

				// Speak the response if speakItems is enabled
				if (clientSettings.llmSpeakResponse) {
					speakAudio(
						cleanLlmContentForSpeech(content),
						clientSettings.speakItemsVoice,
					);
				}
			} else {
				setError('No response received from LLM server.');
			}
		} catch (err) {
			if (axios.isAxiosError(err)) {
				if (err.code === 'ECONNABORTED') {
					setError('Request timeout. The LLM server took too long to respond. Try using a smaller model or reduce thinking.');
					console.error('LocalLLM ECONNABORTED:', err);
				} else if (err.response) {
					if (err.response.status === 401) {
						setError('Unauthorized. Please check your LLM API key.');
					} else if (err.response.status === 404) {
						setError('LLM endpoint not found (404). Please check the server URL.');
					} else if (err.response.status === 422) {
						setError('Unprocessable Entity (422). The request was well-formed but contained semantic errors.');
					} else {
						setError(`LLM server error: ${err.response.status} - ${err.response.statusText}`);
						console.error('LocalLLM response error:', err.response.status, err.response.statusText, err.response.data);
					}
				} else if (err.request) {
					setError(`Cannot connect to LLM server at ${clientSettings.llmServerBaseUrl}. Please check the URL.`);
					console.error('LocalLLM request error (no response):', err.request);
				} else {
					setError(`Error: ${err.message}`);
					console.error('LocalLLM axios error:', err.message, err);
				}
			} else {
				setError('An unexpected error occurred.');
				console.error('LocalLLM unexpected error:', err);
			}
			console.error('LocalLLM error:', err);
		} finally {
			setIsLoading(false);

			// Check if data changed while we were loading and we need to re-analyze
			if (pendingReanalysisRef.current) {
				if (CONSOLE_DEBUG) {
					console.log('[LocalLLM] Data changed while loading, triggering re-analysis');
				}
				pendingReanalysisRef.current = false;
				// Use a small delay to allow state to settle and avoid tight loops
				if (reanalysisTimerRef.current) {
					window.clearTimeout(reanalysisTimerRef.current);
				}
				reanalysisTimerRef.current = window.setTimeout(() => {
					reanalysisTimerRef.current = null;
					queryLLM();
				}, 1000);
			}
		}
	};

	const currentSignature = buildMonitoringSignature(
		hostStateArray,
		serviceStateArray,
		clientSettings,
	);
	const prevSignatureRef = useRef<string | null>(null);
	const debounceTimerRef = useRef<number | null>(null);
	const initialLoadTimerRef = useRef<number | null>(null);

	const handleManualAnalyze = () => {
		hasTriggeredAnalysisRef.current = true;
		queryLLM();
	};

	// Trigger LLM when problems change
	useEffect(() => {
		// Skip if LLM not configured
		if (!clientSettings.llmServerBaseUrl) {
			return;
		}

		// On first render, just store the signature and set up initial load timer
		if (prevSignatureRef.current === null) {
			prevSignatureRef.current = currentSignature;
			
			// Initial load: trigger after 5 seconds if no analysis has run and history is empty
			initialLoadTimerRef.current = window.setTimeout(() => {
				initialLoadTimerRef.current = null;
				if (!hasTriggeredAnalysisRef.current && !isLoading && history.length === 0) {
					if (CONSOLE_DEBUG) {
						console.log('[LocalLLM] Initial load trigger');
					}
					hasTriggeredAnalysisRef.current = true;
					queryLLM();
				}
			}, 5000);
			return () => {
				if (initialLoadTimerRef.current) {
					window.clearTimeout(initialLoadTimerRef.current);
					initialLoadTimerRef.current = null;
				}
			};
		}

		// Check if signature changed
		if (prevSignatureRef.current === currentSignature) {
			return;
		}

		if (CONSOLE_DEBUG) {
			console.log('[LocalLLM] Problems changed:', { 
				prev: prevSignatureRef.current, 
				current: currentSignature 
			});
		}
		prevSignatureRef.current = currentSignature;

		// If we're currently loading, mark that we need to re-analyze after loading completes
		// This handles the case where data changes while an LLM request is in-flight
		if (isLoading) {
			if (CONSOLE_DEBUG) {
				console.log('[LocalLLM] Data changed while loading - marking for re-analysis');
			}
			pendingReanalysisRef.current = true;
			// Clear any pending debounce timer since we'll re-analyze after loading
			if (debounceTimerRef.current) {
				window.clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}
			return;
		}

		// Clear any pending debounce timer
		if (debounceTimerRef.current) {
			window.clearTimeout(debounceTimerRef.current);
		}

		// Debounce: wait 2 seconds before triggering
		debounceTimerRef.current = window.setTimeout(() => {
			if (CONSOLE_DEBUG) {
				console.log('[LocalLLM] Debounce complete, triggering analysis');
			}
			hasTriggeredAnalysisRef.current = true;
			queryLLM();
		}, 2000);

		// Cleanup
		return () => {
			if (debounceTimerRef.current) {
				window.clearTimeout(debounceTimerRef.current);
			}
		};
	}, [currentSignature, clientSettings.llmServerBaseUrl, clientSettings.llmBackendType, isLoading]);

	// Cleanup timers that can be scheduled outside the signature effect lifecycle.
	useEffect(() => {
		return () => {
			if (initialLoadTimerRef.current) {
				window.clearTimeout(initialLoadTimerRef.current);
				initialLoadTimerRef.current = null;
			}
			if (reanalysisTimerRef.current) {
				window.clearTimeout(reanalysisTimerRef.current);
				reanalysisTimerRef.current = null;
			}
		};
	}, []);

	// Measure content height for smooth animation using ResizeObserver
	useEffect(() => {
		const SCOOCH_DOWN = 20; // Padding/margin adjustment
		const content = contentRef.current;
		if (!content) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContentHeight(entry.contentRect.height + SCOOCH_DOWN);
			}
		});

		resizeObserver.observe(content);

		return () => {
			resizeObserver.disconnect();
		};
	}, [llmResponse]);

	const color = currentHistoryItem?.color || 'green';
	const borderClasses = `border-${color}`;

	return (
		<div className={`my-2.5`}>
			<div className="flex justify-between items-center flex-wrap gap-2.5 mb-1.5">
				<h3 className="mr-2 mb-0 text-[#bbb]">
					AI Analysis
					{lastResponseTime && (
						<span className="ml-1">
							@ {formatDateTimeLocale(lastResponseTime.getTime(), clientSettings.locale, clientSettings.clockTimeFormat)}
							{' '}({formatDateTimeAgo(lastResponseTime.getTime())} ago)
						</span>
					)}
				</h3>
				<div className={`flex items-center gap-1.5`}>
					{isLoading && (
						<div className="flex items-center gap-2.5 text-[#444] text-[0.8em]">
							<div className="local-llm-spinner"></div>
						</div>
					)}
					
					{/* History navigation controls */}
					{history.length > 0 && (
						<div className="flex items-center gap-0 mr-0 text-sm">
							<button
								onClick={navigateToPrevious}
								disabled={currentHistoryIndex <= 0}
								className={`p-1.5 rounded transition-all ${
									currentHistoryIndex <= 0
										? 'text-gray-600 cursor-not-allowed'
										: 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-pointer'
								}`}
								title="Previous response"
							>
								<FontAwesomeIcon icon={faChevronLeft} />
							</button>
							<span className="text-xs text-gray-300 font-medium min-w-[30px] text-center tabular-nums">
								{currentHistoryIndex + 1} / {history.length}
							</span>
							<button
								onClick={navigateToNext}
								disabled={currentHistoryIndex >= history.length - 1}
								className={`p-1.5 rounded transition-all ${
									currentHistoryIndex >= history.length - 1
										? 'text-gray-600 cursor-not-allowed'
										: 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-pointer'
								}`}
								title="Next response"
							>
								<FontAwesomeIcon icon={faChevronRight} />
							</button>
						</div>
					)}
					
					{/* <FontAwesomeIcon icon={faArrowsRotate} className="text-[0.8em] text-[#444]" /> */}
					<button
						className="local-llm-button"
						onClick={handleManualAnalyze}
						disabled={isLoading}
					>
						{isLoading ? 'Thinking...' : 'Analyze'}
					</button>
				</div>
			</div>

			{error && (
				<div className="bg-[#4d1e1e] border border-[#7a2d2d] rounded px-2 py-1 text-[#e6a8a8] flex items-start gap-2.5 mb-2.5">
					<span role="img" aria-label="error">⚠️</span> {error}
				</div>
			)}

			{history.length === 0 && !llmResponse && (
				<div className="ServiceItemBorder border-green mt-2.5 pb-1.5!">
					<span className="mx-[5px] inline-block text-lime text-[1.5em]">
						No analysis performed yet
					</span>
				</div>
			)}

			

			{llmResponse && (
				<motion.div 
					className={`local-llm-response ServiceItemBorder ${borderClasses} ${isLoading ? 'local-llm-response-loading' : ''} relative`}
					initial={false}
					animate={{ height: contentHeight }}
					transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
					style={{ overflow: 'hidden' }}
				>
					<div 
						ref={contentRef}
						className="local-llm-response-inner"
					>
						<div className="text-4xl leading-none row-span-2 col-start-1 flex items-start">{responseEmoji}</div>

						<div className={`local-llm-response-content${borderClasses === 'border-green' ? ' text-[1.5em]' : ''}`}>
							{/* Collapsible thinking/reasoning section */}
							{currentHistoryItem?.thinkingContent && (
								<div className="mb-3">
									<button
										onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
										className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-pointer bg-transparent border-none p-0"
									>
										<FontAwesomeIcon icon={faBrain} className="text-purple-400" />
										<span>Chain of Thought</span>
										<FontAwesomeIcon 
											icon={faChevronDown} 
											className={`text-xs transition-transform duration-200 ${isThinkingExpanded ? 'rotate-180' : ''}`}
										/>
									</button>
									{isThinkingExpanded && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											transition={{ duration: 0.2 }}
											className="mt-2 p-3 bg-gray-800/50 border border-gray-700 rounded text-sm text-gray-300 overflow-auto max-h-64"
										>
											<pre className="whitespace-pre-wrap font-sans m-0">{currentHistoryItem.thinkingContent}</pre>
										</motion.div>
									)}
								</div>
							)}
							<LLMMarkup content={llmResponse} />
						</div>

						{/* Display the model used for this response */}
						{currentHistoryItem?.model && (
							<div className="absolute bottom-1 right-2 text-[12px] text-gray-400 opacity-60">
								{currentHistoryItem.responseDurationMs !== undefined
									? `${formatResponseDuration(currentHistoryItem.responseDurationMs)} on ${currentHistoryItem.model}`
									: currentHistoryItem.model}
							</div>
						)}
					</div>
				</motion.div>
			)}
		</div>
	);
}
