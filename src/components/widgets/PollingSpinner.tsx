import React from 'react';
// State Management
import { useAtom } from 'jotai';
import { clientSettingsAtom } from '../../atoms/settingsState';
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import './PollingSpinner.css';

interface PollingSpinnerProps {
	isFetching: boolean;
	isDemoMode: boolean;
	error: boolean;
	errorCount: number;
	//fetchFrequency: number;
	fetchVariableName: 'fetchAlertFrequency' | 'fetchHostFrequency' | 'fetchServiceFrequency';
}

const PollingSpinner = ({
	isFetching,
	isDemoMode,
	error,
	errorCount,
	//fetchFrequency,
	fetchVariableName,
}: PollingSpinnerProps) => {
	//console.log('PollingSpinner run');

	const [clientSettings, setClientSettings] = useAtom(clientSettingsAtom);

	const fetchFrequency = clientSettings[fetchVariableName];

	const onChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		//console.log('onChangeSelect', e.target.value);
		//console.log('onChangeSelect', typeof e.target.value);

		setClientSettings(settings => {

			const newSettings = {
				...settings,
				[fetchVariableName]: parseInt(e.target.value)
			};

			console.log('Saving client settings', newSettings);

			localStorage.setItem('settings', JSON.stringify(newSettings)); // Save LocalStorage

			return newSettings; // Save state
		});

	};

	return (
		<span className={isFetching ? 'PollingSpinner loading-spinner' : 'PollingSpinner loading-spinner loading-spinner-fadeout'}>
			{(!isDemoMode && error) && <span style={{ color: 'yellow' }}>{errorCount} x <FontAwesomeIcon icon={faExclamationTriangle} /> &nbsp; </span>}
			<FontAwesomeIcon icon={faSync} />
			&nbsp;
			<select onChange={onChangeSelect} value={fetchFrequency}>
				<option value={15}>15s</option>
				<option value={30}>30s</option>
				<option value={60}>1m</option>
				<option value={300}>5m</option>
				<option value={600}>10m</option>
			</select>
		</span>
	);
};

// memoFn will re render the compopnent if return false
function arePropsEqual(prev: PollingSpinnerProps, next: PollingSpinnerProps) {
	//console.log('arePropsEqual', prev, next);
	const equals =
		prev.isFetching === next.isFetching &&
		prev.errorCount === next.errorCount;
	return equals;
}

export default React.memo(PollingSpinner, arePropsEqual);