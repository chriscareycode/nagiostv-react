## Development - Setup
------------

### Requirements
- Git
- Node.js


### Setup Instruxtions
```console
$ git clone https://github.com/chriscareycode/nagiostv-react.git
$ cd nagiostv-react
$ npm install
$ npm start
```

Make sure you can access your web server on the hostname and port shown, and you can start editing files.

**However**, you _probably_ see error messages since you _likely_ don't have a Nagios data source. 
You'll either want to use the provided _Mock Data_ or _proxy server_.



### Using Mock data
As of version 0.3.2, mock data is included for doing local development. Without connecting to a real Nagios server, the UI will simulate one of each type of outage. This eliminates the need for the proxy if you just want to make some quick changes. To turn this on:
- add `?fakedata=true` to the URL
- _-or-_ set **useFakeSampleData = true** in `Base.jsx`

### Using Live Data
To use Live Data from your actual Nagios server, edit and run the included **proxy server** like this:
- Edit `proxy.js` using the instructions there
- Run `npm run proxy` in a terminal
- Change your NagiosTV development **Nagios cgi-bin path** setting to use whatever that says. That path will probably be `http://localhost:8080/nagios/cgi-bin/`

Voila! You should see live data populate soon (or refresh it)

#### More info on proxying (if you want to roll your own)
The scripts will not be able to access the Nagios CGIs since, by default, Nagios does not enable CORS headers on those scripts, and the Nagios cgi-bin path may also
have authentication enabled. You will need to either modify
your Apache install to add CORS headers there, or to run a simple Node.js server or Apache config that will proxy the request and add the CORS headers and auth. 

### Demo Mode
Demo Mode uses the fakes/mock data and simulates events happening, just as used on the [demo site](https://nagiostv.com/demo/).

You can also enable "Demo Mode" by adding `?demo=true` to the URL.

Development - Committing your changes to this project
------------
- Fork the project
- Create a feature branch and do your changes there
- Push your feature branch up to origin
- Submit a Pull Request