// Widgets
import AlertItem from 'components/alerts/AlertItem';
// Helpers
import { formatDateTimeAgoColorQuietFor } from '../../helpers/dates';
import { useAtomValue } from 'jotai';
import { alertAtom } from 'atoms/alertAtom';
import { clientSettingsAtom } from 'atoms/settingsState';

const MostRecentAlert = () => {

	const clientSettings = useAtomValue(clientSettingsAtom);
	const alertState = useAtomValue(alertAtom);
	const alertlist = alertState.responseArray;

	let quietForMs: number | null = null;
	if (alertState && alertState.responseArray && alertState.responseArray.length > 0) {
		quietForMs = alertState.responseArray[0].timestamp;
	}

	return (
		<>
			{/* Most Recent Alert Section */}
			{alertlist.length > 0 && <div className="relative rounded-md border border-[#002232] border-l-[3px] border-l-[#00adff] bg-[#051218] mt-[13px] mb-[5px]">
				<div className="m-2 mt-1">
					
					<div className="mb-1 text-gray-400">Most recent alert {quietForMs ? formatDateTimeAgoColorQuietFor(quietForMs) : '?'} ago:</div>
					
					{/* <div className="AlertItem border-green"><div className="AlertItemRight"><span className="uppercase alert-item-state-type-1">hard</span> <span className="uppercase color-green">service ok </span><div className="alert-item-right-date align-right">Sat, Oct 9, 2021 8:30 AM</div></div><span ><div ><span className="alert-item-host-name">unicorn</span> <span className="color-green"><span className="alert-item-description">Check APT</span>APT OK: 0 packages available for upgrade (0 critical updates).</span></div></span></div> */}

					<AlertItem
						key={'alert-item-latest'}
						e={alertlist[0]}
						i={1}
						prevtime={0}
						//showEmoji={this.props.showEmoji}
						language={clientSettings.language}
						locale={clientSettings.locale}
						dateFormat={clientSettings.dateFormat}
						settings={clientSettings}
						isDemoMode={false}
					/>
				</div>
			</div>}
		</>
	);
};

export default MostRecentAlert;
