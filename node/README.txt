This is an example Node.js proxy that can be used for local development.
If you are just running the NagiosTV application and not doing local development, this is not neccesary.

Requirements:

Node.js

Initial setup

$ npm install
$ cp settings.dist.js settings.js
$ cp settings-nagios.dist.js settings-nagios.js

(Edit settings-nagios.js with your Nagios server settings. TLS certificates are
validated by default; if your Nagios server uses a self-signed certificate, set
nagiosServerAllowSelfSigned to true in settings-nagios.js. If you host the web
UI somewhere other than this server, list its origin in allowedOrigins in
settings.js.)

Running the server:

$ node app.js

Then open up NagiosTV and change the Nagios cgi-bin path to the configuration it gives you.

Upgrading from earlier versions
-----------------------------
If you already have settings.js and/or settings-nagios.js from an earlier
version, note these security changes:

1. TLS certificates are now validated when proxying to your Nagios server.
   If your Nagios server uses a self-signed or otherwise invalid HTTPS
   certificate, add this to settings-nagios.js or the proxy will refuse to
   connect:

     "nagiosServerAllowSelfSigned": true

2. Cross-origin requests are no longer allowed from any website. If you serve
   the NagiosTV web UI from this same server, no change is needed. If you host
   the web UI on a different origin, add this to settings.js or the browser
   requests will be blocked:

     allowedOrigins: ['http://your-dashboard-origin:port']