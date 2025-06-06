import { useEffect, useState } from 'react';

// State Management
import { useAtomValue } from 'jotai';
import { hostHowManyAtom } from '../../atoms/hostAtom';
import { serviceHowManyAtom } from '../../atoms/serviceAtom';
import { alertAtom } from '../../atoms/alertAtom';
import { clientSettingsAtom } from 'atoms/settingsState';
import { programStatusAtom } from 'atoms/programAtom';

// Helpers
import { formatDateTimeAgoColorQuietFor } from '../../helpers/dates';
import Doomguy from 'components/Doomguy/Doomguy';
// CSS
import './Summary.css';

export default function Summary() {

	// State Management state (this section)
	const hostHowManyState = useAtomValue(hostHowManyAtom);
	const serviceHowManyState = useAtomValue(serviceHowManyAtom);
	const alertState = useAtomValue(alertAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);
	// const programStatus = useAtomValue(programStatusAtom);
	
	// Extract a couple of fields out of programStatus that we are using: "program_start" and "version"
	// const programStart = programStatus?.response?.program_start;
	// const programVersion = programStatus?.response?.version;

	let quietForMs: number | null = null;
	if (alertState && alertState.responseArray && alertState.responseArray.length > 0) {
		quietForMs = alertState.responseArray[0].timestamp;
	}

	const scrollDown = () => {
		const scrollAreaSelector = '.vertical-scroll-dash';
		const scrollDiv = document.querySelector(scrollAreaSelector);
		const alertDiv = document.querySelector<HTMLDivElement>('.AlertSection');
		if (scrollDiv && alertDiv) {
			scrollDiv.scrollTo({ top: alertDiv.offsetTop - 15, behavior: 'smooth' });
		}
	};

	// Trigger a re-render every minute to get the Quiet For value to show the correct minute
	const [, setTriggerRender] = useState(0);
	useEffect(() => {
		const i = setInterval(() => {
			setTriggerRender(new Date().getTime());
		}, 60 * 1000);
		return () => {
			clearInterval(i);
		};
	});

	return (
		<div className="summary">

			{/* <div className="service-summary">
			<span className="service-summary-title">
				Summary
			</span>
			</div> */}

			<div className="summary-item">

				<div className="summary-left-side">

					{/** Hosts Down */}
					<div className="summary-box">
						<div className="summary-box-big-number">
							<span className={hostHowManyState.howManyHostDown > 0 ? 'color-red' : 'color-green'}>{hostHowManyState.howManyHostDown}</span>
						</div>
						<div className="summary-box-text"><span className={hostHowManyState.howManyHostDown > 0 ? 'color-white' : 'color-white'}>hosts<br />down</span></div>
					</div>

					{/** Hosts Unreachable */}
					<div className="summary-box">
						<div className="summary-box-big-number">
							<span className={hostHowManyState.howManyHostUnreachable > 0 ? 'color-red' : 'color-green'}>{hostHowManyState.howManyHostUnreachable}</span>
						</div>
						<div className="summary-box-text"><span className={hostHowManyState.howManyHostUnreachable > 0 ? 'color-white' : 'color-white'}>hosts<br />unreachable</span></div>
					</div>

					{/** Hosts Total */}
					<div className="summary-box">
						<div className="summary-box-big-number">
							<span className={'color-green'}>{hostHowManyState.howManyHosts}</span>
						</div>
						<div className="summary-box-text"><span className={hostHowManyState.howManyHosts > 0 ? 'color-white' : 'color-white'}>hosts<br />total</span></div>
					</div>

					{/** Blue Separator */}
					<div className="summary-box summary-box-separator">
					</div>

					{/** Service Critical */}
					<div className="summary-box">
						<div className="summary-box-big-number">
							<span className={serviceHowManyState.howManyServiceCritical > 0 ? 'color-red' : 'color-green'}>{serviceHowManyState.howManyServiceCritical}</span>
						</div>
						<div className="summary-box-text"><span className={serviceHowManyState.howManyServiceCritical > 0 ? 'color-white' : 'color-white'}>services<br />critical</span></div>
					</div>

					{/** Service Warning */}
					<div className="summary-box">
						<div className="summary-box-big-number">
							<span className={serviceHowManyState.howManyServiceWarning > 0 ? 'color-yellow' : 'color-green'}>{serviceHowManyState.howManyServiceWarning}</span>
						</div>
						<div className="summary-box-text"><span className={serviceHowManyState.howManyServiceWarning > 0 ? 'color-white' : 'color-white'}>services<br />warning</span></div>
					</div>

					{/** Service Unknown */}
					<div className="summary-box">
						<div className="summary-box-big-number">
							<span className={serviceHowManyState.howManyServiceUnknown > 0 ? 'color-orange' : 'color-green'}>{serviceHowManyState.howManyServiceUnknown}</span>
						</div>
						<div className="summary-box-text"><span className={serviceHowManyState.howManyServiceUnknown > 0 ? 'color-white' : 'color-white'}>services<br />unknown</span></div>
					</div>

					{/** Service Total */}
					<div className="summary-box">
						<div className="summary-box-big-number">
							<span className={'color-green'}>{serviceHowManyState.howManyServices}</span>
						</div>
						<div className="summary-box-text"><span className={serviceHowManyState.howManyServices > 0 ? 'color-white' : 'color-white'}>services<br />total</span></div>
					</div>

				</div>

				<div className="summary-right-side">

					{/* these are floating right */}

	  				{/* Nagios Version */}
					{/* <div className="summary-box">
						<div className="margin-top-5 font-size-0-8">Nagios</div>
						<div className="margin-top-5 color-peach font-size-0-8">v{programVersion}</div>
					</div> */}

	  				{/* Uptime */}
					{/* <div className="summary-box">
						<div className="margin-top-5 font-size-0-8">Uptime</div>
						<div className="margin-top-5 color-peach font-size-0-8">{formatDateTimeAgo(programStart)}</div>
					</div> */}

					{/* Quiet For */}
					<div className="summary-box overflow-hidden" onClick={scrollDown} style={{ cursor: 'pointer' }}>
						<div className="margin-top-5 font-size-0-6 no-wrap">Quiet For</div>
						<div className="margin-top-5 color-peach no-wrap">{quietForMs ? formatDateTimeAgoColorQuietFor(quietForMs) : '?'}</div>
					</div>

					{/* Drift */}
					{/* <div className="summary-box float-right">
						Drift<br />
						20s
					</div> */}

					{/* Doomguy */}
					{clientSettings.doomguyEnabled && <div className="summary-box float-right">
						<div style={{ position: 'relative', top: -10, width: 47, height: 58 }}>
							<Doomguy scaleCss={'1'} />
						</div>
					</div>}
				</div>
			</div>

		</div>
	);
}