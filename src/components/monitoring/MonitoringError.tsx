interface MonitoringErrorProps {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	isDemoMode: boolean;
	itemCount: number;
}

const MonitoringError = ({
	error,
	errorCount,
	errorMessage,
	isDemoMode,
	itemCount,
}: MonitoringErrorProps) => {
	const shouldShow = !isDemoMode && error && (errorCount > 2 || itemCount === 0);

	if (!shouldShow) {
		return null;
	}

	return (
		<div className="margin-top-10 border-red ServiceItemError">
			<span role="img" aria-label="error">⚠️</span> {errorMessage}
		</div>
	);
};

export default MonitoringError;
