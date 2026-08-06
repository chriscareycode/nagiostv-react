import { clientSettingsInitial } from '../atoms/settingsState';
import { ClientSettings } from '../types/settings';

type NumericRange = {
	min: number;
	max: number;
};

const numericRanges: Partial<Record<keyof ClientSettings, NumericRange>> = {
	doomguyConcernedAt: { min: 0, max: 100_000 },
	doomguyAngryAt: { min: 0, max: 100_000 },
	doomguyBloodyAt: { min: 0, max: 100_000 },
	automaticScrollTimeMultiplier: { min: 0.1, max: 100 },
	automaticScrollWaitSeconds: { min: 0, max: 86_400 },
	miniMapWidth: { min: 0, max: 2_000 },
};

const URL_OVERRIDABLE_SETTINGS: ReadonlySet<keyof ClientSettings> = new Set([
	'titleString',
	'hostsAndServicesSideBySide',
	'hideSummarySection',
	'hideMostRecentAlertSection',
	'hideServiceSection',
	'hideServicePending',
	'hideServiceOk',
	'hideServiceWarning',
	'hideServiceUnknown',
	'hideServiceCritical',
	'hideServiceAcked',
	'hideServiceScheduled',
	'hideServiceFlapping',
	'hideServiceSoft',
	'hideServiceNotificationsDisabled',
	'serviceSortOrder',
	'hideHostSection',
	'hideHostPending',
	'hideHostUp',
	'hideHostDown',
	'hideHostUnreachable',
	'hideHostAcked',
	'hideHostScheduled',
	'hideHostFlapping',
	'hideHostSoft',
	'hideHostNotificationsDisabled',
	'hostSortOrder',
	'hideHistory',
	'hideHistoryTitle',
	'hideHistory24hChart',
	'hideHistoryChart',
	'hideAlertSoft',
	'hostgroupFilter',
	'servicegroupFilter',
	'alwaysShowGroupFilters',
	'fontSizeEm',
	'doomguyEnabled',
	'doomguyConcernedAt',
	'doomguyAngryAt',
	'doomguyBloodyAt',
	'showEmoji',
	'showNextCheckInProgressBar',
	'hideHamburgerMenu',
	'hideBottomMenu',
	'automaticScroll',
	'automaticScrollTimeMultiplier',
	'automaticScrollWaitSeconds',
	'showMiniMap',
	'miniMapWidth',
]);

export const getClientSettingsUrlParams = (
	location: Pick<Location, 'hash' | 'search'>,
): URLSearchParams => {
	const urlParams = new URLSearchParams(location.search);
	const hashQueryIndex = location.hash.indexOf('?');

	if (hashQueryIndex !== -1) {
		const hashParams = new URLSearchParams(
			location.hash.substring(hashQueryIndex + 1),
		);
		for (const [key, value] of hashParams) {
			urlParams.set(key, value);
		}
	}

	return urlParams;
};

export const parseClientSettingsUrlOverrides = (
	urlParams: URLSearchParams,
): Partial<ClientSettings> => {
	const overrides: Record<string, unknown> = {};

	for (const [untypedKey, value] of urlParams) {
		if (!Object.prototype.hasOwnProperty.call(clientSettingsInitial, untypedKey)) {
			continue;
		}

		const key = untypedKey as keyof ClientSettings;
		if (!URL_OVERRIDABLE_SETTINGS.has(key)) {
			continue;
		}
		const defaultValue = clientSettingsInitial[key];

		if (typeof defaultValue === 'boolean') {
			if (value === 'true') {
				overrides[key] = true;
			} else if (value === 'false') {
				overrides[key] = false;
			}
			continue;
		}

		if (typeof defaultValue === 'number') {
			const parsedValue = Number(value);
			const range = numericRanges[key];
			if (
				Number.isFinite(parsedValue)
				&& (!range || (
					parsedValue >= range.min
					&& parsedValue <= range.max
				))
			) {
				overrides[key] = parsedValue;
			}
			continue;
		}

		overrides[key] = value;
	}

	return overrides as Partial<ClientSettings>;
};
