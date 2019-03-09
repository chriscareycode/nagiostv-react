import React, { Component } from 'react';

import AlertItem from './AlertItem.jsx';
import QuietFor from './QuietFor.jsx';
// css
import '../animation.css';
import '../services/ServiceItems.css';
import './AlertItems.css';

class AlertItems extends Component {

  render() {
    
    return (
      <div className="AlertItems">
        {/* always show one quiet for (if we have at least 1 item) */}
        {this.props.items.length > 1 &&
          <QuietFor
            first
            nowtime={new Date().getTime()}
            prevtime={this.props.items[0].timestamp}
            showEmoji={this.props.settings.showEmoji}
            language={this.props.settings.language}
          />
        }
        {/* loop through the items */}
        {this.props.items.map((e, i) => {
          const host = (e.object_type === 1 ? e.name : e.host_name);
          const prevtime = (i > 1 ? this.props.items[i-1].timestamp : 0)
          return (
            <AlertItem
              key={'alert-' + host + '-' + e.object_type + '-' + e.timestamp + '-' + i}
              e={e}
              i={i}
              prevtime={prevtime}
              showEmoji={this.props.showEmoji}
              language={this.props.settings.language}
            />
          );
        })}
      </div>
    );
  }
}

export default AlertItems;
