# NagiosTV for Nagios 4

This is a version of NagiosTV for Nagios 4.x servers.

Nagios Core 4.0.7 and newer comes with new JSON CGI's
https://labs.nagios.com/2014/06/19/exploring-the-new-json-cgis-in-nagios-core-4-0-7-part-1/
out of the box which is a game changer for tapping into the Nagios data from a web application.
No more need for ndoutils writing out to a database. No more installing 3rd party tools like status-json and MK livestatus to tap into Nagios. Those are great projects, but now we can make NagiosTV available to the most number of users, going with the built-in API.

NagiosTV
------------
Watch one or more Nagios servers on a wall mounted TV (or your desktop)

New items slide in and out of place with animations.

Technology
------------
NagiosTV is a JavaScript single page application.
The frontend is using the React JavaScript framework.

Screenshot of NagiosTV on desktop
------------

![Display](https://chriscarey.com/software/nagiostv-4/images/nagiostv-screen.png)

Screenshot of NagiosTV on mobile
------------

<img src="https://chriscarey.com/software/nagiostv-4/images/nagiostv-iphone.png" width="300" />

Screenshot of 5 Nagios servers on one TV
------------

This can be accomplished with a simple iframe tag for each region

![Display](http://chriscarey.com/projects/ajax-monitor-for-nagios/nagios-5-in-1.png)

Installing NagiosTV
-------------
- Download NagiosTV releases from https://github.com/chriscareycode/nagiostv-react/releases
- Extract the NagiosTV release using tar. This will create a nagiostv/ folder.
  - Example: $ tar xvfz nagiostv-0.1.1.tar.gz
- We're going to host the NagiosTV folder from the built-in Nagios web ui. Copy/Move the nagiostv/ folder into your Nagios web ui folder. In my case the Nagios web ui folder is at /usr/local/nagios/share/ but your Nagios install may have this at a different location such as /usr/nagios/share/ . The Nagios web ui folder will contain statusjson.cgi so if you can find that file, you know you have the right place.
  - Example: $ mv nagiostv /usr/local/nagios/share/
- Once you have copied the folder, you should chown the files to change the owner of the nagiostv folder so it's not owned by root.
  - Example: $ chown -R nagios:nagios /usr/local/nagios/share/nagiostv
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

Credits
------------
NagiosTV by Chris Carey http://chriscarey.com

Your name here if you want to contribute



