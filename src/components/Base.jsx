import React, { Component } from 'react';
import './Base.css';
import ServiceItems from './ServiceItems.jsx';
import AlertItems from './AlertItems.jsx';
import HostItems from './HostItems.jsx';
import { prettyDateTime } from '../helpers/moment.js';
import Cookie from 'js-cookie';

class Base extends Component {

  state = {
    //baseUrl: 'http://10.69.0.19:3000/nagios/',
    baseUrl: '/nagios/',
    fetchFrequency: 15, // seconds
    fetchAlertFrequency: 60, // seconds

    showSettings: false,

    servicelistError: false,
    servicelistErrorMessage: '',
    servicelistLastUpdate: 0,
    servicelist: {},
    serviceProblemsArray: [],

    hostlistError: false,
    hostlistErrorMessage: '',
    hostlistLastUpdate: 0,
    hostlist: {},
    hostProblemsArray: [],

    alertlistError: false,
    alertlistErrorMessage: '',
    alertlistLastUpdate: 0,
    alertlist: []
  };

  componentDidMount() {
    this.getCookie();

    setTimeout(() => {
      this.fetchServiceData();
      this.fetchHostData();
      this.fetchAlertData();
    }, 1000);

    // fetch host problems and service problems on an interval
    setInterval(() => {
      this.fetchServiceData();
      this.fetchHostData();
    }, this.state.fetchFrequency * 1000);

    // we fetch alerts on a slower frequency interval
    setInterval(() => {
      this.fetchAlertData();
    }, this.state.fetchAlertFrequency * 1000);
  }

  getCookie() {
    const baseUrl = Cookie.get('baseUrl');
    if (baseUrl) {
      this.setState({ baseUrl });
    }
  }

  setCookie() {
    Cookie.set('baseUrl', this.state.baseUrl);
  }


  fetchServiceData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=servicelist&details=true';

    fetch(url)
      .then((response) => {
        console.log(response);
        console.log(response.type); // cors or basic
        console.log(response.headers);
        if (response.status === 200 && response.type === 'cors') {
          this.setState({servicelistError: false, servicelistErrorMessage: ''});
          return response.json();
        } else {
          this.setState({servicelistError: true, servicelistErrorMessage: 'Problem'});
          return { data: { servicelist: [] } };
        }
      }, (err) => {
        console.log('error json', err);
      })
      .then((myJson) => {
        console.log('fetchServiceData() myJson');
        console.log(myJson);
        //console.log(myJson.data.servicelist);
        
        // Make an array from the object
        const servicelist = myJson && myJson.data && myJson.data.servicelist;

        const serviceProblemsArray = [];
        Object.keys(servicelist).map((k) => {
          Object.keys(servicelist[k]).map((l) => {
            if (servicelist[k][l].status !== 2 || servicelist[k][l].is_flapping) {
              serviceProblemsArray.push(servicelist[k][l]);
            }
          });
        });

        //console.log('serviceProblemsArray', serviceProblemsArray);

        this.setState({
          servicelistLastUpdate: new Date().getTime(),
          servicelist,
          serviceProblemsArray: serviceProblemsArray
        });
      });
  }

  fetchHostData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=hostlist&details=true';

    fetch(url)
      .then((response) => {
        //console.log(response);
        if (response.status === 200 && response.type === 'cors') {
          this.setState({hostlistError: false, hostlistErrorMessage: ''});
          return response.json();
        } else {
          this.setState({hostlistError: true, hostlistErrorMessage: 'Problem'});
          return { data: { hostlist: [] } };
        }
      })
      .then((myJson) => {
        //console.log('fetchHostData() myJson');
        //console.log(myJson.data.hostlist);

        // Make an array from the object
        const hostlist = myJson.data.hostlist;

        const hostProblemsArray = [];
        Object.keys(hostlist).map((k) => {
          if (hostlist[k].status !== 2 || hostlist[k].is_flapping) {
            hostProblemsArray.push(hostlist[k]);
          }
        });

        //console.log('hostProblemsArray', hostProblemsArray);

        this.setState({
          hostlistLastUpdate: new Date().getTime(),
          hostlist,
          hostProblemsArray: hostProblemsArray
        });
      });
  }

  fetchAlertData() {
    const url = this.state.baseUrl + 'archivejson.cgi?query=alertlist&starttime=-200000&endtime=%2B0';

    fetch(url)
      .then((response) => {
        //console.log(response);
        if (response.status === 200 && response.type === 'cors') {
          this.setState({alertlistError: false, alertlistErrorMessage: ''});
          return response.json();
        } else {
          this.setState({alertlistError: true, alertlistErrorMessage: 'Problem'});
          return { data: { alertlist: [] } };
        }
      })
      .then((myJson) => {
        //console.log('fetchAlertData() myJson');
        //console.log(myJson);

        // Make an array from the object
        const alertlist = myJson.data.alertlist.reverse();

        //console.log('alertlist', alertlist);

        this.setState({
          alertlistLastUpdate: new Date().getTime(),
          alertlist // it's already an array
        });
      });
  }

  baseUrlChanged(event) {
    console.log('baseUrlChanged ' + event.target.value);
    this.setState({ baseUrl: event.target.value });
  }

  showSettings() {
    this.setState({ showSettings: true });
  }

  hideSettings() {
    this.setState({ showSettings: false });
  }

  render() {
    return (
      <div className="Base">
        <h3>NagiosTV</h3>
        <div>Last Update: {prettyDateTime(this.state.servicelistLastUpdate)}</div>
        <div>Update every {this.state.fetchFrequency} seconds</div>
        {!this.state.showSettings && <button onClick={this.showSettings.bind(this)}>Show Settings</button>}
        {this.state.showSettings && <button onClick={this.hideSettings.bind(this)}>Hide Settings</button>}

        {this.state.showSettings && <div className="margin-top-10 settings border-gray color-white ServiceItem">
          <div>Settings</div>
          <span>Nagios UI path: </span>
          <input type="text" value={this.state.baseUrl} onChange={this.baseUrlChanged.bind(this)} />
          <button onClick={this.setCookie.bind(this)}>Save</button>
        </div>}

        <div style={{ marginTop: '10px' }} className="color-orange">Host Problems: {this.state.hostProblemsArray.length}</div>
        
        {this.state.hostlistError && <div className="margin-top-10 border-red color-red ServiceItem">Error connecting</div>}

        {!this.state.hostlistError && this.state.hostProblemsArray.length === 0 && <div style={{ marginTop: '10px' }} className="border-green color-green ServiceItem">
          All {Object.keys(this.state.hostlist).length} hosts are OK
        </div>}

        <HostItems hostProblemsArray={this.state.hostProblemsArray} />

        <div className="color-orange">Service Problems: {this.state.serviceProblemsArray.length}</div>
        
        {this.state.servicelistError && <div className="margin-top-10 border-red color-red ServiceItem">Error connecting</div>}

        {!this.state.servicelistError && this.state.serviceProblemsArray.length === 0 && <div className="margin-top-10 border-green color-green ServiceItem">
          All {Object.keys(this.state.servicelist).length} services are OK
        </div>}

        <ServiceItems serviceProblemsArray={this.state.serviceProblemsArray} />
        
        <div className="color-orange">Alert History: {this.state.alertlist.length}</div>

        {this.state.alertlistError && <div className="margin-top-10 border-red color-red ServiceItem">Error connecting</div>}

        {!this.state.alertlistError && this.state.alertlist.length === 0 && <div className="margin-top-10 border-green color-green ServiceItem">
          No alerts
        </div>}

        <AlertItems items={this.state.alertlist} />

        <br />
        <br />
      </div>
    );
  }
}

export default Base;
