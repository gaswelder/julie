all: blob/julie fmt

fmt:
	js-beautify -rtn *.js

blob/julie:
	rollup -f iife export.js > blob/julie.js
