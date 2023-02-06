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

// React Router
import {
	HashRouter as Router,
	//Switch,
	//Route,
	//Link,
	NavLink
} from "react-router-dom";

import './LeftPanel.css';

//import ReactTooltip from 'react-tooltip';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faTools, faUpload, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

interface LeftPanelProps {
	isLeftPanelOpen: boolean;
}

const LeftPanel = ({
	isLeftPanelOpen
}: LeftPanelProps) => {
	return (
		<div className={isLeftPanelOpen ? 'LeftPanel left-panel-open' : 'LeftPanel'}>
			<Router>
				<div className="nav-sidebar-icon">
					<span data-tip="Dashboard" data-place="right">
						<NavLink exact={true} activeClassName='is-active' to="/">
							<FontAwesomeIcon
								className="nav-sidebar-icon-icon"
								icon={faTachometerAlt}
							/>
						</NavLink>
					</span>
				</div>

				<div className="nav-sidebar-icon">
					<span data-tip="Settings" data-place="right">
						<NavLink activeClassName='is-active' to="/settings">
							<FontAwesomeIcon
								className="nav-sidebar-icon-icon"
								icon={faTools}
							/>
						</NavLink>
					</span>
				</div>

				<div className="nav-sidebar-icon">
					<span data-tip="Update">
						<NavLink activeClassName='is-active' to="/update">
							<FontAwesomeIcon
								className="nav-sidebar-icon-icon"
								icon={faUpload}
							/>
						</NavLink>
					</span>
				</div>

				<div className="nav-sidebar-icon">
					<span data-tip="Info and Help">
						<NavLink activeClassName='is-active' to="/help">
							<FontAwesomeIcon
								className="nav-sidebar-icon-icon"
								icon={faQuestionCircle}
							/>
						</NavLink>
					</span>
				</div>

				<div className="nav-sidebar-bottom-float" />

			</Router>

		</div>
	);
}

export default LeftPanel;
