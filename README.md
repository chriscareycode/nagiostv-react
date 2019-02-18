# NagiosTV for Nagios 4

NagiosTV is an alternate user interface (UI) for the Nagios open source monitoring system. This is a version of NagiosTV for Nagios 4.x.

This user interface is designed to be viewed on a TV or on your desktop to quickly see if all your services are up or down. This is not meant to be a replacement for the entire Nagios web interface, but an alternate way to look at the “what’s down?” part.

New items slide in and out of place with smooth animations.

NagiosTV also has some goofy addons:

Flynn, the character from the game Doom. This is just a bit of added fun to bring some emotion to server monitoring. The more services are down, the more angry Flynn gets.

Emoticons to show how many items up vs down, and happiness the longer you have quiet time between issues.

Technology
------------
NagiosTV is a JavaScript single page application.
The frontend is using the React JavaScript framework.

Screenshot of NagiosTV on desktop
------------
Default Mode
![Display](https://chriscarey.com/software/nagiostv-react/images/nagiostv-react-noemoji-0.3.0.png)

Emoji and Flynn Enabled
![Display](https://chriscarey.com/software/nagiostv-react/images/nagiostv-react-0.3.0.png)

NagiosTV on mobile
<img src="https://chriscarey.com/software/nagiostv-react/images/nagiostv-react-mobile-0.3.0.png" alt="mobile" width="400"/>

Installing NagiosTV
-------------
- Download the latest NagiosTV tar.gz release from https://github.com/chriscareycode/nagiostv-react/releases
- Extract the NagiosTV release using tar. This will create a nagiostv/ folder.
  - Example: $ tar xvfz nagiostv-0.3.0.tar.gz
- We're going to host the NagiosTV folder from the built-in Nagios web ui. Copy/Move the nagiostv/ folder into your Nagios web ui folder. In my case the Nagios web ui folder is at /usr/local/nagios/share/ but your Nagios install may have this at a different location such as /usr/nagios/share/
  - Example: $ mv nagiostv /usr/local/nagios/share/
- Load the app in your web browser! If your built-in Nagios web ui is at http://my-server/nagios/ then NagiosTV should be available at http://my-server/nagios/nagiostv/
  - Since nagiostv/ is a subfolder in your Nagios web ui, it will share the same authentication as the built-in Nagios web ui.

Upgrading
------------
Pretty much the same process as above. Download and overwrite the nagiostv folder with the new version.
- Example: $ tar xvfz nagiostv-0.3.0.tar.gz
- Example: $ cp nagiostv/* /usr/local/nagios/share/nagiostv/

Development Requirements
------------
- Git
- Node.js

Development Instructions
------------
- $ git clone https://github.com/chriscareycode/nagiostv-react.git
- $ cd nagiostv-react
- $ npm install
- $ npm start
- access your web server on the hostname and port shown, and you can start editing files

One thing to note for local development. Since Nagios is running on a different server than your local development, you will need to point
to the remote server in the "Nagios cgi-bin path" setting. It will not easily
be able to access the Nagios CGIs since, by default, Nagios does not enable CORS headers on those scripts. You will need to either modify
your Apache install to add CORS headers there, or to run a simple Node.js server that will proxy the request and add the CORS headers. 
Reach out to me if you want help here, I will add instructions and sample code for this at some point.

Development - Committing your changes to this project
------------
- Fork the project
- Create a feature branch and do your changes there
- Push your feature branch up to origin
- Submit a Pull Request

TODO
------------
- Clean up the "save settings to server" feature, and settings screen
- Show longest quiet period

History
------------
Nagios Core 4.0.7 and newer comes with new JSON CGI's
https://labs.nagios.com/2014/06/19/exploring-the-new-json-cgis-in-nagios-core-4-0-7-part-1/
out of the box which is a game changer for tapping into the Nagios data from a web application.
No more need for ndoutils writing out to a database. No more installing 3rd party tools like status-json and MK livestatus to tap into Nagios. Those are great projects, but now we can make NagiosTV available to the most number of users, going with the built-in API.

Help
------------
Feel free to reach out to me for help! I'm happy to help you get this project installed and work through installation issues.

Credits
------------
NagiosTV by Chris Carey http://chriscarey.com

Your name here if you want to contribute



