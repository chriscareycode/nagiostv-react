# NagiosTV

Homepage at [NagiosTV.com](https://nagiostv.com)

![Display](https://nagiostv.com/images/nagiostv-0.9.9-beta.png)

NagiosTV is a user interface add-on for the Nagios monitoring system https://www.nagios.org

Compatible with Nagios Core 4, Nagios XI, and MK Livestatus.

Bubble up the most important stuff to the top. Focus only on the work that needs to be done.

Large bold fonts and bright colors - so it's easily read from across the room.

A great conversation piece during an outage.

Originally designed to be viewed on a wall mounted TV, but also looks great on your phone or desktop monitor.

This is not meant to be a replacement for the entire Nagios web interface, but a way to just look at the “what's down?” part.

Some of the features:

- New items slide in and out of place with smooth animations.
- Sorting - Ability to order items newest or oldest first.
- Filters - so you can hide WARNING, CRITICAL, UNREACHABLE, UNKNOWN, PENDING, ACKED, SCHEDULED, FLAPPING, or NOTIFICATIONS DISABLED states.
- Multi language support - English, Spanish and French.
- One-click update to latest version within the app.

NagiosTV also has some fun addons:

- Sound effects for state changes
- Speak the state changes
- Doom Guy (Doomguy), the character from the game Doom. This is just a bit of added fun to bring some emotion to server monitoring. The more services are down, the more angry Doomguy gets.

Technology
------------
NagiosTV is a JavaScript single page application.
- The frontend is using the React JavaScript framework
- Vite build system
- jotai for state management
- motion.dev for item animations
- motion.dev for the page transitions
- highcharts for the graphs

Installing NagiosTV
-------------
- Download the latest NagiosTV tar.gz release from https://github.com/chriscareycode/nagiostv-react/releases or you can just copy and paste the command below to get it:
```console
wget https://github.com/chriscareycode/nagiostv-react/releases/download/v0.9.11/nagiostv-0.9.11.tar.gz
```
- Extract the NagiosTV release using tar. This will create a nagiostv/ folder.
```console
tar xvfz nagiostv-0.9.11.tar.gz
```
- We're going to host the NagiosTV folder from the built-in Nagios web ui. Copy/Move the nagiostv/ folder into your Nagios web ui folder. For Nagios Core 4 the Nagios web ui folder might be at `/usr/local/nagios/share/` or `/usr/nagios/share/`. Nagios XI might be at `/var/www/html/` or `/usr/local/nagiosxi/html/`.

Below is an example command to move NagiosTV into place, but you need to change /usr/local/nagios/share/ to the correct path for your Nagios install:
```console
sudo mv nagiostv /usr/local/nagios/share/
```

Install is all done!

- Load the app in your web browser! If your built-in Nagios web ui is at `http://my-server/nagios/` then NagiosTV should be available at `http://my-server/nagios/nagiostv/`
- Since nagiostv/ is located in a subfolder under your Nagios web ui, it will share the same authentication as the built-in Nagios web ui.


Preparing the client settings file (optional)
------------
By default, settings are saved to browser localStorage. To provide shared defaults, create `client-settings.json` as an administrator. Do not put passwords, API keys, or other secrets in this public file. For manual management, the web server should be able to read the file but must not be able to write it. Change `www-data` to the read-only web-server group used by your system:

```console
sudo install -o root -g www-data -m 640 /path/to/prepared-client-settings.json client-settings.json
```

Secure browser administration
------------
Browser-based settings saves and release updates are available when explicitly configured by an administrator. They require:

- HTTPS;
- a randomly generated `NAGIOSTV_ADMIN_TOKEN` of at least 32 characters configured in PHP/Apache;
- a same-origin browser session and the CSRF token issued by the PHP endpoint;
- write access for the PHP user to the NagiosTV directory.

The administrator token is entered when performing an operation and is never persisted by NagiosTV. For a reverse proxy, set `NAGIOSTV_TRUST_PROXY=true` only when clients cannot connect directly to PHP. Plain HTTP administration can be enabled with `NAGIOSTV_ALLOW_INSECURE_ADMIN=true`, but this is unsafe and intended only for isolated development systems.

The updater accepts only strict release versions, downloads from the fixed NagiosTV GitHub repository with TLS verification, rejects unsafe archive entries, and installs files without passing request data to a shell. Each downloaded release archive must also pass detached Ed25519 signature verification against the publisher key pinned in `nagiostv-release-ed25519.pub` before installation, and a failed install is rolled back to the previous files. Hardened administrative PHP files and the pinned signing key are intentionally protected from browser update and rollback replacement; update those files through the manual release process. Manual updates remain the recommended fallback.

Until a real signing key is installed in `nagiostv-release-ed25519.pub`, browser updates fail closed. Generate a key pair once, keep the secret key offline, and paste only the public value into that file:

```console
php -r '$k=sodium_crypto_sign_keypair();
  echo "secret ".base64_encode(sodium_crypto_sign_secretkey($k))."\n";
  echo "public ".base64_encode(sodium_crypto_sign_publickey($k))."\n";'
```

For each release, publish `nagiostv-<version>.tar.gz.sig` (base64 of a detached Ed25519 signature over the tarball) next to the release archive:

```console
php -r '$s=base64_decode(trim(file_get_contents($argv[2])));
  echo base64_encode(sodium_crypto_sign_detached(file_get_contents($argv[1]),$s));' \
  nagiostv-<version>.tar.gz secret.key > nagiostv-<version>.tar.gz.sig
```

Production HTTPS and security headers
------------
Serve NagiosTV over HTTPS and send security response headers from your web server. Reference configurations are in the `deploy/` folder:

- `deploy/apache-nagiostv.conf` — Apache VirtualHost with HTTP-to-HTTPS redirect, HSTS, and a `Content-Security-Policy` plus `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options` for the NagiosTV subfolder.
- `deploy/nagiostv.htaccess` — the same security headers as a `.htaccess` for the common subfolder install when you cannot edit the main Apache config.
- `deploy/nginx-nagiostv.conf` — an nginx equivalent.

These are starting points, not drop-ins. Review every value and adapt the paths, hostname, and TLS certificate lines to your environment. The default `connect-src 'self'` assumes the Nagios API, PHP endpoints, and any LLM endpoint are same-origin; if you point NagiosTV at a remote Nagios or an external LLM endpoint, add those exact origins to `connect-src`. Enable HSTS only after HTTPS is consistently deployed.

Upgrading Manually
------------
Grab the latest release from here: https://github.com/chriscareycode/nagiostv-react/releases

Then pretty much the same process as above. Download and overwrite the nagiostv folder with the new version.
Remember your web ui destination folder `/usr/local/nagios/share/nagiostv/` may vary depending on your Nagios install.
You can do it on the box with:
```console
wget https://github.com/chriscareycode/nagiostv-react/releases/download/v0.9.11/nagiostv-0.9.11.tar.gz
tar xvfz nagiostv-0.9.11.tar.gz
sudo cp -r nagiostv/* /usr/local/nagios/share/nagiostv/
```

Update CLI script
-------------
The legacy command-line updater remains available for local administrators, but manual updates with verified release artifacts are recommended.
To update this way, go into your nagiostv/ folder and run this command for more instructions:
```
sh autoupdate.sh
```

FAQ - Bypassing Authentication
-------------
This is probably the most common question I get - "How do I disable or bypass authentication?"

There are some circumstances where you may want to bypass authentication. For example, if you are running the display on a Television that would be difficult to deal with the login prompt. It is worth noting here that removing authentication for NagiosTV can decrease the security of your NagiosTV installation. If you do this, make sure your server is private and not reachable from the public Internet without authentication.

I have done a writeup on how to bypass authentication over on the NagiosTV.com website: https://nagiostv.com/bypassing-authentication


History
------------
This project is the latest in many rewrites of NagiosTV over the years using different tech stacks. This version uses React, and TypeScript, and connecting to Nagios with the Nagios CGI APIs. Later, MK Livestatus API connector was added as an alternative to the Nagios CGIs APIs.

NagiosTV was started around 2008. Originally it was called ajax-monitor-for-nagios. Over the years I have continued to run it at home to monitor my own network.

Originally it was written in PHP for Nagios 3 and used the ndoutils package to get status. ndoutils would write the statuses into a MySQL database, and the UI would read the statuses from the database.
This ended up being a very painful install for many, requires a database server, and the database size continuously grew and needed maintenance and trimming.

Later I released vanilla JavaScript and Ember.js versions which used "MK livestatus", and experimented with another another version using "status-json". These seemed a lot better since they got rid of the database requirement, but still required installation that many users were not willing or able to do.

In 2014 with the release of Nagios Core 4.0.7, we got [new JSON CGI's built-in](https://labs.nagios.com/2014/06/19/exploring-the-new-json-cgis-in-nagios-core-4-0-7-part-1/). This allows NagiosTV (and other third-party apps) to read status data from Nagios with no external dependencies. 

In 2018, with the increased popularity of the React JavaScript ecosystem, I started this new project to replace the previous version written in Ember.js.

Development
-------------
Check out README-development.md for instructions to build and run in development mode

Created by
------------
NagiosTV by Chris Carey https://nagiostv.com
Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
