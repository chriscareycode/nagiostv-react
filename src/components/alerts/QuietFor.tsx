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
import moment from 'moment';
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCloudShowersHeavy, faCloudSunRain, faCloudSun, faSun } from '@fortawesome/free-solid-svg-icons';

import './QuietFor.css';

interface QuietForProps {
	nowtime: number;
	prevtime: number;
	language: string;
}

class QuietFor extends Component<QuietForProps> {

	shouldComponentUpdate(nextProps, nextState) {
		//console.log('shouldComponentUpdate', nextProps, nextState);
		if (nextProps.nowtime !== this.props.nowtime || nextProps.prevtime !== this.props.prevtime) {
			return true;
		} else {
			return false;
		}
	}

	render() {

		const { language } = this.props;

		const quietForText = (date_now, date_future) => {
			//var diff = date_now - date_future;
			//var total_minutes = (diff/(60*1000)).toFixed(0);

			// calculate days, hours, minutes, seconds
			// get total seconds between the times
			let delta = Math.abs(date_future - date_now) / 1000;
			//console.log('QuietFor render() delta', delta);

			// calculate (and subtract) whole days
			const days = Math.floor(delta / 86400);
			delta -= days * 86400;

			// calculate (and subtract) whole hours
			const hours = Math.floor(delta / 3600) % 24;
			delta -= hours * 3600;

			// calculate (and subtract) whole minutes
			const minutes = Math.floor(delta / 60) % 60;
			delta -= minutes * 60;

			// what's left is seconds
			const seconds = parseInt((delta % 60).toFixed(0), 10);  // in theory the modulus is not required

			let foo = '';
			if (days === 1) { foo += days + ' ' + translate('day', language) + ' '; }
			if (days > 1) { foo += days + ' ' + translate('days', language) + ' '; }
			if (hours === 1) { foo += hours + ' ' + translate('hour', language) + ' '; }
			if (hours > 1) { foo += hours + ' ' + translate('hours', language) + ' '; }
			if (minutes === 1) { foo += minutes + ' ' + translate('minute', language) + ' '; }
			if (minutes > 1) { foo += minutes + ' ' + translate('minutes', language) + ' '; }
			if (days === 0 && hours === 0 && minutes === 0) {
				if (seconds === 1) {
					foo += seconds + ' ' + translate('second', language) + '';
				} else {
					foo += seconds + ' ' + translate('seconds', language) + '';
				}
			}
			return foo;
		};

		const date_future = this.props.prevtime;
		const date_now = this.props.nowtime;
		const duration = moment.duration(date_future - date_now);
		const hours = Math.abs(Math.floor(duration.asHours()));

		let icon = '';
		let color = 'color-white';
		let size = 'quietfor-normal-size'
		// if (hours > 12) {
		//     icon = <FontAwesomeIcon className="color-green" icon={faSun} />;
		//     color = 'color-green';
		//     size = 'quietfor-xlarge-size';
		// } else if (hours > 6 && hours <= 12) {
		//     icon = <FontAwesomeIcon className="color-yellow" icon={faCloudSun} />;
		//     color = 'color-yellow';
		//     size = 'quietfor-large-size';
		// } else if (hours > 1 && hours <= 6) {
		//     icon = <FontAwesomeIcon className="color-orange" icon={faCloudSunRain} />;
		//     color = 'color-orange';
		//     size = 'quietfor-medium-size';
		// } else {
		//     icon = <FontAwesomeIcon className="color-red" icon={faCloudShowersHeavy} />;
		//     color = 'color-red'; 
		// }



		//console.log('quietFor render');
		return (
			<div className={`QuietFor ${color} ${size}`}>
				<div className="QuietForIcon">{icon}</div>
				<span className="QuietForClock"><FontAwesomeIcon icon={faClock} /></span>
				<span className={`${color}`}>
				</span>
				<span className="QuietForText uppercase-first display-inline-block">{translate('quiet', language)}</span> {quietForText(this.props.nowtime, this.props.prevtime)}
			</div>
		);
	}
}

export default QuietFor;
