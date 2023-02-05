#/bin/bash

#
# NagiosTV https://nagiostv.com
# Copyright (C) 2008-2023 Chris Carey https://chriscarey.com
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#


# sudo chown -R pi .
# sh autoupdate.sh 0.3.5
# sudo chown -R nagios .

show_permission_error () {
  # permission error we will share
  echo "It is possible you have a permissions issue."
  echo "Did you first change ownership of the folder to the logged in user?"
  echo ""
  echo "$ sudo chown -R $USER ."
  echo ""
}

# try to detect /usr/local/nagios/ owner, fall back to "nagios"
NAGIOSUSER=$(stat -c '%U' ..)
if [ ! $? -eq 0 ]; then
	NAGIOSUSER="nagios"
fi

echo "===================================================================="
echo "NagiosTV autoupdate script"
echo "This script will allow you to downgrade or upgrade to any release"
echo "on github at https://github.com/chriscareycode/nagiostv-react/releases"
echo "===================================================================="

# test if parameter was provided
if [ -z "$1" ] || [ "$1" = "help" ] || [ "$1" = "HELP" ]
  then
    echo ""
    echo "For this script to succeed, it needs permission to overwrite the nagiostv files and folders."
    echo "You will need to change the owner of the nagiostv folder to the currently logged in user with this command:"
    echo ""
    echo "$ sudo chown -R $USER ."
    echo ""
    echo "Then proceed with the autoupdate command:"
    echo ""
    echo "$ sh autoupdate.sh 0.3.6"
    echo ""
    echo "You can optionally change the folder owner back to the nagios user after:"
    echo "$ sudo chown -R $NAGIOSUSER ."
    echo "(if permissions are correct it probably does not matter)"
    echo ""
    exit 1
fi



# catch parameter of which version to update to
VERSION=$1
echo "Starting autoupdate to version $VERSION"

# create upgrade folder if it does not exist
[ -d autoupdate ] || mkdir autoupdate

# empty the autoupdate folder
[ autoupdate ] || rm -rf autoupdate/*

# download the file from github with curl
GITHUBPATH="https://github.com/chriscareycode/nagiostv-react/releases/download/v$VERSION/nagiostv-$VERSION.tar.gz"
FILENAME="nagiostv-$VERSION.tar.gz"
echo $FILE
echo "Changing into autoupdate/ folder"
cd autoupdate
echo "Downloading $GITHUBPATH"
curl -O -L --silent $GITHUBPATH > $FILENAME
# check the return code from curl
if [ ! $? -eq 0 ]; then
	echo "ERROR: Problem downloading file with curl. Aborting."
  show_permission_error
	cd ..
	exit 1
fi

#ls -la $FILENAME

# verify the file exists
if [ ! -f $FILENAME ]; then
	echo ""
    echo "ERROR: Downloaded file not found! Aborting."
    show_permission_error
    cd ..
    exit 1
fi

# untar the file
echo "Extracting archive..."
tar xfz $FILENAME
# check the return code from tar
if [ ! $? -eq 0 ]; then
	echo ""
	echo "ERROR: Problem extracting file. Aborting."
  echo "It is possible that you specified a version that does not exist."
	cd ..
	exit 1
fi

# copy the resulting files from nagiostv/autoupdate/nagiostv/* over the current version
echo "Overwriting files..."
cp -r nagiostv/* ../
# check if the copy succeeded
if [ ! $? -eq 0 ]; then
	echo ""
	echo "ERROR: Problem copying files. Aborting."
	show_permission_error
	cd ..
	exit 1
fi

# change dir from nagiostv/autoupdate/ back to nagiostv/ 
cd ..

# create client-settings if it does not exist, and set permission
if [ ! -f client-settings.json ]; then
    touch client-settings.json
fi
chmod 777 client-settings.json

# return success or failure
echo "Update to v$VERSION complete. Refresh NagiosTV in the browser."
exit 0
