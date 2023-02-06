export interface BigState {
	currentVersion: number; // This gets incremented with each new release (manually)
	currentVersionString: string; // This gets incremented with each new release (manually)
	latestVersion: number;
	latestVersionString: string;
	lastVersionCheckTime: number;

	isDemoMode: boolean;
	isDebugMode: boolean;
	isStressTestMode: boolean;
	useFakeSampleData: boolean;

	isRemoteSettingsLoaded: boolean;
	isCookieLoaded: boolean; // I have this to render things only after cookie is loaded
	isDoneLoading: boolean;

	hideFilters: boolean;
	isLeftPanelOpen: boolean;
}

export interface ClientSettings {

	titleString: string;
	dataSource: string;
	baseUrl: string; // Base path to Nagios cgi-bin folder
	livestatusPath: string;

	fetchHostFrequency: number; // seconds
	fetchServiceFrequency: number; // seconds
	fetchAlertFrequency: number; // seconds
	fetchHostGroupFrequency: number; // seconds
	fetchCommentFrequency: number; // seconds

	alertDaysBack: number;
	alertHoursBack: number;
	alertMaxItems: number;

	hostsAndServicesSideBySide: boolean;
	hideSummarySection: boolean;
	hideServiceSection: boolean;
	hideServicePending: boolean;
	hideServiceWarning: boolean;
	hideServiceUnknown: boolean;
	hideServiceCritical: boolean;
	hideServiceAcked: boolean;
	hideServiceScheduled: boolean;
	hideServiceFlapping: boolean;
	hideServiceSoft: boolean;
	hideServiceNotificationsDisabled: boolean;
	serviceSortOrder: string;

	hideHostSection: boolean;
	hideHostPending: boolean;
	hideHostDown: boolean;
	hideHostUnreachable: boolean;
	hideHostAcked: boolean;
	hideHostScheduled: boolean;
	hideHostFlapping: boolean;
	hideHostSoft: boolean;
	hideHostNotificationsDisabled: boolean;
	hostSortOrder: string;

	hideHistory: boolean;
	hideHistoryTitle: boolean;
	hideHistory24hChart: boolean;
	hideHistoryChart: boolean;

	hideAlertSoft: boolean;

	hostgroupFilter: string;
	servicegroupFilter: string;

	versionCheckDays: number;

	language: string;
	locale: string;
	dateFormat: string;
	clockDateFormat: string;
	clockTimeFormat: string;

	// audio and visual
	fontSizeEm: string;
	customLogoEnabled: boolean;
	customLogoUrl: string;
	flynnEnabled: boolean;
	flynnConcernedAt: number;
	flynnAngryAt: number;
	flynnBloodyAt: number;
	flynnCssScale: string;
	showEmoji: boolean;
	speakItems: boolean;
	speakItemsVoice: string;
	playSoundEffects: boolean;
	soundEffectCritical: string;
	soundEffectWarning: string;
	soundEffectOk: string;
	showNextCheckInProgressBar: boolean;
	hideHamburgerMenu: boolean;
	hideBottomMenu: boolean;
	automaticScroll: boolean;
	automaticScrollTimeMultiplier: number;
	automaticScrollWaitSeconds: number;
	showMiniMap: boolean;
	miniMapWidth: number;
}