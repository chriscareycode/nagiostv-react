/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2023 Chris Carey https://chriscarey.com
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

import { Component } from 'react';
import { translate } from '../../helpers/language';
import { momentFormatDateTime } from '../../helpers/moment';
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

class AlertItem extends Component<AlertItemProps> {

	shouldComponentUpdate(nextProps, nextState) {
		// console.log('shouldComponentUpdate', nextProps, nextState);
		// if (nextProps.prevtime !== this.props.prevtime) {
		//   return true;
		// } else {
		//   return false;
		// }
		return false;
	}

	openNagiosHostPage = () => {
		const isDemoMode = this.props.isDemoMode;
		if (isDemoMode) {
			return;
		}

		const { e } = this.props;
		let hostName;
		if (e.object_type === 1) {
			hostName = e.name;
		}
		if (e.object_type === 2) {
			hostName = e.host_name;
		}
		const baseUrl = this.props.settings.baseUrl;
		const url = encodeURI(`${baseUrl}extinfo.cgi?type=1&host=${hostName}`);
		const win = window.open(url, '_blank');
		win?.focus();
	}

	openNagiosServicePage = () => {
		const isDemoMode = this.props.isDemoMode;
		if (isDemoMode) {
			return;
		}

		const { e } = this.props;
		let hostName;
		if (e.object_type === 1) {
			hostName = e.name;
		}
		if (e.object_type === 2) {
			hostName = e.host_name;
		}
		const baseUrl = this.props.settings.baseUrl;
		const url = encodeURI(`${baseUrl}extinfo.cgi?type=2&host=${hostName}&service=${e.description}`);
		const win = window.open(url, '_blank');
		win?.focus();
	}

	render() {

		const { language, locale, dateFormat } = this.props;
		const howMuchTimeIsQuietTime = 10;
		const { e, i } = this.props;
		const isSoft = e.state_type === 2;

		return (
			<div>
				{/* show quiet for */}
				{(i > 0) && ifQuietFor(e.timestamp, this.props.prevtime, howMuchTimeIsQuietTime) &&
					<QuietFor
						nowtime={e.timestamp}
						prevtime={this.props.prevtime}
						//showEmoji={this.props.showEmoji}
						language={this.props.language}
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

						<div className="alert-item-right-date align-right">{momentFormatDateTime(e.timestamp, locale, dateFormat)}</div>

					</div>
					<span style={{ textAlign: 'left' }}>

						<div style={{ marginTop: '2px' }}>
							{/* host */}
							{e.object_type === 1 && <span className="alert-item-host-name" onClick={this.openNagiosHostPage} style={{ cursor: 'pointer' }}>{e.name}</span>}
							{/* service */}
							{e.object_type === 2 && <span className="alert-item-host-name" onClick={this.openNagiosHostPage} style={{ cursor: 'pointer' }}>{e.host_name}</span>}
							{' '}
							<span className={alertTextClass(e.object_type, e.state)}>
								{e.object_type === 2 && <span className="alert-item-description" onClick={this.openNagiosServicePage} style={{ cursor: 'pointer' }}>{e.description}</span>}
								{e.plugin_output}
							</span>
						</div>
					</span>

				</div>
			</div>
		);
	}
}

export default AlertItem;
