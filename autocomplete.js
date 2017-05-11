export default autocomplete;

import {
	limit
} from './util.js';

function esc(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/*
 * optionsFunction is a function taking entered term and returning
 * corresponding array of suggestions.
 */
function autocomplete(input, getOptions) {

	// Disable the browser's autocompletion
	input.autocomplete = 'off';

	// Current list of options returned by getOptions
	var options = [];

	// Index of the option selected by the user with keyboard or mouse
	var selectionIndex = -1;


	var listContainer = document.createElement('div');
	listContainer.className = 'ju autocomplete';
	listContainer.style.position = 'absolute';

	var list = document.createElement('ul');
	listContainer.appendChild(list);
	document.body.appendChild(listContainer);


	input.addEventListener('input', function() {
		options = []
		selectionIndex = -1;
		listContainer.style.display = 'none';

		if (this.value == '') {
			return;
		}

		getOptions(this.value, function(newOptions) {
			options = newOptions;
			if (options.length == 0) {
				return;
			}
			renderOptions();
			alignList();
		});
	});

	function renderOptions() {
		var html = '';
		for (var i = 0; i < options.length; i++) {
			html += '<li';
			if (i == selectionIndex) {
				html += ' class="selected"';
			}
			html += ' data-index="' + i + '"';
			html += '>' + esc(options[i]) + '</li>';
		}
		list.innerHTML = html;
		listContainer.style.display = 'block';
	}

	function alignList() {
		listContainer.style.left = input.offsetLeft + 'px';
		listContainer.style.top = input.offsetTop + input.offsetHeight + 'px';
		listContainer.style.width = input.offsetWidth + 'px';
	}

	input.addEventListener('keydown', function(event) {
		var KEY_UP = 38;
		var KEY_DOWN = 40;
		var KEY_ENTER = 13;

		// Check if this is a relevant event.
		if ([KEY_UP, KEY_DOWN, KEY_ENTER].indexOf(event.keyCode) < 0) {
			return;
		}

		// If there are no options, ignore.
		if (options.length == 0) {
			return;
		}

		if (event.keyCode == KEY_ENTER) {
			accept();
			return
		}

		switch (event.keyCode) {
			case KEY_UP:
				select(selectionIndex - 1);
				break;
			case KEY_DOWN:
				select(selectionIndex + 1);
				break;
		}

		renderOptions();
	});

	function select(index) {
		selectionIndex = limit(index, -1, options.length - 1);
		renderOptions();
	}

	function accept() {
		input.value = options[selectionIndex];
		options = [];
		selectionIndex = -1;
		renderOptions();
	}

	list.addEventListener('mouseover', function(event) {
		var li = event.target;
		var index = li.dataset.index;
		select(index);
	});

	list.addEventListener('click', function(event) {
		var li = event.target;
		if (li.tagName.toLowerCase() != 'li') {
			return;
		}
		accept();
	});

	/*
	 * When anything outside the list is clicked, hide the list.
	 */
	document.body.addEventListener('click', function() {
		options = [];
		selectionIndex = -1;
		renderOptions();
	});
}

	/*
	 * Create list element and insert it after the input.
	 * Simply appending it to the body would make positioning easier,
	 * but it would cause problems if the input itself was in a
	 * positioned container (a draggable dialog, for example).
	 */


function onInput(input, func) {
	/*
	 * As of 2014, significant number of browsers still don't support
	 * the "input" event. For them we have to fall back to listening for
	 * the "keyup" event.
	 */

	var inputEventSupported = ('oninput' in document.createElement('input'));
	if (inputEventSupported) {
		input.addEventListener('input', func);
	} else {
		input.addEventListener('keyup', function(event) {
			if (event.keyCode < 32 || event.keyCode > 127) {
				return;
			}
			func.call(this, event);
		});
	}
}
