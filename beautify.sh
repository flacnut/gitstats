#!/bin/sh

green=`tput setaf 2`
red=`tput setaf 1`
reset=`tput sgr0`

JSBEAUTIFY=./node_modules/js-beautify/js/bin/js-beautify.js

# Install locally - global modifications make linux desktop users sad

if !(which js-beautify) then
  npm install js-beautify
fi

find  web/app/ -type f -name "*.js" | xargs $JSBEAUTIFY -q --config $PWD/jsbeautifyconfig.js -r
find  web/test/ -type f -name "*.js" | xargs $JSBEAUTIFY -q --config $PWD/jsbeautifyconfig.js -r
