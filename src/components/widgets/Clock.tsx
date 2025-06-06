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

import { useEffect, useRef } from 'react';
import { formatDateTimeLocale } from '../../helpers/dates';
import './Clock.css';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faClock } from '@fortawesome/free-solid-svg-icons';

const Clock = ({
	locale,
	clockDateFormat,
	clockTimeFormat,
}) => {

	const dateRef = useRef<HTMLDivElement>(null);

	useEffect(
		() => {
			//start timer
			//console.log('Clock() Start 1s interval');
			const timer = setInterval(() => {
				if (dateRef && dateRef.current) {
					dateRef.current.innerHTML =
						formatDateTimeLocale('now', locale, clockDateFormat) +
						'&nbsp;' +
						formatDateTimeLocale('now', locale, clockTimeFormat);
				}
			}, 1000);

			return () => {
				//stop timer
				//console.log('Clock() Stop interval');
				if (timer) {
					clearInterval(timer);
				}
			};
		},
		[locale, clockDateFormat, clockTimeFormat]
	);

	return (
		<div className="Clock" ref={dateRef} />
	);

}

export default Clock;
