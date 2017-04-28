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
