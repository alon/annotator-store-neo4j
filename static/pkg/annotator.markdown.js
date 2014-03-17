/*
** Annotator v2.0.0-dev-dev-9dfff13
** https://github.com/okfn/annotator/
**
** Copyright 2014, the Annotator project contributors.
** Dual licensed under the MIT and GPLv3 licenses.
** https://github.com/okfn/annotator/blob/master/LICENSE
**
** Built at: 2014-03-06 10:35:41Z
*/
!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Annotator=e():"undefined"!=typeof global?global.Annotator=e():"undefined"!=typeof self&&(self.Annotator=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('annotator');
require('annotator-plugin-markdown');

},{"annotator":"VH1sEA","annotator-plugin-markdown":"4EwWCN"}],"VH1sEA":[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};var Annotator, self, _ref;

if (typeof self !== "undefined" && self !== null) {
  self = self;
}

if (typeof global !== "undefined" && global !== null) {
  if (self == null) {
    self = global;
  }
}

if (typeof window !== "undefined" && window !== null) {
  if (self == null) {
    self = window;
  }
}

Annotator = self != null ? self.Annotator : void 0;

if (Annotator == null) {
  Annotator = (self != null ? (_ref = self.define) != null ? _ref.amd : void 0 : void 0) ? self != null ? self.require('annotator') : void 0 : void 0;
}

module.exports = Annotator;


},{}],"annotator":[function(require,module,exports){
module.exports=require('VH1sEA');
},{}],"4EwWCN":[function(require,module,exports){
var Annotator,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Annotator = require('annotator');

Annotator.Plugin.Markdown = (function(_super) {
  __extends(Markdown, _super);

  Markdown.prototype.events = {
    'annotationViewerTextField': 'updateTextField'
  };

  function Markdown(element, options) {
    this.updateTextField = __bind(this.updateTextField, this);
    if ((typeof Showdown !== "undefined" && Showdown !== null ? Showdown.converter : void 0) != null) {
      Markdown.__super__.constructor.apply(this, arguments);
      this.converter = new Showdown.converter();
    } else {
      console.error(Annotator._t("To use the Markdown plugin, you must include Showdown into the page first."));
    }
  }

  Markdown.prototype.updateTextField = function(field, annotation) {
    var text;
    text = Annotator.Util.escape(annotation.text || '');
    return $(field).html(this.convert(text));
  };

  Markdown.prototype.convert = function(text) {
    return this.converter.makeHtml(text);
  };

  return Markdown;

})(Annotator.Plugin);

module.exports = Annotator.Plugin.Markdown;


},{"annotator":"VH1sEA"}],"annotator-plugin-markdown":[function(require,module,exports){
module.exports=require('4EwWCN');
},{}]},{},[1])

(1)
})
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGtnL2Fubm90YXRvci5tYXJrZG93bi5qcyIsInNvdXJjZXMiOlsiLi4vZmFrZV9iZmI1NWIyZC5qcyIsIm5hbWVzcGFjZS5jb2ZmZWUiLCJwbHVnaW4vbWFya2Rvd24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBOztBQ0dBOztBQUFBLElBQWUsd0NBQWY7Q0FBQSxFQUFPLENBQVA7Q0FBQTs7QUFDQSxJQUFrQiw0Q0FBbEI7O0dBQVEsQ0FBUjtHQUFBO0NBREE7O0FBRUEsSUFBa0IsNENBQWxCOztHQUFRLENBQVI7R0FBQTtDQUZBOztBQUdBLENBSEEsRUFHWSxDQUFJLEVBSGhCLEdBR0E7OztDQUc4QixDQUE5QixDQUF1QyxDQUFYLEVBQWYsQ0FBMEI7Q0FOdkM7O0FBV0EsQ0FYQSxFQVdpQixHQUFYLENBQU4sRUFYQTs7Ozs7O0FDTEE7R0FBQTs7a1NBQUE7O0FBQUEsR0FBWSxNQUFaLEVBQVk7O0FBS04sQ0FMTixLQUtzQixHQUFQO0NBRWI7O0NBQUEsRUFDRSxHQURGO0NBQ0UsQ0FBNkIsRUFBN0I7Q0FERjs7Q0FhYSxpQkFBQztDQUNaO0NBQUE7Q0FDRTtDQUFBLEVBQ2lCLENBQWhCLEVBQUQsRUFBeUIsQ0FBekI7TUFGRjtDQUlFLENBQWMsR0FBZCxFQUFPLEVBQWdCLG1FQUFUO0tBTEw7Q0FiYixFQWFhOztDQWJiLENBaUN5QixDQUFSLE1BQUMsQ0FBRCxLQUFqQjtDQUVFO0NBQUEsQ0FBTyxFQUFQLEVBQU8sR0FBUyxDQUF1QjtDQUN2QyxNQUFjLElBQWQ7Q0FwQ0YsRUFpQ2lCOztDQWpDakIsRUFnRFMsSUFBVCxFQUFVO0NBQ1AsT0FBRCxDQUFVLEVBQVY7Q0FqREYsRUFnRFM7O0NBaERUOztDQUZzQyxRQUFTOztBQXNEakQsQ0EzREEsRUEyRGlCLEdBQVgsQ0FBTixDQTNEQSxDQTJEMEIiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ2Fubm90YXRvcicpO1xucmVxdWlyZSgnYW5ub3RhdG9yLXBsdWdpbi1tYXJrZG93bicpO1xuIiwiIyBJbiBvcmRlciB0byBidWlsZCBwb3J0YWJsZSBleHRlbnNpb24gYnVuZGxlcyB0aGF0IGNhbiBiZSB1c2VkIHdpdGggQU1EIGFuZFxuIyBzY3JpcHQgY29uY2F0ZW5hdGlvbiBwbHVnaW5zIGFyZSBidWlsdCB3aXRoIHRoaXMgbW9kdWxlIGFzICdhbm5vdGF0b3InLlxuXG4jIEFubm90YXRvciB3aWxsIGV4cG9ydCBpdHNlbGYgZ2xvYmFsbHkgd2hlbiB0aGUgYnVpbHQgVU1EIG1vZHVsZXMgYXJlIHVzZWQgaW5cbiMgYSBsZWdhY3kgZW52aXJvbm1lbnQgb2Ygc2ltcGxlIHNjcmlwdCBjb25jYXRlbmF0aW9uLlxuc2VsZiA9IHNlbGYgaWYgc2VsZj9cbnNlbGYgPz0gZ2xvYmFsIGlmIGdsb2JhbD9cbnNlbGYgPz0gd2luZG93IGlmIHdpbmRvdz9cbkFubm90YXRvciA9IHNlbGY/LkFubm90YXRvclxuXG4jIEluIGEgcHVyZSBBTUQgZW52aXJvbm1lbnQsIEFubm90YXRvciBtYXkgbm90IGJlIGV4cG9ydGVkIGdsb2JhbGx5LlxuQW5ub3RhdG9yID89IGlmIHNlbGY/LmRlZmluZT8uYW1kIHRoZW4gc2VsZj8ucmVxdWlyZSgnYW5ub3RhdG9yJylcblxuIyBOb3RlOiB3aGVuIHdvcmtpbmcgaW4gYSBDb21tb25KUyBlbnZpcm9ubWVudCBhbmQgYnVuZGxpbmcgcmVxdWlyZW1lbnRzIGludG9cbiMgYXBwbGljYXRpb25zIHRoZW4gcmVxdWlyZSBjYWxscyBzaG91bGQgcmVmZXIgdG8gbW9kdWxlcyBmcm9tIHRoZSBucG0gbGliXG4jIGRpcmVjdG9yeSBvZiBhbm5vdGF0b3IgcGFja2FnZSBhbmQgYXZvaWQgdGhpcyBhbHRvZ2V0aGVyLlxubW9kdWxlLmV4cG9ydHMgPSBBbm5vdGF0b3JcbiIsIkFubm90YXRvciA9IHJlcXVpcmUoJ2Fubm90YXRvcicpXG5cblxuIyBQbHVnaW4gdGhhdCByZW5kZXJzIGFubm90YXRpb24gY29tbWVudHMgZGlzcGxheWVkIGluIHRoZSBWaWV3ZXIgaW4gTWFya2Rvd24uXG4jIFJlcXVpcmVzIFNob3dkb3duIGxpYnJhcnkgdG8gYmUgcHJlc2VudCBpbiB0aGUgcGFnZSB3aGVuIGluaXRpYWxpc2VkLlxuY2xhc3MgQW5ub3RhdG9yLlBsdWdpbi5NYXJrZG93biBleHRlbmRzIEFubm90YXRvci5QbHVnaW5cbiAgIyBFdmVudHMgdG8gYmUgYm91bmQgdG8gdGhlIEBlbGVtZW50LlxuICBldmVudHM6XG4gICAgJ2Fubm90YXRpb25WaWV3ZXJUZXh0RmllbGQnOiAndXBkYXRlVGV4dEZpZWxkJ1xuXG4gICMgUHVibGljOiBJbml0YWlsaXNlcyBhbiBpbnN0YW5jZSBvZiB0aGUgTWFya2Rvd24gcGx1Z2luLlxuICAjXG4gICMgZWxlbWVudCAtIFRoZSBBbm5vdGF0b3IjZWxlbWVudC5cbiAgIyBvcHRpb25zIC0gQW4gb3B0aW9ucyBPYmplY3QgKHRoZXJlIGFyZSBjdXJyZW50bHkgbm8gb3B0aW9ucykuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBwbHVnaW4gPSBuZXcgQW5ub3RhdG9yLlBsdWdpbi5NYXJrZG93bihhbm5vdGF0b3IuZWxlbWVudClcbiAgI1xuICAjIFJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgQW5ub3RhdG9yLlBsdWdpbi5NYXJrZG93bi5cbiAgY29uc3RydWN0b3I6IChlbGVtZW50LCBvcHRpb25zKSAtPlxuICAgIGlmIFNob3dkb3duPy5jb252ZXJ0ZXI/XG4gICAgICBzdXBlclxuICAgICAgQGNvbnZlcnRlciA9IG5ldyBTaG93ZG93bi5jb252ZXJ0ZXIoKVxuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUuZXJyb3IgQW5ub3RhdG9yLl90KFwiVG8gdXNlIHRoZSBNYXJrZG93biBwbHVnaW4sIHlvdSBtdXN0IGluY2x1ZGUgU2hvd2Rvd24gaW50byB0aGUgcGFnZSBmaXJzdC5cIilcblxuICAjIEFubm90YXRvciBldmVudCBjYWxsYmFjay4gRGlzcGxheXMgdGhlIGFubm90YXRpb24udGV4dCBhcyBhIE1hcmtkb3duXG4gICMgcmVuZGVyZWQgdmVyc2lvbi5cbiAgI1xuICAjIGZpZWxkICAgICAgLSBUaGUgdmlld2VyIGZpZWxkIEVsZW1lbnQuXG4gICMgYW5ub3RhdGlvbiAtIFRoZSBhbm5vdGF0aW9uIE9iamVjdCBiZWluZyBkaXNwbGF5ZWQuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIE5vcm1hbGx5IGNhbGxlZCBieSBBbm5vdGF0b3Ijdmlld2VyKClcbiAgIyAgIHBsdWdpbi51cGRhdGVUZXh0RmllbGQoZmllbGQsIHt0ZXh0OiAnTXkgX21hcmtkb3duXyBjb21tZW50J30pXG4gICMgICAkKGZpZWxkKS5odG1sKCkgIyA9PiBSZXR1cm5zIFwiTXkgPGVtPm1hcmtkb3duPC9lbT4gY29tbWVudFwiXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmdcbiAgdXBkYXRlVGV4dEZpZWxkOiAoZmllbGQsIGFubm90YXRpb24pID0+XG4gICAgIyBFc2NhcGUgYW55IEhUTUwgaW4gdGhlIHRleHQgdG8gcHJldmVudCBYU1MuXG4gICAgdGV4dCA9IEFubm90YXRvci5VdGlsLmVzY2FwZShhbm5vdGF0aW9uLnRleHQgfHwgJycpXG4gICAgJChmaWVsZCkuaHRtbCh0aGlzLmNvbnZlcnQodGV4dCkpXG5cbiAgIyBDb252ZXJ0cyBwcm92aWRlZCB0ZXh0IGludG8gbWFya2Rvd24uXG4gICNcbiAgIyB0ZXh0IC0gQSBTdHJpbmcgb2YgTWFya2Rvd24gdG8gcmVuZGVyIGFzIEhUTUwuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgcGx1Z2luLmNvbnZlcnQoJ1RoaXMgaXMgX3ZlcnlfIGJhc2ljIFtNYXJrZG93bl0oaHR0cDovL2RhcmluZ2ZpcmViYWxsLmNvbSknKVxuICAjICMgPT4gUmV0dXJucyBcIlRoaXMgaXMgPGVtPnZlcnk8ZW0+IGJhc2ljIDxhIGhyZWY9XCJodHRwOi8vLi4uXCI+TWFya2Rvd248L2E+XCJcbiAgI1xuICAjIFJldHVybnMgSFRNTCBzdHJpbmcuXG4gIGNvbnZlcnQ6ICh0ZXh0KSAtPlxuICAgIEBjb252ZXJ0ZXIubWFrZUh0bWwgdGV4dFxuXG5cbm1vZHVsZS5leHBvcnRzID0gQW5ub3RhdG9yLlBsdWdpbi5NYXJrZG93blxuIl19