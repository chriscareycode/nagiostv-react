import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';

// State Management
import { useAtom, useAtomValue } from 'jotai';
import { hostAtom } from '../../atoms/hostAtom';
import { serviceAtom } from '../../atoms/serviceAtom';
import { clientSettingsAtom } from '../../atoms/settingsState';
import { 
	llmHistoryAtom, 
	llmCurrentHistoryIndexAtom, 
	LLMHistoryItem,
	llmIsLoadingAtom,
	llmResponseAtom,
	llmErrorAtom,
	llmLastResponseTimeAtom,
	llmResponseEmojiAtom,
	LLMHistoryColor
} from '../../atoms/llmAtom';

// Types
import { Host, Service } from '../../types/hostAndServiceTypes';

// Components
import LLMMarkup from './LLMMarkup';

// Helpers
import { speakAudio } from '../../helpers/audio';
import { formatDateTimeAgo, formatDateTimeLocale } from '../../helpers/dates';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// CSS (kept for complex styles like animations and grid layout)
import './LocalLLM.css';
import { filterHostStateArray, filterServiceStateArray } from 'helpers/nagiostv';

// Configurable limit for maximum problems to send to LLM
const MAX_HOST_PROBLEMS_FOR_LLM = 20;
const MAX_SERVICE_PROBLEMS_FOR_LLM = 20;

interface LLMMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface LLMResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export default function LocalLLM() {
	// State Management
	const hostState = useAtomValue(hostAtom);
	const serviceState = useAtomValue(serviceAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);

	// All state persisted in atoms
	const [isLoading, setIsLoading] = useAtom(llmIsLoadingAtom);
	const [llmResponse, setLlmResponse] = useAtom(llmResponseAtom);
	const [error, setError] = useAtom(llmErrorAtom);
	const [lastResponseTime, setLastResponseTime] = useAtom(llmLastResponseTimeAtom);
	const [responseEmoji, setResponseEmoji] = useAtom(llmResponseEmojiAtom);
	const [history, setHistory] = useAtom(llmHistoryAtom);
	const [currentHistoryIndex, setCurrentHistoryIndex] = useAtom(llmCurrentHistoryIndexAtom);

	// Tracks whether we've already triggered an analysis this page load (manual or auto)
	const hasTriggeredAnalysisRef = useRef<boolean>(false);

	// Ref and state for measuring content height for smooth animation
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState<number>(0);

	// Helper function to format host issues
	const formatHostIssues = (hosts: Host[]): string => {
		if (hosts.length === 0) {
			return 'No host issues detected.';
		}

		const issues = hosts.map(host => {
			const statusMap: Record<number, string> = {
				1: 'PENDING',
				2: 'UP',
				4: 'DOWN',
				8: 'UNREACHABLE'
			};

			return `- Host: ${host.name}
  Status: ${statusMap[host.status] || 'UNKNOWN'}
  Plugin Output: ${host.plugin_output || 'N/A'}
  Last Time Up: ${host.last_time_up ? formatDateTimeLocale(host.last_time_up, clientSettings.locale, clientSettings.dateFormat) : 'N/A'}
  Acknowledged: ${host.problem_has_been_acknowledged ? 'Yes' : 'No'}
  Scheduled Downtime: ${host.scheduled_downtime_depth > 0 ? 'Yes' : 'No'}
  Flapping: ${host.is_flapping ? 'Yes' : 'No'}`;
		}).join('\n\n');

		return `Host Issues (${hosts.length}):\n${issues}`;
	};

	// Helper function to format service issues
	const formatServiceIssues = (services: Service[]): string => {
		if (services.length === 0) {
			return 'No service issues detected.';
		}

		const issues = services.map(service => {
			const statusMap: Record<number, string> = {
				1: 'PENDING',
				2: 'OK',
				4: 'WARNING',
				8: 'UNKNOWN',
				16: 'CRITICAL'
			};

			return `- Host: ${service.host_name}
  Service: ${service.description}
  Status: ${statusMap[service.status] || 'UNKNOWN'}
  Last Time OK: ${service.last_time_ok ? formatDateTimeLocale(service.last_time_ok, clientSettings.locale, clientSettings.dateFormat) : 'N/A'}
  Plugin Output: ${service.plugin_output || 'N/A'}
  Acknowledged: ${service.problem_has_been_acknowledged ? 'Yes' : 'No'}
  Scheduled Downtime: ${service.scheduled_downtime_depth > 0 ? 'Yes' : 'No'}
  Flapping: ${service.is_flapping ? 'Yes' : 'No'}`;
		}).join('\n\n');

		return `Service Issues (${services.length}):\n${issues}`;
	};

	// Function to query the LLM
	const queryLLM = async () => {
		// Check if LLM settings are configured
		if (!clientSettings.llmServerHost || !clientSettings.llmServerPort) {
			setError('LLM server hostname and port are not configured. Please configure them in settings.');
			return;
		}

		hasTriggeredAnalysisRef.current = true;

		setIsLoading(true);
		setError('');
		// Don't clear llmResponse - keep previous results visible while loading
		// setLlmResponse('');

		// Let the LLM know what today's date is
		const todaysDate = new Date().toISOString().split('T')[0];
		const todaysTime = new Date().toLocaleTimeString();
		const dayOfTheWeek = new Date().toLocaleDateString(undefined, { weekday: 'long' });

		try {
			// Get the host and service problems
			const hostStateArray = hostState.stateArray || [];
			const serviceStateArray = serviceState.stateArray || [];

			// Filter the problems according to the client settings for filters
			// use filterHostStateArray and filterServiceStateArray from nagiostv.ts
			const filteredHostStates = filterHostStateArray(hostStateArray, clientSettings);
			const filteredServiceStates = filterServiceStateArray(serviceStateArray, clientSettings);

			// Check if there are too many problems to analyze
			const tooManyHostStates = filteredHostStates.length > MAX_HOST_PROBLEMS_FOR_LLM;
			const tooManyServiceStates = filteredServiceStates.length > MAX_SERVICE_PROBLEMS_FOR_LLM;

			// Check if there are no issues
			const noIssues = filteredHostStates.length === 0 && filteredServiceStates.length === 0;

			// Prepare the messages for the LLM
			let messages: LLMMessage[];

			if (tooManyHostStates || tooManyServiceStates) {
				// Too many problems - inform the LLM without sending the full payload
				let overloadMessage = 'The monitoring system is reporting a large number of states to the LLM:\n\n';
				
				if (tooManyHostStates) {
					overloadMessage += `- There are ${filteredHostStates.length} host problems (limit is ${MAX_HOST_PROBLEMS_FOR_LLM})\n`;
				} else {
					overloadMessage += `- There are ${filteredHostStates.length} host problems\n`;
				}
				
				if (tooManyServiceStates) {
					overloadMessage += `- There are ${filteredServiceStates.length} service problems (limit is ${MAX_SERVICE_PROBLEMS_FOR_LLM})\n`;
				} else {
					overloadMessage += `- There are ${filteredServiceStates.length} service problems\n`;
				}
				
				overloadMessage += '\nThe detailed analysis cannot be performed due to context size protections. Increase the maximums in settings if you wish to allow larger analyses.';

				messages = [
					{
						role: 'system',
						content: `You are a helpful assistant analyzing Nagios monitoring data. Today's date is ${todaysDate}. The time is ${todaysTime}. Day of the week is ${dayOfTheWeek}. Always add an emoji in the first position at the beginning of the response; it will be displayed as a "large icon" next to the response. Use an appropriate warning/alert emoji given the severity of the situation.`
					},
					{
						role: 'user',
						content: `${overloadMessage}\n\nPlease provide a brief response acknowledging this situation and suggesting immediate steps the operator should take.`
					},
				];
			} else if (noIssues) {
				// No issues - ask for a compliment
				messages = [
					{
						role: 'system',
						content: `You are a friendly assistant that celebrates system reliability. Today's date is ${todaysDate}. The time is ${todaysTime}. Day of the week is ${dayOfTheWeek}. Always add a emoji in the first position at the beginning of the response; it will be displayed as a "large icon" next to the response. Do not output tables in the response, use plain text only.`
					},
					{
						role: 'user',
						content: `${clientSettings.llmPromptAllOk}`
					},
				];
			} else {
				// Format the issues for the LLM
				const hostIssuesText = formatHostIssues(filteredHostStates);
				const serviceIssuesText = formatServiceIssues(filteredServiceStates);

				messages = [
					{
						role: 'system',
						content: `You are a helpful assistant analyzing Nagios monitoring data. Provide concise insights about the current infrastructure health, identify critical issues, and suggest priorities for resolution. Today's date is ${todaysDate}. The time is ${todaysTime}. Day of the week is ${dayOfTheWeek}. If you mention "flapping", capitalize it as "FLAPPING".`
					},
					// Default
					{
						role: 'user',
						content: `Please analyze the following Nagios monitoring data and provide insights:\n\n${hostIssuesText}\n\n${serviceIssuesText}\n\n ${clientSettings.llmPromptNotOk}`
					},

					// Middle of the road
					// {
					// 	role: 'user',
					// 	content: `Please analyze the following Nagios monitoring data and provide insights:\n\n${hostIssuesText}\n\n${serviceIssuesText}\n\nProvide a brief summary of the current situation. Please do not start your response with a title or greeting, just get in to the summary of host and service issues. Try to refrain from creating bulleted or numbered lists unless absolutely necessary. ${clientSettings.llmPromptNotOk}`
					// },

					// More Detailed
					// {
					// 	role: 'user',
					// 	content: `Please analyze the following Nagios monitoring data and provide insights:\n\n${hostIssuesText}\n\n${serviceIssuesText}\n\nProvide a brief summary of the current situation. Call out specific hosts or service checks that are most important and when you do call them out, emphasize the name with backtick so it shows up clearly in the response. Please do not start your response with a title or greeting, just get in to the summary of host and service issues. Try to refrain from creating bulleted or numbered lists unless absolutely necessary.`
					// },

					// Detailed summary
					// {
					// 	role: 'user',
					// 	content: `Please analyze the following Nagios monitoring data and provide insights:\n\n${hostIssuesText}\n\n${serviceIssuesText}\n\nStart with a short high level overview in the first paragraph. Next, provide a detailed summary of the current situation. We want to focus on what is having issues, so do not call out if all hosts or services are OK. Call out specific hosts or service checks that are most important and when you do call them out, emphasize the name with backtick so it shows up clearly in the response. Please do not start your response with a title or greeting, just get in to the summary of host and service issues.`
					// },
				];
			}

			// Construct the API URL
			const apiUrl = `http://${clientSettings.llmServerHost}:${clientSettings.llmServerPort}/v1/chat/completions`;

			// Output the messages to console for debugging
			// console.log('LocalLLM - Sending messages to LLM:', messages);

			// Make the API call
			const response = await axios.post<LLMResponse>(
				apiUrl,
				{
					model: clientSettings.llmModel || 'openai/gpt-oss-20b',
					messages: messages,
					temperature: 0.7,
					max_tokens: 50000
				},
				{
					headers: {
						'Content-Type': 'application/json',
						...(clientSettings.llmApiKey && { 'Authorization': `Bearer ${clientSettings.llmApiKey}` })
					},
					timeout: 30000 // 30 second timeout
				}
			);

			// Extract the response
			if (response.data.choices && response.data.choices.length > 0) {
				const rawContent = response.data.choices[0].message.content;
				const timestamp = Date.now();
				
				// Check if response starts with an emoji and extract it
				// Emoji regex pattern to match emojis at the start of the string
				const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}][\u{FE00}-\u{FE0F}]?)\s*/u;
				const emojiMatch = rawContent.match(emojiRegex);
				
				let content: string;
				let selectedEmoji: string;
				
				if (emojiMatch) {
					// Found an emoji at the start - use it and strip it from content
					selectedEmoji = emojiMatch[1];
					content = rawContent.slice(emojiMatch[0].length);
				} else {
					// No leading emoji - fall back to issue count based selection
					content = rawContent;
					const issueCount = hostStateArray.length + serviceStateArray.length;
					if (issueCount > 10) {
						selectedEmoji = '🚨';
					} else if (issueCount > 0) {
						selectedEmoji = '⚠️';
					} else {
						selectedEmoji = '✅';
					}
				}
				// Based on the filtered host and service problems, determine the color to use for this response
				let color: LLMHistoryColor = 'green'; // Default to green
				
				// Count issues from filtered arrays
				const hasServiceWarning = filteredServiceStates.some(s => s.status === 4);  // 4 = WARNING
				const hasServiceCritical = filteredServiceStates.some(s => s.status === 16); // 16 = CRITICAL
				const hasServiceUnknown = filteredServiceStates.some(s => s.status === 8);  // 8 = UNKNOWN
				const hasHostDown = filteredHostStates.some(h => h.status === 4);           // 4 = DOWN
				const hasHostUnreachable = filteredHostStates.some(h => h.status === 8);    // 8 = UNREACHABLE
				
				// Service warning
				if (hasServiceWarning) {
					color = 'yellow';
				}
				// Service unknown
				if (hasServiceUnknown) {
					color = 'orange';
				}
				// Service critical
				if (hasServiceCritical) {
					color = 'red';
				}
				// Host down
				if (hasHostDown) {
					color = 'red';
				}
				// Host unreachable
				if (hasHostUnreachable) {
					color = 'red';
				}
				
				// Add to history
				const newHistoryItem: LLMHistoryItem = {
					content,
					timestamp,
					emoji: selectedEmoji,
					model: response.data.model || clientSettings.llmModel || 'unknown',
					color,
				};
				
				// Check if user is currently viewing the most recent response
				const isViewingMostRecent = currentHistoryIndex === history.length - 1 || currentHistoryIndex === -1;
				
				// Set item into history, keeping max 10 items
				setHistory(prev => {
					const newHistory = [...prev, newHistoryItem];
					if (newHistory.length > 10) {
						return newHistory.slice(-10); // Keep only the last 10 items
					}
					return newHistory;
				});
				
				// Only jump to new response if user was viewing the most recent one
				// Note: We clamp to 9 (max index) because history is limited to 10 items
				// and the state update is asynchronous, so history.length may not reflect the new size yet
				const newIndex = Math.min(history.length, 9);
				if (isViewingMostRecent) {
					setCurrentHistoryIndex(newIndex);
					setLlmResponse(content);
					setLastResponseTime(new Date(timestamp));
					setResponseEmoji(selectedEmoji);
				} else {
					// Just update the index to account for the new item being added
					// but don't change what the user is viewing
					// (the setHistory will add it, but we don't navigate to it)
					setCurrentHistoryIndex(newIndex);
					setLlmResponse(content);
					setLastResponseTime(new Date(timestamp));
					setResponseEmoji(selectedEmoji);
				}
				
				// Speak the response if speakItems is enabled
				if (clientSettings.llmSpeakResponse) {
					// Remove markdown formatting for better speech
					const cleanedContent = content
						.replace(/#{1,6}\s+/g, '') // Remove heading markers
						.replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
						.replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
						.replace(/`([^`]+)`/g, '$1') // Remove inline code markers
						.replace(/```[\s\S]*?```/g, '') // Remove code blocks
						.replace(/[-*+]\s+/g, '') // Remove list markers
						.replace(/\d+\.\s+/g, '') // Remove numbered list markers
						.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, ''); // Remove emojis
					
					// Extract only the first paragraph (split by double newlines or single newlines)
					// const firstParagraph = cleanedContent.split(/\n\n|\n/)[0];
					
					speakAudio(cleanedContent, clientSettings.speakItemsVoice);
				}
			} else {
				setError('No response received from LLM server.');
			}
		} catch (err) {
			if (axios.isAxiosError(err)) {
				if (err.code === 'ECONNABORTED') {
					setError('Request timeout. The LLM server took too long to respond.');
					console.error('LocalLLM ECONNABORTED:', err);
				} else if (err.response) {
					setError(`LLM server error: ${err.response.status} - ${err.response.statusText}`);
					console.error('LocalLLM response error:', err.response.status, err.response.statusText, err.response.data);
				} else if (err.request) {
					setError(`Cannot connect to LLM server at ${clientSettings.llmServerHost}:${clientSettings.llmServerPort}. Please check the hostname and port.`);
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
		}
	};

	// Navigation functions
	const navigateToPrevious = () => {
		if (currentHistoryIndex > 0) {
			const newIndex = currentHistoryIndex - 1;
			const item = history[newIndex];
			setCurrentHistoryIndex(newIndex);
			setLlmResponse(item.content);
			setLastResponseTime(new Date(item.timestamp));
			setResponseEmoji(item.emoji);
		}
	};

	const navigateToNext = () => {
		if (currentHistoryIndex < history.length - 1) {
			const newIndex = currentHistoryIndex + 1;
			const item = history[newIndex];
			setCurrentHistoryIndex(newIndex);
			setLlmResponse(item.content);
			setLastResponseTime(new Date(item.timestamp));
			setResponseEmoji(item.emoji);
		}
	};

	const hostStateArray = hostState.stateArray || [];
	const serviceStateArray = serviceState.stateArray || [];

	// Build a simple signature: sorted list of problem identifiers plus filter settings
	// Triggers on actual problem additions/removals and filter changes
	const buildSignature = (): string => {
		const hostIds = hostStateArray.map(h => h.name).sort().join(',');
		const serviceIds = serviceStateArray.map(s => `${s.host_name}:${s.description}`).sort().join(',');
		
		// Include filter settings in signature so changes trigger re-analysis
		const filterSignature = [
			clientSettings.hideHostPending,
			clientSettings.hideHostUp,
			clientSettings.hideHostDown,
			clientSettings.hideHostUnreachable,
			clientSettings.hideHostAcked,
			clientSettings.hideHostScheduled,
			clientSettings.hideHostFlapping,
			clientSettings.hideHostSoft,
			clientSettings.hideHostNotificationsDisabled,
			clientSettings.hideServicePending,
			clientSettings.hideServiceOk,
			clientSettings.hideServiceWarning,
			clientSettings.hideServiceUnknown,
			clientSettings.hideServiceCritical,
			clientSettings.hideServiceAcked,
			clientSettings.hideServiceScheduled,
			clientSettings.hideServiceFlapping,
			clientSettings.hideServiceSoft,
			clientSettings.hideServiceNotificationsDisabled,
		].map(v => v ? '1' : '0').join('');
		
		return `${hostStateArray.length}|${serviceStateArray.length}|${hostIds}|${serviceIds}|${filterSignature}`;
	};

	const currentSignature = buildSignature();
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
		if (!clientSettings.llmServerHost || !clientSettings.llmServerPort) {
			return;
		}

		// On first render, just store the signature and set up initial load timer
		if (prevSignatureRef.current === null) {
			prevSignatureRef.current = currentSignature;
			
			// Initial load: trigger after 5 seconds if no analysis has run and history is empty
			initialLoadTimerRef.current = window.setTimeout(() => {
				if (!hasTriggeredAnalysisRef.current && !isLoading && history.length === 0) {
					console.log('[LocalLLM] Initial load trigger');
					hasTriggeredAnalysisRef.current = true;
					queryLLM();
				}
			}, 5000);
			return;
		}

		// Check if signature changed
		if (prevSignatureRef.current === currentSignature) {
			return;
		}

		console.log('[LocalLLM] Problems changed:', { 
			prev: prevSignatureRef.current, 
			current: currentSignature 
		});
		prevSignatureRef.current = currentSignature;

		// Clear any pending debounce timer
		if (debounceTimerRef.current) {
			window.clearTimeout(debounceTimerRef.current);
		}

		// Debounce: wait 2 seconds before triggering
		debounceTimerRef.current = window.setTimeout(() => {
			console.log('[LocalLLM] Debounce complete, triggering analysis');
			hasTriggeredAnalysisRef.current = true;
			queryLLM();
		}, 2000);

		// Cleanup
		return () => {
			if (debounceTimerRef.current) {
				window.clearTimeout(debounceTimerRef.current);
			}
		};
	}, [currentSignature, clientSettings.llmServerHost, clientSettings.llmServerPort, isLoading]);

	// Cleanup initial load timer on unmount
	useEffect(() => {
		return () => {
			if (initialLoadTimerRef.current) {
				window.clearTimeout(initialLoadTimerRef.current);
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

	// Border color based on hosts and services warning or critical status from current history item
	const currentHistoryItem = history[currentHistoryIndex];

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
						Analyze
					</button>
				</div>
			</div>

			{history.length === 0 && !llmResponse && (
				<div className="ServiceItemBorder border-green mt-2.5 pb-1.5!">
					<span className="m-[5px_5px] inline-block text-white">
						All systems operating normally. No issues to analyze.
					</span>
				</div>
			)}

			{error && (
				<div className="bg-[#4d1e1e] border border-[#7a2d2d] rounded px-2 py-1 text-[#e6a8a8] flex items-start gap-2.5 mb-2.5">
					<span role="img" aria-label="error">⚠️</span> {error}
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

						<div className="local-llm-response-content">
							<LLMMarkup content={llmResponse} />
						</div>

						{/* Display the model used for this response */}
						{currentHistoryItem?.model && (
							<div className="absolute bottom-1 right-2 text-[12px] text-gray-500 opacity-60">
								{currentHistoryItem.model}
							</div>
						)}
					</div>
				</motion.div>
			)}
		</div>
	);
}
