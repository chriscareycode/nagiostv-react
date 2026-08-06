/*****
 * Configurable Settings for the Node.js server
 *****/

module.exports = {

  serverPort: 4000,
  debug: false,

  // Network interface to bind to. Defaults to loopback ('127.0.0.1') so the
  // proxy is not reachable from the network. Only change this if you understand
  // the exposure, and set proxyToken below when you do.
  bindHost: '127.0.0.1',

  // Shared token required from clients (sent as an Authorization header).
  // Leave empty for loopback-only development. Required to start on a
  // non-loopback bindHost.
  proxyToken: '',

  // Exact browser origin allowed to make cross-origin requests, for example
  // 'http://localhost:3015'. Leave empty to disable CORS (same-origin only).
  allowedOrigin: '',

  // Path to a PEM CA bundle when the Nagios server uses an internal CA.
  nagiosCaBundlePath: '',

  // Set true ONLY to disable upstream TLS certificate verification. This is
  // insecure and exposes credentials to man-in-the-middle attacks.
  insecureSkipTlsVerify: false

};
