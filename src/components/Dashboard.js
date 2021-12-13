import React from 'react';
// Recoil
import { useRecoilValue } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
// Dashboard Fetch (For HostGroup and Comment)
import DashboardFetch from './DashboardFetch';
// Import Hosts and Services
import HostGroupFilter from './hosts/HostGroupFilter.jsx';
import Summary from './summary/Summary';
import HostSection from './hosts/HostSection.jsx';
import ServiceSection from './services/ServiceSection.jsx';
import AlertSection from './alerts/AlertSection.jsx';
import SelectedItem from './widgets/SelectedItem';
// Demo mode
import Demo from './Demo';

// CSS
import './Dashboard.css';

const Dashboard = () => {

  const bigState = useRecoilValue(bigStateAtom);
  const clientSettings = useRecoilValue(clientSettingsAtom);

  // Chop the bigState into vars
  const {
    isDemoMode,
    isDoneLoading,
    hideFilters,
  } = bigState;

  // Chop the clientSettings into vars
  const {
    hideSummarySection,
    hideHistory,
    hideHostSection,
    hideServiceSection,
  } = clientSettings;

  const isSelectedItem = bigState.selectedItem && bigState.selectedItem.name;

  //console.log('Dashboard render()');

  return (
    <div className="Dashboard">

      {isDoneLoading && <div>
      
        <DashboardFetch />

        {/* Hostgroup Filter Section */}
        {!hideFilters && <HostGroupFilter />}

        {!hideSummarySection && <Summary />}

        {/* Hosts Section */}
        {!hideHostSection && <HostSection />} 

        {/* Services Section */}
        {!hideServiceSection && <ServiceSection  
          commentlist={[]}
        />}
                    
        {/* Alert History Section */}
        {!hideHistory && <AlertSection />}

        {/* Selected Item */}
        {isSelectedItem && <SelectedItem />}

        {/* Demo mode */}
        {isDemoMode && <Demo />}
      
      </div>}

    </div>
    
  );
};

// function isEqualMemo(prev, next) {
//   //console.log('Dashboard memoFn', prev, next);
//   return false; // update
// }

// We do not have
export default React.memo(Dashboard);