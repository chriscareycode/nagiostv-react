
/*
 * TODO:
 */

//=============================================================================
// Requires
//=============================================================================

var express = require('express');
var app = express();
var cors = require('cors');
var fs = require('fs');
var bodyParser = require('body-parser');
// express-http-proxy https://github.com/villadora/express-http-proxy
var proxy = require('express-http-proxy');

//=============================================================================
// Settings
//=============================================================================

let settings;
let settingsNagios;

// Load the settings.js file, if it exists
try {
  const stats = fs.lstatSync('settings.js');
  if (stats.isFile()) { console.log('settings.js file found. This is where the Node.js server settings are stored.'); }
  settings = require('./settings');
}
catch (e) {
  console.log('****************************************************************************************************************');
  console.log('No settings.js file found. This is where the Node.js server settings are stored.')
  console.log('Copy the file settings.dist.js to settings.js and edit settings.js if you want to. The settings.js file will not be overwritten by updates.');
  console.log('****************************************************************************************************************');
  process.exit();
}

loadSettingsNagios();

//=============================================================================
// loadSettings and saveSettings
//=============================================================================
function loadSettingsNagios() {
  // Load the settings-nagios.js file, if it exists
  try {
    const stats = fs.lstatSync('settings-nagios.js');
    if (stats.isFile()) { console.log('settings-nagios.js file found. This is where the Nagios server config is set.'); }
    settingsNagios = require('./settings-nagios');
    console.log('Nagios Server: ' + settingsNagios.nagiosServerHost);
  } catch (e) {
    console.log('****************************************************************************************************************');
    console.log('No settings-nagios.js found. This is where the webUI will store it\'s settings, once you save them to the server.');
    console.log('You can copy the file settings-nagios.dist.js to settings-nagios.js and edit the file manually. The settings-nagios.js file will not be overwritten by updates.');
    console.log('****************************************************************************************************************');
  }
}

//=============================================================================
// Set up routes
//=============================================================================

app.use(cors());

// to support JSON-encoded bodies
app.use(bodyParser.json());

// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use('/', express.static('../dist'));

//***********************************************************************
//* Start Proxy
//***********************************************************************

let proxyUrl = '';
if (settingsNagios) { proxyUrl = settingsNagios.nagiosServerHost + settingsNagios.nagiosServerCgiPath + '/:resource'; }
console.log('Will proxy requests to ' + proxyUrl);

var proxyOptions = {
  proxyReqPathResolver: function(req) {
    if (settings.debug) { console.log('Proxying to URL: ' + proxyUrl + req.url); }
    return require('url').parse(req.url).path;
  },
  proxyReqOptDecorator: function(proxyReqOpts, originalReq) {
    proxyReqOpts.rejectUnauthorized = false
    return proxyReqOpts;
  }
};

// Add auth if it is enabled
if (settingsNagios && settingsNagios.auth) {
  proxyOptions.headers = {
    Authorization: "Basic " + new Buffer(settingsNagios.username + ':' + settingsNagios.password).toString('base64')
  };
}

app.get('/nagios/:resource', proxy(proxyUrl + '/:resource', proxyOptions));

//***********************************************************************
//* End Proxy
//***********************************************************************

// Server listen on port
app.listen(settings.serverPort);

console.log('Listening on port ' + settings.serverPort + '...');
console.log(' ');
console.log(`In NagiosTV settings you can now set the Nagios cgi-bin path to`);
console.log(`http://<this server ip address>: ${settings.serverPort}`);
console.log(`And this server will proxy and add auth to the Nagios server at`);
console.log(`${settingsNagios.nagiosServerHost}${settingsNagios.nagiosServerCgiPath}`);
console.log(' ');
