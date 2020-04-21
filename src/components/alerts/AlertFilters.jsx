import React, { Component } from 'react';
import './AlertFilters.css';
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/Checkbox.jsx';

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
      <div className="sort-and-filter">

        {(!this.props.hideFilters) && <Checkbox className={this.props.howManyAlertSoft ? 'Checkbox soft uppercase' : 'Checkbox soft uppercase dim'}
          handleCheckboxChange={this.props.handleCheckboxChange}
          stateName={'hideAlertSoft'}
          defaultChecked={!this.props.hideAlertSoft}
          howMany={this.props.howManyAlertSoft}
          howManyText={translate('soft', language)}
        />}

      </div>
    );
  }
}

export default AlertFilters;
