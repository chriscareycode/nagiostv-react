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
//import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';
import {
	//serviceIsFetchingAtom,
	//serviceAtom,
	serviceHowManyAtom
} from '../../atoms/serviceAtom';
import { commentlistAtom } from '../../atoms/commentlistAtom';

import { filterServiceStateArray } from '../../helpers/nagiostv';
import MonitoringItems from '../monitoring/MonitoringItems';
import ServiceItem from './ServiceItem';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faSun } from '@fortawesome/free-solid-svg-icons';

// Types
import { Service } from 'types/hostAndServiceTypes';
import { ClientSettings } from 'types/settings';

// CSS
import './ServiceItems.css';

interface ServiceItemsProps {
	serviceStateArray: Service[];
	settings: ClientSettings;
	isDemoMode: boolean;
}

const ServiceItems = ({
	serviceStateArray,
	settings,
	isDemoMode,
	//servicelistError,
	//howManyServices,
	//commentlist
}: ServiceItemsProps) => {
	const commentlistState = useAtomValue(commentlistAtom);
	const commentlistObject = commentlistState.commentlistObject;

	const serviceHowManyState = useAtomValue(serviceHowManyAtom);

	const {
		howManyServices,
		// howManyServiceOk,
		// howManyServiceWarning,
		// howManyServiceUnknown,
		// howManyServiceCritical,
		// howManyServicePending,
		// howManyServiceAcked,
		// howManyServiceScheduled,
		// howManyServiceFlapping,
		// howManyServiceSoft,
		// howManyServiceNotificationsDisabled,
	} = serviceHowManyState;

	//console.log('this.props.serviceStateArray is', this.props.serviceStateArray);
	//console.log(Object.keys(this.props.serviceStateArray));

	const filteredServiceStateArray = filterServiceStateArray(serviceStateArray, settings);

	const { language } = settings;

	return (
		<MonitoringItems
			allHealthyMessage="services are OK"
			className="ServiceItems"
			filteredItems={filteredServiceStateArray}
			getKey={service => `${service.host_name}-${service.description}`}
			itemClassName="ServiceItem"
			items={serviceStateArray}
			itemsWrapClassName="service-items-wrap"
			language={language}
			renderItem={(service, problemCount) => (
				<ServiceItem
					settings={settings}
					serviceItem={service}
					comments={commentlistObject.services[
						`${service.host_name}_${service.description}`
					]?.comments ?? []}
					howManyDown={problemCount}
					isDemoMode={isDemoMode}
				/>
			)}
			totalCount={howManyServices}
			type="service"
		/>
	);
}

export default ServiceItems;
