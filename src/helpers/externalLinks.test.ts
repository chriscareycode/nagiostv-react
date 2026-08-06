import { describe, expect, it } from 'vitest';
import { buildNagiosExtInfoUrl } from './externalLinks';

describe('buildNagiosExtInfoUrl', () => {
	it('builds a same-origin URL from a relative base', () => {
		const url = buildNagiosExtInfoUrl('/nagios/cgi-bin/', { type: 1, host: 'web01' });
		expect(url).toBe(`${window.location.origin}/nagios/cgi-bin/extinfo.cgi?type=1&host=web01`);
	});

	it('builds an absolute http(s) URL from an absolute base', () => {
		const url = buildNagiosExtInfoUrl('https://nagios.example.com/cgi-bin/', {
			type: 2,
			host: 'web01',
			service: 'HTTP',
		});
		expect(url).toBe('https://nagios.example.com/cgi-bin/extinfo.cgi?type=2&host=web01&service=HTTP');
	});

	it('encodes reserved characters in host and service', () => {
		const url = buildNagiosExtInfoUrl('/nagios/cgi-bin/', {
			type: 2,
			host: 'a&b=c',
			service: 'load average',
		});
		expect(url).toContain('host=a%26b%3Dc');
		expect(url).toContain('service=load+average');
		expect(url).not.toContain('&b=c');
	});

	it('rejects a javascript: scheme', () => {
		expect(buildNagiosExtInfoUrl('javascript:alert(1)//', { type: 1, host: 'x' })).toBeNull();
	});

	it('rejects an empty base', () => {
		expect(buildNagiosExtInfoUrl('', { type: 1, host: 'x' })).toBeNull();
	});
});
