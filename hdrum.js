/*
 * HDrum is an HRing which takes only positions such that an element
 * is always "aligned" in the window.
 */
export default HDrum;

import HRing from './hring.js';
import {
	normalizeSettings
} from './util.js';


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
