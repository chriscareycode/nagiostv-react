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

import { filterHostStateArray } from '../../helpers/nagiostv';
import MonitoringItems from '../monitoring/MonitoringItems';
import HostItem from './HostItem';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faSun } from '@fortawesome/free-solid-svg-icons';

// CSS
import './HostItems.css';
import { Host } from 'types/hostAndServiceTypes';
import { ClientSettings } from 'types/settings';

interface HostItemsProps {
	hostStateArray: Host[];
	settings: ClientSettings;
	isDemoMode: boolean;
}

const HostItems = ({
	hostStateArray,
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



	//console.log('hostStateArray is', hostStateArray);
	//console.log(Object.keys(hostStateArray));

	const filteredHostStateArray = filterHostStateArray(hostStateArray, settings);

	const { language } = settings;

	return (
		<MonitoringItems
			allHealthyMessage="hosts are UP"
			className="HostItems ServiceItems"
			filteredItems={filteredHostStateArray}
			getKey={host => `host-${host.name}`}
			itemClassName="HostItem"
			items={hostStateArray}
			itemsWrapClassName="host-items-wrap"
			language={language}
			renderItem={(host, problemCount) => (
				<HostItem
					settings={settings}
					hostItem={host}
					comments={commentlistObject.hosts[host.name]?.comments ?? []}
					howManyDown={problemCount}
					isDemoMode={isDemoMode}
				/>
			)}
			totalCount={howManyHosts}
			type="host"
		/>
	);

};

export default HostItems;
