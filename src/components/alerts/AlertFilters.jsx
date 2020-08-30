import React, { Component } from 'react';
import './AlertFilters.css';
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/FilterCheckbox.jsx';

class AlertFilters extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    const propsToCauseRender = [
      'hideFilters',
      'hideAlertSoft',
      'howManyAlertSoft'
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

        <span className="filter-ok-label filter-ok-label-gray"><strong>{this.props.howManyAlerts}</strong> Alerts</span>

        {(!this.props.hideFilters || this.props.howManyAlertSoft !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="soft"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideAlertSoft'}
            defaultChecked={!this.props.hideAlertSoft}
            howMany={this.props.howManyAlertSoft}
            howManyText={translate('soft', language)}
          />
        </span>}
      </>
    );
  }
}

export default AlertFilters;
