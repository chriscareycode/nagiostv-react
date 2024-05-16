export const handleFetchFail = (setFn, error, url: string, incrementErrorCount: boolean) => {
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
		setFn(curr => ({
			...curr,
			error: true,
			errorCount: curr.errorCount + 1,
			errorMessage
		}));
	} else {
		setFn(curr => ({
			...curr,
			error: true,
			errorMessage
		}));
	}
};

