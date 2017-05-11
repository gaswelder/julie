# Julie

Javascript user interface library.

A collection of old-style (pre-React) widgets. Intended use is via ES6 imports.
For cases where compiling is more inconvenient than including the whole library,
there is the compiled version in blob/julie.js.

Example:

```js
import Gallery from "julie/gallery.js";

$(document).ready(function() {
	var g = new Gallery($('#pics').get(0));
});
```

Unlike the jQuery plugin approach, Julie provides widgets as standalone objects
which have their own functions.


## Available widgets

High-level widgets:

* [Gallery](gallery.md)
* [Autocomplete](autocomplete.md)
* [Tabs](tabs.md)

There are more primitive objects that are used to build the widgets and may be
useful by themselves:

* [H-drum](hdrum.md)
* [H-ring](hring.md)
* [H-scroll](hscroll.md)
