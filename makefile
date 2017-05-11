dist: dist/julie.js dist/julie.css

dist/julie.js:
	rollup -f iife export.js > dist/julie.js

dist/julie.css: src/style.less
	lessc src/style.less > dist/julie.css

fmt:
	js-beautify -rtn *.js
