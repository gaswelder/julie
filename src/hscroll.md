# HScroll

	var scroll = new HScroll(container);

H-scroll puts its elements into a horizontal line which can be scrolled
left and right inside its container. This is much like a 'div' element
with `overflow-x: scroll` style, just a different implementation and
API.


## Functions

* `scroll.setPos(newPos);`

	Sets current position to `newPos` in pixels.

* `pos = scroll.getPos();`

	Returns current position in pixels.

* `scroll.on(eventType, func);`

	Adds `func` as a listener for `eventType` events.


## Events

* `dragend`

	The user has stopped dragging the scroll.
