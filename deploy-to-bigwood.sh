#!/bin/bash
npm run build
rsync -av build/* root@bigwood:/usr/local/nagios/share/nagiostv/
