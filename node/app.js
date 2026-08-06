//=============================================================================
// Requires
//=============================================================================

var express = require('express');
var app = express();
var cors = require('cors');
var fs = require('fs');
var crypto = require('crypto');
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
// Security configuration
//=============================================================================

// Bind to loopback unless an operator explicitly opts into another interface.
const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '::1'];
const bindHost = settings.bindHost || '127.0.0.1';
const isLoopback = LOOPBACK_HOSTS.includes(bindHost);

// Non-loopback exposure requires a shared client token; fail closed otherwise.
if (!isLoopback && !settings.proxyToken) {
  console.log('Refusing to start: bindHost is non-loopback but no proxyToken is configured in settings.js.');
  process.exit();
}

// Load a private CA bundle when Nagios uses an internal certificate authority.
let nagiosCaBundle = null;
if (settings.nagiosCaBundlePath) {
  try {
    nagiosCaBundle = fs.readFileSync(settings.nagiosCaBundlePath);
    console.log('Loaded Nagios CA bundle from ' + settings.nagiosCaBundlePath);
  } catch (e) {
    console.log('Refusing to start: unable to read nagiosCaBundlePath: ' + settings.nagiosCaBundlePath);
    process.exit();
  }
}
if (settings.insecureSkipTlsVerify === true) {
  console.log('WARNING: insecureSkipTlsVerify is enabled. Upstream TLS certificate verification is DISABLED.');
}

// Only these read-only Nagios JSON CGIs may be reached through the proxy.
const ALLOWED_RESOURCES = new Set(['statusjson.cgi', 'objectjson.cgi', 'archivejson.cgi']);

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) { return false; }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function requireProxyToken(req, res, next) {
  if (!settings.proxyToken) { return next(); }
  const provided = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (provided && safeEqual(provided, settings.proxyToken)) { return next(); }
  return res.status(401).json({ error: 'Proxy authorization required' });
}

function requireAllowedResource(req, res, next) {
  if (!ALLOWED_RESOURCES.has(req.params.resource)) {
    return res.status(404).json({ error: 'Unknown resource' });
  }
  return next();
}

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

// Enable CORS only for one explicitly configured development origin. The proxy
// serves the built app from ../dist on the same origin, so most setups need none.
if (settings.allowedOrigin) {
  app.use(cors({ origin: settings.allowedOrigin, credentials: false }));
}

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
    if (settings.insecureSkipTlsVerify === true) {
      proxyReqOpts.rejectUnauthorized = false;
    } else {
      proxyReqOpts.rejectUnauthorized = true;
      if (nagiosCaBundle) { proxyReqOpts.ca = nagiosCaBundle; }
    }
    return proxyReqOpts;
  }
};

// Add auth if it is enabled. Credentials may be supplied via environment
// variables to keep them out of the executable settings file.
if (settingsNagios && settingsNagios.auth) {
  const nagiosUsername = process.env.NAGIOS_PROXY_USERNAME || settingsNagios.username;
  const nagiosPassword = process.env.NAGIOS_PROXY_PASSWORD || settingsNagios.password;
  if (nagiosUsername && nagiosPassword) {
    proxyOptions.headers = {
      Authorization: "Basic " + Buffer.from(nagiosUsername + ':' + nagiosPassword).toString('base64')
    };
  }
}

app.get('/nagios/:resource', requireProxyToken, requireAllowedResource, proxy(proxyUrl + '/:resource', proxyOptions));

//***********************************************************************
//* End Proxy
//***********************************************************************

// Server listen on port
app.listen(settings.serverPort, bindHost);

console.log('Listening on ' + bindHost + ':' + settings.serverPort + '...');
console.log(' ');
console.log(`This server will proxy and add auth to the Nagios server at`);
console.log(`${settingsNagios.nagiosServerHost}${settingsNagios.nagiosServerCgiPath}`);
console.log(' ');
console.log(`In NagiosTV settings you can now set the Nagios cgi-bin path to:`);
console.log(`http://${bindHost}:${settings.serverPort}/nagios/`);
console.log(' ');
