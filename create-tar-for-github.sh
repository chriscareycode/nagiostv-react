#!/bin/bash
npm run build

# remove settings that should not be in the build
rm build/client-settings.json
rm build/connectors/livestatus-settings.ini
rm build/node/settings-nagios.js

mkdir -p releases/nagiostv
rm releases/nagiostv-0.0.0.tar.gz
rm -rf releases/nagiostv/*
rsync -av --delete build/* releases/nagiostv
cd releases
tar -zcvf nagiostv-0.0.0.tar.gz nagiostv
cd ..
echo .
echo Now rename releases/nagiostv-0.0.0.tar.gz to the new version name
