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

// Cross-origin requests are disabled by default (the web UI is served by this
// same server, so it does not need CORS). The proxy injects Nagios credentials
// server-side, so a permissive CORS policy would let any website the operator
// visits read authenticated monitoring data. To allow another origin (for
// example if you host the web UI elsewhere), add its origin to allowedOrigins
// in settings.js.
var allowedOrigins = (settings && Array.isArray(settings.allowedOrigins)) ? settings.allowedOrigins : [];
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : false }));

// Basic hardening headers for everything this server serves or proxies.
app.use(function(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

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
if (settingsNagios) { proxyUrl = settingsNagios.nagiosServerHost + settingsNagios.nagiosServerCgiPath; }
console.log('Will proxy requests to ' + proxyUrl);

var proxyOptions = {
  proxyReqPathResolver: function(req) {
    if (settings.debug) { console.log('Proxying to URL: ' + proxyUrl + '/' + req.params.resource); }
    //return require('url').parse(req.url).path;
    var url = require('url').parse(req.url);
    //console.log('proxy-' + url.path + '?' + url.query);
    //console.log(req.params);
    return proxyUrl + '/' + req.params.resource + '?' + url.query;
    //return url.path + '?' + url.query;
  },
  proxyReqOptDecorator: function(proxyReqOpts, originalReq) {
    // Validate TLS certificates by default. Set nagiosServerAllowSelfSigned to
    // true in settings-nagios.js only if your Nagios server uses a self-signed
    // or otherwise invalid certificate. Disabling validation would allow a
    // man-in-the-middle to steal the Basic auth credentials injected below.
    proxyReqOpts.rejectUnauthorized = !(settingsNagios && settingsNagios.nagiosServerAllowSelfSigned);
    return proxyReqOpts;
  }
};

// Add auth if it is enabled
if (settingsNagios && settingsNagios.auth) {
  proxyOptions.headers = {
    Authorization: "Basic " + Buffer.from(settingsNagios.username + ':' + settingsNagios.password).toString('base64')
  };
  //console.log('Adding proxy auth');
  //console.log(proxyOptions);
}

app.get('/nagios/:resource', proxy(proxyUrl + '/:resource', proxyOptions));

//***********************************************************************
//* End Proxy
//***********************************************************************

// Server listen on port
app.listen(settings.serverPort);

console.log('Listening on port ' + settings.serverPort + '...');
console.log(' ');
console.log(`This server will proxy and add auth to the Nagios server at`);
console.log(`${settingsNagios.nagiosServerHost}${settingsNagios.nagiosServerCgiPath}`);
console.log(' ');
console.log(`In NagiosTV settings you can now set the Nagios cgi-bin path to:`);
console.log(`http://<this server ip address>:${settings.serverPort}/nagios/`);
console.log(`http://localhost:${settings.serverPort}/nagios/`);
console.log(' ');
