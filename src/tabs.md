# Tabs widget

## Usage

```js
import Tabs from "julie/tabs.js";

var tabs = new Tabs(container, settings);
```

The container must be a reference to a DOM element. If the container
has content, it is supposed to be organized into sections with section
elements, each having a header element for the title. The sections will
be converted into tab pages with headers used as tab titles. It is also
possible to add pages from the script.


## Settings

* `sectionSelector` (default: `'section'`)

	Selector that will be used on the container to obtain section
	elements.

* `headerSelector` (default: `'h1'`)

	Selector that will be used on each section to obtain its heading.


## Functions

* `tabs.onChange(func)`

	The func will be called each time pages are switched, with the
	context (`this`) pointing to the relevant Tabs instance and the
	first argument being the index of the new current page.

* `page = tabs.addPage(title, container, index)`

	Adds a page with the given title. If container is given, it must be
	a reference to a DOM element which will be appended to the created
	page. If not, an empty page will be created.

	If index is given, the page will be created at that position. If
	omitted, the page will be added to the end.

	The return value is a page object with setContent function which
	allows to set the HTML content of the page.

* `page = tabs.getPageAt(index)`

	Returns a page object corresponding to the page at given position.

* `tabs.setCurrentPage(index)`

* `i = tabs.getCurrentPage()`

* `n = tabs.count()`

* `tabs.disablePage(index)`

* `tabs.enablePage(index)`

