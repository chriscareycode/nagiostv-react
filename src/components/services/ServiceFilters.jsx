/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
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

import React, { Component } from 'react';
import './ServiceFilters.css';
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/FilterCheckbox.jsx';

class ServiceFilters extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    const propsToCauseRender = [
      'hideFilters',
      'serviceSortOrder',
      'howManyServices',
      'howManyServiceWarning',
      'howManyServicePending',
      'howManyServiceUnknown',
      'howManyServiceCritical',
      'howManyServiceAcked',
      'howManyServiceScheduled',
      'howManyServiceFlapping',
      'howManyServiceSoft',
      'howManyServiceNotificationsDisabled'
    ];
    for(let i=0;i<propsToCauseRender.length;i++) {
      if (nextProps[propsToCauseRender[i]] !== this.props[propsToCauseRender[i]]) {
        return true;
      }
    }
    return false;
  }

  render() {
    
    const language = this.props.language;

    const howManyServiceOk = this.props.howManyServices - this.props.howManyServiceWarning - this.props.howManyServiceCritical;

    return (
      <>

        {!this.props.hideFilters && <select value={this.props.serviceSortOrder} varname={'serviceSortOrder'} onChange={this.props.handleSelectChange}>
          <option value="newest">{translate('newest first', language)}</option>
          <option value="oldest">{translate('oldest first', language)}</option>
        </select>}

        {(this.props.howManyServiceWarning !== 9 || this.props.howManyServiceCritical !== 0) && <span>
          &nbsp;
          <span className="filter-ok-label filter-ok-label-green"><strong>{howManyServiceOk}</strong> OK</span>
        </span>}
        
        {(!this.props.hideFilters || this.props.howManyServiceCritical !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="critical"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServiceCritical'}
            defaultChecked={!this.props.settingsObject.hideServiceCritical}
            howMany={this.props.howManyServiceCritical}
            howManyText={translate('critical', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyServiceWarning !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="warning"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServiceWarning'}
            defaultChecked={!this.props.settingsObject.hideServiceWarning}
            howMany={this.props.howManyServiceWarning}
            howManyText={translate('warning', language)}
          />
        </span>}
        
        {(!this.props.hideFilters || this.props.howManyServiceUnknown !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="unknown"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServiceUnknown'}
            defaultChecked={!this.props.settingsObject.hideServiceUnknown}
            howMany={this.props.howManyServiceUnknown}
            howManyText={translate('unknown', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyServicePending !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="pending"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServicePending'}
            defaultChecked={!this.props.settingsObject.hideServicePending}
            howMany={this.props.howManyServicePending}
            howManyText={translate('pending', language)}
          />
        </span>}
        
        {(!this.props.hideFilters || this.props.howManyServiceAcked !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="acked"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServiceAcked'}
            defaultChecked={!this.props.settingsObject.hideServiceAcked}
            howMany={this.props.howManyServiceAcked}
            howManyText={translate('acked', language)}
          />
        </span>}
        
        {(!this.props.hideFilters || this.props.howManyServiceScheduled !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="scheduled"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServiceScheduled'}
            defaultChecked={!this.props.settingsObject.hideServiceScheduled}
            howMany={this.props.howManyServiceScheduled}
            howManyText={translate('scheduled', language)}
          />
        </span>}
        
        {(!this.props.hideFilters || this.props.howManyServiceFlapping !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="flapping"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServiceFlapping'}
            defaultChecked={!this.props.settingsObject.hideServiceFlapping}
            howMany={this.props.howManyServiceFlapping}
            howManyText={translate('flapping', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyServiceSoft !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="soft"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServiceSoft'}
            defaultChecked={!this.props.settingsObject.hideServiceSoft}
            howMany={this.props.howManyServiceSoft}
            howManyText={translate('soft', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyServiceNotificationsDisabled !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="notifications_disabled"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideServiceNotificationsDisabled'}
            defaultChecked={!this.props.settingsObject.hideServiceNotificationsDisabled}
            howMany={this.props.howManyServiceNotificationsDisabled}
            howManyText={translate('notifications disabled', language)}
          />
        </span>}

      </>
    );
  }
}

export default ServiceFilters;
