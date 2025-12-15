import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';

// State Management
import { useAtomValue } from 'jotai';
import { hostAtom } from '../../atoms/hostAtom';
import { serviceAtom } from '../../atoms/serviceAtom';
import { clientSettingsAtom } from '../../atoms/settingsState';

// Types
import { Host, Service } from '../../types/hostAndServiceTypes';

// Components
import LLMMarkup from './LLMMarkup';

// Helpers
import { speakAudio } from '../../helpers/audio';
import { formatDateTimeAgo } from '../../helpers/dates';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// CSS
import './LocalLLM.css';

interface LLMMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface LLMHistoryItem {
	content: string;
	timestamp: number; // Unix timestamp
	emoji: string;
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

	// Local state
	const [isLoading, setIsLoading] = useState(false);
	const [llmResponse, setLlmResponse] = useState<string>('');
	const [error, setError] = useState<string>('');
	const [lastResponseTime, setLastResponseTime] = useState<Date | null>(null);
	const [responseEmoji, setResponseEmoji] = useState<string>('✅');
	
	// History state
	const [history, setHistory] = useState<LLMHistoryItem[]>([]);
	const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

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
			const hostProblems = hostState.problemsArray || [];
			const serviceProblems = serviceState.problemsArray || [];

			// Check if there are no issues
			const noIssues = hostProblems.length === 0 && serviceProblems.length === 0;

			// Prepare the messages for the LLM
			let messages: LLMMessage[];

			if (noIssues) {
				// No issues - ask for a compliment
				messages = [
					{
						role: 'system',
						content: `You are a friendly assistant that celebrates IT team achievements and system reliability. Today's date is ${todaysDate}. The time is ${todaysTime}. Day of the week is ${dayOfTheWeek}.`
					},
					{
						role: 'user',
						content: `${clientSettings.llmPromptAllOk}`
					},
				];
			} else {
				// Format the issues for the LLM
				const hostIssuesText = formatHostIssues(hostProblems);
				const serviceIssuesText = formatServiceIssues(serviceProblems);

				messages = [
					{
						role: 'system',
						content: `You are a helpful assistant analyzing Nagios monitoring data. Provide concise insights about the current infrastructure health, identify critical issues, and suggest priorities for resolution. Today's date is ${todaysDate}. The time is ${todaysTime}. Day of the week is ${dayOfTheWeek}.`
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

			// Make the API call
			const response = await axios.post<LLMResponse>(
				apiUrl,
				{
					model: clientSettings.llmModel || 'openai/gpt-oss-20b',
					messages: messages,
					temperature: 0.7,
					max_tokens: 500
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
				const content = response.data.choices[0].message.content;
				const timestamp = Date.now();
				
				// Extract all emojis from the response and randomly select one
				// Regex to match emojis (including multi-codepoint emojis)
				const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{203C}\u{2049}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}-\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}-\u{2623}\u{2626}\u{262A}\u{262E}-\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{265F}-\u{2660}\u{2663}\u{2665}-\u{2666}\u{2668}\u{267B}\u{267E}-\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}-\u{269C}\u{26A0}-\u{26A1}\u{26A7}\u{26AA}-\u{26AB}\u{26B0}-\u{26B1}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26C8}\u{26CE}-\u{26CF}\u{26D1}\u{26D3}-\u{26D4}\u{26E9}-\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}][\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}\u{1F3FB}-\u{1F3FF}]?(?:\u{200D}[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}][\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}\u{1F3FB}-\u{1F3FF}]?)*/gu;
				const emojisInResponse = content.match(emojiRegex);
				
				let selectedEmoji = '✅';
				if (emojisInResponse && emojisInResponse.length > 0) {
					// Randomly select one emoji from the response
					selectedEmoji = emojisInResponse[Math.floor(Math.random() * emojisInResponse.length)];
				} else {
					// Fall back to default based on issue count if no emojis found
					if (totalIssues > 10) {
						selectedEmoji = '🚨';
					} else if (totalIssues > 5) {
						selectedEmoji = '⚠️';
					}
				}
				
				// Add to history
				const newHistoryItem: LLMHistoryItem = {
					content,
					timestamp,
					emoji: selectedEmoji
				};
				
				// Check if user is currently viewing the most recent response
				const isViewingMostRecent = currentHistoryIndex === history.length - 1 || currentHistoryIndex === -1;
				
				setHistory(prev => [...prev, newHistoryItem]);
				
				// Only jump to new response if user was viewing the most recent one
				if (isViewingMostRecent) {
					setCurrentHistoryIndex(history.length); // Will be the index of the new item
					setLlmResponse(content);
					setLastResponseTime(new Date(timestamp));
					setResponseEmoji(selectedEmoji);
				} else {
					// Just update the index to account for the new item being added
					// but don't change what the user is viewing
					// (the setHistory will add it, but we don't navigate to it)
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
				} else if (err.response) {
					setError(`LLM server error: ${err.response.status} - ${err.response.statusText}`);
				} else if (err.request) {
					setError(`Cannot connect to LLM server at ${clientSettings.llmServerHost}:${clientSettings.llmServerPort}. Please check the hostname and port.`);
				} else {
					setError(`Error: ${err.message}`);
				}
			} else {
				setError('An unexpected error occurred.');
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

	const totalIssues = (hostState.problemsArray?.length || 0) + (serviceState.problemsArray?.length || 0);

	// Track the previous totalIssues count
	const prevTotalIssuesRef = useRef<number>(totalIssues);
	const isInitialMountRef = useRef<boolean>(true);

	// Create a debounced version of queryLLM
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedQueryLLM = useCallback(
		debounce(() => {
			queryLLM();
		}, 2000), // Wait 2 seconds after the last change before running
		[hostState.problemsArray, serviceState.problemsArray, clientSettings]
	);

	// Automatically run analysis when totalIssues changes
	useEffect(() => {
		// Skip the very first render
		if (isInitialMountRef.current) {
			isInitialMountRef.current = false;
			prevTotalIssuesRef.current = totalIssues; // Initialize the ref on first render
			return;
		}

		// Only run if the count actually changed
		if (prevTotalIssuesRef.current !== totalIssues) {
			// Store the previous value before updating
			const previousCount = prevTotalIssuesRef.current;
			
			// Update the ref with the new count
			prevTotalIssuesRef.current = totalIssues;

			// Only auto-run if LLM is configured
			if (clientSettings.llmServerHost && clientSettings.llmServerPort) {
				console.log(`[LocalLLM] Issue count changed: ${previousCount} → ${totalIssues}. Triggering analysis...`);
				debouncedQueryLLM();
			}
		}

		// Cleanup function to cancel pending debounced calls
		return () => {
			debouncedQueryLLM.cancel();
		};
	}, [totalIssues, clientSettings.llmServerHost, clientSettings.llmServerPort, debouncedQueryLLM]);

	
	return (
		<div className="local-llm">
			<div className="local-llm-header">
				<h3 className="local-llm-title">
					AI Analysis
					{lastResponseTime && (
						<span className="local-llm-timestamp">
							@ {lastResponseTime.toLocaleString()}
							{' '}({formatDateTimeAgo(lastResponseTime.getTime())}ago)
						</span>
					)}
				</h3>
				<div className="local-llm-header-right">
					{isLoading && (
						<div className="local-llm-loading-inline">
							<div className="local-llm-spinner"></div>
							<span>Analyzing...</span>
						</div>
					)}
					
					{/* History navigation controls */}
					{history.length > 0 && (
						<div className="flex items-center gap-2 mr-3 text-sm">
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
							<span className="text-xs text-gray-300 font-medium min-w-[45px] text-center tabular-nums">
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
					
					<FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: '0.8em' }} className="text-[#444]" />
					<button
						className="local-llm-button"
						onClick={queryLLM}
						disabled={isLoading}
					>
						Analyze
					</button>
				</div>
			</div>

			{totalIssues === 0 && !llmResponse && (
				<div className="all-ok-item mt-2.5">
					<span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">
						All systems operating normally. No issues to analyze.
					</span>
				</div>
			)}

			{error && (
				<div className="local-llm-error">
					<span role="img" aria-label="error">⚠️</span> {error}
				</div>
			)}

			{llmResponse && (
				<div className={`local-llm-response ${isLoading ? 'local-llm-response-loading' : ''}`}>
					<div className="local-llm-response-emoji">{responseEmoji}</div>

					<div className="local-llm-response-content">
						<LLMMarkup content={llmResponse} />
					</div>
				</div>
			)}
		</div>
	);
}
