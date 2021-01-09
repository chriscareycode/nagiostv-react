# NagiosTV

![Display](https://nagiostv.com/images/nagiostv-0.6.8a.png)

Compatible with Nagios Core 4, Nagios XI, and MK Livestatus

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
- Doom Guy (Flynn), the character from the game Doom. This is just a bit of added fun to bring some emotion to server monitoring. The more services are down, the more angry Flynn gets.
- Emoticons to show how many items up vs down, and happiness the longer you have quiet time between issues.

Technology
------------
NagiosTV is a JavaScript single page application.
The frontend is using the React JavaScript framework.

Installing NagiosTV
-------------
- Download the latest NagiosTV tar.gz release from https://github.com/chriscareycode/nagiostv-react/releases or you can just copy and paste the command below to get it:
```console
$ wget https://github.com/chriscareycode/nagiostv-react/releases/download/v0.6.8/nagiostv-0.6.8.tar.gz
```
- Extract the NagiosTV release using tar. This will create a nagiostv/ folder.
```console
$ tar xvfz nagiostv-0.6.8.tar.gz
```
- We're going to host the NagiosTV folder from the built-in Nagios web ui. Copy/Move the nagiostv/ folder into your Nagios web ui folder. For Nagios Core 4 the Nagios web ui folder might be at `/usr/local/nagios/share/` or `/usr/nagios/share/`. Nagios XI might be at `/var/www/html`.
```console
$ sudo mv nagiostv /usr/local/nagios/share/
```
- Load the app in your web browser! If your built-in Nagios web ui is at `http://my-server/nagios/` then NagiosTV should be available at `http://my-server/nagios/nagiostv/`
- Since nagiostv/ is a subfolder in your Nagios web ui, it will share the same authentication as the built-in Nagios web ui.

Preparing the client settings file (optional)
------------
By default, settings are saved to a browser cookie. If you want to save settings on the server, so all users of NagiosTV will get those settings, you need to create a client-settings.json file. We do not include this file in the NagiosTV release so it will not be overwritten when you upgrade. NagiosTV will read this client-settings file when the app loads. If you want the NagiosTV web interface to be able to save to this server configuration file for you, you will also want to set permissions on that file. In the example below, I show the two options below, first chown and second with chmod. Change the www-data to your own apache user, which is often different depending on white Linux distro you are running:

```console
$ sudo touch client-settings.json
$ sudo chown www-data:www-data client-settings.json 
```
or
```console
$ sudo touch client-settings.json
$ sudo chmod 777 client-settings.json 
```

Upgrading Automatically
------------
As of version v0.6.0 there is now an update routine included that you can run from within NagiosTV. *We call this automatic, but it does not update on it's own*. We have a page within the NagiosTV UI that provides you with upgrade (and downgrade) with a click of the button. The script performs these actions:

* download the release
* unarchive the release into temp/ folder
* copying the release over the old NagiosTV

Find the update page at the bottom of the Settings page, or by clicking any update notification in the bottom bar. More instructions are displayed on the update page.

Preparing NagiosTV for automatic update
------------
For automatic upgrade to work, your NagiosTV folder needs to be owned by the apache user. The apache user is different on many different Linux distributions, so You could use `ps` or `ps -aux | grep apache` to find that username. In the example below, change `www-data` to your apache user, and change `usr/local/nagios/share/nagiostv` to be the path to your NagiosTV folder you just installed. 

```console
$ sudo chown www-data:www-data /usr/local/nagios/share/nagiostv
```
Then inside the application, open Settings and find the Update NagiosTV button, or click the update notification NagiosTV version in the bottom bar, and read more instructions there.

Upgrading Manually
------------
Grab the latest release from here: https://github.com/chriscareycode/nagiostv-react/releases

Then pretty much the same process as above. Download and overwrite the nagiostv folder with the new version.
Remember your web ui destination folder `/usr/local/nagios/share/nagiostv/` may vary depending on your Nagios install.
You can do it on the box with:
```console
$ wget https://github.com/chriscareycode/nagiostv-react/releases/download/v0.6.8/nagiostv-0.6.8.tar.gz
$ tar xvfz nagiostv-0.6.8.tar.gz
$ sudo cp -r nagiostv/* /usr/local/nagios/share/nagiostv/
```

Update CLI script
-------------
This command line autoupdate script can be used to upgrade or downgrade to any version easily. 
This has been superceded by the AutoUpdate within the NagiosTV UI. (see above)
To update this way, go into your nagiostv/ folder and run this command for more instructions:
```
$ sh autoupdate.sh
```

History
------------
NagiosTV was started around 2009. Originally it was called ajax-monitor-for-nagios. Over the years I have continued to run it at home to monitor my own network.

Originally it was written in PHP for Nagios 3 and used the ndoutils package to get status. ndoutils would write the statuses into a MySQL database, and the UI would read the statuses from the database.
This ended up being a very painful install for many, requires a database server, and the database size continuously grew and needed maintenance and trimming.

Later I released JavaScript versions which used MK livestatus, and another version using status-json. These seemed better since they got rid of the database requirement, but still required setup and changes that many users were not willing to jump through.

Now with Nagios 4, Nagios Core 4.0.7 and newer comes with new JSON CGI's out of the box which is a game changer for tapping into the Nagios data from a web application.

https://labs.nagios.com/2014/06/19/exploring-the-new-json-cgis-in-nagios-core-4-0-7-part-1/

No more need for ndoutils writing out to a database. No more requiring 3rd party tools like status-json and MK livestatus* to tap into Nagios. Those are great projects, but now we can make NagiosTV available to the most number of users, going with the built-in API. This makes the install take just a couple minutes with no dependencies!

* Though Nagios CGI is the default option, MK Livestatus support has now been added to this project as of version 0.6.5

Also this is the first version that (aside from the client-settings save and autoupdate feature) has no server-side component. It's all JavaScript in the browser.

Help
------------
Try out the discussions area https://github.com/chriscareycode/nagiostv-react/discussions

Development
-------------
Check out README-development.md for instructions to build and run in development mode

Credits
------------
NagiosTV https://nagiostv.com
Copyright (C) 2008-2021 Chris Carey https://chriscarey.com

