/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2021 Chris Carey https://chriscarey.com
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

import React from 'react';
// Recoil
import { useRecoilState, useRecoilValue } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';
import { hostIsFetchingAtom, hostAtom, hostHowManyAtom } from '../../atoms/hostAtom';

import Cookie from 'js-cookie';
import './HostFilters.css';
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/FilterCheckbox.jsx';

const HostFilters = () => {

  const hostHowManyState = useRecoilValue(hostHowManyAtom);

  const bigState = useRecoilValue(bigStateAtom);
  const [clientSettings, setClientSettings] = useRecoilState(clientSettingsAtom);

  // Chop the bigState into vars
  const {
    hideFilters,
  } = bigState;

  // Chop the clientSettings into vars
  const {
    hostSortOrder,
    language,
  } = clientSettings;

  const saveCookie = (obj) => {
    //const cookieObject = {};
    //this.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', obj);
    console.log('Saved cookie', obj);
  };

  const handleSelectChange = (e) => {
    console.log('handleSelectChange', e.target);
    // console.log('event.target.value', event.target.value);
    const propName = e.target.getAttribute('varname');
    //console.log(propName);
    // setClientSettings(settings => ({
    //   ...settings,
    //   [propName]: e.target.value
    // }));
    setClientSettings(settings => {
      saveCookie({
        ...settings,
        [propName]: e.target.value
        });
      return ({
        ...settings,
        [propName]: e.target.value
      });
    });
  };

  const handleCheckboxChange = (e, propName, dataType) => {
    //console.log('handleCheckboxChange', e.target, propName, dataType);
    // we put this to solve the bubble issue where the click goes through the label then to the checkbox
    if (typeof e.target.checked === 'undefined') { return; }
 
    let val = '';
    if (dataType === 'checkbox') {
      val = (!e.target.checked);
    } else {
      val = e.target.value;
    }

    // Save to Cookie and to Recoil state
    setClientSettings(settings => {
      saveCookie({
        ...settings,
        [propName]: val
        });
      return ({
        ...settings,
        [propName]: val
      });
    });
    
  };
  
  const {
    //howManyHosts,
    howManyHostUp,
    howManyHostDown,
    howManyHostUnreachable,
    howManyHostPending,
    howManyHostAcked,
    howManyHostScheduled,
    howManyHostFlapping,
    howManyHostSoft,
    howManyHostNotificationsDisabled,
  } = hostHowManyState;

  return (
    <>

      {!hideFilters && <select value={hostSortOrder} varname={'hostSortOrder'} onChange={handleSelectChange}>
        <option value="newest">{translate('newest first', language)}</option>
        <option value="oldest">{translate('oldest first', language)}</option>
      </select>}

      {(howManyHostDown !== 9) && <span>
        &nbsp;
        <span className="filter-ok-label filter-ok-label-green"><strong>{howManyHostUp}</strong> UP</span>
      </span>}

      {(!hideFilters || howManyHostDown !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="down"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideHostDown'}
          defaultChecked={!clientSettings.hideHostDown}
          howMany={howManyHostDown}
          howManyText={translate('down', language)}
        />
      </span>}

      {(!hideFilters || howManyHostUnreachable !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="unreachable"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideHostUnreachable'}
          defaultChecked={!clientSettings.hideHostUnreachable}
          howMany={howManyHostUnreachable}
          howManyText={translate('unreachable', language)}
        />
      </span>}

      {(!hideFilters || howManyHostPending !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="pending"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideHostPending'}
          defaultChecked={!clientSettings.hideHostPending}
          howMany={howManyHostPending}
          howManyText={translate('pending', language)}
        />
      </span>}

      {(!hideFilters || howManyHostAcked !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="acked"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideHostAcked'}
          defaultChecked={!clientSettings.hideHostAcked}
          howMany={howManyHostAcked}
          howManyText={translate('acked', language)}
        />
      </span>}

      {(!hideFilters || howManyHostScheduled !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="scheduled"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideHostScheduled'}
          defaultChecked={!clientSettings.hideHostScheduled}
          howMany={howManyHostScheduled}
          howManyText={translate('scheduled', language)}
        />
      </span>}

      {(!hideFilters || howManyHostFlapping !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="flapping"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideHostFlapping'}
          defaultChecked={!clientSettings.hideHostFlapping}
          howMany={howManyHostFlapping}
          howManyText={translate('flapping', language)}
        />
      </span>}

      {(!hideFilters || howManyHostSoft !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="soft"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideHostSoft'}
          defaultChecked={!clientSettings.hideHostSoft}
          howMany={howManyHostSoft}
          howManyText={translate('soft', language)}
        />
      </span>}

      {(!hideFilters || howManyHostNotificationsDisabled !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="notifications_disabled"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideHostNotificationsDisabled'}
          defaultChecked={!clientSettings.hideHostNotificationsDisabled}
          howMany={howManyHostNotificationsDisabled}
          howManyText={translate('notifications disabled', language)}
        />
      </span>}

    </>
  );
}

export default HostFilters;
