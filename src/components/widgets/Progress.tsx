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


import { memo, useEffect, useRef, useState } from 'react';
import './Progress.css';

interface ProgressProps {
	next_check: number;
	color: string;
}

const Progress = ({ next_check, color }: ProgressProps) => {

	const [started, setStarted] = useState(false);
	const previous_next_check = useRef(0);

	useEffect(() => {

		// If next_check value increases, then store the value and set started to true
		if (next_check > previous_next_check.current) {
			previous_next_check.current = next_check;
			setStarted(true);
		}

		// Start a timer that will fire at the next_check time and set started to false
		const seconds = (next_check - Date.now()) / 1000;
		const timeoutHandle = setTimeout(() => {
			setStarted(false);
		}, seconds * 1000);
		return () => {
			clearTimeout(timeoutHandle);
		}
		
	}, [setStarted, next_check]);
	
	let seconds = (next_check - Date.now()) / 1000;
	if (seconds > 2) {
		seconds = seconds - 2;
	}
	if (seconds < 0) {
		seconds = 0;
	}
	
	// console.log('Progress render', next_check, Date.now(), seconds);

	const progressStyle = {
		animation: started ?
			`scaledown-keyframes 1s linear, scaleup-keyframes ${seconds}s linear` :
			'none'
	};

	return (
		<div className="Progress progress">
			<div className={`progress-bar ${color}`} style={progressStyle}></div>
		</div>
	);
}

// write a function to pass into memo
function arePropsEqual(prevProps: ProgressProps, nextProps: ProgressProps) {
	// When this function returns, true we do not render, false we render
	return prevProps.next_check === nextProps.next_check;
	// return true;
}

export default memo(Progress, arePropsEqual);
