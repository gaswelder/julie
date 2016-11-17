/*
 * H-ring simulates a view of elements as if they were put on a carousel
 * rotating in front of the viewer.
 */
export default HRing

import {
	limit,
	initDrag,
	onEventRun,
	animate,
	animateFriction
} from './util.js';

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
