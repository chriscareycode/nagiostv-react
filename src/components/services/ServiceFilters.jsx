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
import { serviceHowManyAtom } from '../../atoms/serviceAtom';

import Cookie from 'js-cookie';
import './ServiceFilters.css';
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/FilterCheckbox.jsx';

const ServiceFilters = () => {

  const serviceHowManyState = useRecoilValue(serviceHowManyAtom);

  const bigState = useRecoilValue(bigStateAtom);
  const [clientSettings, setClientSettings] = useRecoilState(clientSettingsAtom);
  const settingsObject = clientSettings; // TODO rename

  // Chop the bigState into vars
  const {
    hideFilters,
  } = bigState;

  // Chop the clientSettings into vars
  const {
    serviceSortOrder,
    language,
  } = clientSettings;
  
  const saveCookie = (obj) => {
    //const cookieObject = {};
    //this.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', obj);
    console.log('Saved cookie', obj);
  };
  
  const handleSelectChange = (e) => {
    //console.log('handleSelectChange', e.target);
    // console.log(event);
    // console.log(event.target.getAttribute('varname'));
    // console.log('event.target.value', event.target.value);
    const propName = e.target.getAttribute('varname');
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

      {!hideFilters && <select value={serviceSortOrder} varname={'serviceSortOrder'} onChange={handleSelectChange}>
        <option value="newest">{translate('newest first', language)}</option>
        <option value="oldest">{translate('oldest first', language)}</option>
      </select>}

      {(howManyServiceWarning !== 9 || howManyServiceCritical !== 0) && <span>
        &nbsp;
        <span className="filter-ok-label filter-ok-label-green"><strong>{howManyServiceOk}</strong> OK</span>
      </span>}
      
      {(!hideFilters || howManyServiceCritical !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="critical"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideServiceCritical'}
          defaultChecked={!settingsObject.hideServiceCritical}
          howMany={howManyServiceCritical}
          howManyText={translate('critical', language)}
        />
      </span>}

      {(!hideFilters || howManyServiceWarning !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="warning"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideServiceWarning'}
          defaultChecked={!settingsObject.hideServiceWarning}
          howMany={howManyServiceWarning}
          howManyText={translate('warning', language)}
        />
      </span>}
      
      {(!hideFilters || howManyServiceUnknown !== 0) && <span>
        &nbsp;
        <Checkbox
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
        &nbsp;
        <Checkbox
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
        &nbsp;
        <Checkbox
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
        &nbsp;
        <Checkbox
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
        &nbsp;
        <Checkbox
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
        &nbsp;
        <Checkbox
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
        &nbsp;
        <Checkbox
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
