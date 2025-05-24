/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { translate } from '../../helpers/language';
import { formatDateTimeLocale } from '../../helpers/dates';
import { ifQuietFor } from '../../helpers/date-math';
import { alertTextClass, alertBorderClass } from '../../helpers/colors';
import { nagiosAlertState, nagiosAlertStateType } from '../../helpers/nagios';
import QuietFor from './QuietFor';
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faAdjust } from '@fortawesome/free-solid-svg-icons';

// css
import './AlertItem.css';
import { Alert } from 'types/hostAndServiceTypes';
import { ClientSettings } from 'types/settings';

interface AlertItemProps {
	isDemoMode: boolean;
	settings: ClientSettings;
	e: Alert;
	i: number;
	language: string;
	locale: string;
	dateFormat: string;
	prevtime: number;
}

const AlertItem = (props: AlertItemProps) => {

	const openNagiosHostPage = () => {
		const isDemoMode = props.isDemoMode;
		if (isDemoMode) {
			return;
		}

		const { e } = props;
		let hostName;
		if (e.object_type === 1) {
			hostName = e.name;
		}
		if (e.object_type === 2) {
			hostName = e.host_name;
		}
		const baseUrl = props.settings.baseUrl;
		const url = encodeURI(`${baseUrl}extinfo.cgi?type=1&host=${hostName}`);
		const win = window.open(url, '_blank');
		win?.focus();
	}

	const openNagiosServicePage = () => {
		const isDemoMode = props.isDemoMode;
		if (isDemoMode) {
			return;
		}

		const { e } = props;
		let hostName;
		if (e.object_type === 1) {
			hostName = e.name;
		}
		if (e.object_type === 2) {
			hostName = e.host_name;
		}
		const baseUrl = props.settings.baseUrl;
		const url = encodeURI(`${baseUrl}extinfo.cgi?type=2&host=${hostName}&service=${e.description}`);
		const win = window.open(url, '_blank');
		win?.focus();
	}

	const { language, locale, dateFormat } = props;
	const howMuchTimeIsQuietTime = 10;
	const { e, i } = props;
	const isSoft = e.state_type === 2;

	return (
		<div>
			{/* show quiet for */}
			{(i > 0) && ifQuietFor(e.timestamp, props.prevtime, howMuchTimeIsQuietTime) &&
				<QuietFor
					nowtime={e.timestamp}
					prevtime={props.prevtime}
					//showEmoji={this.props.showEmoji}
					language={props.language}
				/>
			}
			{/* show alert item */}
			<div className={`AlertItem ${alertBorderClass(e.object_type, e.state)}`}>
				<div className={'AlertItemRight'}>
					{/*isSoft && <span className="softIcon color-white"><FontAwesomeIcon icon={faAdjust} /></span>*/}
					{/* {1 === 2 && <span>({e.state_type})</span>} */}
					<span className={`uppercase alert-item-state-type-${e.state_type}`}>{translate(nagiosAlertStateType(e.state_type), language)}</span>
					{' '}
					{/* {1 === 2 && <span>({e.state})</span>} */}
					{/* {1 === 2 && <span>({e.object_type})</span>} */}
					<span className={`uppercase ${alertTextClass(e.object_type, e.state)}`}>{translate(nagiosAlertState(e.state), language)}{' '}</span>

					<div className="alert-item-right-date align-right">{formatDateTimeLocale(e.timestamp, locale, dateFormat)}</div>

				</div>
				<span className="alert-item-left" style={{ textAlign: 'left' }}>

					<div style={{ marginTop: '2px' }}>
						{/* host */}
						{e.object_type === 1 && <span className="alert-item-host-name alert-item-clickable" onClick={openNagiosHostPage}>{e.name}</span>}
						{/* service */}
						{e.object_type === 2 && <span className="alert-item-host-name alert-item-clickable" onClick={openNagiosHostPage}>{e.host_name}</span>}
						{' '}
						<span className={alertTextClass(e.object_type, e.state)}>
							{e.object_type === 2 && <span className="alert-item-description alert-item-clickable" onClick={openNagiosServicePage}>{e.description}</span>}
							<span className="plugin-output">{e.plugin_output}</span>
						</span>
					</div>
				</span>

			</div>
		</div>
	);
	
}

export default AlertItem;
