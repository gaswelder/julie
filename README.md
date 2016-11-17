# Julie

Javascript user interface library.

With introduction of modules to ECMAScript and its support in
translators, it has become convenient to write libraries. There is no
need to worry about packing it all in a single file anymore. A library
may be extensive, but the resulting compilation will contain only the
bits that are needed by the application. Some of them depend on each
other, but that doesn't concern the user: they can import just the
needed object, and the translator will organize everything:

```js
import Gallery from "julie/gallery.js";

$(document).ready(function() {
	var g = new Gallery($('#pics').get(0));
});
```

Unlike the popular jQuery plugin approach, Julie provides many widgets
as standalone objects which have their own functions.


## Importing

I use [rollup](https://github.com/rollup/rollup) to build the scripts
that use Julie. There are other popular compilers supporting ECMAScript
modules.

For those who don't want to use that approach, there is the compiled
version in blob/julie.js.


## Dependencies

Most of the code relies on jQuery internally, but the API is kept clean
to make it possible to rewrite everything in plain JavaScript. As newer
browsers taker their user share, it becomes easier and more rewarding
to gradually phase jQuery out.


## Available widgets

The high-level widgets include:

* [Gallery](gallery.md)
* [Autocomplete](autocomplete.md)

There are more primitive objects that are used to build the widgets
and may be useful by themselves:

* [H-drum](hdrum.md)
* [H-ring](hring.md)
* [H-scroll](hscroll.md)
