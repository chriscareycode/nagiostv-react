# NagiosTV for Nagios 4 (React edition)

NagiosTV is an alternate user interface (UI) for the Nagios open source monitoring system. This is a version of NagiosTV for Nagios 4.x servers.

This user interface is designed to be viewed on a TV or on your desktop to quickly see if all your services are up or down. This is not meant to be a replacement for the entire Nagios web interface, but an alternate way to look at the “what’s down?” part.

New items slide in and out of place with smooth animations.

This version adds Flynn, the character from the game Doom. This is just a bit of added fun to bring some emotion to server monitoring. The more services are down, the more angry Flynn gets.

Technology
------------
NagiosTV is a JavaScript single page application.
The frontend is using the React JavaScript framework.

Screenshot of NagiosTV on desktop
------------

![Display](https://chriscarey.com/software/nagiostv-react/images/nagiostv-react.png)

Installing NagiosTV
-------------
- Download the latest NagiosTV tar.gz release from https://github.com/chriscareycode/nagiostv-react/releases
- Extract the NagiosTV release using tar. This will create a nagiostv/ folder.
  - Example: $ tar xvfz nagiostv-0.2.0.tar.gz
- We're going to host the NagiosTV folder from the built-in Nagios web ui. Copy/Move the nagiostv/ folder into your Nagios web ui folder. In my case the Nagios web ui folder is at /usr/local/nagios/share/ but your Nagios install may have this at a different location such as /usr/nagios/share/
  - Example: $ mv nagiostv /usr/local/nagios/share/
- Load the app in your web browser! If your built-in Nagios web ui is at http://my-server/nagios/ then NagiosTV should be available at http://my-server/nagios/nagiostv/
  - Since nagiostv/ is a subfolder in your Nagios web ui, it will share the same authentication as the built-in Nagios web ui.

Upgrading
------------
Pretty much the same process as above. Download and overwrite the nagiostv folder with the new version.

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

Committing to this project
------------
- Fork the project
- Create a feature branch and do your changes there
- Push your feature branch up to origin
- Submit a Pull Request

History
------------
Nagios Core 4.0.7 and newer comes with new JSON CGI's
https://labs.nagios.com/2014/06/19/exploring-the-new-json-cgis-in-nagios-core-4-0-7-part-1/
out of the box which is a game changer for tapping into the Nagios data from a web application.
No more need for ndoutils writing out to a database. No more installing 3rd party tools like status-json and MK livestatus to tap into Nagios. Those are great projects, but now we can make NagiosTV available to the most number of users, going with the built-in API.

Credits
------------
NagiosTV by Chris Carey http://chriscarey.com

Your name here if you want to contribute



