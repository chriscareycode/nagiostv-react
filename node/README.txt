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