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
// Helpers
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/FilterCheckbox';
// External Deps
import Cookie from 'js-cookie';
// CSS
import './AlertFilters.css';

const AlertFilters = ({
  //hideFilters,
  //hideAlertSoft,
  //howManyAlerts,
  howManyAlertSoft,
}) => {

  const bigState = useRecoilValue(bigStateAtom);
  const [clientSettings, setClientSettings] = useRecoilState(clientSettingsAtom);

  // Chop the bigState into vars
  const {
    hideFilters,
  } = bigState;

  // Chop the clientSettings into vars
  const {
    hideAlertSoft,
    //hostSortOrder,
    //hostgroupFilter,
    //hideHistory,
    //hideHostDown,
    //hideHostSection,
    //serviceSortOrder,
    language,
  } = clientSettings;

  // shouldComponentUpdate(nextProps, nextState) {
  //   const propsToCauseRender = [
  //     'hideFilters',
  //     'hideAlertSoft',
  //     'howManyAlertSoft'
  //   ];
  //   for(let i=0;i<propsToCauseRender.length;i++) {
  //     if (nextProps[propsToCauseRender[i]] !== this.props[propsToCauseRender[i]]) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  const saveCookie = (settings) => {
    //const cookieObject = {};
    //this.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', settings);
    console.log('Saved cookie', settings);
  };

  const handleCheckboxChange = (e, propName, dataType) => {
    // This will get called twice (see note below). The little hack there deals with it
    // So we actually do not want e.preventDefault(); here
    //console.log('handleCheckboxChange', e);

    // we put this to solve the bubble issue where the click goes through the label then to the checkbox
    if (typeof e.target.checked === 'undefined') { return; }
 
    console.log('handleCheckboxChange going through');

    let val = '';
    if (dataType === 'checkbox') {
      val = (!e.target.checked);
    } else {
      val = e.target.value;
    }
    // Save to state

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
    
  

  return (
    <>

      {/*<span className="filter-ok-label filter-ok-label-gray"><strong>{howManyAlerts}</strong> Alerts</span>*/}

      {(!hideFilters || howManyAlertSoft !== 0) && <span>
        &nbsp;
        <Checkbox
          filterName="soft"
          hideFilters={hideFilters}
          handleCheckboxChange={handleCheckboxChange}
          stateName={'hideAlertSoft'}
          defaultChecked={!hideAlertSoft}
          howMany={howManyAlertSoft}
          howManyText={translate('soft', language)}
        />
      </span>}
    </>
  );
  
};

export default AlertFilters;
