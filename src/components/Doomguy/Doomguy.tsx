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

import { useState, useEffect, useMemo } from 'react';

// State Management
import { useAtomValue } from 'jotai';
import { clientSettingsAtom } from '../../atoms/settingsState';
import { hostAtom } from '../../atoms/hostAtom';
import { serviceAtom } from '../../atoms/serviceAtom';
import { llmIsLoadingAtom } from '../../atoms/llmAtom';

// Helpers
import {
	filterHostProblemsArray,
	filterServiceProblemsArray,
	countFilteredHostProblems,
	countFilteredServiceProblems
} from '../../helpers/nagiostv';

import './Doomguy.css';
// @ts-ignore-next-line
import doomguyImage from './Doomguy.png';
/*
 Doomguy will be happy at 0 services down
 Doomguy will be angry at < 4 services down
 Doomguy will be bloody at >= 4 services down
*/

const Doomguy = ({ scaleCss, style }: {
	scaleCss?: string,
	style?: React.CSSProperties
}) => {

	const smileClasses = ['doomguy20', 'doomguy21', 'doomguy22', 'doomguy23'];
	const happyClasses = ['doomguy1', 'doomguy6', 'doomguy11'];
	const angryClasses = ['doomguy2', 'doomguy3', 'doomguy7', 'doomguy8', 'doomguy12', 'doomguy13', 'doomguy16', 'doomguy17', 'doomguy18', 'doomguy19'];
	const bloodyClasses = ['doomguy4', 'doomguy5', 'doomguy9', 'doomguy10', 'doomguy14', 'doomguy15', 'doomguy24', 'doomguy25'];
	const thinkingClasses = ['doomguy1', 'doomguy6', 'doomguy7', 'doomguy8', 'doomguy11', 'doomguy12'];
	const thinkingAnimation = [6,6,6,6,11,11,11,6,6,6,6,11,11,11,11,6,6,6,6,11,11];

	const clientSettings = useAtomValue(clientSettingsAtom);
	const hostState = useAtomValue(hostAtom);
	const serviceState = useAtomValue(serviceAtom);
	const llmIsLoading = useAtomValue(llmIsLoadingAtom);

	const [clicked, setClicked] = useState(false); // Clicking his face will temporarily make him angry
	const [thinkingFrame, setThinkingFrame] = useState(thinkingAnimation[0]);

	// Calculate filtered counts using useMemo for performance
	const howManyDown = useMemo(() => {
		const filteredHosts = filterHostProblemsArray(hostState.problemsArray, clientSettings);
		const filteredServices = filterServiceProblemsArray(serviceState.problemsArray, clientSettings);
		
		const hostDownCount = countFilteredHostProblems(filteredHosts);
		const serviceProblems = countFilteredServiceProblems(filteredServices);
		
		return hostDownCount + serviceProblems.warning + serviceProblems.critical;
	}, [hostState.problemsArray, serviceState.problemsArray, clientSettings]);

	// Animate Doomguy while thinking
	useEffect(() => {
		if (!llmIsLoading) {
			return;
		}
		let index = 0;
		const interval = setInterval(() => {
			index = (index + 1) % thinkingAnimation.length;
			setThinkingFrame(thinkingAnimation[index]);
		}, 200);
		return () => clearInterval(interval);
	}, [llmIsLoading]);

	let doomguyClass = 'doomguy';
	let classes: any[] = [];
	if (howManyDown === -1) {
		classes = smileClasses;
	} else if (howManyDown === 0) {
		classes = happyClasses;
	} else if (howManyDown >= clientSettings.doomguyAngryAt && howManyDown < clientSettings.doomguyBloodyAt) {
		classes = angryClasses;
	} else if (howManyDown >= clientSettings.doomguyBloodyAt) {
		classes = bloodyClasses;
	} else {
		classes = happyClasses;
	}

	// Get a random item from the list
	let item = classes[Math.floor(Math.random() * classes.length)];

	// If clicked then force smile
	if (clicked) {
		item = 'doomguy23';
	}

	// If thinking, animate through frames
	if (llmIsLoading) {
		item = 'doomguy' + thinkingFrame;
	}

	// Get the class name and scale
	doomguyClass = 'doomguy ' + item;
	//const transformCss = 'scale(' + clientSettings.doomguyCssScale + ')';
	const transformCss = {
		backgroundImage: 'url(' + doomguyImage + ')',
		transform: `scale(${scaleCss ? scaleCss : '1'})`,
	};

	//console.log('doomguyClass is ' + doomguyClass + ' ' + new Date());

	// If clicked then force smile
	const clickedDoomguy = () => {
		setClicked(true);
		// TODO this could trigger a setState on unmounted component
		setTimeout(() => {
			setClicked(false);
		}, 2000);
	};

	return (
		<div className="doomguy-wrap" style={style}>
			<div style={transformCss} className={doomguyClass} onClick={clickedDoomguy}>
			</div>
			{llmIsLoading && <div className="doomguy-thinking">thinking</div>}
		</div>
	);

};

export default Doomguy;
