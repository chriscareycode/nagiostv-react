import { ClientSettings } from '../types/settings';

export type NagiosQuery =
	| 'alertlist'
	| 'commentlist'
	| 'hostcount'
	| 'hostgrouplist'
	| 'hostlist'
	| 'programstatus'
	| 'servicecount'
	| 'servicegrouplist'
	| 'servicelist';

type NagiosConnectionSettings = Pick<ClientSettings, 'baseUrl' | 'dataSource' | 'livestatusPath'>;

type QueryParameterValue = boolean | number | string | undefined;

const cgiScripts: Record<NagiosQuery, string> = {
	alertlist: 'archivejson.cgi',
	commentlist: 'statusjson.cgi',
	hostcount: 'statusjson.cgi',
	hostgrouplist: 'objectjson.cgi',
	hostlist: 'statusjson.cgi',
	programstatus: 'statusjson.cgi',
	servicecount: 'statusjson.cgi',
	servicegrouplist: 'objectjson.cgi',
	servicelist: 'statusjson.cgi',
};

const detailedQueries = new Set<NagiosQuery>([
	'commentlist',
	'hostgrouplist',
	'hostlist',
	'servicegrouplist',
	'servicelist',
]);

const appendPath = (basePath: string, fileName: string): string => (
	basePath.endsWith('/') ? `${basePath}${fileName}` : `${basePath}/${fileName}`
);

export const buildNagiosUrl = (
	settings: NagiosConnectionSettings,
	query: NagiosQuery,
	parameters: Record<string, QueryParameterValue> = {},
): string => {
	const isLivestatus = settings.dataSource === 'livestatus';
	const path = isLivestatus
		? settings.livestatusPath
		: appendPath(settings.baseUrl, cgiScripts[query]);
	const searchParams = new URLSearchParams({ query });

	if (!isLivestatus && detailedQueries.has(query)) {
		searchParams.set('details', 'true');
	}

	Object.entries(parameters).forEach(([key, value]) => {
		if (value !== undefined && value !== '') {
			searchParams.set(key, String(value));
		}
	});

	return `${path}?${searchParams.toString()}`;
};

export const buildGroupFilterParameters = (
	hostgroup: string,
	servicegroup: string,
): Record<string, string | undefined> => ({
	hostgroup: hostgroup || undefined,
	servicegroup: servicegroup || undefined,
});
