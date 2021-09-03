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
import { hostgroupAtom } from '../../atoms/hostgroupAtom';
import './HostGroupFilter.css';

// http://pi4.local/nagios/jsonquery.html
// http://pi4.local/nagios/cgi-bin/objectjson.cgi?query=hostgrouplist&details=true

const HostGroupFilter = () => {

  //const bigState = useRecoilValue(bigStateAtom);
  const [clientSettings, setClientSettings] = useRecoilState(clientSettingsAtom);
  const hostgroupState = useRecoilValue(hostgroupAtom);

  const hostgroup = hostgroupState.response;
  const hostgroupFilter = clientSettings.hostgroupFilter;
  
  const onChangeHostGroupFilter = (e) => {
    setClientSettings(curr => {
      return ({
        ...curr,
        hostgroupFilter: e.target.value
      });
    });
  };

  if (!hostgroup) {
    return (<div className="HostGroupFilter">Could not load hostgroups</div>);
  }

  const keys = Object.keys(hostgroup);
  // add an option for each hostgroup returned by the server
  const options = keys.map((key, i) => {
    return <option key={i} value={key}>{key}</option>;
  });
  // if the saved hostgroupFilter setting is not in the list of hostgroups from the server, add it manually
  if (hostgroupFilter && keys.indexOf(hostgroupFilter) === -1) {
    options.push(<option key={hostgroupFilter} value={hostgroupFilter}>{hostgroupFilter}</option>);
  }

  return (
    <div className="HostGroupFilter">
      HostGroup Filter: {' '}
      <select onChange={onChangeHostGroupFilter} value={hostgroupFilter}>
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

export default React.memo(HostGroupFilter, propsAreEqual);
