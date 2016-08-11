/*
 * A gallery widget build around H-drum.
 */

export default Gallery;

import HDrum from './hdrum.js';
import {normalizeSettings} from './util.js';

function Gallery(container, settings)
{
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
	if(settings.leftRight) {
		initLeftRight($container, drum);
	}

	/*
	 * Automatic rotation.
	 */
	if(settings.autoChangePeriod) {
		initAutoChange($container, drum, settings.autoChangePeriod);
	}
}

function initAutoChange($container, drum, period)
{
	var block = false;
	var timer = setInterval(function() {
		if(block) return;
		drum.setPos(drum.getPos() + 1);
	}, period);

	/*
	 * Pause the autorotation on mouse hover.
	 */
	$container.on("mouseenter", function() { block = true; });
	$container.on("mouseleave", function() { block = false; });

	/*
	 * Cancel the autorotation completely after any manual
	 * interaction.
	 */
	$container.on("click mousedown", function() {
		clearTimeout(timer);
	});
}

function initLeftRight($container, drum)
{
	var $c = $('<div class="left-right">'
		+ '<div class="btn left"></div>'
		+ '<div class="btn right"></div>'
		+ '</div>');
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
