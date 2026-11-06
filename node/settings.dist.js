/*****
 * Configurable Settings for the Node.js server
 *****/

module.exports = {

  serverPort: 4000,
  debug: false,

  // Cross-origin requests are disabled by default because the web UI is
  // served by this same server. If you host the NagiosTV web UI somewhere
  // else and it needs to talk to this proxy, list its origin(s) here,
  // for example: ['http://dashboard.example.lan:8080']
  allowedOrigins: []

};
