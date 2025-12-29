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

// State Management
import { useAtomValue } from 'jotai';
import {
	//hostIsFetchingAtom,
	//hostAtom,
	hostHowManyAtom
} from '../../atoms/hostAtom';
import { commentlistAtom } from '../../atoms/commentlistAtom';

import { translate } from '../../helpers/language';
import HostItem from './HostItem';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faSun } from '@fortawesome/free-solid-svg-icons';

// CSS
import './HostItems.css';
import { useRef } from 'react';
import { Host } from 'types/hostAndServiceTypes';
import { ClientSettings } from 'types/settings';

import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";

interface HostItemsProps {
	hostProblemsArray: Host[];
	settings: ClientSettings;
	isDemoMode: boolean;
}

const HostItems = ({
	hostProblemsArray,
	settings,
	isDemoMode,
}: HostItemsProps) => {

	const commentlistState = useAtomValue(commentlistAtom);
	const commentlistObject = commentlistState.commentlistObject;

	const hostHowManyState = useAtomValue(hostHowManyAtom);

	const {
		howManyHosts,
		// howManyHostPending,
		// howManyHostUp,
		// howManyHostDown,
		// howManyHostUnreachable,
		// howManyHostAcked,
		// howManyHostScheduled,
		// howManyHostFlapping,
		// howManyHostSoft,
		// howManyHostNotificationsDisabled,
	} = hostHowManyState;



	//console.log('hostProblemsArray is', hostProblemsArray);
	//console.log(Object.keys(hostProblemsArray));

	const filteredHostProblemsArray = hostProblemsArray.filter(item => {
		if (settings.hideHostPending) {
			if (item.status === 1) { return false; }
		}
		if (settings.hideHostUp) {
			if (item.status === 2) { return false; }
		}
		if (settings.hideHostDown) {
			if (item.status === 4) { return false; }
		}
		if (settings.hideHostUnreachable) {
			if (item.status === 8) { return false; }
		}
		if (settings.hideHostAcked) {
			if (item.problem_has_been_acknowledged) { return false; }
		}
		if (settings.hideHostScheduled) {
			if (item.scheduled_downtime_depth > 0) { return false; }
		}
		if (settings.hideHostFlapping) {
			if (item.is_flapping) { return false; }
		}
		if (settings.hideHostSoft) {
			if (item.state_type === 0) { return false; }
		}
		if (settings.hideHostNotificationsDisabled) {
			if (item.notifications_enabled === false) { return false; }
		}
		return true;
	});

	const howManyHidden = hostProblemsArray.length - filteredHostProblemsArray.length;
	const showSomeDownItems = hostProblemsArray.length > 0 && filteredHostProblemsArray.length === 0;
	const { language } = settings;

	return (
		<div className="HostItems ServiceItems">

			<AnimatePresence initial={false}>
				{hostProblemsArray.length === 0 && <motion.div
					className={`all-ok-item`}
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
				>
					<span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">{translate('All', language)} {howManyHosts} {translate('hosts are UP', language)}</span>{' '}
				</motion.div>}
			</AnimatePresence>

			<div className={`some-down-items ${showSomeDownItems ? 'visible' : 'hidden'}`}>
				<div>
					<span className="display-inline-block color-green" style={{ marginRight: '10px' }}>{howManyHosts - hostProblemsArray.length} of {howManyHosts} {translate('hosts are UP', language)}</span>{' '}
					<span className="filter-ok-label filter-ok-label-green some-down-hidden-text">{howManyHidden} hidden</span>
				</div>
			</div>

			<div className="host-items-wrap">
				<AnimatePresence initial={false}>
					{filteredHostProblemsArray.map((e, i) => {
						//console.log('HostItem item');
						//console.log(e, i);

						return (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								// style={box}
								key={`host-${e.name}`}
								className="HostItem"
							>
								<HostItem
									settings={settings}
									hostItem={e}
									comments={commentlistObject.hosts[e.name] ? commentlistObject.hosts[e.name].comments : []}
									howManyDown={filteredHostProblemsArray.length}
									isDemoMode={isDemoMode}
								/>
							</motion.div>
						);

					})}
				</AnimatePresence>
			</div>
		</div>
	);

};

export default HostItems;
