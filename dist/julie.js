(function () {
'use strict';

/*
 * Auxiliary code
 */

var performance = window.performance;
var requestAnimationFrame = window.requestAnimationFrame;

if (!performance || !performance.now) {
	performance = {
		now: function() {
			return Date.now();
		}
	};

	requestAnimationFrame = function(f) {
		setTimeout(function() {
			f(performance.now());
		}, 1);
	};
}

function limit(val, min, max) {
	if (min > max) {
		throw "Invalid arguments given to 'limit'";
	}
	if (val < min) val = min;
	if (val > max) val = max;
	return val;
}

function initDrag($obj, onStart, onMove, onEnd) {
	var origin = null;
	var $body = $('body');

	var t = performance.now();
	var pos = [0, 0];

	var event = {
		// 'offset' tells how long from the starting point
		// the pointer has travelled so far.
		offset: {
			left: 0,
			top: 0
		},
		// Current speed (x, y) in pixels per millisecond.
		speed: [0, 0]
	};

	// Disable native dragstart event.
	$obj.on("dragstart", function(e) {
		e.preventDefault();
	});

	// At the end of our dragging a "click" event is emitted
	// along with the "mouseup" event. If we have been dragging
	// right now, that click event should be suppressed.
	$obj.on("click", function(e) {
		if (event.offset.left != 0 || event.offset.top != 0) {
			e.preventDefault();
		}
	});

	var beginEvent, trackEvent, endEvent;
	if ("ontouchstart" in document.body) {
		beginEvent = "touchstart";
		trackEvent = "touchmove";
		endEvent = "touchend";
	} else {
		beginEvent = "mousedown";
		trackEvent = "mousemove";
		endEvent = "mouseup mouseleave";
	}

	$obj.on(beginEvent, begin);

	function begin(e) {
		event.speed = [0, 0];
		event.offset.left = 0;
		event.offset.top = 0;
		if (onStart && onStart(event) === false) {
			return;
		}

		e.preventDefault();

		pos = [
			e.pageX || e.originalEvent.touches[0].pageX,
			e.pageY || e.originalEvent.touches[0].pageY
		];

		origin = {
			left: pos[0],
			top: pos[1]
		};

		$body.on(trackEvent, track);
		$body.on(endEvent, end);
	}

	function end(e) {
		call(onEnd, event);
		$body.off(trackEvent, track);
		$body.off(endEvent, end);
	}

	function track(e) {
		var newPos = [
			e.pageX || e.originalEvent.touches[0].pageX,
			e.pageY || e.originalEvent.touches[0].pageY
		];
		var newT = performance.now();
		var dt = newT - t;
		if (!dt) {
			return;
		}

		event.speed = [
			(newPos[0] - pos[0]) / dt,
			(newPos[1] - pos[1]) / dt
		];

		pos = newPos;
		t = newT;

		if (event.speed[0] == 0 && event.speed[1] == 0) {
			return;
		}

		event.offset.left = pos[0] - origin.left;
		event.offset.top = pos[1] - origin.top;

		if (onMove) onMove(event);
	}

	function call(f, arg) {
		if (f) return f(arg);
	}
}

function animate(from, to, duration, callback) {
	var b = from;
	var a = to - from;

	var t1 = performance.now();

	function next(t) {
		var prog = (t - t1) / duration;
		var val = a * prog + b;
		callback(val);
		if (prog > 1 && val != to) {
			callback(to);
		}
		if (prog < 1) {
			requestAnimationFrame(next);
		}
	}

	requestAnimationFrame(next);
}

function animateFriction(x, v, a, onMove, onEnd) {
	var dir = 1;
	if (v < 0) {
		dir = -1;
		v = -v;
	}

	var t = 0;
	requestAnimationFrame(move);

	function move(t1) {
		if (!t) {
			t = t1;
		} else {
			var dt = t1 - t;
			t = t1;
			x += dir * v * dt;
			v -= a * dt;
			onMove(x);
		}

		if (v > 0) {
			requestAnimationFrame(move);
		} else {
			onEnd();
		}
	}
}

function normalizeSettings(settings, defaults) {
	if (!settings) settings = {};
	for (var k in defaults) {
		if (k in settings) continue;
		settings[k] = defaults[k];
	}
	return settings;
}

function debounce(func, delay) {
	var timeout = null;

	return function() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
		timeout = setTimeout(func, delay);
	};
}

/*
 * H-ring simulates a view of elements as if they were put on a carousel
 * rotating in front of the viewer.
 */
function HRing$1(container) {
	// Current position
	var pos = 0;

	// Event listeners
	var listeners = {
		"dragend": []
	};

	/*
	 * Cache variables
	 */
	var $container = $(container);
	var items = [];
	var maxItemWidth = 0;
	var maxItemHeight = 0;
	var frameWidth = 0;
	var totalLength = 0;
	var active = false;

	/*
	 * Disable or enable the widget, if needed, after window resizes.
	 */
	window.addEventListener('resize', debounce(update, 500), false);
	update();

	function update() {
		/*
		 * Determine whether there is enough elements for the ring.
		 */
		refreshCache();
		var enough = maxItemWidth + frameWidth <= totalLength;

		if (!active) {
			if (enough) {
				active = true;
				construct();
			}
		} else {
			if (!enough) {
				active = false;
				deconstruct();
			}
		}

		if (active) {
			setPos(0);
		}
	}

	/*
	 * Init dragging.
	 */
	initDrag($container,
		function(e) {
			if (!active) return false;
			e.dragPos = pos;
		},
		function(e) {
			setPos(e.dragPos - e.offset.left);
		},
		function(e) {
			animateFriction(
				pos, -e.speed[0] / 2, 0.01,
				function(newPos) {
					setPos(newPos);
				},
				function() {
					call("dragend");
				}
			);
		}
	);

	/*
	 * Adds a listener.
	 */
	this.on = function(type, func) {
		listeners[type].push(func);
	};

	/*
	 * Sets new position.
	 */
	this.setPos = function(newPos) {
		if (!active) return;
		animate(pos, newPos, 300, function(p) {
			setPos(p);
		});
	};

	/*
	 * Returns current position.
	 */
	this.getPos = function() {
		if (!active) return undefined;
		return pos;
	};

	this.enabled = function() {
		return active;
	};

	this.getItem = function(i) {
		return items[i];
	};

	this.length = function() {
		return totalLength;
	};

	this.count = function() {
		return items.length;
	};

	//

	function refreshCache() {
		frameWidth = $container.width();

		items = [];
		totalLength = 0;
		maxItemWidth = 0;
		maxItemHeight = 0;

		$container.children().each(function() {
			var $t = $(this);
			var w = $t.outerWidth(true);
			var h = $t.outerHeight(true);

			items.push({
				$e: $t,
				pos: totalLength,
				width: w
			});
			totalLength += w;

			if (h > maxItemHeight) maxItemHeight = h;
			if (w > maxItemWidth) maxItemWidth = w;
		});

	}

	function construct() {
		$container.css({
			"position": "relative",
			"height": maxItemHeight + "px",
			"overflow": "hidden"
		});

		$container.children().css({
			"position": "absolute",
			"display": "block"
		});
	}

	function deconstruct() {
		$container.children().css({
			"position": "",
			"display": "",
			"left": ""
		});
		$container.css({
			"position": "",
			"height": "",
			"overflow": ""
		});
	}

	function setPos(newPos) {
		pos = newPos;

		/*
		 * Find first item that is visible on the left.
		 */
		newPos = wrap(newPos, totalLength);
		var i = 0;
		var x;
		for (i = 0; i < items.length; i++) {
			var item = items[i];
			if (item.pos <= newPos && newPos < item.pos + item.width) {
				x = item.pos - newPos;
				break;
			}
		}
		if (i == items.length) {
			throw "Oops";
		}

		/*
		 * Fill the frame with items starting from the one found.
		 */
		while (x < frameWidth) {
			item = getItem(i++);
			item.$e.css("display", "block");
			item.$e.css("left", x + "px");
			x += item.width;
		}

		/*
		 * Move the rest of the items away.
		 */
		while (i < 2 * items.length) {
			item = getItem(i);
			if (item.pos <= newPos && newPos < item.pos + item.width) {
				break;
			}
			item.$e.css({
				"display": "none"
			});
			i++;
		}
	}

	function call(type) {
		listeners[type].forEach(function(f) {
			f();
		});
	}

	function getItem(i) {
		i = wrap(i, items.length);
		return items[i];
	}

	function wrap(val, range) {
		if (range < 0) {
			throw "Negative range given to 'wrap'";
		}
		if (range == 0) {
			return 0;
		}

		while (val < 0) val += range;
		while (val >= range) val -= range;
		return val;
	}
}

/*
 * HDrum is an HRing which takes only positions such that an element
 * is always "aligned" in the window.
 */
function HDrum$1(container, params) {
	/*
	 * Validate the settings.
	 */
	params = normalizeSettings(params, {
		"gravity": "left"
	});
	if (["center", "left"].indexOf(params.gravity) == -1) {
		throw new Error("Unknown gravity value: " + params.gravity);
	}

	/*
	 * Current position.
	 */
	var pos;

	var ring = new HRing$1(container);
	var _this = this;

	/*
	 * Align the ring after the user drags it.
	 */
	ring.on("dragend", function() {
		var L = ring.length();
		var p = ring.getPos();
		var x = gravityOffset();
		var turns = Math.floor((p + x) / L);

		/*
		 * Find index of the item at gravity position.
		 */
		var i = findItem(p + x - turns * L);
		if (i == -1) {
			throw new Error("Meaningless error message 116");
		}

		/*
		 * Use the found index.
		 */
		_this.setPos(i + turns * ring.count());
	});

	function findItem(p) {
		var N = ring.count();
		for (var i = 0; i < N; i++) {
			var item = ring.getItem(i);
			if (item.pos <= p && p < item.pos + item.width) {
				return i;
			}
		}
		return -1;
	}

	this.setPos = function(i) {
		if (!ring.enabled()) {
			return;
		}

		pos = i;

		var N = ring.count();

		/*
		 * Represent i as n*N + j, where N is the period.
		 * With the floor function this works for negative i as well.
		 */
		var n = Math.floor(i / N);
		var j = i - n * N;

		var item = ring.getItem(j);
		if (!item) {
			throw new Error("Meaningless error message 2354");
		}

		/*
		 * Determine and set the ring position in pixels.
		 */
		var L = ring.length();
		var p = ring.getPos();

		switch (params.gravity) {
			case "left":
				p = L * n + item.pos;
				break;
			case "center":
				p = L * n + item.pos - 1 / 2 * (frameWidth() - item.width);
				break;
			default:
				throw "Invalid gravity";
		}

		ring.setPos(p);
	};

	this.getPos = function() {
		return pos;
	};

	function gravityOffset() {
		switch (params.gravity) {
			case "center":
				return frameWidth() / 2;
			case "left":
				return frameWidth() / 8;
			default:
				throw "Invalid gravity";
		}
	}

	function frameWidth() {
		return container.offsetWidth;
	}

	this.setPos(0);
}

/*
 * A gallery widget built around H-drum.
 */
function Gallery$1(container, settings) {
	settings = normalizeSettings(settings, {
		autoChangePeriod: undefined,
		leftRight: false
	});

	var $container = $(container);
	$container.addClass('ju').addClass('gallery');

	/*
	 * Init the drum in a separate subcontainer.
	 */
	$container.wrapInner('<div></div>');
	var drum = new HDrum$1($container.children().get(0), settings);

	/*
	 * Left-right buttons.
	 */
	if (settings.leftRight) {
		initLeftRight($container, drum);
	}

	/*
	 * Automatic rotation.
	 */
	if (settings.autoChangePeriod) {
		initAutoChange($container, drum, settings.autoChangePeriod);
	}
}

function initAutoChange($container, drum, period) {
	var block = false;
	var timer = setInterval(function() {
		if (block) return;
		drum.setPos(drum.getPos() + 1);
	}, period);

	/*
	 * Pause the autorotation on mouse hover.
	 */
	$container.on("mouseenter", function() {
		block = true;
	});
	$container.on("mouseleave", function() {
		block = false;
	});

	/*
	 * Cancel the autorotation completely after any manual
	 * interaction.
	 */
	$container.on("click mousedown", function() {
		clearTimeout(timer);
	});
}

function initLeftRight($container, drum) {
	var $c = $('<div class="left-right">' +
		'<div class="btn left"></div>' +
		'<div class="btn right"></div>' +
		'</div>');
	var $left = $c.find('.left');
	var $right = $c.find('.right');

	$container.append($c);

	$left.add($right).css({
		"display": "inline-block"
	});

	$right.on('click', function() {
		drum.setPos(drum.getPos() + 1);
	});

	$left.on('click', function() {
		drum.setPos(drum.getPos() - 1);
	});
}

var ids = 0;

/*
 * Tabbed widget constructor. 'container' is a DOM
 * element which will be converted to the widget.
 */
function Tabs$1(container, settings) {
	settings = normalizeSettings(settings, {
		sectionSelector: 'section',
		headerSelector: 'h1'
	});

	var _this = this;
	/*
	 * Page "bundles".
	 * Each bundle has fields "$body", "$head" and "obj".
	 */
	var pages = [];

	/*
	 * Index of the currently visible page
	 */
	var currentPageIndex = undefined;

	/*
	 * Array of "change" callbacks
	 */
	var changeListeners = [];

	var $container = $(container);
	$container.addClass('w-tabs');

	var $headsContainer = $('<div class="w-tabs-heads"></div>');
	var $bodiesContainer = $('<div class="w-tabs-bodies"></div>');

	/*
	 * Construct the widget.
	 */
	parseContents($container, settings.sectionSelector, settings.headerSelector);
	$container.append($headsContainer).append($bodiesContainer);
	initEvents();
	setCurrentPage(0);

	/*
	 * Parse the existing markup into pages and tabs.
	 */
	function parseContents($container, sectionSel, headerSel) {
		var $sections = $container.children(sectionSel);
		$sections.each(function() {
			var $header = $(this).children(headerSel).eq(0);
			addPage($header.html(), this);
		});
	}

	function initEvents() {
		$headsContainer.on('click', '.w-tabs-head', function(event) {
			var index = getTabIndex(this);
			if (index < 0) {
				return;
			}
			event.preventDefault();
			setCurrentPage(index);
			triggerChange(index);
		});
	}

	function triggerChange(index) {
		var n = changeListeners.length;
		for (var i = 0; i < n; i++) {
			changeListeners[i].call(_this, index);
		}
	}

	function setCurrentPage(index) {
		if (index < 0 || index >= pages.length) {
			return;
		}

		if (pages[index].disabled) {
			return;
		}

		if (currentPageIndex >= 0) {
			var page = pages[currentPageIndex];
			page.$head.removeClass('current');
			page.$body.hide();
		}

		currentPageIndex = index;
		var page = pages[currentPageIndex];
		page.$head.addClass('current');
		page.$body.show();
	}

	/*
	 * Creates a page, adds and returns it.
	 * 'title' is a string, 'container' is a DOM element reference
	 * (optional). 'index' is the position at which the page has to be
	 * created (if omitted, the page will be appended to the end).
	 */
	function addPage(title, container, index) {
		if (typeof index == "undefined") {
			index = pages.length;
		}

		ids++;
		var id = '-w-tabs-id-' + ids;

		/*
		 * Create head and body
		 */
		var $head = $('<a href="#' + id + '" class="w-tabs-head"></a>');
		$head.html(title);
		var $body = $('<div class="w-tabs-body" id="' + id + '"></div>');
		if (container) {
			$body.append(container);
		}

		var page = {
			$head: $head,
			$body: $body,
			obj: new Page($head, $body),
			disabled: false
		};

		if (index == pages.length) {
			$headsContainer.append($head);
			$bodiesContainer.append($body);
			pages.push(page);
		} else {
			$head.insertBefore($heads[index]);
			$body.insertBefore($bodies[index]);
			pages.splice(index, 0, [page]);
		}

		$body.hide();
		if (typeof currentPageIndex == "undefined") {
			setCurrentPage(0);
		}
		return page.obj;
	}

	/*
	 * Finds page index by its tab element reference.
	 */
	function getTabIndex(tabElement) {
		var n = pages.length;
		for (var i = 0; i < n; i++) {
			if (pages[i].$head.get(0) == tabElement) {
				return i;
			}
		}
		return -1;
	}

	/*
	 * Returns number of currently selected page.
	 */
	function getCurrentPage() {
		return currentPageIndex;
	}

	/*
	 * Returns page object at given index.
	 */
	function getPageAt(index) {
		if (index < 0 || index >= pages.length) {
			return null;
		}
		return pages[index];
	}

	function disablePage(index) {
		if (index < 0 || index >= pages.length) {
			return;
		}

		/*
		 * If we are disabling the current page, we have to switch to
		 * any other page which is not disabled.
		 */
		if (currentPageIndex == index) {
			/*
			 * If there is no more enabled pages, don't disable this
			 * one.
			 */
			var newIndex = findEnabledPage(index);
			if (newIndex < 0) {
				return;
			}
			setCurrentPage(newIndex);
		}

		var page = pages[index];
		page.disabled = true;
		page.$head.addClass('disabled');
		page.$body.addClass('disabled');
	}

	function enablePage(index) {
		if (index < 0 || index >= pages.length) {
			return;
		}

		var page = pages[index];
		page.$head.removeClass('disabled');
		page.$body.removeClass('disabled');
		page.disabled = false;
	}

	/*
	 * Finds first enabled page index except the given one.
	 */
	function findEnabledPage(except) {
		var n = pages.length;
		for (var i = 0; i < n; i++) {
			if (i != except && !pages[i].disabled) {
				return i;
			}
		}
		return -1;
	}

	function Page($head, $body) {
		this.setContent = function(html) {
			$body.html(html);
		};
	}

	this.onChange = function(func) {
		changeListeners.push(func);
	};

	this.addPage = addPage;
	this.setCurrentPage = setCurrentPage;
	this.getCurrentPage = getCurrentPage;
	this.count = function() {
		return pages.length;
	};

	this.getPageAt = getPageAt;
	this.disablePage = disablePage;
	this.enablePage = enablePage;
}

var CLASS = 'w-layer';
var $win = $(window);
var layers = [];

function Layer$1(contentNode, coords) {
	var $l = $('<div class="' + CLASS + '"></div>');
	$l.css({
		"position": "absolute"
	});

	if (contentNode) {
		$l.append(contentNode);
	}

	$(document.body).append($l);

	/*
	 * Fix the layer's width to avoid reflowing at screen edges.
	 */
	var w = $l.width();
	if (w) {
		$l.width(w);
	}

	/*
	 * Position the layer. If no coords given, choose them.
	 */
	if (!coords) {
		coords = defaultCoords($l);
	}
	$l.css({
		"left": coords[0] + "px",
		"top": coords[1] + "px"
	});

	/*
	 * Register the layer.
	 */
	layers.push($l);

	/*
	 * Move focus to the new layer.
	 */
	moveFocus($l);

	var removeListeners = [];

	this.remove = function() {
		removeListeners.forEach(function(f) {
			f();
		});
		removeListeners = null;
		removeLayer($l);
	};

	this.focus = function() {
		moveFocus($l);
	};

	this.blur = function() {
		$l.removeClass('focus');
	};

	this.hasFocus = function() {
		return $l.hasClass('focus');
	};

	this.on = function(eventType, func) {
		switch (eventType) {
			case 'blur':
				$l.on('-layer-blur', func);
				break;
			case 'focus':
				$l.on('-layer-focus', func);
				break;
				//case 'remove':
				//	removeListeners.push(func);
				//	break;
			default:
				throw "Unknown event type: " + eventType;
		}
	};
}


function defaultCoords($l) {
	var w = $l.outerWidth();
	var h = $l.outerHeight();
	var W = $win.width();
	var H = $win.height();

	var x = $win.scrollLeft() + (W - w) / 2;
	var y = $win.scrollTop() + (H - h) / 2;

	/*
	 * Shift the layer if there are others.
	 */
	var delta = 20 * layers.length;
	x += delta;
	y += delta;

	/*
	 * Fold the coordinates at the window border.
	 */
	while (x + w > W + $win.scrollLeft()) {
		x -= W;
	}
	while (y + h > H + $win.scrollTop()) {
		y -= H;
	}
	if (x < 0) x = 0;
	if (y < 0) y = 0;

	return [x, y];
}

function removeLayer($l) {
	$l.remove();
	var i = layers.indexOf($l);
	layers.splice(i, 1);
	/*
	 * Move focus to previous layer, if there is one.
	 */
	if (layers.length == 0) {
		return;
	}
	i--;
	if (i < 0) i = layers.length - 1;
	layers[i].addClass('focus').trigger('-layer-focus');
}

/*
 * When a layer is clicked, move the focus to it.
 */
$win.on('mousedown', function(event) {
	var $l = targetLayer(event);
	if (!$l) return;
	moveFocus($l);
});

function moveFocus($layer) {
	/*
	 * If this layer already has the focus, don't do anything.
	 */
	if ($layer.hasClass('focus')) {
		return;
	}
	/*
	 * Find the layer with the focus.
	 */
	var $l = focusedLayer();
	if ($l) {
		$l.removeClass('focus').trigger('-layer-blur');
	}
	$layer.addClass('focus').trigger('-layer-focus');
}

/*
 * Returns layer which is the subject of the given event.
 */
function targetLayer(event) {
	var $t = $(event.target);
	if (!$t.is('.' + CLASS)) {
		$t = $t.parents('.' + CLASS);
	}
	return $t.length ? $t : null;
}

/*
 * Returns layer which currently has focus.
 */
function focusedLayer() {
	var n = layers.length;
	while (n-- > 0) {
		var $l = layers[n];
		if ($l.hasClass('focus')) {
			return $l;
		}
	}
	return null;
}

/*
 * Dragging.
 */
var $drag = null;
var dragOffset = [0, 0];

$win.on('mousedown', function(event) {
	/*
	 * Ignore events on inputs and controls.
	 */
	if ($(event.target).is('button, input, select, textarea')) {
		return;
	}
	var $t = targetLayer(event);
	if (!$t) return;

	event.preventDefault();
	var off = $t.offset();

	dragOffset = [
		event.pageX - off.left,
		event.pageY - off.top
	];
	$drag = $t;
	$drag.addClass("dragging");
});

$win.on('mousemove', function(event) {
	if (!$drag) {
		return;
	}
	var x = event.pageX - dragOffset[0];
	var y = event.pageY - dragOffset[1];
	$drag.css({
		left: x,
		top: y
	});
});

$win.on('mouseup', function() {
	if (!$drag) return;
	$drag.removeClass("dragging");
	$drag = null;
});

function esc(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/*
 * optionsFunction is a function taking entered term and returning
 * corresponding array of suggestions.
 */
function autocomplete$1(input, getOptions) {

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
		options = [];
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
 * This is the file used to generate the blob
 * with the most useful widgets
 */

window.Julie = {
	Gallery: Gallery$1,
	Tabs: Tabs$1,
	Layer: Layer$1,
	autocomplete: autocomplete$1
};

}());
