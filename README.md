# NagiosTV

Compatible with Nagios Core 4 and Nagios XI

NagiosTV is a user interface (UI) for the Nagios monitoring system https://www.nagios.org

This user interface is designed to be viewed on a TV, phone, or desktop to quickly see if all your services are up or down. This is not meant to be a replacement for the entire Nagios web interface, but a way to just look at the “what's down?” part.

Some of the features:

- Multi language support - English, Spanish and French so far
- New items slide in and out of place with smooth animations which looks really cool when things are happening.
- Sorting - Ability to order items newest or oldest first
- Filters - so you can hide ACKED or SCHEDULED or UNKNOWN or FLAPPING states
- Last OK value goes from green, to yellow, to red - based on how long the item has been down

NagiosTV also has some fun addons:

- Sound effects for state changes
- Speak the state changes
- Flynn, the character from the game Doom. This is just a bit of added fun to bring some emotion to server monitoring. The more services are down, the more angry Flynn gets.
- Emoticons to show how many items up vs down, and happiness the longer you have quiet time between issues.

Technology
------------
NagiosTV is a JavaScript single page application.
The frontend is using the React JavaScript framework.

Screenshots
------------

![Display](https://chriscarey.com/software/nagiostv-react/images/nagiostv-0.3.1.png)

NagiosTV on mobile

<img src="https://chriscarey.com/software/nagiostv-react/images/nagiostv-0.3.1-iphone.jpg" alt="mobile" width="400"/>

Installing NagiosTV
-------------
- Download the latest NagiosTV tar.gz release from https://github.com/chriscareycode/nagiostv-react/releases
```console
$ wget https://github.com/chriscareycode/nagiostv-react/releases/download/v0.4.2/nagiostv-0.4.2.tar.gz
```
- Extract the NagiosTV release using tar. This will create a nagiostv/ folder.
```console
$ tar xvfz nagiostv-0.4.2.tar.gz
```
- We're going to host the NagiosTV folder from the built-in Nagios web ui. Copy/Move the nagiostv/ folder into your Nagios web ui folder. For Nagios Core 4 the Nagios web ui folder might be at `/usr/local/nagios/share/` or `/usr/nagios/share/`. Nagios XI might be at `/var/www/html`.
```console
$ sudo mv nagiostv /usr/local/nagios/share/
```
- Load the app in your web browser! If your built-in Nagios web ui is at `http://my-server/nagios/` then NagiosTV should be available at `http://my-server/nagios/nagiostv/`
- Since nagiostv/ is a subfolder in your Nagios web ui, it will share the same authentication as the built-in Nagios web ui.

Preparing the client settings file (optional)
------------
By default, settings are saved to a browser cookie. If you want to save settings on the server, so all users of NagiosTV will get those settings, you need to create a client-settings.json file and set 
permissions on that file so NagiosTV (Apache) can edit it. In the example below, I set the file permission to 777, but you could optionally just give access to the "apache" ("www-data" on Debian/ubuntu) user.

```console
$ sudo touch client-settings.json
$ sudo chmod 777 client-settings.json 
```

Then inside the application, open Settings, and read more instructions there.

Upgrading
------------
Grab the latest release from here: https://github.com/chriscareycode/nagiostv-react/releases

Then pretty much the same process as above. Download and overwrite the nagiostv folder with the new version.
Remember your web ui destination folder `/usr/local/nagios/share/nagiostv/` may vary depending on your Nagios install.
You can do it on the box with:
```console
$ wget https://github.com/chriscareycode/nagiostv-react/releases/download/v0.4.2/nagiostv-0.4.2.tar.gz
$ tar xvfz nagiostv-0.4.2.tar.gz
$ sudo cp -r nagiostv/* /usr/local/nagios/share/nagiostv/
```

AutoUpdate script
-------------
I'm now including a autoupdate script which can be used to upgrade or downgrade to any version easily. 
To update this way, go into your nagiostv/ folder and run this command for more instructions:
```
$ sh autoupdate.sh
```

Development Requirements
------------
- Git
- Node.js

Development Instructions
------------
```console
$ git clone https://github.com/chriscareycode/nagiostv-react.git
$ cd nagiostv-react
$ npm install
$ npm start
```
- access your web server on the hostname and port shown, and you can start editing files

### Mock data now included for local development
Update: As of version 0.3.2, **I have now included mock data for doing local development**. So without connecting to a real Nagios server, the UI will simulate one of each type of outage. This eliminates the need for the proxy if you just want to make some quick changes. To turn this on, set **useFakeSampleData = true** in Base.jsx

If you do not use the mock data, and want to connect to your actual server, there is some extra work. Since Nagios is running on a different server than your local development, you will need to point
to the remote server in the "Nagios cgi-bin path" setting. It will not easily
be able to access the Nagios CGIs since, by default, Nagios does not enable CORS headers on those scripts, and the Nagios cgi-bin path may also
have authentication enabled. You will need to either modify
your Apache install to add CORS headers there, or to run a simple Node.js server or Apache config that will proxy the request and add the CORS headers and auth. 
Reach out to me if you want help here, I will add instructions and sample code for this at some point.

You can also enable "Demo Mode" by changing the URL to `http://localhost:3000/?demo=true`

Development - Committing your changes to this project
------------
- Fork the project
- Create a feature branch and do your changes there
- Push your feature branch up to origin
- Submit a Pull Request

TODO
------------
- Clean up the "save settings to server" feature, and settings screen
- Fix settings screen to work on mobile (cant scroll right now)
- Add a Node.js proxy server for local development, and instructions how to use it

History
------------
The idea for NagiosTV was started around 2009. It was created to have a nice way to display Nagios status on a TV at work.
Over the years I have continued to run it at home to monitor my own network.

Originally it was written in PHP for Nagios 3 and used the ndoutils package to get status.
This ended up being a very painful install for many, requires a database, and the database size continuously grew and needed maintenance.

Later I released JavaScript versions which used MK livestatus, and another version using status-json. These seemed better since they got rid of the database requirement, but still required setup and changes that many users were not willing to jump through.

Now with Nagios 4, Nagios Core 4.0.7 and newer comes with new JSON CGI's out of the box which is a game changer for tapping into the Nagios data from a web application.

https://labs.nagios.com/2014/06/19/exploring-the-new-json-cgis-in-nagios-core-4-0-7-part-1/

No more need for ndoutils writing out to a database. No more installing 3rd party tools like status-json and MK livestatus to tap into Nagios. Those are great projects, but now we can make NagiosTV available to the most number of users, going with the built-in API. This makes the install take just a couple minutes with no dependencies!

Also this is the first version that (aside from the client-settings save feature) has no server-side component. It's all JavaScript in the browser.

Help
------------
Feel free to reach out to me for help! I'm happy to help you get this project installed and work through installation issues.

Credits
------------
NagiosTV by Chris Carey http://chriscarey.com

