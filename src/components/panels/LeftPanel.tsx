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

import { useCallback, useEffect, useRef } from 'react';

// React Router
import { NavLink } from "react-router-dom";

import './LeftPanel.css';

//import ReactTooltip from 'react-tooltip';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faTools, faUpload, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { useSetAtom } from "jotai";
import { bigStateAtom } from "atoms/settingsState";

interface LeftPanelProps {
	isLeftPanelOpen: boolean;
}

// Auto-hide the left panel after this delay if no item is selected
const AUTO_HIDE_DELAY_MS = 10 * 1000; // 10 seconds

const LeftPanel = ({
	isLeftPanelOpen
}: LeftPanelProps) => {

	const setBigState = useSetAtom(bigStateAtom);
	const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Clear the auto-hide timer
	const clearAutoHideTimer = useCallback(() => {
		if (autoHideTimerRef.current) {
			clearTimeout(autoHideTimerRef.current);
			autoHideTimerRef.current = null;
		}
	}, []);

	// Start the auto-hide timer to close the panel after a period of inactivity
	const startAutoHideTimer = useCallback(() => {
		clearAutoHideTimer();
		autoHideTimerRef.current = setTimeout(() => {
			setBigState(curr => ({
				...curr,
				isLeftPanelOpen: false,
			}));
		}, AUTO_HIDE_DELAY_MS);
	}, [clearAutoHideTimer, setBigState]);

	// Start or clear the auto-hide timer when the panel opens or closes
	useEffect(() => {
		if (isLeftPanelOpen) {
			startAutoHideTimer();
		} else {
			clearAutoHideTimer();
		}
	}, [isLeftPanelOpen, startAutoHideTimer, clearAutoHideTimer]);

	// Clean up timer on unmount
	useEffect(() => {
		return () => {
			clearAutoHideTimer();
		};
	}, [clearAutoHideTimer]);

	const clickedItem = () => {
		// Clear auto-hide timer since user selected a menu item
		clearAutoHideTimer();
		setBigState(curr => ({
			...curr,
			isLeftPanelOpen: false,
		}));
	}

	return (
		<div className={isLeftPanelOpen ? 'LeftPanel left-panel-open' : 'LeftPanel'}>

			<div className="nav-sidebar-icon nav-dash">
				<span data-tip="Dashboard" data-place="right">
					<NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/">
						<FontAwesomeIcon
							className="nav-sidebar-icon-icon"
							icon={faTachometerAlt}
							onClick={clickedItem}
						/>
					</NavLink>
				</span>
			</div>

			<div className="nav-sidebar-icon nav-settings">
				<span data-tip="Settings" data-place="right">
					<NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/settings">
						<FontAwesomeIcon
							className="nav-sidebar-icon-icon"
							icon={faTools}
							onClick={clickedItem}
						/>
					</NavLink>
				</span>
			</div>

			<div className="nav-sidebar-icon nav-update">
				<span data-tip="Update">
					<NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/update">
						<FontAwesomeIcon
							className="nav-sidebar-icon-icon"
							icon={faUpload}
							onClick={clickedItem}
						/>
					</NavLink>
				</span>
			</div>

			<div className="nav-sidebar-icon nav-info">
				<span data-tip="Info and Help">
					<NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/help">
						<FontAwesomeIcon
							className="nav-sidebar-icon-icon"
							icon={faQuestionCircle}
							onClick={clickedItem}
						/>
					</NavLink>
				</span>
			</div>

			<div className="nav-sidebar-bottom-float" />

		</div>
	);
}

export default LeftPanel;
