export default HScroll;
/*
 * Lays out the container's children so that they can be scrolled
 * horizontally inside the container.
 */

import {limit, initDrag} from './util.js';

function HScroll($container)
{
	var $children = $container.children();

	var totalWidth = 0;
	var maxHeight = 0;

	$children.each(function() {
		var $t = $(this);
		var w = $t.outerWidth(true);
		var h = $t.outerHeight(true);
		$t.css({
			"position": "absolute",
			"left": totalWidth + "px"
		});
		totalWidth += w;
		if(h > maxHeight) maxHeight = h;
	});

	var $film = $('<div></div>');
	$film.css({
		"width": totalWidth + "px",
		"position": "absolute",
		"top": "0px",
		"left": "0px",
		"height": maxHeight + "px",
		"transition": "left 0.3s"
	});

	$film.append($children);
	$container.append($film);
	$container.css({
		"position": "relative",
		"overflow": "hidden",
		"height": maxHeight + "px"
	});

	function animationOn() {
		$film.css("transition", "left 0.3s");
	}
	function animationOff() {
		$film.css("transition", "none");
	}

	var pos = 0;

	function maxPos() {
		return totalWidth - $container.width();
	}

	this.setPos = function(newPos) {
		pos = limit(newPos, 0, maxPos());
		$film.css("left", -pos + "px");
	};

	this.getPos = function() {
		return pos;
	};

	this.children = function() {
		return $children;
	};

	var dragPos;
	var _t = this;
	initDrag($film,
		function(e) {
			animationOff();
			dragPos = pos;
		},
		function(e) {
			_t.setPos(dragPos - e.offset.left);
		},
		function(e) {
			animationOn();
			listeners.dragend.forEach(function(f) {
				f();
			});
		}
	);

	var listeners = {
		"dragend": []
	};

	this.on = function(type, func) {
		listeners[type].push(func);
	};
}
