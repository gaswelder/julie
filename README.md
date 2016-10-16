# Julie

Javascript user interface library.

UI controls implemented as standalone objects providing functions and
events directly rather than through invocations glued to a jQuery
context.

With introduction of modules and its support in existing translators,
it has become convenient and efficient to write UI controls as
libraries. It is possible now to organize the code more cleanly as
there is no need to worry about packing it all in a single file. A
library may be extensive, but the resulting compilation will contain
only the bits that are needed.

Julie provides many stand-alone objects. Some of them depend on each
other, but that doesn't concern the user: they can import just the
needed object, and the translator-compiler will organize everything:

	import Gallery from "julie/gallery.js"

	$(document).ready(function() {
		var g = new Gallery($('#pics').get(0));
	});

I use rollup to build the scripts using Julie. There are other more
popular compilers supporting ECMAScript modules. For those who don't
want to use that approach, there is the compiled version in
blob/julie.js.

Most of the code relies on jQuery internally as the de-facto standard
for DOM manipulation, but the API in Julie is only in terms of native
objects.



tabstop, arrow keys

onfirstdisplay event for elements


* No CSS "namespaces".

	There is no such thing, really. A name "foo-something" is not a name
	in the "foo" namespace, it's just a name. Julie assigns the "ju"
	class to all its containers, though, and that root class shoud be
	used to limit styles to the widgets.
