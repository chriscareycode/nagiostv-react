import React, { Component } from 'react';
import './Base.css';
import ServiceItem from './ServiceItem.jsx';
import { formatDateTime, formatDateTimeAgo } from './helpers/moment.js';

class Base extends Component {

  state = {
  	servicelistLastUpdate: 0,
    servicelist: {},
    servicelistArray: [],
    serviceProblemsArray: []
  };

  componentDidMount() {
    this.fetchData();

    const interval = setInterval(() => {
      this.fetchData();
    }, 15000);
  }

  fetchData() {
    const url = 'http://10.69.0.19:3000/nagios/statusjson.cgi?query=servicelist&details=true';
    //const url = '/nagios/statusjson.cgi?query=servicelist&details=true';
    fetch(url)
      .then((response) => {
        //console.log(response);
        return response.json();
      })
      .then((myJson) => {
        console.log('myJson');
        //console.log(JSON.stringify(myJson));
        //console.log(myJson);
        console.log(myJson.data.servicelist);
        

        // Make an array from the object
        const hostlist = myJson.data.servicelist;
        //const hostlistArray = Object.keys(hostlist).map((k) => hostlist[k]);

        // Filter down the array to only include hosts with with only problems left
        // const hostlistProblemsArray = hostlistArray.filter((host) => {
        //   return service.status !== 2 || service.is_flapping;
        // });

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
          servicelist: myJson.data.servicelist,
          serviceProblemsArray: serviceProblemsArray,
          //servicelistArray: servicelistArray
        });
      });
  }

  render() {
    return (
      <div className="Base">
        <h3>NagiosTV</h3>
        <div>Last Update: {this.state.servicelistLastUpdate}</div>
        <div>this.state.serviceProblemsArray.length: {this.state.serviceProblemsArray.length}</div>
        
        <ServiceItem serviceProblemsArray={this.state.serviceProblemsArray} />
        
        <div className="border-green color-green ServiceItem">
        	All Services are OK
        </div>

        <div className="border-green color-green ServiceItem">
        	All Hosts are OK
        </div>

        <br />
        <br />
      </div>
    );
  }
}

export default Base;
