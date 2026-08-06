/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 */

interface ExtInfoParams {
	type: 1 | 2;
	host: string;
	service?: string;
}

// Resolve the configured base against the current page so relative same-origin
// paths keep working, and reject any scheme other than http(s).
export const buildNagiosExtInfoUrl = (
	externalLinkBaseUrl: string,
	{ type, host, service }: ExtInfoParams,
): string | null => {
	if (!externalLinkBaseUrl) {
		return null;
	}

	let url: URL;
	try {
		url = new URL(`${externalLinkBaseUrl}extinfo.cgi`, window.location.href);
	} catch {
		return null;
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		return null;
	}

	const searchParams = new URLSearchParams();
	searchParams.set('type', String(type));
	searchParams.set('host', host);
	if (service !== undefined) {
		searchParams.set('service', service);
	}
	url.search = searchParams.toString();
	return url.toString();
};

export const openNagiosExtInfoPage = (
	externalLinkBaseUrl: string,
	params: ExtInfoParams,
): void => {
	const url = buildNagiosExtInfoUrl(externalLinkBaseUrl, params);
	if (!url) {
		return;
	}

	const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
	if (openedWindow) {
		openedWindow.opener = null;
	}
};
