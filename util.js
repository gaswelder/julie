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

export function limit(val, min, max) {
	if (min > max) {
		throw "Invalid arguments given to 'limit'";
	}
	if (val < min) val = min;
	if (val > max) val = max;
	return val;
}

export function initDrag($obj, onStart, onMove, onEnd) {
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

	$obj.on("mousedown", begin);

	function begin(e) {
		event.speed = [0, 0];
		event.offset.left = 0;
		event.offset.top = 0;
		if (onStart && onStart(event) === false) {
			return;
		}

		e.preventDefault();

		origin = {
			left: e.pageX,
			top: e.pageY
		};
		pos = [e.pageX, e.pageY];

		$body.on("mousemove", track);
		$body.on("mouseup mouseleave", end);
	}

	function end(e) {
		call(onEnd, event);
		$body.off("mousemove", track);
		$body.off("mouseup mouseleave", end);
	}

	function track(e) {
		var newPos = [e.pageX, e.pageY];
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

		event.offset.left = e.pageX - origin.left;
		event.offset.top = e.pageY - origin.top;

		if (onMove) onMove(event);
	}

	function call(f, arg) {
		if (f) return f(arg);
	}
}

export function animate(from, to, duration, callback) {
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

export function animateFriction(x, v, a, onMove, onEnd) {
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

export function normalizeSettings(settings, defaults) {
	if (!settings) settings = {};
	for (var k in defaults) {
		if (k in settings) continue;
		settings[k] = defaults[k];
	}
	return settings;
}

export function debounce(func, delay) {
	var timeout = null;

	return function() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
		timeout = setTimeout(f, delay);
	};
};
