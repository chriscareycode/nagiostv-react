rm releases/nagiostv-1.0.0.tar.gz
rsync -av --delete build releases/nagiostv
cd releases
tar -zcvf nagiostv-1.0.0.tar.gz nagiostv
cd ..
echo .
echo Now rename releases/nagiostv-1.0.0.tar.gz to the new version name
