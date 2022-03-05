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
import { useRecoilValue } from 'recoil';
//import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';
import {
  //serviceIsFetchingAtom,
  //serviceAtom,
  serviceHowManyAtom
} from '../../atoms/serviceAtom';
import { commentlistAtom } from '../../atoms/commentlistAtom';

import { translate } from '../../helpers/language';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import ServiceItem from './ServiceItem';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faSun } from '@fortawesome/free-solid-svg-icons';

// css
import './ServiceItems.css';

const ServiceItems = ({
  serviceProblemsArray,
  settings,
  isDemoMode,
  //servicelistError,
  //howManyServices,
  //commentlist
}) => {

  //const nodeRef = React.useRef(null);

  const commentlistState = useRecoilValue(commentlistAtom);
  const commentlistObject = commentlistState.commentlistObject;
  
  const serviceHowManyState = useRecoilValue(serviceHowManyAtom);

  const {
    howManyServices,
    // howManyServiceOk,
    // howManyServiceWarning,
    // howManyServiceUnknown,
    // howManyServiceCritical,
    // howManyServicePending,
    // howManyServiceAcked,
    // howManyServiceScheduled,
    // howManyServiceFlapping,
    // howManyServiceSoft,
    // howManyServiceNotificationsDisabled,
  } = serviceHowManyState;



  //console.log('this.props.serviceProblemsArray is', this.props.serviceProblemsArray);
  //console.log(Object.keys(this.props.serviceProblemsArray));
  
  const filteredServiceProblemsArray = serviceProblemsArray.filter(item => {
    if (settings.hideServicePending) {
      if (item.status === 1) { return false; }
    }
    if (settings.hideServiceWarning) {
      if (item.status === 4) { return false; }
    }
    if (settings.hideServiceUnknown) {
      if (item.status === 8) { return false; }
    }
    if (settings.hideServiceCritical) {
      if (item.status === 16) { return false; }
    }
    if (settings.hideServiceAcked) {
      if (item.problem_has_been_acknowledged) { return false; }
    }
    if (settings.hideServiceScheduled) {
      if (item.scheduled_downtime_depth > 0) { return false; }
    }
    if (settings.hideServiceFlapping) {
      if (item.is_flapping) { return false; }
    }
    if (settings.hideServiceSoft) {
      if (item.state_type === 0) { return false; }
    }
    if (settings.hideServiceNotificationsDisabled) {
      if (item.notifications_enabled === false) { return false; }
    }
    return true;
  });

  const howManyHidden = serviceProblemsArray.length - filteredServiceProblemsArray.length;
  const showSomeDownItems = serviceProblemsArray.length > 0 && filteredServiceProblemsArray.length === 0;
  const { language } = settings;

  return (
    <div className="ServiceItems">

      <div className={`all-ok-item ${serviceProblemsArray.length === 0 ? 'visible' : 'hidden'}`}>
        <span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">{translate('All', language)} {howManyServices} {translate('services are OK', language)}</span>{' '}
      </div>

      <div className={`some-down-items ${showSomeDownItems ? 'visible' : 'hidden'}`}>
        <div>
          <span className="display-inline-block color-green" style={{ marginRight: '10px' }}>{howManyServices - serviceProblemsArray.length} of {howManyServices} {translate('services are OK', language)}</span>{' '}
          <span className="filter-ok-label filter-ok-label-green some-down-hidden-text">{howManyHidden} hidden</span>
        </div>
      </div>

      <TransitionGroup className="service-items-wrap">

        {filteredServiceProblemsArray.map((e, i) => {
          //console.log('ServiceItem item');
          //console.log(e, i);

          return (

            <CSSTransition
              key={e.host_name + '-' + e.description}
              classNames="example"
              timeout={{ enter: 500, exit: 500 }}
            >
              <ServiceItem
                //ref={nodeRef}
                settings={settings}
                serviceItem={e}
                comments={commentlistObject.services[`${e.host_name}_${e.description}`] ? commentlistObject.services[`${e.host_name}_${e.description}`].comments : null}
                howManyDown={filteredServiceProblemsArray.length}
                isDemoMode={isDemoMode}
              />
            </CSSTransition>
            
          );
          
        })}
      </TransitionGroup>
    </div>
  );
  
}

export default ServiceItems;
