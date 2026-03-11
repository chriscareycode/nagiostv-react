import { AxiosError } from "axios";

interface FetchStateBase {
	error: boolean;
	errorCount?: number;
	errorMessage: string;
}

export const handleFetchFail = <T extends FetchStateBase>(setFn: (updater: (prev: T) => T) => void, error: AxiosError, url: string, incrementErrorCount: boolean) => {
	// console.log('handleFetchFail DEBUG error', error);

	let errorMessage = '';
	if (error?.code === 'ERR_NETWORK') {
		errorMessage = `ERROR: ${error.code} CONNECTION REFUSED ${error.message} ${url}`;
	} else if (error && error.code && error.message) {
		errorMessage = `ERROR: ${error.code} ${error.message} ${url}`;
	} else {
		errorMessage = `UNKNOWN ERROR to ${url} check console`;
		console.log('Axios unknown error', error);
	}

	if (incrementErrorCount) {
		setFn((curr) => ({
			...curr,
			error: true,
			errorCount: curr.errorCount !== undefined ? curr.errorCount + 1 : 1,
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

