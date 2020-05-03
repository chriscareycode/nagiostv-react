import React, { Component } from 'react';
import './HostFilters.css';
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/FilterCheckbox.jsx';

class HostFilters extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    const propsToCauseRender = [
      'hideFilters',
      'hostSortOrder',
      'howManyHostDown',
      'howManyHostDown',
      'howManyHostUnreachable',
      'howManyHostPending',
      'howManyHostAcked',
      'howManyHostScheduled',
      'howManyHostFlapping',
      'howManyHostSoft'
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

    return (
      <>

        {!this.props.hideFilters && <select value={this.props.hostSortOrder} varname={'hostSortOrder'} onChange={this.props.handleSelectChange}>
          <option value="newest">{translate('newest first', language)}</option>
          <option value="oldest">{translate('oldest first', language)}</option>
        </select>}
        &nbsp;
        {(!this.props.hideFilters || this.props.howManyHostDown !== 0) && <Checkbox
          filterName="down"
          hideFilters={this.props.hideFilters}
          handleCheckboxChange={this.props.handleCheckboxChange}
          stateName={'hideHostDown'}
          defaultChecked={!this.props.settingsObject.hideHostDown}
          howMany={this.props.howManyHostDown}
          howManyText={translate('down', language)}
        />}
        &nbsp;
        {(!this.props.hideFilters || this.props.howManyHostUnreachable !== 0) && <Checkbox
          filterName="unreachable"
          hideFilters={this.props.hideFilters}
          handleCheckboxChange={this.props.handleCheckboxChange}
          stateName={'hideHostUnreachable'}
          defaultChecked={!this.props.settingsObject.hideHostUnreachable}
          howMany={this.props.howManyHostUnreachable}
          howManyText={translate('unreachable', language)}
        />}
        &nbsp;
        {(!this.props.hideFilters || this.props.howManyHostPending !== 0) && <Checkbox
          filterName="pending"
          hideFilters={this.props.hideFilters}
          handleCheckboxChange={this.props.handleCheckboxChange}
          stateName={'hideHostPending'}
          defaultChecked={!this.props.settingsObject.hideHostPending}
          howMany={this.props.howManyHostPending}
          howManyText={translate('pending', language)}
        />}
        &nbsp;
        {(!this.props.hideFilters || this.props.howManyHostAcked !== 0) && <Checkbox
          filterName="acked"
          hideFilters={this.props.hideFilters}
          handleCheckboxChange={this.props.handleCheckboxChange}
          stateName={'hideHostAcked'}
          defaultChecked={!this.props.settingsObject.hideHostAcked}
          howMany={this.props.howManyHostAcked}
          howManyText={translate('acked', language)}
        />}
        &nbsp;
        {(!this.props.hideFilters || this.props.howManyHostScheduled !== 0) && <Checkbox
          filterName="scheduled"
          hideFilters={this.props.hideFilters}
          handleCheckboxChange={this.props.handleCheckboxChange}
          stateName={'hideHostScheduled'}
          defaultChecked={!this.props.settingsObject.hideHostScheduled}
          howMany={this.props.howManyHostScheduled}
          howManyText={translate('scheduled', language)}
        />}
        &nbsp;
        {(!this.props.hideFilters || this.props.howManyHostFlapping !== 0) && <Checkbox
          filterName="flapping"
          hideFilters={this.props.hideFilters}
          handleCheckboxChange={this.props.handleCheckboxChange}
          stateName={'hideHostFlapping'}
          defaultChecked={!this.props.settingsObject.hideHostFlapping}
          howMany={this.props.howManyHostFlapping}
          howManyText={translate('flapping', language)}
        />}
        &nbsp;
        {(!this.props.hideFilters || this.props.howManyHostSoft !== 0) && <Checkbox
          filterName="soft"
          hideFilters={this.props.hideFilters}
          handleCheckboxChange={this.props.handleCheckboxChange}
          stateName={'hideHostSoft'}
          defaultChecked={!this.props.settingsObject.hideHostSoft}
          howMany={this.props.howManyHostSoft}
          howManyText={translate('soft', language)}
        />}

      </>
    );
  }
}

export default HostFilters;
