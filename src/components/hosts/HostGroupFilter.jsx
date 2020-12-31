/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
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
import './HostGroupFilter.css';

// http://bigwood.local/nagios/jsonquery.html
// http://bigwood.local/nagios/cgi-bin/objectjson.cgi?query=hostgrouplist&details=true

const HostGroupFilter = (props) => {

  const onChangeHostGroupFilter = (e) => {
    props.updateStateAndReloadNagiosData({
      hostgroupFilter: e.target.value
    });
  };

  const keys = Object.keys(props.hostgroup);
  // add an option for each hostgroup returned by the server
  const options = keys.map((key, i) => {
    return <option key={i} value={key}>{key}</option>;
  });
  // if the saved hostgroupFilter setting is not in the list of hostgroups from the server, add it manually
  if (props.hostgroupFilter && keys.indexOf(props.hostgroupFilter) === -1) {
    options.push(<option key={props.hostgroupFilter} value={props.hostgroupFilter}>{props.hostgroupFilter}</option>);
  }

  return (
    <div className="HostGroupFilter">
      HostGroup Filter: {' '}
      <select onChange={onChangeHostGroupFilter} value={props.hostgroupFilter}>
        <option value="">none</option>
        {options}
      </select>
    </div>
  );
  
}

function propsAreEqual(prevProps, nextProps) {
  return Object.keys(prevProps.hostgroup).length === Object.keys(nextProps.hostgroup).length && prevProps.hostgroupFilter === nextProps.hostgroupFilter;
}

export default React.memo(HostGroupFilter, propsAreEqual);
