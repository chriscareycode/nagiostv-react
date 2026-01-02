import { atom } from 'jotai';
// Types
import { BigState, ClientSettings } from 'types/settings';
// Import Polyfills
import 'url-search-params-polyfill';

// turn on demo mode if ?demo=true or we are hosting on nagiostv.com
// demo mode uses fake data and rotates through a couple of alerts as an example
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || window.location.hostname === 'nagiostv.com';
if (isDemoMode) {
	console.log('Demo mode is on');
}

const isStressTestMode = urlParams.get('stresstest') === 'true';

// turn on debug mode if ?debug=true
const isDebugMode = urlParams.get('debug') === 'true';

// use fake data (for local development) if ?fakedata=true, or if demo mode is true (?demo=true)
const useFakeSampleData = urlParams.get('fakedata') === 'true' || urlParams.get('fakeData') === 'true' || isDemoMode;

//**************************************************************************** */
// state which is used internally by NagiosTV
//**************************************************************************** */

const bigStateInitial: BigState = {

	currentVersion: 85, // This gets incremented with each new release (manually)
	currentVersionString: '0.9.7', // This gets incremented with each new release (manually)

	latestVersion: 0,
	latestVersionString: '',
	lastVersionCheckTime: 0,

	isDemoMode,
	isDebugMode,
	isStressTestMode,
	useFakeSampleData,

	isRemoteSettingsLoaded: false,
	isLocalSettingsLoaded: false, // I have this to render things only after local settings is loaded
	isDoneLoading: false,

	hideFilters: true,
	isLeftPanelOpen: false,
};

//**************************************************************************** */
// state which is loaded and saved into client settings / server settings
//**************************************************************************** */
export const clientSettingsInitial: ClientSettings = {

	titleString: 'NagiosTV',
	dataSource: 'cgi',
	baseUrl: '/nagios/cgi-bin/', // Base path to Nagios cgi-bin folder
	livestatusPath: 'connectors/livestatus.php',

	fetchHostFrequency: 30, // seconds
	fetchServiceFrequency: 30, // seconds
	fetchAlertFrequency: 60, // seconds
	fetchHostGroupFrequency: 3600, // seconds
	fetchCommentFrequency: 120, // seconds

	alertDaysBack: 30,
	alertHoursBack: 24,
	alertMaxItems: 1000,

	hostsAndServicesSideBySide: false,
	hideSummarySection: true,
	hideMostRecentAlertSection: true,
	hideLocalLLMSection: true,
	hideServiceSection: false,
	hideServicePending: false,
	hideServiceOk: true,
	hideServiceWarning: false,
	hideServiceUnknown: false,
	hideServiceCritical: false,
	hideServiceAcked: false,
	hideServiceScheduled: false,
	hideServiceFlapping: false,
	hideServiceSoft: false,
	hideServiceNotificationsDisabled: false,
	serviceSortOrder: 'newest',

	hideHostSection: false,
	hideHostPending: false,
	hideHostUp: true,
	hideHostDown: false,
	hideHostUnreachable: false,
	hideHostAcked: false,
	hideHostScheduled: false,
	hideHostFlapping: false,
	hideHostSoft: false,
	hideHostNotificationsDisabled: false,
	hostSortOrder: 'newest',

	hideHistory: false,
	hideHistoryTitle: false,
	hideHistory24hChart: false,
	hideHistoryChart: false,

	hideAlertSoft: false,

	hostgroupFilter: '',
	servicegroupFilter: '',

	versionCheckDays: 7,

	language: 'English',
	locale: 'en',
	dateFormat: 'fff',
	clockDateFormat: 'DD',
	clockTimeFormat: 'ttt',

	// audio and visual
	fontSizeEm: '1em',
	customLogoEnabled: true,
	customLogoUrl: './icon-256.png',
	doomguyEnabled: false,
	doomguyConcernedAt: 1,
	doomguyAngryAt: 2,
	doomguyBloodyAt: 4,
	showEmoji: false,
	speakItems: false,
	speakItemsVoice: '',
	playSoundEffects: false,
	soundEffectCritical: './sample-audio/critical.mp3',
	soundEffectWarning: './sample-audio/warning.mp3',
	soundEffectOk: './sample-audio/ok.mp3',
	showNextCheckInProgressBar: true,
	hideHamburgerMenu: false,
	hideBottomMenu: false,
	automaticScroll: false,
	automaticScrollTimeMultiplier: 4,
	automaticScrollWaitSeconds: 10,
	showMiniMap: false,
	miniMapWidth: 120,

	// LLM integration
	llmServerBaseUrl: 'http://localhost:1234',
	llmModel: 'openai/gpt-oss-20b',
	llmApiKey: '',
	llmSpeakResponse: false,
	llmSystemPrompt: `
You are a helpful assistant analyzing Nagios monitoring data. Provide concise insights about the current infrastructure health, identify critical issues, and suggest priorities for resolution. Today's date is {{DATE}}. The time is {{TIME}}. Day of the week is {{DAY_OF_WEEK}}. If you mention "flapping", capitalize it as "FLAPPING". Always add an emoji in the first position at the beginning of the response; it will be displayed as a "large icon" next to the response.
`,
	llmPromptAllOk: `
All systems are operating normally with no detected issues. 

Please start by announcing the time in plain language, and saying the following:
"All systems OK". 

If the current day is significant, like a major holiday, mention it.

Optionally append a single happy or network or server related emoji on the end of the response, be creative with your choice.
`,
	llmPromptNotOk: `
Provide a brief summary of the current situation. 

Alerts are always in the past, and I like to measure how long since the last alert. If it happened recently then it's worth mentioning. If it happened > 1 hour ago then not as interesting.

- If you mention a host name, service name, or check name, put backticks around the name so it will emphasize in the markup.

- If there are no host issues, then do not mention there are no host issues; only focus on the service issues.
- If no services are critical, then do not mention there are no critical. Only focus on communicating the state of the items listed, and not on what state they are not in.
- If we are not acknowledged, not scheduled downtime, or not flapping, do not mention these states in the response.
- If we have flapping, put a emoji related to flapping, next to the where you call it out.

Do not provide recommendations unless they are explicitly called out below:

======================================
RECOMMENDATIONS if the service is not in OK state:

- Check APT: Update the packages at your earliest convenience.
======================================

`,
};

export const bigStateAtom = atom(bigStateInitial);

export const clientSettingsAtom = atom(clientSettingsInitial);
