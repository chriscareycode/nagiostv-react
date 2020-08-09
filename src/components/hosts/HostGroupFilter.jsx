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
  const options = keys.map((key, i) => {
    return <option key={i} value={key}>{key}</option>;
  });

  return (
    <div>
      HostGroup Filter:{' '}
      <select onChange={onChangeHostGroupFilter} defaultValue={props.hostgroupFilter}>
        <option value="">off</option>
        {options}
      </select>
    </div>
  );
  
}

export default HostGroupFilter;
