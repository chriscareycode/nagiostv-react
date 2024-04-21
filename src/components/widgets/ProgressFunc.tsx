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

	// timeoutHandle: NodeJS.Timeout | null = null;

	// countdownHandle: NodeJS.Timeout | null = null;

	// state = {
	// 	//progressMax: 15,
	// 	//progressValue: 15,
	// 	started: false
	// };

	// shouldComponentUpdate(nextProps, nextState) {
	// 	// console.log('Progress shouldComponentUpdate', nextProps, nextState);

	// 	// This needs to trigger in order to reset things and it does not always trigger.
	// 	// Particularly if the seconds value gets set larger before we get a chance to see it fall below 0
	// 	if (nextProps.seconds < 0 && this.state.started === true) {
	// 		this.setState({ started: false });
	// 		//return true;
	// 	}

	// 	// If the countdownHandle is null, then start a setTimeout for this.props.seconds
	// 	if (this.countdownHandle === null) {
	// 		this.countdownHandle = setTimeout(() => {
	// 			this.setState({ started: false });
	// 			this.countdownHandle = null;
	// 		}, this.props.seconds * 1000);
	// 	}

	// 	// If there is an increase in the seconds set the started flag to true
	// 	if (nextProps.seconds > this.props.seconds && this.state.started === false) {
	// 		this.setState({ started: true });
	// 	}

	// 	// we re-render when the seconds value jumps up, never when it goes down
	// 	// the check for nextState.started !== this.state.started is for first run
	// 	if (nextProps.seconds > this.props.seconds || nextState.started !== this.state.started) {
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}

	// 	// if (nextState.started !== this.state.started) {
	// 	//   return true;
	// 	// }
	// }

	
	

	// componentDidMount() {
	// 	// setInterval(() => {
	// 	//   this.setState({
	// 	//     progressValue: this.state.progressValue > 0 ? this.state.progressValue - 1 : this.state.progressMax
	// 	//   });
	// 	// }, 1000);


	// 	this.timeoutHandle = setTimeout(() => {
	// 		this.setState({ started: true });
	// 	}, 1 * 1000);

	// 	// setInterval(() => {
	// 	//   this.setState({ started: false });

	// 	//   setTimeout(() => {
	// 	//     this.setState({ started: true });
	// 	//   }, 1 * 1000);

	// 	// }, 14 * 1000);
	// }

	// componentWillUnmount() {
	// 	if (this.timeoutHandle) {
	// 		clearTimeout(this.timeoutHandle);
	// 	}
	// }

	const previous_next_check = useRef(0);

	useEffect(() => {

		if (next_check > previous_next_check.current) {
			previous_next_check.current = next_check;
			setStarted(true);
		}

		//setStarted(true);
		const seconds = (next_check - Date.now()) / 1000;
		const timeoutHandle = setTimeout(() => {
			setStarted(false);
		}, seconds * 1000);
		return () => {
			clearTimeout(timeoutHandle);
		}
		
	}, [setStarted, next_check]);
	

	const seconds = (next_check - Date.now()) / 1000;

	console.log('Progress render', next_check, seconds);


	const progressStyle = {
		animation: started ?
			`progress-keyframes ${seconds}s linear` :
			'progress-reverse-keyframes 1s linear'
	};

	return (
		<div className="Progress progress">
			<div className={`progress-bar ${color}`} style={progressStyle}></div>
		</div>
	);
	
}

// write a function to pass into memo
function arePropsEqual(prevProps, nextProps, ) {
	// When this function returns, true we do not render, false we render
	return prevProps.next_check === nextProps.next_check;
	// return true;
}


export default memo(Progress, arePropsEqual);
