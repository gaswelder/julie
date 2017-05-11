# Input suggestions element

Supplements a text input with an automatic drop-down list of suggestions.

## Usage

```js
import autocomplete from "julie/autocomplete.js";

var input = document.getElementById('myinput');
autocomplete(input, requestSuggestions);
```

`requestSuggestions` is a function in form:

	function(term, callback)

This function will be called as the user types characters in the input. The
`term` argument is the current value of the input, and the `callback` argument
is a function that has to be called to update the suggestions list. The
`callback` function has form:

	function(optionsList)

The `optionsList` argument is a list of suggested strings corresponding to the
given `term` value.


## CSS classes

* `ju`, `autocomplete`

	The absolutely positioned list container (a `div` element).

* `selected`

	The currently selected item in the list. This should be styled instead of
	the `:hover` pseudo-class since it unifies mouse and keyboard selection.


## Example

```js
var input = document.getElementById("myinput");
autocomplete(input,
	function(term, callback) {
		var objects = findObjects(term);
		callback(list);
	}
);
```
