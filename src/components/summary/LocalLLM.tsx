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

// CSS
import './LocalLLM.css';

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

	// Local state
	const [isLoading, setIsLoading] = useState(false);
	const [llmResponse, setLlmResponse] = useState<string>('');
	const [error, setError] = useState<string>('');

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
						content: `You are a friendly assistant that celebrates IT team achievements and system reliability.`
					},
					{
						role: 'user',
						content: `All systems are operating normally with no detected issues. Please provide a brief, encouraging message complimenting the IT department on maintaining excellent system health and reliability. Make it funny or professional, and make it no more than 2-3 sentences.`
					},
				];
			} else {
				// Format the issues for the LLM
				const hostIssuesText = formatHostIssues(hostProblems);
				const serviceIssuesText = formatServiceIssues(serviceProblems);

				messages = [
					{
						role: 'system',
						content: `You are a helpful assistant analyzing Nagios monitoring data. Provide concise insights about the current infrastructure health, identify critical issues, and suggest priorities for resolution.`
					},
					// {
					// 	role: 'user',
					// 	content: `Please analyze the following Nagios monitoring data and provide insights:\n\n${hostIssuesText}\n\n${serviceIssuesText}\n\nProvide a brief summary of the current situation, prioritize the most critical issues, and suggest what should be addressed first.`
					// },
					// {
					// 	role: 'user',
					// 	content: `Please analyze the following Nagios monitoring data and provide insights:\n\n${hostIssuesText}\n\n${serviceIssuesText}\n\nProvide a brief summary of the current situation. Call out specific hosts or service checks that are most important and when you do call them out, emphasize the name with backtick so it shows up clearly in the response. Please do not start your response with a title or greeting, just get in to the summary of host and service issues. Try to refrain from creating bulleted or numbered lists unless absolutely necessary.`
					// },
					{
						role: 'user',
						content: `Please analyze the following Nagios monitoring data and provide insights:\n\n${hostIssuesText}\n\n${serviceIssuesText}\n\nStart with a short high level overview in the first paragraph. Next, provide a detailed summary of the current situation. We want to focus on what is having issues, so do not call out if all hosts or services are OK. Call out specific hosts or service checks that are most important and when you do call them out, emphasize the name with backtick so it shows up clearly in the response. Please do not start your response with a title or greeting, just get in to the summary of host and service issues.`
					},
				];
			}

			// Construct the API URL
			const apiUrl = `http://${clientSettings.llmServerHost}:${clientSettings.llmServerPort}/v1/chat/completions`;

			// Make the API call
			const response = await axios.post<LLMResponse>(
				apiUrl,
				{
					model: clientSettings.llmModel || 'gpt-3.5-turbo',
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
				setLlmResponse(content);
				
				// Speak the response if speakItems is enabled
				if (clientSettings.speakItems) {
					// Remove markdown formatting for better speech
					const cleanedContent = content
						.replace(/#{1,6}\s+/g, '') // Remove heading markers
						.replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
						.replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
						.replace(/`([^`]+)`/g, '$1') // Remove inline code markers
						.replace(/```[\s\S]*?```/g, '') // Remove code blocks
						.replace(/[-*+]\s+/g, '') // Remove list markers
						.replace(/\d+\.\s+/g, ''); // Remove numbered list markers
					
					// Extract only the first paragraph (split by double newlines or single newlines)
					const firstParagraph = cleanedContent.split(/\n\n|\n/)[0];
					
					speakAudio(firstParagraph, clientSettings.speakItemsVoice);
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
			return;
		}

		// Only run if the count actually changed
		if (prevTotalIssuesRef.current !== totalIssues) {
			// Update the ref with the new count
			prevTotalIssuesRef.current = totalIssues;

			// Only auto-run if LLM is configured
			if (clientSettings.llmServerHost && clientSettings.llmServerPort) {
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
				<h3 className="local-llm-title">AI Analysis</h3>
				<div className="local-llm-header-right">
					{isLoading && (
						<div className="local-llm-loading-inline">
							<div className="local-llm-spinner"></div>
							<span>Analyzing...</span>
						</div>
					)}
					<button
						className="local-llm-button"
						onClick={queryLLM}
						disabled={isLoading}
					>
						{isLoading ? 'Analyzing...' : totalIssues === 0 ? 'Get Status' : 'Analyze Issues'}
					</button>
				</div>
			</div>

			{totalIssues === 0 && !llmResponse && (
				<div className="local-llm-info">
					<span role="img" aria-label="success">✅</span> All systems operating normally. No issues to analyze.
				</div>
			)}

			{error && (
				<div className="local-llm-error">
					<span role="img" aria-label="error">⚠️</span> {error}
				</div>
			)}

			{llmResponse && (
				<div className={`local-llm-response ${isLoading ? 'local-llm-response-loading' : ''}`}>
					<div className="local-llm-response-title">Analysis Results:</div>
					<div className="local-llm-response-content">
						<LLMMarkup content={llmResponse} />
					</div>
				</div>
			)}
		</div>
	);
}
