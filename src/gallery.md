# Gallery

	var gallery = new Gallery(container, params);

Gallery is built upon h-drum.

## Params

* `gravity` (`"left"` or `"center"`, default `"left"`)

	how to position the focused item.

* `leftRight` (boolean, default `false`)

	if set to `true`, the "left" and "right" buttons will be added to
	the widget.

* `autoChangePeriod` (integer, default is `undefined`)

	autochange period in milliseconds. If undefined, autochange will be
	disabled. The autochange will pause on mouse hover and cancel
	completely after any manual interaction with the widget.


## Classes

* `ju`, `gallery`

	root container of the gallery

* `left-right`

	container for "left" and "right" buttons

* `btn`, `left`

	"left" button

* `btn`, `right`

	"right" button
