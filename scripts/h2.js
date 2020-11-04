// h2.js
// Lightweight vdom impl optimized for browser include
//
// Exposes a subset of HTML tags from the WHATWG HTML Living Standard
// for use as h functions, e.g. p([ "Hello world!" ])
//
(function (tags) {
	var EMPTY_OBJ = {}
	var EMPTY_ARR = []
	for (var tag of tags) {
		window[tag] = (function (h, tag) {
			return function (data, content) {
				return data === undefined || Array.isArray(data)
					? h(tag, EMPTY_OBJ, data || EMPTY_ARR)
					: h(tag, data, content || EMPTY_ARR)
			}
		})(h, tag)
	}

	window.manifest = manifest
	window.patch = patch

	function h(tag, data, content) {
		return {
			tag: tag,
			data: data,
			content: content
		}
	}

	function manifest(node) {
		if (node instanceof Element) return node
		if (!node || typeof node !== "object") {
			return document.createTextNode(node)
		}
		let tag = node.tag
		let data = node.data
		let content = node.content
		let element = document.createElement(tag)
		for (let name in data) {
			let value = data[name]
			element[name] = value
			if (typeof value !== "function") {
				element.setAttribute(name, value)
			}
		}
		for (let i = 0; i < content.length; i++) {
			let child = manifest(content[i])
			element.appendChild(child)
		}
		return element
	}

	function patch(el, node) {
		let tag = el.tagName
		let data = el.attributes
		let content = el.childNodes

		// just create a new element if the new tag is different
		if (typeof tag !== typeof node.tag || tag !== node.tag.toUpperCase()) {
			let newel = manifest(node)
			if (el.parentNode) {
				el.parentNode.replaceChild(newel, el)
			}
			return newel
		}

		// remove attributes on old element
		// if they are missing from new node
		for (let i = 0; i < data.length; i++) {
			let attr = data[i]
			let attrid = attr.name
			if (!node.data[attrid]) {
				el.removeAttribute(attrid)
			}
		}

		// add new node attributes to old element
		// if they are missing from old element
		for (let attrid in node.data) {
			let attrval = node.data[attrid]
			if (typeof attrval === "function") {
				if (el[attrid] === attrval) continue
				el[attrid] = attrval
			} else if (el.getAttribute(attrid) !== attrval.toString()) {
				el.setAttribute(attrid, attrval)
			}
		}

		// remove extra children from old element
		// if they are missing from new element
		// TODO: determine if there's a faster way
		//   to find which elements were removed
		while (content.length > node.content.length) {
			el.removeChild(content[content.length - 1])
		}

		// patch remaining children
		for (let i = 0; i < node.content.length; i++) {
			let child = content[i]
			let newchild = node.content[i]
			if (!child) {
				// nothing to patch, add a new element
				el.appendChild(manifest(newchild))
			} else if (child instanceof Element || typeof newchild === "object") {
				// general situation: patch child to reflect new child data
				patch(child, newchild)
			} else if (child.data !== newchild) {
				// for textnode: just change content
				child.data = newchild
			}
		}

		return el
	}
})([
	"main", "header", "footer", "div",
	"ul", "li", "p", "span", "button", "input"
])
