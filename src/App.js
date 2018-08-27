import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ServiceItem from './ServiceItem.jsx';

//import { Transition, animated } from 'react-spring';

class App extends Component {

  state = {
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
          servicelist: myJson.data.servicelist,
          serviceProblemsArray: serviceProblemsArray,
          //servicelistArray: servicelistArray
        });
      });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        {/*<Transition
          native
          keys={Object.keys(this.state.servicelist)}
          from={{ opacity: 0, height: 0 }}
          enter={{ opacity: 1, height: 100 }}
          leave={{ opacity: 0, height: 0 }}>
          {Object.keys(this.state.servicelist).map((e, i) => styles => {
            console.log(e);
            console.log(this.state.servicelist[e]);
            return <animated.div key={i}><ServiceItem>{e}</ServiceItem></animated.div>
          })}
        </Transition>*/}
        <div>this.state.serviceProblemsArray.length: {this.state.serviceProblemsArray.length}</div>
        {this.state.serviceProblemsArray.map((service, o) => {
          return <div key={o}>{service.host_name} {service.plugin_output}</div>;
        })}
      {/*
        {this.state.serviceProblemsArray.map((e, i) => {
          console.log(e);
          //console.log(this.state.servicelist[e]);
          return <ServiceItem key={i} serviceProblemsArray={this.state.serviceProblemsArray}>{e}</ServiceItem>
        })}
      */}
        <ServiceItem serviceProblemsArray={this.state.serviceProblemsArray} />

        {/*Object.keys(this.state.servicelist).map((e, i) => {
          console.log(e);
          console.log(this.state.servicelist[e]);
          return <ServiceItem key={i} serviceProblems={this.state.serviceProblems} item={this.state.servicelist[e]}>{e}</ServiceItem>
        })*}

        {/*this.state.servicelistArray.map((e, i) => {
          return <div key={i}>asdf</div>
        }) */}
      </div>
    );
  }
}

export default App;
