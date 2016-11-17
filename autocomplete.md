# Input suggestions element

Supplements a text input with an automatic drop-down list
of suggestions.

## Usage

```js
import autocomplete from "julie/autocomplete.js";

var input = document.getElementById('myinput');
autocomplete(input, requestSuggestions, onAccept);
```

`requestSuggestions` is a function in form:

	function(term, callback)

This function will be called as the user types characters in the
input. The `term` argument is the current value of the input, and the
`callback` argument is a function that has to be called to update the suggestions list. The `callback` function has form:

	function(valuesList, contextsList)

The `valuesList` argument is a list of suggested strings corresponding
to the given `term` value. The `contextList` argument is optional and
may be set to a list of arbitrary values corresponding to the suggested
strings. When a suggestion is accepted, the corresponding context is
passed to the application along with the accepted string.

`onAccept` is a function in form:

	function(value, context)

The function is called when a suggestion is accepted by the user and
entered into the input. The `value` is the resulting value of the
input, and `context` is the corresponding context data for that value,
as was given by the suggestions function.


## CSS classes

* `autocomplete`

	The absolutely positioned list container (a DIV element).

* `selected`

	The item of the list that has been selected by arrow keys or mouse
	pointing. This should be styled instead of ":hover" pseudo-class
	since it unifies mouse and keyboard selection.


## Example

```js
var input = document.getElementById("myinput");
autocomplete(input,
	/*
	 * Suggestions function
	 */
	function(term, callback) {
		// Find objects for the term
		var objects = findObjects(term);

		// Create list of object names
		var list = [];
		for(var i = 0; i < objects.length; i++) {
			list[i] = objects[i].name;
		}

		// Return both
		callback(list, objects);
	},
	/*
	 * Accept callback
	 */
	function(term, object) {
		console.log("The user chose this object:", object);
	}
);
```

## To do

Close the list when the user leaves the input.

There may be not enough space for the list between the input and the
page border. A scrollbar could be added to the list, or the list could
be placed differently in that case.
