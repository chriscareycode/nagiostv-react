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
import { clientSettingsAtom } from '../../atoms/settingsState';
import { servicegroupAtom } from '../../atoms/hostgroupAtom';
import './ServiceGroupFilter.css';
import { saveCookie } from 'helpers/nagiostv';

// http://pi4.local/nagios/jsonquery.html
// http://pi4.local/nagios/cgi-bin/objectjson.cgi?query=servicegrouplist&details=true

const ServiceGroupFilter = () => {

  //const bigState = useRecoilValue(bigStateAtom);
  const [clientSettings, setClientSettings] = useRecoilState(clientSettingsAtom);
  const servicegroupState = useRecoilValue(servicegroupAtom);

  const servicegroup = servicegroupState.response;
  const servicegroupFilter = clientSettings.servicegroupFilter;
  
  const onChangeServiceGroupFilter = (e) => {
    setClientSettings(curr => {
      saveCookie('Service Group Filter', {
        ...curr,
        servicegroupFilter: e.target.value
      });
      return ({
        ...curr,
        servicegroupFilter: e.target.value
      });
    });

  };

  if (!servicegroup) {
    return (<div className="HostGroupFilter">Could not load servicegroups</div>);
  }

  const keys = Object.keys(servicegroup);
  // add an option for each servicegroup returned by the server
  const options = keys.map((key, i) => {
    return <option key={i} value={key}>{key}</option>;
  });
  // if the saved servicegroupFilter setting is not in the list of servicegroups from the server, add it manually
  if (servicegroupFilter && keys.indexOf(servicegroupFilter) === -1) {
    options.push(<option key={servicegroupFilter} value={servicegroupFilter}>{servicegroupFilter}</option>);
  }

  return (
    <div className="HostGroupFilter">
      ServiceGroup Filter: {' '}
      <select onChange={onChangeServiceGroupFilter} value={servicegroupFilter}>
        <option value="">no filter</option>
        {options}
      </select>
    </div>
  );
  
}

function propsAreEqual(prevProps, nextProps) {
  // return Object.keys(prevProps.hostgroup).length === Object.keys(nextProps.hostgroup).length &&
  //   prevProps.hostgroupFilter === nextProps.hostgroupFilter;
  return true;
}

export default React.memo(ServiceGroupFilter, propsAreEqual);
