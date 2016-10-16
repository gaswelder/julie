# HDrum

	var drum = new HDrum(container, params);

H-drum is an h-ring which always has an "aligned" or "current" element.
Whenever the drum is released after scrolling, the current element is
designated from the ones that are visible, and the the drum's position
is adjusted to align the current element correctly.

The position of an h-drum is calculated not by pixels, as with h-ring,
but by integer numbers which are mapped to the element indices.

The `container` argument is a document node which will be transformed
into the widget. The container's child elements will be absolutely
positioned inside the container.

## Params

* `gravity` (`"left"` or `"center"`)

	how to position the aligned element. The default is `"left"`.


## Class names

* `ju`, `h-drum`

	widget's root node.

* `current`

	currently aligned element.


## Functions

* `drum.setPos(i)`

	Moves the drum to the position `i`. The element to which `i` maps
	will become "aligned".


* `i = drum.getPos()`

	Returns current position index.
