import React, { Component } from 'react';
import { translate } from '../../helpers/language';
import { prettyDateTime } from '../../helpers/moment.js';
import { ifQuietFor } from '../../helpers/date-math.js';
import { alertTextClass, alertBorderClass } from '../../helpers/colors.js';
import { nagiosAlertState, nagiosAlertStateType } from '../../helpers/nagios.js';
import QuietFor from './QuietFor.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYinYang } from '@fortawesome/free-solid-svg-icons';
// css
//import './AlertItem.css';

class AlertItem extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    // console.log('shouldComponentUpdate', nextProps, nextState);
    // if (nextProps.prevtime !== this.props.prevtime) {
    //   return true;
    // } else {
    //   return false;
    // }
    return false;
  }

  render() {
    
    const { language } = this.props;
    const howMuchTimeIsQuietTime = 10;
    const { e, i } = this.props;
    const isSoft = e.state_type === 2;

    return (
      <div>
        {/* show quiet for */}
        {(i > 1) && ifQuietFor(e.timestamp, this.props.prevtime, howMuchTimeIsQuietTime) &&
          <QuietFor
          	nowtime={e.timestamp}
          	prevtime={this.props.prevtime}
          	showEmoji={this.props.showEmoji}
          	language={this.props.language}
          />
        }
        {/* show alert item */}
        <div className={`AlertItem ${alertBorderClass(e.object_type, e.state)}`}>
          <div style={{ float: 'right' }}>
            {isSoft && <span className="softIcon color-white"><FontAwesomeIcon icon={faYinYang} /></span>}
            {1 === 2 && <span>({e.state_type})</span>}
            <span className="uppercase">{translate(nagiosAlertStateType(e.state_type), language)}</span>{' '}
            {1 === 2 && <span>({e.state})</span>}
            {1 === 2 && <span>({e.object_type})</span>}
            <span className={`uppercase ${alertTextClass(e.object_type, e.state)}`}>{translate(nagiosAlertState(e.state), language)}{' '}</span>
            {' - '}{prettyDateTime(e.timestamp)}
          </div>
          <span style={{ textAlign: 'left' }}>
            {e.object_type === 1 && <span>{e.name}</span>}
            {e.object_type === 2 && <span>{e.host_name}</span>}
            {' - '}
            <span className={alertTextClass(e.object_type, e.state)}>
              {e.object_type === 2 && <span className="color-orange">{e.description} - </span>}
              {e.plugin_output}
            </span>
          </span>
          
        </div>
      </div>
    );
  }
}

export default AlertItem;
