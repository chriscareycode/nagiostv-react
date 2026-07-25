import { LLMHistoryColor } from '../../atoms/llmAtom';
import { formatDateTimeAgo, formatDateTimeLocale } from '../../helpers/dates';
import { LLMMessage } from '../../helpers/llmBackends';
import { Alert, Host, Service } from '../../types/hostAndServiceTypes';
import { ClientSettings } from '../../types/settings';

export const MAX_HOST_PROBLEMS_FOR_LLM = 20;
export const MAX_SERVICE_PROBLEMS_FOR_LLM = 20;

const HOST_STATUS_NAMES: Record<number, string> = {
	1: 'PENDING',
	2: 'UP',
	4: 'DOWN',
	8: 'UNREACHABLE',
};

const SERVICE_STATUS_NAMES: Record<number, string> = {
	1: 'PENDING',
	2: 'OK',
	4: 'WARNING',
	8: 'UNKNOWN',
	16: 'CRITICAL',
};

const MONITOR_STATE_TYPE_NAMES: Record<number, string> = {
	0: 'SOFT',
	1: 'HARD',
};

const ALERT_STATE_NAMES: Record<number, string> = {
	1: 'HOST UP',
	2: 'HOST DOWN',
	4: 'HOST UNREACHABLE',
	8: 'SERVICE OK',
	16: 'SERVICE WARNING',
	32: 'SERVICE CRITICAL',
	64: 'SERVICE UNKNOWN',
};

const ALERT_STATE_TYPE_NAMES: Record<number, string> = {
	1: 'HARD',
	2: 'SOFT',
};

const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}][\u{FE00}-\u{FE0F}]?)\s*/u;
const doomguySaysRegex = /Doomguy says\s*:?\s*(?:"([^"]*)"|“([^”]*)”|‘([^’]*)’)\s*\.?\s*/gi;

export const formatResponseDuration = (durationMs?: number): string => {
	if (durationMs === undefined) {
		return '';
	}

	return `${Math.max(1, Math.round(durationMs / 1000))}s`;
};

export const formatHostIssues = (
	hosts: Host[],
	locale: string,
	dateFormat: string,
): string => {
	if (hosts.length === 0) {
		return 'No host issues detected.';
	}

	const issues = hosts.map(host => {
		const timestampAgo = formatDateTimeAgo(host.last_time_up);
		return `- Host: ${host.name}
  Status: ${HOST_STATUS_NAMES[host.status] || 'UNKNOWN'}
  Alert State: ${MONITOR_STATE_TYPE_NAMES[host.state_type] || 'UNKNOWN'}
  Plugin Output: ${host.plugin_output || 'N/A'}
  Last Time Up: ${host.last_time_up ? formatDateTimeLocale(host.last_time_up, locale, dateFormat) : 'N/A'} (${timestampAgo} ago)
  Acknowledged: ${host.problem_has_been_acknowledged ? 'Yes' : 'No'}
  Scheduled Downtime: ${host.scheduled_downtime_depth > 0 ? 'Yes' : 'No'}
  Flapping: ${host.is_flapping ? 'Yes' : 'No'}`;
	}).join('\n\n');

	return `Host Issues (${hosts.length}):\n\n${issues}`;
};

export const formatServiceIssues = (
	services: Service[],
	locale: string,
	dateFormat: string,
): string => {
	if (services.length === 0) {
		return 'No service issues detected.';
	}

	const issues = services.map(service => {
		const timestampAgo = formatDateTimeAgo(service.last_time_ok);
		return `- Host: ${service.host_name}
  Service: ${service.description}
  Status: ${SERVICE_STATUS_NAMES[service.status] || 'UNKNOWN'}
  Alert State: ${MONITOR_STATE_TYPE_NAMES[service.state_type] || 'UNKNOWN'}
  Last Time OK: ${service.last_time_ok ? formatDateTimeLocale(service.last_time_ok, locale, dateFormat) : 'N/A'} (${timestampAgo} ago)
  Plugin Output: ${service.plugin_output || 'N/A'}
  Acknowledged: ${service.problem_has_been_acknowledged ? 'Yes' : 'No'}
  Scheduled Downtime: ${service.scheduled_downtime_depth > 0 ? 'Yes' : 'No'}
  Flapping: ${service.is_flapping ? 'Yes' : 'No'}`;
	}).join('\n\n');

	return `Service Issues (${services.length}):\n\n${issues}`;
};

export const formatRecentAlerts = (
	alerts: Alert[],
	locale: string,
	dateFormat: string,
): string => {
	if (alerts.length === 0) {
		return 'No recent alerts.';
	}

	const formattedAlerts = alerts.map(alert => {
		const timestamp = formatDateTimeLocale(alert.timestamp, locale, dateFormat);
		const timestampAgo = formatDateTimeAgo(alert.timestamp);
		const commonDetails = `State: ${ALERT_STATE_NAMES[alert.state] || 'UNKNOWN'}
  State Type: ${ALERT_STATE_TYPE_NAMES[alert.state_type] || 'UNKNOWN'}
  Time: ${timestamp} (${timestampAgo} ago)
  Plugin Output: ${alert.plugin_output || 'N/A'}`;

		if (alert.object_type === 1) {
			return `- Host: ${alert.name}
  ${commonDetails}`;
		}

		return `- Host: ${alert.host_name}
  Service: ${alert.description}
  ${commonDetails}`;
	}).join('\n\n');

	return `Recent Alerts (${alerts.length}):\n\n${formattedAlerts}`;
};

export const buildMonitoringSignature = (
	hosts: Host[],
	services: Service[],
	settings: ClientSettings,
): string => {
	const hostIds = hosts.map(host => `${host.name}:${host.status}`).sort().join(',');
	const serviceIds = services
		.map(service => `${service.host_name}:${service.description}:${service.status}`)
		.sort()
		.join(',');
	const filterSignature = [
		settings.hideHostPending,
		settings.hideHostUp,
		settings.hideHostDown,
		settings.hideHostUnreachable,
		settings.hideHostAcked,
		settings.hideHostScheduled,
		settings.hideHostFlapping,
		settings.hideHostSoft,
		settings.hideHostNotificationsDisabled,
		settings.hideServicePending,
		settings.hideServiceOk,
		settings.hideServiceWarning,
		settings.hideServiceUnknown,
		settings.hideServiceCritical,
		settings.hideServiceAcked,
		settings.hideServiceScheduled,
		settings.hideServiceFlapping,
		settings.hideServiceSoft,
		settings.hideServiceNotificationsDisabled,
	].map(value => value ? '1' : '0').join('');

	return `${hosts.length}|${services.length}|${hostIds}|${serviceIds}|${filterSignature}`;
};

export const buildSystemPrompt = (
	settings: ClientSettings,
	now = new Date(),
): string => {
	let prompt = settings.llmSystemPrompt
		.replace(/\{\{DATE\}\}/g, now.toISOString().split('T')[0])
		.replace(/\{\{TIME\}\}/g, now.toLocaleTimeString(undefined, { hour12: false }))
		.replace(/\{\{DAY_OF_WEEK\}\}/g, now.toLocaleDateString(undefined, { weekday: 'long' }));

	if ((settings.llmThinkingLevel || 'medium') === 'off') {
		prompt += '\n\nRespond directly with no internal reasoning, no chain-of-thought, and no <think> tags.';
	}
	if (settings.doomguyEnabled) {
		prompt += `\n\n${settings.llmDoomguyPrompt}`;
	}

	return prompt;
};

export const buildAnalysisMessages = (
	systemPrompt: string,
	hosts: Host[],
	services: Service[],
	recentAlerts: Alert[],
	settings: ClientSettings,
): LLMMessage[] => {
	const tooManyHosts = hosts.length > MAX_HOST_PROBLEMS_FOR_LLM;
	const tooManyServices = services.length > MAX_SERVICE_PROBLEMS_FOR_LLM;

	if (tooManyHosts || tooManyServices) {
		let overloadMessage = 'The monitoring system is reporting a large number of states to the LLM:\n\n';
		overloadMessage += tooManyHosts
			? `- There are ${hosts.length} host problems (limit is ${MAX_HOST_PROBLEMS_FOR_LLM})\n`
			: `- There are ${hosts.length} host problems\n`;
		overloadMessage += tooManyServices
			? `- There are ${services.length} service problems (limit is ${MAX_SERVICE_PROBLEMS_FOR_LLM})\n`
			: `- There are ${services.length} service problems\n`;
		overloadMessage += '\nThe detailed analysis cannot be performed due to context size protections. Increase the maximums in settings if you wish to allow larger analyses.';

		return [
			{ role: 'system', content: systemPrompt },
			{
				role: 'user',
				content: `${overloadMessage}\n\nPlease provide a brief response acknowledging this situation and suggesting immediate steps the operator should take.`,
			},
		];
	}

	if (hosts.length === 0 && services.length === 0) {
		return [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: settings.llmPromptAllOk },
		];
	}

	const hostIssues = formatHostIssues(hosts, settings.locale, settings.dateFormat);
	const serviceIssues = formatServiceIssues(services, settings.locale, settings.dateFormat);
	const alerts = settings.hideMostRecentAlertSection
		? ''
		: formatRecentAlerts(recentAlerts, settings.locale, settings.dateFormat);

	return [
		{ role: 'system', content: systemPrompt },
		{
			role: 'user',
			content: `Please analyze the following Nagios monitoring data and provide insights:\n\n${hostIssues}\n\n${serviceIssues}${alerts ? `\n\n${alerts}` : ''}\n\n ${settings.llmPromptNotOk}`,
		},
	];
};

export const parseThinkingContent = (
	rawContent: string,
): { thinkingContent: string; mainContent: string } => {
	const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
	const match = rawContent.match(thinkRegex);
	if (match) {
		return {
			thinkingContent: match[1].trim(),
			mainContent: rawContent.replace(thinkRegex, '').trim(),
		};
	}

	const closeThinkIndex = rawContent.toLowerCase().indexOf('</think>');
	if (closeThinkIndex !== -1) {
		return {
			thinkingContent: rawContent.substring(0, closeThinkIndex).trim(),
			mainContent: rawContent.substring(closeThinkIndex + '</think>'.length).trim(),
		};
	}

	return { thinkingContent: '', mainContent: rawContent };
};

export interface ParsedLlmContent {
	content: string;
	emoji: string;
	shortResponse: string;
	thinkingContent?: string;
}

export const parseLlmContent = (
	rawContent: string,
	explicitThinkingContent: string | undefined,
	issueCount: number,
): ParsedLlmContent => {
	const parsedThinking = parseThinkingContent(rawContent);
	const thinkingContent = [explicitThinkingContent || '', parsedThinking.thinkingContent]
		.filter(Boolean)
		.join('\n\n')
		.trim();
	const emojiMatch = parsedThinking.mainContent.match(emojiRegex);
	const emoji = emojiMatch
		? emojiMatch[1]
		: issueCount > 10
			? '🚨'
			: issueCount > 0
				? '⚠️'
				: '✅';
	let content = emojiMatch
		? parsedThinking.mainContent.slice(emojiMatch[0].length)
		: parsedThinking.mainContent;
	let shortResponse = '';
	let doomguyMatch: RegExpExecArray | null;

	while ((doomguyMatch = doomguySaysRegex.exec(content)) !== null) {
		shortResponse = doomguyMatch[1] ?? doomguyMatch[2] ?? doomguyMatch[3] ?? '';
	}

	content = content
		.replace(doomguySaysRegex, '')
		.trim()
		.replace(/\s*["'`“”‘’]\s*$/, '')
		.trim();

	return {
		content,
		emoji,
		shortResponse,
		thinkingContent: thinkingContent || undefined,
	};
};

export const getLlmHistoryColor = (
	hosts: Host[],
	services: Service[],
): LLMHistoryColor => {
	if (
		hosts.some(host => host.status === 4 || host.status === 8)
		|| services.some(service => service.status === 16)
	) {
		return 'red';
	}
	if (services.some(service => service.status === 4)) {
		return 'yellow';
	}
	if (services.some(service => service.status === 8)) {
		return 'orange';
	}
	return 'green';
};

export const cleanLlmContentForSpeech = (content: string): string => {
	return content
		.replace(/#{1,6}\s+/g, '')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/```[\s\S]*?```/g, '')
		.replace(/[-*+]\s+/g, '')
		.replace(/\d+\.\s+/g, '')
		.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
};
