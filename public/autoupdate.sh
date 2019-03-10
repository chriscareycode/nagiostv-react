#/bin/bash

# test if parameter was provided
if [ -z "$1" ]
  then
    echo "No version provided"
    echo "Use like this:"
    echo "$ sh autoupdate.sh 0.3.5"
    exit 1
fi

# catch parameter of which version to update to
VERSION=$1
echo "Will upgrade to version $VERSION"

# create upgrade folder if it does not exist
[ -d autoupdate ] || mkdir autoupdate

# empty the autoupdate folder
[ autoupdate ] || rm -rf autoupdate/*

# download the file from github with curl
GITHUBPATH="https://github.com/chriscareycode/nagiostv-react/releases/download/v$VERSION/nagiostv-$VERSION.tar.gz"
FILENAME="nagiostv-$VERSION.tar.gz"
echo "Downloading $GITHUBPATH"
echo $FILE
cd autoupdate
curl -O -L $GITHUBPATH > $FILENAME
ls -la .

# verify the file exists
if [ ! -f $FILENAME ]; then
    echo "File not found!"
    cd ..
    exit 1
fi

# untar the file
tar xvfz $FILENAME

# copy the resulting files over the current version
cp -r nagiostv/* ../../

# finish up
cd ..

# return success or failure
exit 0
