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

import { useState } from 'react';

// Recoil
import { useRecoilValue } from 'recoil';
import { clientSettingsAtom } from '../../atoms/settingsState';
import { hostHowManyAtom } from '../../atoms/hostAtom';
import { serviceHowManyAtom } from '../../atoms/serviceAtom';

import './Flynn.css';
// @ts-ignore-next-line
import flynnImage from './flynn.png';
/*
 Flynn will be happy at 0 services down
 Flynn will be angry at < 4 services down
 Flynn will be bloody at >= 4 services down
*/


const Flynn = ({ style }: { style?: React.CSSProperties }) => {

	const smileClasses = ['flynn20', 'flynn21', 'flynn22', 'flynn23'];
	const happyClasses = ['flynn1', 'flynn6', 'flynn11'];
	const angryClasses = ['flynn2', 'flynn3', 'flynn7', 'flynn8', 'flynn12', 'flynn13', 'flynn16', 'flynn17', 'flynn18', 'flynn19'];
	const bloodyClasses = ['flynn4', 'flynn5', 'flynn9', 'flynn10', 'flynn14', 'flynn15', 'flynn24', 'flynn25'];

	const clientSettings = useRecoilValue(clientSettingsAtom);
	const hostHowManyState = useRecoilValue(hostHowManyAtom);
	const serviceHowManyState = useRecoilValue(serviceHowManyAtom);

	const [clicked, setClicked] = useState(false); // Temp make him angry

	const howManyDown =
		hostHowManyState.howManyHostDown +
		serviceHowManyState.howManyServiceWarning +
		serviceHowManyState.howManyServiceCritical;

	let flynnClass = 'flynn';
	let classes: any[] = [];
	if (howManyDown === -1) {
		classes = smileClasses;
	} else if (howManyDown === 0) {
		classes = happyClasses;
	} else if (howManyDown >= clientSettings.flynnAngryAt && howManyDown < clientSettings.flynnBloodyAt) {
		classes = angryClasses;
	} else if (howManyDown >= clientSettings.flynnBloodyAt) {
		classes = bloodyClasses;
	} else {
		classes = happyClasses;
	}

	// Get a random item from the list
	let item = classes[Math.floor(Math.random() * classes.length)];

	// If clicked then force smile
	if (clicked) {
		item = 'flynn23';
	}

	// Get the class name and scale
	flynnClass = 'flynn ' + item;
	const scale = 'scale(' + clientSettings.flynnCssScale + ')';

	//console.log('flynnClass is ' + flynnClass + ' ' + new Date());

	// If clicked then force smile
	const clickedFlynn = () => {
		setClicked(true);
		// TODO this could trigger a setState on unmounted component
		setTimeout(() => {
			setClicked(false);
		}, 2000);
	};

	return (
		<div className="flynn-wrap" style={style}>
			<div style={{ backgroundImage: 'url(' + flynnImage + ')', transform: scale }} className={flynnClass} onClick={clickedFlynn}>
			</div>
		</div>
	);

};

export default Flynn;
