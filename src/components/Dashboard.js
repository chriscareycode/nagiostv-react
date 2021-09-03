import React from 'react';
// Recoil
import { useRecoilValue } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
// Dashboard Fetch (For HostGroup and Comment)
import DashboardFetch from './DashboardFetch';
// Import Hosts and Services
import HostGroupFilter from './hosts/HostGroupFilter.jsx';
import HostSection from './hosts/HostSection.jsx';
import ServiceSection from './services/ServiceSection.jsx';
import AlertSection from './alerts/AlertSection.jsx';
// CSS
import './Dashboard.css';

const Dashboard = () => {

  const bigState = useRecoilValue(bigStateAtom);
  const clientSettings = useRecoilValue(clientSettingsAtom);

  // Chop the bigState into vars
  const {
    isDoneLoading,
    hideFilters,
  } = bigState;

  // Chop the clientSettings into vars
  const {
    hideHistory,
    hideHostSection,
    hideServiceSection,
  } = clientSettings;

  //console.log('Dashboard render()');

  return (
    <div className="Dashboard">

      {isDoneLoading && <div>
      
        <DashboardFetch />

        {/* Hostgroup Filter Section */}
        {!hideFilters && <HostGroupFilter />}

        {/* Hosts Section */}
        {!hideHostSection && <HostSection />} 

        {/* Services Section */}
        {!hideServiceSection && <ServiceSection  
          commentlist={[]}
        />}
                    
        {/* Alert History Section */}
        {!hideHistory && <AlertSection />}
      
      </div>}

    </div>
    
  );
};
export default React.memo(Dashboard);