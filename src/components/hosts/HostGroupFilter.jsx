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
