# Layer

## Usage

	var layer = new Layers(content, coords);

The `content` argument is an HTML string or a DOM element that will be 
placed on the layer. The optional `coords` argument is an array `[x, 
y]` with the coordinates of the layer.

Every layer can be "dragged" on screen. At most one layer at a time has
the "focus".


## Functions

* `layer.remove()`

	Removes the layer and its contents from the document.

* `layer.focus()`

	Gives the focus to the layer.

* `layer.blur()`

	Makes the layer lose the focus.

* `layer.hasFocus()`

	Returns `true` if the layer currently has the focus, or `false`
	otherwise.

* `layer.on(eventType, callback)`

	Adds `callback` to listeners of event `eventType`.


## Events

* `blur` - the layer has lost focus
* `focus` - the layer obtained focus


## CSS classes

* `w-layer` - a layer's root element
* `focus` - a layer with the focus
* `dragging` - a layer that is being dragged.
