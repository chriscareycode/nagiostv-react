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

import { useEffect, useState, useRef } from 'react';
// State Management
import { useAtom, useAtomValue } from 'jotai';
//import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import { hostAtom, hostIsFakeDataSetAtom } from '../atoms/hostAtom';
import { serviceAtom, serviceIsFakeDataSetAtom } from '../atoms/serviceAtom';
// Helpers
import { convertHostObjectToArray, convertServiceObjectToArray } from '../helpers/nagiostv';
import { clone, cloneDeep } from 'lodash';

import './Demo.css';

/**
 * Demo
 * 
 * Now after refactoring Base.jsx and data fetching so that each section -
 * HostSection and ServiceSection fetch and store data inside themselves,
 * the data is no longer stored in Base.css so I'm including this Demo component on both HostSection and ServiceSection
 * so that it can perform it's demo magic. I'd rather not do this since its sort of messy and with some future data
 * storage global state that works better I'll refactor this again.
 */

const Demo = () => {

	const [isVisible, setIsVisible] = useState(false);

	// State Management state (this section)
	const [hostState, setHostState] = useAtom(hostAtom);
	const [serviceState, setServiceState] = useAtom(serviceAtom);

	const isHostFakeDataSet = useAtomValue(hostIsFakeDataSetAtom);
	const isServiceFakeDataSet = useAtomValue(serviceIsFakeDataSetAtom);

	const hostlistRef = useRef({});
	const servicelistRef = useRef({});

	//console.log('Demo render hostState.response is ', hostState.response);
	//console.log('Demo render serviceState.response is ', serviceState.response);

	const addHostDown = () => {
		// clone the ref object (it's read only)
		const cloned = JSON.parse(JSON.stringify(hostlistRef.current));
		const hostlist = cloned;

		if (Object.keys(hostlist).length === 0) {
			return;
		}

		// loop through hostProblemsArray, set one to down, and set state
		Object.keys(hostlist).some(key => {
			// "UP" and "not SOFT"
			if (hostlist[key].status === 2) {
				// Set status to DOWN
				hostlist[key].status = 4;
				hostlist[key].last_time_up = new Date().getTime();
				return true;
			}
			return false;
		});

		// set back into ref
		hostlistRef.current = hostlist;

		// convert object to array
		const hostProblemsArray = convertHostObjectToArray(hostlist);

		// set state
		setHostState(curr => ({
			...curr,
			response: hostlist,
			problemsArray: hostProblemsArray
		}));

	};

	const removeHostDown = () => {
		// clone the ref object (it's read only)
		const cloned = JSON.parse(JSON.stringify(hostlistRef.current));
		const hostlist = cloned;

		if (Object.keys(hostlist).length === 0) {
			return;
		}

		// loop through hostProblemsArray backwards, set one to up, and set state
		Object.keys(hostlist).reverse().some(key => {
			// If status is "DOWN"
			if (hostlist[key].status === 4) {
				// Set status to "UP"
				hostlist[key].status = 2;
				hostlist[key].last_time_up = new Date().getTime();
				return true;
			}
			return false;
		});

		// set back into ref
		hostlistRef.current = hostlist;

		// convert object to array
		const hostProblemsArray = convertHostObjectToArray(hostlist);

		// set state
		setHostState(curr => ({
			...curr,
			response: hostlist,
			problemsArray: hostProblemsArray
		}));
	};

	const addServiceWarning = () => {
		addServiceStatus(4);
	};

	const addServiceCritical = () => {
		addServiceStatus(16);
	};

	const removeServiceWarning = () => {
		removeServiceStatus(4);
	};

	const removeServiceCritical = () => {
		removeServiceStatus(16);
	};

	const addServiceStatus = (status: number) => {
		// clone the ref object (it's read only)
		const cloned = JSON.parse(JSON.stringify(servicelistRef.current));
		const servicelist = cloned;

		//console.log('Demo addServiceStatus() serviceState', serviceState);

		if (Object.keys(servicelist).length === 0) {
			return;
		}

		// loop through serviceProblemsArray, set one to down, and set state
		let done = false;
		Object.keys(servicelist).some(hostkey => {
			Object.keys(servicelist[hostkey]).some(key => {
				if (servicelist[hostkey][key].status === 2) {
					servicelist[hostkey][key].status = status;
					servicelist[hostkey][key].last_time_up = new Date().getTime();
					done = true;
					return true;
				}
				return false;
			});
			if (done) { return true; }
			return false;
		});

		// set back into ref
		servicelistRef.current = servicelist;

		const serviceProblemsArray = convertServiceObjectToArray(servicelist);

		// set state
		setServiceState(curr => ({
			...curr,
			response: servicelist,
			problemsArray: serviceProblemsArray
		}));
	};

	const removeServiceStatus = (status: number) => {
		// clone the ref object (it's read only)
		const cloned = JSON.parse(JSON.stringify(servicelistRef.current));
		const servicelist = cloned;

		if (Object.keys(servicelist).length === 0) {
			return;
		}

		// loop through serviceProblemsArray backwards, set one to up, and set state
		let done = false;
		Object.keys(servicelist).reverse().some(hostkey => {
			Object.keys(servicelist[hostkey]).reverse().some(key => {
				if (servicelist[hostkey][key].status === status) {
					servicelist[hostkey][key].status = 2;
					servicelist[hostkey][key].last_time_up = new Date().getTime();
					done = true;
					return true;
				}
				return false;
			});
			if (done) { return true; }
			return false;
		});

		// set back into ref
		servicelistRef.current = servicelist;

		const serviceProblemsArray = convertServiceObjectToArray(servicelist);

		// set state
		setServiceState(curr => ({
			...curr,
			response: servicelist,
			problemsArray: serviceProblemsArray
		}));
	};

	useEffect(() => {
		//console.log('Demo isHostFakeDataSet changed');

		if (isHostFakeDataSet) {

			//const cloned = JSON.parse(JSON.stringify(hostState.response));
			const cloned = cloneDeep(hostState.response);
			hostlistRef.current = cloned;

			addHostDown();
			addHostDown();
			addHostDown();

			setTimeout(() => {
				removeHostDown();
			}, 10000);

			setTimeout(() => {
				removeHostDown();
			}, 25000);

			setTimeout(() => {
				removeHostDown();
			}, 40000);

			setTimeout(() => {
				removeHostDown();

				// now at the end of the longest part of this automation, we set isVisible to true
				// so that the interactive controls will display. We do not want people messing with them during the
				// automatic demo.

				// though for right now since this is broken I'm going to hide the controls completely.
				// TODO: fix this later after refactoring so we can have access to data hostlist and servicelist
				setIsVisible(true);

			}, 35000);

		}

	}, [isHostFakeDataSet]);

	useEffect(() => {
		//console.log('Demo isServiceFakeDataSet changed');

		if (isServiceFakeDataSet) {

			//const cloned = JSON.parse(JSON.stringify(hostState.response));
			const cloned = cloneDeep(serviceState.response);
			servicelistRef.current = cloned;

			addServiceWarning();
			addServiceWarning();
			addServiceCritical();
			addServiceCritical();

			setTimeout(() => {
				removeServiceWarning();
			}, 6000);

			setTimeout(() => {
				addServiceWarning();
			}, 12000);

			setTimeout(() => {
				removeServiceCritical();
			}, 15000);

			setTimeout(() => {
				removeServiceWarning();
			}, 20000);

			setTimeout(() => {
				removeServiceCritical();
			}, 30000);

			setTimeout(() => {
				removeServiceWarning();
				removeServiceWarning();
			}, 35000);

		}

	}, [isServiceFakeDataSet]);



	// only show the demo controls once.



	return (

		<div className={isVisible ? 'Demo' : 'Demo display-none'}>
			<div className="demo-header">NagiosTV demo mode - Try adding some fake issues!</div>
			<table>
				<tbody>
					<tr>
						{/*<td>
              <div className="summary-label summary-label-red">Host DOWN</div>
              <button onClick={addHostDown}>Add</button>
              <button onClick={removeHostDown}>Remove</button>
            </td>*/}
						<td>
							<div className="summary-label summary-label-yellow">Service WARNING</div>
							<button onClick={addServiceWarning}>Add</button>
							<button onClick={removeServiceWarning}>Remove</button>
						</td>
						<td>
							<div className="summary-label summary-label-red">Service CRITICAL</div>
							<button onClick={addServiceCritical}>Add</button>
							<button onClick={removeServiceCritical}>Remove</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);

};

export default Demo;
