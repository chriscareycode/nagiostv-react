import React, { Component } from 'react';
import './Base.css';
import ServiceItem from './ServiceItems.jsx';
import HostItems from './HostItems.jsx';
import { prettyDateTime } from './helpers/moment.js';

class Base extends Component {

  state = {
  	baseUrl: 'http://10.69.0.19:3000/nagios/statusjson.cgi',
  	//baseUrl: '/nagios/statusjson.cgi',
  	fetchFrequency: 15,

  	servicelistLastUpdate: 0,
    servicelist: {},
    serviceProblemsArray: [],

    hostlistLastUpdate: 0,
    hostlist: {},
    hostProblemsArray: []
  };

  componentDidMount() {
    this.fetchServiceData();
    this.fetchHostData();

    setInterval(() => {
      this.fetchServiceData();
      this.fetchHostData();
    }, this.state.fetchFrequency * 1000);
  }

  fetchServiceData() {
    const url = this.state.baseUrl + '?query=servicelist&details=true';

    fetch(url)
      .then((response) => {
        //console.log(response);
        return response.json();
      })
      .then((myJson) => {
        console.log('fetchServiceData() myJson');
        console.log(myJson.data.servicelist);
        

        // Make an array from the object
        const hostlist = myJson.data.servicelist;

        const serviceProblemsArray = [];
        Object.keys(hostlist).map((k) => {
          Object.keys(hostlist[k]).map((l) => {
            if (hostlist[k][l].status !== 2 || hostlist[k][l].is_flapping) {
              serviceProblemsArray.push(hostlist[k][l]);
            }
          });
        });

        console.log('serviceProblemsArray', serviceProblemsArray);

        this.setState({
        	servicelistLastUpdate: new Date().getTime(),
          servicelist: hostlist,
          serviceProblemsArray: serviceProblemsArray
        });
      });
  }

  fetchHostData() {
    const url = this.state.baseUrl + '?query=hostlist&details=true';

    fetch(url)
      .then((response) => {
        //console.log(response);
        return response.json();
      })
      .then((myJson) => {
        console.log('fetchHostData() myJson');
        console.log(myJson.data.hostlist);
        

        // Make an array from the object
        const hostlist = myJson.data.hostlist;

        const hostProblemsArray = [];
        Object.keys(hostlist).map((k) => {
          if (hostlist[k].status !== 2 || hostlist[k].is_flapping) {
            hostProblemsArray.push(hostlist[k]);
          }
        });

        console.log('hostProblemsArray', hostProblemsArray);

        this.setState({
        	hostlistLastUpdate: new Date().getTime(),
          hostlist: hostlist,
          hostProblemsArray: hostProblemsArray
        });
      });
  }

  render() {
    return (
      <div className="Base">
        <h3>NagiosTV</h3>
        <div>Last Update: {prettyDateTime(this.state.servicelistLastUpdate)}</div>
        <div>Update every {this.state.fetchFrequency} seconds</div>

        <div style={{ marginTop: '10px' }} className="color-orange">Host Problems: {this.state.hostProblemsArray.length}</div>
        
        {this.state.hostProblemsArray.length === 0 && <div className="border-green color-green ServiceItem">
        	All Hosts are OK
        </div>}

        <HostItems hostProblemsArray={this.state.hostProblemsArray} />

        <div className="color-orange">Service Problems: {this.state.serviceProblemsArray.length}</div>

        {this.state.serviceProblemsArray.length === 0 && <div className="border-green color-green ServiceItem">
        	All Services are OK
        </div>}

        <ServiceItem serviceProblemsArray={this.state.serviceProblemsArray} />
        
        <div className="color-orange">Alert History: 0</div>

        
        <br />
        <br />
      </div>
    );
  }
}

export default Base;
