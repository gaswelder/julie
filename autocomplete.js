export default autocomplete;

/*
 * optionsFunction is a function taking entered term and returning
 * corresponding array of suggestions.
 */
function autocomplete(input, optionsFunc, onAccept) {
	var $input = $(input);
	var $list = buildList($input);
	var list = new List($input, $list, optionsFunc, onAccept);
	initInputEvents(list);
	initKeyboardEvents(list);
	initMouseEvents(list);
}

/*
 * A structure for the generated drop-down list.
 */
function List($input, $list, optionsFunc, acceptCallback) {
	// The input
	this.$input = $input;

	// The UL element we show below the input
	this.$list = $list;

	// Suggestions function and onAccept function
	this.func = optionsFunc;
	this.acceptCallback = acceptCallback;

	// Array of currently shown suggestions
	this.contents = [];
	this.contexts = [];

	// Currently highlighted suggestion
	this.selection = -1;

	// Previous value of the input
	this.prevValue = '';
}

/*
 * Takes an input and returns the list for it.
 */
function buildList($input) {
	/*
	 * Disable the browser's autocompletion feature.
	 */
	$input.attr("autocomplete", "off");

	/*
	 * Create list element and insert it after the input.
	 * Simply appending it to the body would make positioning easier,
	 * but it would cause problems if the input itself was in a
	 * positioned container (a draggable dialog, for example).
	 */
	var $list = $("<div class=\"autocomplete\"></div>");
	$list.css("position", "absolute");
	$list.insertAfter($input);
	$list.css('display', 'none');

	/*
	 * Make sure that the input's and the list's parent has relative or
	 * absolute positioning.
	 */
	var $parent = $list.parent();
	var pos = $parent.css('position');
	if (pos != 'absolute' && pos != 'relative') {
		$parent.css('position', 'relative');
	}

	return $list;
}

function initInputEvents(list) {
	/*
	 * Save the list variable in a closure.
	 */
	function oninput(event) {
		updateInput(list);
	}

	/*
	 * We have to listen for "input" events and react to them.
	 * As of 2014, significant number of browsers still don't support
	 * it. For them we have to fall back to listening for "keyup"
	 * events.

	/*
	 * If oninput is supported, use it.
	 */
	var inputEventSupported = ('oninput' in document.createElement('input'));
	if (inputEventSupported) {
		list.$input.on("input", oninput);
		return true;
	}
	/*
	 * Otherwise, do a trick with keyup.
	 */
	list.$input.on("keyup", function(event) {
		if (event.keyCode >= 32 && event.keyCode <= 127) {
			updateInput(list);
		}
	});
}

/*
 * Gets called whenever the associated input value is changed.
 */
function updateInput(list) {
	var MIN_LENGTH = 1;

	var newValue = list.$input.val();

	/* If the value hasn't changed, don't do anything. */
	if (list.currentValue == newValue) {
		return;
	}

	list.prevValue = list.currentValue;
	list.currentValue = newValue;

	if (list.currentValue < MIN_LENGTH) {
		hideList(list);
		return;
	}

	/*
	 * Save the list variable in closure and call the suggestions
	 * function with it.
	 */
	var f = function(options, contexts) {
		showSuggestions(list, options, contexts);
	}
	list.func.call(undefined, list.currentValue, f);
}

function hideList(list) {
	list.$list.css('display', 'none');
}

function showSuggestions(list, suggestions, contexts) {
	var $list = list.$list;

	$list.empty();
	list.selection = -1;
	list.contents = suggestions;
	list.contexts = contexts;

	var container = createItems(suggestions);
	if (!container) {
		hideList(list);
		return;
	}

	$list.append(container);
	$list.css('display', 'block');
	/*
	 * After we fill the list, we call alignList to update the list
	 * position. We have to do it every time because in general the page
	 * layout could change at any time, and not only due to the window
	 * resize.
	 */
	alignList(list);
}

function createItems(suggestions) {
	var n = suggestions.length;
	if (!n) {
		return null;
	}

	var container = document.createElement('ul');
	var s = '';
	for (var i = 0; i < n; i++) {
		s += '<li data-index="' + i + '">' + suggestions[i] + '</li>';
	}
	container.innerHTML = s;
	return container;
}

/*
 * Move list to the correct position relative to the input.
 */
function alignList(list) {
	var $input = list.$input;
	var $list = list.$list;

	var offset = $input.position();
	var hmargin = $input.outerWidth(true) - $input.outerWidth();

	var left = offset.left + hmargin / 2;
	/*
	 * We assume that there is always enough space below the input.
	 */
	var top = offset.top + $input.outerHeight();

	$list.css({
		"left": left + "px",
		"top": top + "px",
		"min-width": $input.outerWidth() + "px"
	})
}

function initKeyboardEvents(list) {
	/* Event key codes. */
	var KEY_UP = 38;
	var KEY_DOWN = 40;
	var KEY_ENTER = 13;

	var $input = list.$input;
	var $list = list.$list;

	$input.on('keydown', onKeyPress);

	/*
	 * Processes key presses at the list.
	 */
	function onKeyPress(event) {
		if (!$list.is(":visible")) {
			return;
		}

		var index = list.selection;

		switch (event.keyCode) {
			case KEY_UP:
				selectItem(list, index - 1);
				break;
			case KEY_DOWN:
				selectItem(list, index + 1);
				break;
			case KEY_ENTER:
				acceptItem(list, index);
				break;
			default:
				return;
		}

		event.preventDefault();
		event.stopPropagation();
	}
}

function selectItem(list, index) {
	var n = list.contents.length;
	var $list = list.$list;

	if (!n) {
		return;
	}

	if (index < 0) {
		index = n - 1;
	} else {
		index = index % n;
	}

	var $prev = $list.find('li').eq(list.selection);
	var $next = $list.find('li').eq(index);

	$prev.removeClass('selected');
	$next.addClass('selected');

	list.selection = index;
}

function acceptItem(list, index) {
	var n = list.contents.length;
	if (index < 0 || index >= n) {
		return;
	}

	var item = list.contents[index];
	list.$input.val(item).trigger("change");
	hideList(list);

	if (list.acceptCallback) {
		var context;
		if (list.contexts) {
			context = list.contexts[index];
		} else {
			context = null;
		}
		list.acceptCallback(item, context);
	}
}

function initMouseEvents(list) {
	var $list = list.$list;

	/*
	 * Update selection when pointed by mouse.
	 */
	$list.on('mouseenter', 'li', function(event) {
		var index = $(this).data('index');
		selectItem(list, index);
	});

	/*
	 * When a list entry is clicked, accept it.
	 */
	$list.on("click", 'li', function(event) {
		var index = $(this).data('index');
		acceptItem(list, index);
		event.stopPropagation();
	});

	/*
	 * When anything outside the list is clicked, hide the list.
	 */
	$("body").on('click', function() {
		hideList(list);
	});
}
