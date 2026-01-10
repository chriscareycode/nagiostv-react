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
import { useAtom, useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';
import { serviceHowManyAtom } from '../../atoms/serviceAtom';

import './ServiceFilters.css';
import { translate } from '../../helpers/language';
import FilterCheckbox from '../widgets/FilterCheckbox';
import SortOrderSelect from '../widgets/SortOrderSelect';
import { saveLocalStorage } from 'helpers/nagiostv';
import { ChangeEvent } from 'react';
import { useQueryParams } from '../../hooks/useQueryParams';

const ServiceFilters = () => {

	const serviceHowManyState = useAtomValue(serviceHowManyAtom);

	const bigState = useAtomValue(bigStateAtom);
	const [clientSettings, setClientSettings] = useAtom(clientSettingsAtom);
	const settingsObject = clientSettings; // TODO rename
	const queryParams = useQueryParams();

	// Chop the bigState into vars
	const {
		hideFilters,
	} = bigState;

	// Chop the clientSettings into vars
	const {
		serviceSortOrder,
		language,
	} = clientSettings;

	const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
		// console.log('handleSelectChange', e.target);
		// console.log(event);
		// console.log(event.target.getAttribute('data-varname'));
		// console.log('event.target.value', event.target.value);
		const propName = e.target.getAttribute('data-varname');

		// setClientSettings(settings => ({
		//   ...settings,
		//   [propName]: e.target.value
		// }));

		if (propName === null) {
			return;
		}

		setClientSettings(settings => {
			saveLocalStorage('Service Filters', {
				...settings,
				[propName]: e.target.value
			});
			return ({
				...settings,
				[propName]: e.target.value
			});
		});

	};

	const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>, propName: string, dataType: 'checkbox') => {
		// This will get called twice (see note below). The little hack there deals with it
		// So we actually do not want e.preventDefault(); here
		//console.log('handleCheckboxChange', e.target, propName, dataType);
		// we put this to solve the bubble issue where the click goes through the label then to the checkbox
		if (typeof e.target.checked === 'undefined') { return; }

		let val: boolean | string = true;
		if (dataType === 'checkbox') {
			val = (!e.target.checked);
		} else {
			val = e.target.value;
		}

		// Save to localStorage and to Recoil state
		setClientSettings(settings => {
			saveLocalStorage('Service Filters', {
				...settings,
				[propName]: val
			});
			return ({
				...settings,
				[propName]: val
			});
		});

		// Sync to URL query params
		queryParams.set({ [propName]: val });
	};

	const {
		//howManyServices,
		howManyServiceOk,
		howManyServiceWarning,
		howManyServiceUnknown,
		howManyServiceCritical,
		howManyServicePending,
		howManyServiceAcked,
		howManyServiceScheduled,
		howManyServiceFlapping,
		howManyServiceSoft,
		howManyServiceNotificationsDisabled,
	} = serviceHowManyState;

	return (
		<>
			{!hideFilters && <SortOrderSelect
				value={serviceSortOrder}
				varName="serviceSortOrder"
				language={language}
				onChange={handleSelectChange}
				syncToUrl={true}
			/>}

			<span>
				{' '}
				<FilterCheckbox
					filterName="ok"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceOk'}
					defaultChecked={!settingsObject.hideServiceOk}
					howMany={howManyServiceOk}
					howManyText={translate('ok', language)}
				/>
			</span>

			{(!hideFilters || howManyServiceWarning !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="warning"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceWarning'}
					defaultChecked={!settingsObject.hideServiceWarning}
					howMany={howManyServiceWarning}
					howManyText={translate('warning', language)}
				/>
			</span>}

			{(!hideFilters || howManyServiceCritical !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="critical"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceCritical'}
					defaultChecked={!settingsObject.hideServiceCritical}
					howMany={howManyServiceCritical}
					howManyText={translate('critical', language)}
				/>
			</span>}

			{(!hideFilters || howManyServiceUnknown !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="unknown"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceUnknown'}
					defaultChecked={!settingsObject.hideServiceUnknown}
					howMany={howManyServiceUnknown}
					howManyText={translate('unknown', language)}
				/>
			</span>}

			{(!hideFilters || howManyServicePending !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="pending"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServicePending'}
					defaultChecked={!settingsObject.hideServicePending}
					howMany={howManyServicePending}
					howManyText={translate('pending', language)}
				/>
			</span>}

			{(!hideFilters || howManyServiceAcked !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="acked"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceAcked'}
					defaultChecked={!settingsObject.hideServiceAcked}
					howMany={howManyServiceAcked}
					howManyText={translate('acked', language)}
				/>
			</span>}

			{(!hideFilters || howManyServiceScheduled !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="scheduled"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceScheduled'}
					defaultChecked={!settingsObject.hideServiceScheduled}
					howMany={howManyServiceScheduled}
					howManyText={translate('scheduled', language)}
				/>
			</span>}

			{(!hideFilters || howManyServiceFlapping !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="flapping"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceFlapping'}
					defaultChecked={!settingsObject.hideServiceFlapping}
					howMany={howManyServiceFlapping}
					howManyText={translate('flapping', language)}
				/>
			</span>}

			{(!hideFilters || howManyServiceSoft !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="soft"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceSoft'}
					defaultChecked={!settingsObject.hideServiceSoft}
					howMany={howManyServiceSoft}
					howManyText={translate('soft', language)}
				/>
			</span>}

			{(!hideFilters || howManyServiceNotificationsDisabled !== 0) && <span>
				{' '}
				<FilterCheckbox
					filterName="notifications_disabled"
					hideFilters={hideFilters}
					handleCheckboxChange={handleCheckboxChange}
					stateName={'hideServiceNotificationsDisabled'}
					defaultChecked={!settingsObject.hideServiceNotificationsDisabled}
					howMany={howManyServiceNotificationsDisabled}
					howManyText={translate('notifications disabled', language)}
				/>
			</span>}

		</>
	);

};

export default ServiceFilters;
