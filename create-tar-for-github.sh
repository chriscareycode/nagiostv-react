rm releases/nagiostv-0.0.0.tar.gz
mkdir releases/nagiostv
rsync -av --delete build/* releases/nagiostv
cd releases
tar -zcvf nagiostv-0.0.0.tar.gz nagiostv
cd ..
echo .
echo Now rename releases/nagiostv-0.0.0.tar.gz to the new version name
