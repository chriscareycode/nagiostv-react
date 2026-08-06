This is an example Node.js proxy that can be used for local development.
If you are just running the NagiosTV application and not doing local development, this is not neccesary.

Requirements:

Node.js

Initial setup

$ npm install
$ cp settings.dist.js settings.js
$ cp settings-nagios.dist.js settings-nagios.js

(Edit settings-nagios.js with your Nagios server settings)

Running the server:

$ node app.js

Then open up NagiosTV and change the Nagios cgi-bin path to the configuration it gives you.

Security notes:

- By default the proxy binds to loopback (127.0.0.1) only and is not reachable
  from the network. To expose it on another interface, set bindHost in
  settings.js AND set proxyToken; the server refuses to start on a non-loopback
  interface without a token. Clients must then send the token in an
  Authorization header.
- CORS is disabled by default. Set allowedOrigin in settings.js to the exact
  browser origin if cross-origin access is required.
- Only the read-only Nagios JSON CGIs (statusjson.cgi, objectjson.cgi,
  archivejson.cgi) can be reached through the proxy.
- Upstream TLS certificates are verified by default. If Nagios uses an internal
  CA, set nagiosCaBundlePath. Do not enable insecureSkipTlsVerify except for
  throwaway local testing.
- settings.js and settings-nagios.js hold credentials. Keep them readable only
  by the account running the proxy, for example: chmod 600 settings-nagios.js
  Alternatively, keep the Nagios credentials out of the file entirely by setting
  the NAGIOS_PROXY_USERNAME and NAGIOS_PROXY_PASSWORD environment variables.