import React from 'react';
// Recoil
import { useRecoilValue } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
// Dashboard Fetch (For HostGroup and Comment)
import DashboardFetch from './DashboardFetch';
// Import Hosts and Services
import HostGroupFilter from './hosts/HostGroupFilter';
import Summary from './summary/Summary';
import HostSection from './hosts/HostSection';
import ServiceSection from './services/ServiceSection';
import AlertSection from './alerts/AlertSection';
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
    fontSizeEm,
    hideSummarySection,
    hideHistory,
    hideHostSection,
    hideServiceSection,
    hostsAndServicesSideBySide,
  } = clientSettings;

  //console.log('Dashboard render()');

  

  return (
    <div className="Dashboard" style={{ fontSize: fontSizeEm}}>

      {isDoneLoading && <div>
      
        <DashboardFetch />

        {/* Hostgroup Filter Section */}
        {!hideFilters && <HostGroupFilter />}

        {/* Summary Section */}
        {!hideSummarySection && <Summary />}

        {/* Hosts and Services Side by Side Enabled */}
        {hostsAndServicesSideBySide && (
          <div className="two-column-container">
            <div className="two-column-column-1 two-column-box">
              <div className="two-column-column-margin">
                {/* Hosts Section */}
                {!hideHostSection && <HostSection />}
              </div>
            </div>
            <div className="two-column-column-2 two-column-box">
              <div className="two-column-column-margin">
                {/* Services Section */}
                {!hideServiceSection && <ServiceSection />}
              </div>
            </div>
          </div>
        )}

        {/* Hosts and Services Side by Side Disabled (Default stacked) */}
        {!hostsAndServicesSideBySide && (
          <div>
            {/* Hosts Section */}
            {!hideHostSection && <HostSection />}

            {/* Services Section */}
            {!hideServiceSection && <ServiceSection />}
          </div>
        )}
                    
        {/* Alert History Section */}
        {!hideHistory && <AlertSection />}

        {/* Demo mode */}
        {isDemoMode && <Demo />}
      
      </div>}

      {/* add space to the bottom of the dashboard */}
      <div style={{ height: 40 }}></div>

    </div>
    
  );
};

// function isEqualMemo(prev, next) {
//   //console.log('Dashboard memoFn', prev, next);
//   return false; // update
// }

// We do not have
export default React.memo(Dashboard);