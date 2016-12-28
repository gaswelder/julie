(function () {
	'use strict';

	/*
	 * Auxiliary code
	 */

	var performance = window.performance;
	var requestAnimationFrame = window.requestAnimationFrame;

	if (!performance) {
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

	function initDrag($obj, onStart, onMove, onEnd) {
		var origin = null;
		var $body = $('body');

		var t = performance.now();
		var pos = [0, 0];
		var speed = [0, 0];

		var event;

		$obj.on("dragstart", function(e) {
			e.preventDefault();
		});

		$obj.on("mousedown", function(e) {
			e.preventDefault();
			origin = {
				left: e.pageX,
				top: e.pageY
			};
			speed = [0, 0];
			pos = [e.pageX, e.pageY];

			event = {};
			if (call(onStart, event) === false) {
				return;
			}
			$body.on("mousemove", track);
			$body.on("mouseup mouseleave", end);
		});

		function end() {
			event.speed = speed;
			call(onEnd, event);
			delete event.speed;
			$body.off("mousemove", track);
			$body.off("mouseup mouseleave", end);
		}

		function track(e) {
			var newPos = [e.pageX, e.pageY];
			var newT = performance.now();

			var dt = newT - t;
			speed = [
				(newPos[0] - pos[0]) / dt,
				(newPos[1] - pos[1]) / dt
			];

			pos = newPos;
			t = newT;

			if (speed[0] == 0 && speed[1] == 0) {
				return;
			}

			var offset = {
				left: e.pageX - origin.left,
				top: e.pageY - origin.top
			};

			event.offset = offset;
			call(onMove, event);
			delete event.offset;
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
	};

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

	function onEventRun(element, event, maxDuration, onBegin, onEnd) {
		var stopTimeout;
		var max = maxDuration;
		element.addEventListener(event, start, false);

		function start() {
			element.removeEventListener(event, start, false);
			element.addEventListener(event, track, false);
			stopTimeout = setTimeout(stop, max);
			if (onBegin) onBegin();
		}

		function track() {
			clearTimeout(stopTimeout);
			stopTimeout = setTimeout(stop, max);
		}

		function stop() {
			element.removeEventListener(event, track, false);
			element.addEventListener(event, start);
			if (onEnd) onEnd();
		}
	}

	function HRing(container) {
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
		onEventRun(window, "resize", 500, update);
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

	function HDrum(container, params) {
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

		var ring = new HRing(container);
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

	function Gallery(container, settings) {
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
		var drum = new HDrum($container.children().get(0), settings);

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
	function Tabs(container, settings) {
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
			}

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
		};

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

	window.Julie = {
		Gallery: Gallery,
		Tabs: Tabs
	};

}());