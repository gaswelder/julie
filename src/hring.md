# H-Ring

H-ring simulates a view of elements as if they were put on a rotating
carousel. This could be seen as an infinite h-scroll with repeated
content. There must be more than one element to have the effect
working: there is no point or way to rotate a single picture.

The effect is possible if `maxItemWidth + frameWidth <= totalLength`.
The widget checks the condition on creation and after window resizes.
The widget may return to the original page layout if the condition
becomes false after a window resize, and organize the layout back again
if the condition becomes true.

The position of the ring is measured in pixels. When the ring "scrolls"
right (simulating counter-clockwise rotation), its position increases
by the amount of pixels scrolled. The position can be negative and is
unlimited: it doesn't "wrap" to zero after a full rotation but continues
to grow.


## Functions

* `setPos(newPos)`;

	Sets current position to `newPos` in pixels.


* `pos = getPos();`

	Returns current position in pixels.


* `ok = ring.enabled();`

	Returns `true` if the widget is enabled and `false` otherwise. The
	result depends on the items and container sizes and may change after
	a window resize.


* `count = ring.count();`

	Returns the number of items in the ring.

* `len = ring.length();`

	Returns the total length in pixels on all ring elements.


* `node = ring.getItem(i);`

	Returns an item object stored at index `i`. The object has fields
	`pos` and `width` with values in pixels.


* `ring.on(eventType, func);`

	Adds a listener for events of given type.


## Events

* `dragend`

	Dragging by the user and possible following animation have completed.


## Principle

The way of simulating the effect is moving the visible elements
normally as in the H-scroll but also swapping elements from one side to
the other during the movement to keep the stream of elements
continuous.

Let's assume that we have `N` elements on the ring, enumerated with
index `i = 0..(N-1)`. Let's mark the length of an `i`-th element as
`l[i]`, and the total length of all elements as `L = sum(l[i])`.
Let's mark the length of the visible part of the carousel as `W`. It
can also be thought of as the "window" through which we look at the
"carousel".

If the length of the visible part `W` is too
big, or one of the elements is too long, it may be impossible to keep
the stream continuous. The effect would break if the window would "wrap
around" the carousel wheel far enough to catch in its sight both sides
of an element on the other side of the wheel. For that not to happen
the length of the biggest of the elements combined with the length of
the window must not exceed the total length of the carousel:

	max(l[i]) + W <= L.

In the common particular case where the elements and the
window all have the same length `w`, the condition takes form:

	2*w <= L,

which means, as `L = N*w`, that the minimal required number of
elements for the effect in that case is `2`.


## Rotation

We will measure the rotation in linear units, as the length that the
carousel was "scrolled" by the window. For consistency with the
conventional coordinates system of screens, positive value corresponds
to counter-clockwise rotation. Thus, for example, `L` is one full
rotation in the counter-clockwise direction.

Every element, as it is assigned to the imaginary carousel wheel, gets
assigned a static position on that wheel. The first element's left edge
is at position `0`, its right edge is at position `l[0]`, and so on to
the last element, the position of the right edge of which is `L` (or
`0` after taking modulo `L`).

When the carousel is set to position `p`, there will be one element
`i=i'` partially (or possibly fully) visible at the left side, and zero
or more elements `j=i''..i'''` inside the window, with the last of them
possible partially outside the window.

	p[i] <= p < p[i] + l[i]
	p < p[j] < p + W


## Index-based coordinates

If we need to set the wheel in position `p = P(i)` such that the
element `i` is centered in the window, the following must hold:

	P(i) + W/2 = l[i] + w[i]/2 + m*L,

where `m` is an arbitrary integer number. From this follows
that

	P(i) = l[i] + 1/2*(w[i] - W) + m*L.

If we need only to initialize the position so that an element `i` is displayed, we can choose arbitrary value for `m`. But if we need to "snap"
the wheel into the nearest position `P(i)` after the user has rotated the drum
manually, we have to find also the closest `m` value, as the wheel may have made multiple turns.

As we already know, an element `i` is centered in the window if the
following holds:

	P(i) + W/2 = (l[i] + w[i]/2) + L*m,

