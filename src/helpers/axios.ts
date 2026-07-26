import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
interface NagiosJsonResponse {
	data: Record<string, unknown> & {
		count: Record<string, number>;
	};
	result: {
		last_data_update: number;
	};
}

interface FetchErrorState {
	error: boolean;
	errorCount: number;
	errorMessage: string;
}

type FetchErrorSetter<T extends FetchErrorState> = (
	update: (current: T) => T
) => unknown;

export const INVALID_JSON_RESPONSE_MESSAGE = 'ERROR: Result data is not JSON. Base URL setting is probably wrong.';

export class InvalidJsonResponseError extends Error {
	constructor(public readonly url: string) {
		super(INVALID_JSON_RESPONSE_MESSAGE);
		this.name = 'InvalidJsonResponseError';
	}
}

export const responseHasJsonContentType = (headers: AxiosResponse['headers']): boolean => {
	const contentType = headers?.['content-type'];
	return contentType == null || String(contentType).toLowerCase().includes('application/json');
};

export const getJson = async <T = NagiosJsonResponse>(
	url: string,
	config: AxiosRequestConfig = {},
): Promise<AxiosResponse<T>> => {
	const response = await axios.get<T>(url, config);
	if (!responseHasJsonContentType(response.headers)) {
		throw new InvalidJsonResponseError(url);
	}
	return response;
};

export const getFetchErrorMessage = (error: unknown, url: string): string => {
	if (error instanceof InvalidJsonResponseError) {
		return INVALID_JSON_RESPONSE_MESSAGE;
	}

	if (axios.isAxiosError(error)) {
		if (error.code === 'ERR_NETWORK') {
			return `ERROR: ${error.code} CONNECTION REFUSED ${error.message} ${url}`;
		}
		if (error.code && error.message) {
			return `ERROR: ${error.code} ${error.message} ${url}`;
		}
	}

	console.log('Unknown request error', error);
	return `UNKNOWN ERROR to ${url} check console`;
};

export const handleFetchFail = <T extends FetchErrorState>(
	setFn: FetchErrorSetter<T>,
	error: unknown,
	url: string,
	incrementErrorCount: boolean,
) => {
	const errorMessage = getFetchErrorMessage(error, url);

	if (incrementErrorCount) {
		setFn((curr) => ({
			...curr,
			error: true,
			errorCount: curr.errorCount + 1,
			errorMessage
		}));
	} else {
		setFn((curr) => ({
			...curr,
			error: true,
			errorMessage
		}));
	}
};
