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

import { useDemoScenario } from '../hooks/useDemoScenario';

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

	const {
		addServiceCritical,
		addServiceWarning,
		isVisible,
		removeServiceCritical,
		removeServiceWarning,
	} = useDemoScenario();

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
