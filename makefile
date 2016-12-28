all: fmt blob/julie

fmt:
	js-beautify -rtn *.js

blob/julie:
	rollup -f iife export.js > blob/julie.js
