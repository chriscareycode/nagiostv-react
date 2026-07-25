import { describe, expect, it } from 'vitest';
import { buildGroupFilterParameters, buildNagiosUrl } from './nagiosUrls';

const cgiSettings = {
	baseUrl: '/nagios/cgi-bin/',
	dataSource: 'cgi',
	livestatusPath: '/connectors/livestatus.php',
};

const livestatusSettings = {
	...cgiSettings,
	dataSource: 'livestatus',
};

describe('buildNagiosUrl', () => {
	it('selects the correct CGI script and details option', () => {
		expect(buildNagiosUrl(cgiSettings, 'hostlist')).toBe(
			'/nagios/cgi-bin/statusjson.cgi?query=hostlist&details=true',
		);
		expect(buildNagiosUrl(cgiSettings, 'hostgrouplist')).toBe(
			'/nagios/cgi-bin/objectjson.cgi?query=hostgrouplist&details=true',
		);
		expect(buildNagiosUrl(cgiSettings, 'alertlist')).toBe(
			'/nagios/cgi-bin/archivejson.cgi?query=alertlist',
		);
	});

	it('supports base paths without a trailing slash', () => {
		expect(buildNagiosUrl({ ...cgiSettings, baseUrl: '/nagios/cgi-bin' }, 'programstatus')).toBe(
			'/nagios/cgi-bin/statusjson.cgi?query=programstatus',
		);
	});

	it('routes every query through the configured livestatus connector', () => {
		expect(buildNagiosUrl(livestatusSettings, 'servicegrouplist')).toBe(
			'/connectors/livestatus.php?query=servicegrouplist',
		);
	});

	it('encodes reserved characters in hostgroup and servicegroup filters', () => {
		const filters = buildGroupFilterParameters(
			'Production & Operations',
			'HTTP/API + Database',
		);

		expect(buildNagiosUrl(cgiSettings, 'hostlist', filters)).toBe(
			'/nagios/cgi-bin/statusjson.cgi?query=hostlist&details=true'
			+ '&hostgroup=Production+%26+Operations'
			+ '&servicegroup=HTTP%2FAPI+%2B+Database',
		);
		expect(buildNagiosUrl(livestatusSettings, 'servicelist', filters)).toBe(
			'/connectors/livestatus.php?query=servicelist'
			+ '&hostgroup=Production+%26+Operations'
			+ '&servicegroup=HTTP%2FAPI+%2B+Database',
		);
	});

	it('omits empty filters and encodes status and time parameters', () => {
		expect(buildNagiosUrl(cgiSettings, 'servicelist', {
			...buildGroupFilterParameters('', ''),
			servicestatus: 'warning critical unknown pending',
			starttime: -86400,
			endtime: '-0',
		})).toBe(
			'/nagios/cgi-bin/statusjson.cgi?query=servicelist&details=true'
			+ '&servicestatus=warning+critical+unknown+pending'
			+ '&starttime=-86400&endtime=-0',
		);
	});
});
