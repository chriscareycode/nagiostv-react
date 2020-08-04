import React from 'react';
import './HostGroupFilter.css';

// http://bigwood.local/nagios/jsonquery.html
// http://bigwood.local/nagios/cgi-bin/objectjson.cgi?query=hostgrouplist&details=true

const HostGroupFilter = (props) => {

  return (
    <div>
      HostGroup Filter:{' '}
      <select>
        <option>Off</option>
        <option>All</option>
        <option>HTTP Servers</option>
      </select>
    </div>
  );
  
}

export default HostGroupFilter;
