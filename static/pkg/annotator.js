/*
** Annotator v2.0.0-dev-2312690
** https://github.com/okfn/annotator/
**
** Copyright 2014, the Annotator project contributors.
** Dual licensed under the MIT and GPLv3 licenses.
** https://github.com/okfn/annotator/blob/master/LICENSE
**
** Built at: 2014-03-07 10:37:42Z
*/
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.Annotator=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {
  var root = this,
      breaker = {},
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {
    return {
      keys: Object.keys,

      uniqueId: function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              if (iterator.call(context, obj[key], key, obj) === breaker) return;
            }
          }
        }
      },

      once: function(func) {
        var ran = false, memo;
        return function() {
          if (ran) return memo;
          ran = true;
          memo = func.apply(this, arguments);
          func = null;
          return memo;
        };
      }
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof define === "function") {
    define(function() {
      return Events;
    });
  } else if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],2:[function(_dereq_,module,exports){
module.exports = _dereq_('./backbone-events-standalone');

},{"./backbone-events-standalone":1}],3:[function(_dereq_,module,exports){
(function (definition) {
  if (typeof exports === "object") {
    module.exports = definition();
  }
  else if (typeof define === 'function' && define.amd) {
    define(definition);
  }
  else {
    window.BackboneExtend = definition();
  }
})(function () {
  "use strict";
  
  // mini-underscore
  var _ = {
    has: function (obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    },
  
    extend: function(obj) {
      for (var i=1; i<arguments.length; ++i) {
        var source = arguments[i];
        if (source) {
          for (var prop in source) {
            obj[prop] = source[prop];
          }
        }
      }
      return obj;
    }
  };

  /// Following code is pasted from Backbone.js ///

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Expose the extend function
  return extend;
});

},{}],4:[function(_dereq_,module,exports){
var AnnotationProvider, StorageProvider,
  __hasProp = {}.hasOwnProperty;

StorageProvider = _dereq_('./storage');

AnnotationProvider = (function() {
  AnnotationProvider.configure = function(registry) {
    if (registry['annotations'] == null) {
      registry['annotations'] = new this(registry);
    }
    return registry.include(StorageProvider);
  };

  function AnnotationProvider(registry) {
    this.registry = registry;
  }

  AnnotationProvider.prototype.create = function(obj) {
    if (obj == null) {
      obj = {};
    }
    return this._cycle(obj, 'create');
  };

  AnnotationProvider.prototype.update = function(obj) {
    if (obj.id == null) {
      throw new TypeError("annotation must have an id for update()");
    }
    return this._cycle(obj, 'update');
  };

  AnnotationProvider.prototype["delete"] = function(obj) {
    if (obj.id == null) {
      throw new TypeError("annotation must have an id for delete()");
    }
    return this._cycle(obj, 'delete');
  };

  AnnotationProvider.prototype.query = function(query) {
    return this.registry['store'].query(query);
  };

  AnnotationProvider.prototype.load = function(query) {
    return this.query(query);
  };

  AnnotationProvider.prototype._cycle = function(obj, storeFunc) {
    var safeCopy;
    safeCopy = $.extend(true, {}, obj);
    delete safeCopy._local;
    return this.registry['store'][storeFunc](safeCopy).then((function(_this) {
      return function(ret) {
        var k, v;
        for (k in obj) {
          if (!__hasProp.call(obj, k)) continue;
          v = obj[k];
          if (k !== '_local') {
            delete obj[k];
          }
        }
        $.extend(obj, ret);
        return obj;
      };
    })(this));
  };

  return AnnotationProvider;

})();

module.exports = AnnotationProvider;


},{"./storage":11}],5:[function(_dereq_,module,exports){
var AnnotationProvider, Annotator, Delegator, Editor, Notification, Range, Registry, Util, Viewer, Widget, extend, g, handleError, notification, _Annotator, _ref, _t,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

extend = _dereq_('backbone-extend-standalone');

Delegator = _dereq_('./class');

Range = _dereq_('./range');

Util = _dereq_('./util');

Widget = _dereq_('./widget');

Viewer = _dereq_('./viewer');

Editor = _dereq_('./editor');

Notification = _dereq_('./notification');

Registry = _dereq_('./registry');

AnnotationProvider = _dereq_('./annotations');

_t = Util.TranslationString;

_Annotator = this.Annotator;

handleError = function() {
  return console.error.apply(console, arguments);
};

Annotator = (function(_super) {
  __extends(Annotator, _super);

  Annotator.prototype.events = {
    ".annotator-adder button click": "onAdderClick",
    ".annotator-adder button mousedown": "onAdderMousedown",
    ".annotator-hl mouseover": "onHighlightMouseover",
    ".annotator-hl mouseout": "startViewerHideTimer"
  };

  Annotator.prototype.html = {
    adder: '<div class="annotator-adder"><button type="button">' + _t('Annotate') + '</button></div>',
    wrapper: '<div class="annotator-wrapper"></div>'
  };

  Annotator.prototype.options = {
    store: null,
    readOnly: false,
    loadQuery: {}
  };

  Annotator.prototype.plugins = {};

  Annotator.prototype.editor = null;

  Annotator.prototype.viewer = null;

  Annotator.prototype.selectedRanges = null;

  Annotator.prototype.mouseIsDown = false;

  Annotator.prototype.ignoreMouseup = false;

  Annotator.prototype.viewerHideTimer = null;

  function Annotator(element, options) {
    this.onEditAnnotation = __bind(this.onEditAnnotation, this);
    this.onAdderClick = __bind(this.onAdderClick, this);
    this.onAdderMousedown = __bind(this.onAdderMousedown, this);
    this.onHighlightMouseover = __bind(this.onHighlightMouseover, this);
    this.checkForEndSelection = __bind(this.checkForEndSelection, this);
    this.checkForStartSelection = __bind(this.checkForStartSelection, this);
    this.clearViewerHideTimer = __bind(this.clearViewerHideTimer, this);
    this.startViewerHideTimer = __bind(this.startViewerHideTimer, this);
    this.showViewer = __bind(this.showViewer, this);
    this.onEditorSubmit = __bind(this.onEditorSubmit, this);
    this.onEditorHide = __bind(this.onEditorHide, this);
    this.showEditor = __bind(this.showEditor, this);
    Annotator.__super__.constructor.apply(this, arguments);
    this.plugins = {};
    Annotator._instances.push(this);
    if (!Annotator.supported()) {
      return this;
    }
    Registry.createApp(this, options);
  }

  Annotator.extend = extend;

  Annotator.prototype._setupWrapper = function() {
    this.wrapper = $(this.html.wrapper);
    this.element.find('script').remove();
    this.element.wrapInner(this.wrapper);
    this.wrapper = this.element.find('.annotator-wrapper');
    return this;
  };

  Annotator.prototype._setupViewer = function() {
    this.viewer = new Annotator.Viewer({
      readOnly: this.options.readOnly
    });
    this.viewer.hide().on("edit", this.onEditAnnotation).on("delete", (function(_this) {
      return function(annotation) {
        _this.viewer.hide();
        _this.publish('beforeAnnotationDeleted', [annotation]);
        _this.cleanupAnnotation(annotation);
        return _this.annotations["delete"](annotation).done(function() {
          return _this.publish('annotationDeleted', [annotation]);
        });
      };
    })(this)).addField({
      load: (function(_this) {
        return function(field, annotation) {
          if (annotation.text) {
            $(field).html(Util.escape(annotation.text));
          } else {
            $(field).html("<i>" + (_t('No Comment')) + "</i>");
          }
          return _this.publish('annotationViewerTextField', [field, annotation]);
        };
      })(this)
    }).element.appendTo(this.wrapper).bind({
      "mouseover": this.clearViewerHideTimer,
      "mouseout": this.startViewerHideTimer
    });
    return this;
  };

  Annotator.prototype._setupEditor = function() {
    this.editor = new Annotator.Editor();
    this.editor.hide().on('hide', this.onEditorHide).on('save', this.onEditorSubmit).addField({
      type: 'textarea',
      label: _t('Comments') + '\u2026',
      load: function(field, annotation) {
        return $(field).find('textarea').val(annotation.text || '');
      },
      submit: function(field, annotation) {
        return annotation.text = $(field).find('textarea').val();
      }
    });
    this.editor.element.appendTo(this.wrapper);
    return this;
  };

  Annotator.prototype._setupDocumentEvents = function() {
    $(document).bind({
      "mouseup": this.checkForEndSelection,
      "mousedown": this.checkForStartSelection
    });
    return this;
  };

  Annotator.prototype._setupDynamicStyle = function() {
    var max, sel, style, x;
    style = $('#annotator-dynamic-style');
    if (!style.length) {
      style = $('<style id="annotator-dynamic-style"></style>').appendTo(document.head);
    }
    sel = '*' + ((function() {
      var _i, _len, _ref, _results;
      _ref = ['adder', 'outer', 'notice', 'filter'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        _results.push(":not(.annotator-" + x + ")");
      }
      return _results;
    })()).join('');
    max = Util.maxZIndex($(document.body).find(sel));
    max = Math.max(max, 1000);
    style.text([".annotator-adder, .annotator-outer, .annotator-notice {", "  z-index: " + (max + 20) + ";", "}", ".annotator-filter {", "  z-index: " + (max + 10) + ";", "}"].join("\n"));
    return this;
  };

  Annotator.prototype.load = function(query) {
    return this.annotations.load(query).then((function(_this) {
      return function(annotations, meta) {
        return _this.loadAnnotations(annotations);
      };
    })(this));
  };

  Annotator.prototype.destroy = function() {
    var idx, name, plugin, _ref;
    $(document).unbind({
      "mouseup": this.checkForEndSelection,
      "mousedown": this.checkForStartSelection
    });
    $('#annotator-dynamic-style').remove();
    this.adder.remove();
    this.viewer.destroy();
    this.editor.destroy();
    this.wrapper.find('.annotator-hl').each(function() {
      $(this).contents().insertBefore(this);
      return $(this).remove();
    });
    this.wrapper.contents().insertBefore(this.wrapper);
    this.wrapper.remove();
    this.element.data('annotator', null);
    _ref = this.plugins;
    for (name in _ref) {
      plugin = _ref[name];
      this.plugins[name].destroy();
    }
    this.removeEvents();
    idx = Annotator._instances.indexOf(this);
    if (idx !== -1) {
      return Annotator._instances.splice(idx, 1);
    }
  };

  Annotator.prototype.getSelectedRanges = function() {
    var browserRange, i, normedRange, r, ranges, rangesToIgnore, selection, _i, _len;
    selection = Util.getGlobal().getSelection();
    ranges = [];
    rangesToIgnore = [];
    if (!selection.isCollapsed) {
      ranges = (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = selection.rangeCount; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          r = selection.getRangeAt(i);
          browserRange = new Range.BrowserRange(r);
          normedRange = browserRange.normalize().limit(this.wrapper[0]);
          if (normedRange === null) {
            rangesToIgnore.push(r);
          }
          _results.push(normedRange);
        }
        return _results;
      }).call(this);
      selection.removeAllRanges();
    }
    for (_i = 0, _len = rangesToIgnore.length; _i < _len; _i++) {
      r = rangesToIgnore[_i];
      selection.addRange(r);
    }
    return $.grep(ranges, function(range) {
      if (range) {
        selection.addRange(range.toRange());
      }
      return range;
    });
  };

  Annotator.prototype.setupAnnotation = function(annotation) {
    var e, normed, normedRanges, r, root, _i, _j, _len, _len1, _ref;
    root = this.wrapper[0];
    normedRanges = [];
    _ref = annotation.ranges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      r = _ref[_i];
      try {
        normedRanges.push(Range.sniff(r).normalize(root));
      } catch (_error) {
        e = _error;
        if (e instanceof Range.RangeError) {
          this.publish('rangeNormalizeFail', [annotation, r, e]);
        } else {
          throw e;
        }
      }
    }
    annotation.quote = [];
    annotation.ranges = [];
    annotation._local = {};
    annotation._local.highlights = [];
    for (_j = 0, _len1 = normedRanges.length; _j < _len1; _j++) {
      normed = normedRanges[_j];
      annotation.quote.push($.trim(normed.text()));
      annotation.ranges.push(normed.serialize(this.wrapper[0], '.annotator-hl'));
      $.merge(annotation._local.highlights, this.highlightRange(normed));
    }
    annotation.quote = annotation.quote.join(' / ');
    $(annotation._local.highlights).data('annotation', annotation);
    return annotation;
  };

  Annotator.prototype.cleanupAnnotation = function(annotation) {
    var h, _i, _len, _ref, _ref1;
    if (((_ref = annotation._local) != null ? _ref.highlights : void 0) != null) {
      _ref1 = annotation._local.highlights;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        h = _ref1[_i];
        if (h.parentNode != null) {
          $(h).replaceWith(h.childNodes);
        }
      }
      delete annotation._local.highlights;
    }
    return annotation;
  };

  Annotator.prototype.loadAnnotations = function(annotations) {
    var clone, loader;
    if (annotations == null) {
      annotations = [];
    }
    loader = (function(_this) {
      return function(annList) {
        var n, now, _i, _len;
        if (annList == null) {
          annList = [];
        }
        now = annList.splice(0, 10);
        for (_i = 0, _len = now.length; _i < _len; _i++) {
          n = now[_i];
          _this.setupAnnotation(n);
        }
        if (annList.length > 0) {
          return setTimeout((function() {
            return loader(annList);
          }), 10);
        } else {
          return _this.publish('annotationsLoaded', [clone]);
        }
      };
    })(this);
    clone = annotations.slice();
    loader(annotations);
    return this;
  };

  Annotator.prototype.dumpAnnotations = function() {
    if (this.plugins['Store']) {
      return this.plugins['Store'].dumpAnnotations();
    } else {
      console.warn(_t("Can't dump annotations without Store plugin."));
      return false;
    }
  };

  Annotator.prototype.highlightRange = function(normedRange, cssClass) {
    var hl, node, white, _i, _len, _ref, _results;
    if (cssClass == null) {
      cssClass = 'annotator-hl';
    }
    white = /^\s*$/;
    hl = $("<span class='" + cssClass + "'></span>");
    _ref = normedRange.textNodes();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      if (!white.test(node.nodeValue)) {
        _results.push($(node).wrapAll(hl).parent().show()[0]);
      }
    }
    return _results;
  };

  Annotator.prototype.highlightRanges = function(normedRanges, cssClass) {
    var highlights, r, _i, _len;
    if (cssClass == null) {
      cssClass = 'annotator-hl';
    }
    highlights = [];
    for (_i = 0, _len = normedRanges.length; _i < _len; _i++) {
      r = normedRanges[_i];
      $.merge(highlights, this.highlightRange(r, cssClass));
    }
    return highlights;
  };

  Annotator.prototype.addPlugin = function(name, options) {
    var klass, _base;
    if (this.plugins[name]) {
      console.error(_t("You cannot have more than one instance of any plugin."));
    } else {
      klass = Annotator.Plugin[name];
      if (typeof klass === 'function') {
        this.plugins[name] = new klass(this.element[0], options);
        this.plugins[name].annotator = this;
        if (typeof (_base = this.plugins[name]).pluginInit === "function") {
          _base.pluginInit();
        }
      } else {
        console.error(_t("Could not load ") + name + _t(" plugin. Have you included the appropriate <script> tag?"));
      }
    }
    return this;
  };

  Annotator.prototype.editAnnotation = function(annotation, position) {
    var dfd, reject, resolve;
    dfd = $.Deferred();
    resolve = dfd.resolve.bind(dfd, annotation);
    reject = dfd.reject.bind(dfd, annotation);
    this.showEditor(annotation, position);
    this.subscribe('annotationEditorSubmit', resolve);
    this.once('annotationEditorHidden', (function(_this) {
      return function() {
        _this.unsubscribe('annotationEditorSubmit', resolve);
        if (dfd.state() === 'pending') {
          return reject();
        }
      };
    })(this));
    return dfd.promise();
  };

  Annotator.prototype.showEditor = function(annotation, location) {
    this.editor.element.css(location);
    this.editor.load(annotation);
    this.publish('annotationEditorShown', [this.editor, annotation]);
    return this;
  };

  Annotator.prototype.onEditorHide = function() {
    this.publish('annotationEditorHidden', [this.editor]);
    return this.ignoreMouseup = false;
  };

  Annotator.prototype.onEditorSubmit = function(annotation) {
    return this.publish('annotationEditorSubmit', [this.editor, annotation]);
  };

  Annotator.prototype.showViewer = function(annotations, location) {
    this.viewer.element.css(location);
    this.viewer.load(annotations);
    return this.publish('annotationViewerShown', [this.viewer, annotations]);
  };

  Annotator.prototype.startViewerHideTimer = function() {
    if (!this.viewerHideTimer) {
      return this.viewerHideTimer = setTimeout(this.viewer.hide, 250);
    }
  };

  Annotator.prototype.clearViewerHideTimer = function() {
    clearTimeout(this.viewerHideTimer);
    return this.viewerHideTimer = false;
  };

  Annotator.prototype.checkForStartSelection = function(event) {
    if (!(event && this.isAnnotator(event.target))) {
      this.startViewerHideTimer();
    }
    return this.mouseIsDown = true;
  };

  Annotator.prototype.checkForEndSelection = function(event) {
    var container, range, _i, _len, _ref;
    this.mouseIsDown = false;
    if (this.ignoreMouseup) {
      return;
    }
    this.selectedRanges = this.getSelectedRanges();
    _ref = this.selectedRanges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      range = _ref[_i];
      container = range.commonAncestor;
      if ($(container).hasClass('annotator-hl')) {
        container = $(container).parents('[class!=annotator-hl]')[0];
      }
      if (this.isAnnotator(container)) {
        return;
      }
    }
    if (event && this.selectedRanges.length) {
      return this.adder.css(Util.mousePosition(event, this.wrapper[0])).show();
    } else {
      return this.adder.hide();
    }
  };

  Annotator.prototype.isAnnotator = function(element) {
    return !!$(element).parents().addBack().filter('[class^=annotator-]').not(this.wrapper).length;
  };

  Annotator.prototype.configure = function(registry) {
    this.registry = registry;
    return registry.include(AnnotationProvider);
  };

  Annotator.prototype.run = function(registry) {
    this.registry = registry;
    if (!this.options.readOnly) {
      this._setupDocumentEvents();
    }
    this._setupWrapper()._setupViewer()._setupEditor();
    this._setupDynamicStyle();
    this.adder = $(this.html.adder).appendTo(this.wrapper).hide();
    if (this.options.loadQuery) {
      return this.load(this.options.loadQuery);
    }
  };

  Annotator.prototype.onHighlightMouseover = function(event) {
    var annotations;
    this.clearViewerHideTimer();
    if (this.mouseIsDown || this.viewer.isShown()) {
      return false;
    }
    annotations = $(event.target).parents('.annotator-hl').addBack().map(function() {
      return $(this).data("annotation");
    });
    return this.showViewer($.makeArray(annotations), Util.mousePosition(event, this.wrapper[0]));
  };

  Annotator.prototype.onAdderMousedown = function(event) {
    if (event != null) {
      event.preventDefault();
    }
    return this.ignoreMouseup = true;
  };

  Annotator.prototype.onAdderClick = function(event) {
    var annotation, position;
    if (event != null) {
      event.preventDefault();
    }
    position = this.adder.position();
    this.adder.hide();
    annotation = {
      ranges: this.selectedRanges
    };
    return $.when(annotation).done((function(_this) {
      return function(annotation) {
        return _this.publish('beforeAnnotationCreated', [annotation]);
      };
    })(this)).then((function(_this) {
      return function(annotation) {
        return _this.setupAnnotation(annotation);
      };
    })(this)).done((function(_this) {
      return function(annotation) {
        return $(annotation._local.highlights).addClass('annotator-hl-temporary');
      };
    })(this)).then((function(_this) {
      return function(annotation) {
        return _this.editAnnotation(annotation, position);
      };
    })(this)).then((function(_this) {
      return function(annotation) {
        return _this.annotations.create(annotation).fail(handleError);
      };
    })(this)).done((function(_this) {
      return function(annotation) {
        return $(annotation._local.highlights).removeClass('annotator-hl-temporary');
      };
    })(this)).done((function(_this) {
      return function(annotation) {
        return _this.publish('annotationCreated', [annotation]);
      };
    })(this)).fail(this.cleanupAnnotation);
  };

  Annotator.prototype.onEditAnnotation = function(annotation) {
    var position;
    position = this.viewer.element.position();
    this.viewer.hide();
    return $.when(annotation).done((function(_this) {
      return function(annotation) {
        return _this.publish('beforeAnnotationUpdated', [annotation]);
      };
    })(this)).then((function(_this) {
      return function(annotation) {
        return _this.editAnnotation(annotation, position);
      };
    })(this)).then((function(_this) {
      return function(annotation) {
        return _this.annotations.update(annotation).fail(handleError);
      };
    })(this)).done((function(_this) {
      return function(annotation) {
        return _this.publish('annotationUpdated', [annotation]);
      };
    })(this));
  };

  return Annotator;

})(Delegator);

Annotator.Plugin = (function(_super) {
  __extends(Plugin, _super);

  function Plugin(element, options) {
    Plugin.__super__.constructor.apply(this, arguments);
  }

  Plugin.prototype.pluginInit = function() {};

  Plugin.prototype.destroy = function() {
    return this.removeEvents();
  };

  return Plugin;

})(Delegator);

g = Util.getGlobal();

if (((_ref = g.document) != null ? _ref.evaluate : void 0) == null) {
  $.getScript('http://assets.annotateit.org/vendor/xpath.min.js');
}

if (g.getSelection == null) {
  $.getScript('http://assets.annotateit.org/vendor/ierange.min.js');
}

if (g.JSON == null) {
  $.getScript('http://assets.annotateit.org/vendor/json2.min.js');
}

if (g.Node == null) {
  g.Node = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  };
}

Annotator.Delegator = Delegator;

Annotator.Range = Range;

Annotator.Util = Util;

Annotator.Widget = Widget;

Annotator.Viewer = Viewer;

Annotator.Editor = Editor;

Annotator.Notification = Notification;

notification = new Notification;

Annotator.showNotification = notification.show;

Annotator.hideNotification = notification.hide;

Annotator._instances = [];

Annotator._t = _t;

Annotator.supported = function() {
  return (function() {
    return !!this.getSelection;
  })();
};

Annotator.noConflict = function() {
  Util.getGlobal().Annotator = _Annotator;
  return this;
};

$.fn.annotator = function(options) {
  var args;
  args = Array.prototype.slice.call(arguments, 1);
  return this.each(function() {
    var instance;
    instance = $.data(this, 'annotator');
    if (instance) {
      return options && instance[options].apply(instance, args);
    } else {
      instance = new Annotator(this, options);
      return $.data(this, 'annotator', instance);
    }
  });
};

module.exports = Annotator;


},{"./annotations":4,"./class":6,"./editor":7,"./notification":8,"./range":9,"./registry":10,"./util":12,"./viewer":13,"./widget":14,"backbone-extend-standalone":3}],6:[function(_dereq_,module,exports){
var BackboneEvents, Delegator, Util,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty;

Util = _dereq_('./util');

Delegator = (function() {
  Delegator.prototype.events = {};

  Delegator.prototype.options = {};

  Delegator.prototype.element = null;

  function Delegator(element, options) {
    this.options = $.extend(true, {}, this.options, options);
    this.element = $(element);
    this._closures = {};
    this.addEvents();
  }

  Delegator.prototype.addEvents = function() {
    var event, _i, _len, _ref, _results;
    _ref = Delegator._parseEvents(this.events);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      _results.push(this._addEvent(event.selector, event.event, event.functionName));
    }
    return _results;
  };

  Delegator.prototype.removeEvents = function() {
    var event, _i, _len, _ref, _results;
    _ref = Delegator._parseEvents(this.events);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      _results.push(this._removeEvent(event.selector, event.event, event.functionName));
    }
    return _results;
  };

  Delegator.prototype._addEvent = function(selector, event, functionName) {
    var closure;
    closure = (function(_this) {
      return function() {
        return _this[functionName].apply(_this, arguments);
      };
    })(this);
    if (selector === '' && Delegator._isCustomEvent(event)) {
      this.subscribe(event, closure);
    } else {
      this.element.delegate(selector, event, closure);
    }
    this._closures["" + selector + "/" + event + "/" + functionName] = closure;
    return this;
  };

  Delegator.prototype._removeEvent = function(selector, event, functionName) {
    var closure;
    closure = this._closures["" + selector + "/" + event + "/" + functionName];
    if (selector === '' && Delegator._isCustomEvent(event)) {
      this.unsubscribe(event, closure);
    } else {
      this.element.undelegate(selector, event, closure);
    }
    delete this._closures["" + selector + "/" + event + "/" + functionName];
    return this;
  };

  Delegator.prototype.publish = function(name, args) {
    if (args == null) {
      args = [];
    }
    return this.trigger.apply(this, [name].concat(__slice.call(args)));
  };

  Delegator.prototype.subscribe = function(event, callback, context) {
    if (context == null) {
      context = this;
    }
    return this.on(event, callback, context);
  };

  Delegator.prototype.unsubscribe = function(event, callback, context) {
    if (context == null) {
      context = this;
    }
    return this.off(event, callback, context);
  };

  return Delegator;

})();

Delegator._parseEvents = function(eventsObj) {
  var event, events, functionName, sel, selector, _i, _ref;
  events = [];
  for (sel in eventsObj) {
    functionName = eventsObj[sel];
    _ref = sel.split(' '), selector = 2 <= _ref.length ? __slice.call(_ref, 0, _i = _ref.length - 1) : (_i = 0, []), event = _ref[_i++];
    events.push({
      selector: selector.join(' '),
      event: event,
      functionName: functionName
    });
  }
  return events;
};

Delegator.natives = (function() {
  var key, specials, val;
  specials = (function() {
    var _ref, _results;
    _ref = $.event.special;
    _results = [];
    for (key in _ref) {
      if (!__hasProp.call(_ref, key)) continue;
      val = _ref[key];
      _results.push(key);
    }
    return _results;
  })();
  return "blur focus focusin focusout load resize scroll unload click dblclick\nmousedown mouseup mousemove mouseover mouseout mouseenter mouseleave\nchange select submit keydown keypress keyup error".split(/[^a-z]+/).concat(specials);
})();

Delegator._isCustomEvent = function(event) {
  event = event.split('.')[0];
  return $.inArray(event, Delegator.natives) === -1;
};

BackboneEvents = _dereq_('backbone-events-standalone');

BackboneEvents.mixin(Delegator.prototype);

module.exports = Delegator;


},{"./util":12,"backbone-events-standalone":2}],7:[function(_dereq_,module,exports){
var Editor, Util, Widget, _t,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Util = _dereq_('./util');

Widget = _dereq_('./widget');

_t = Util.TranslationString;

Editor = (function(_super) {
  __extends(Editor, _super);

  Editor.prototype.events = {
    "form submit": "submit",
    ".annotator-save click": "submit",
    ".annotator-cancel click": "hide",
    ".annotator-cancel mouseover": "onCancelButtonMouseover",
    "textarea keydown": "processKeypress"
  };

  Editor.prototype.classes = {
    hide: 'annotator-hide',
    focus: 'annotator-focus'
  };

  Editor.prototype.html = "<div class=\"annotator-outer annotator-editor\">\n  <form class=\"annotator-widget\">\n    <ul class=\"annotator-listing\"></ul>\n    <div class=\"annotator-controls\">\n      <a href=\"#cancel\" class=\"annotator-cancel\">" + _t('Cancel') + "</a>\n<a href=\"#save\" class=\"annotator-save annotator-focus\">" + _t('Save') + "</a>\n    </div>\n  </form>\n</div>";

  Editor.prototype.options = {};

  function Editor(options) {
    this.onCancelButtonMouseover = __bind(this.onCancelButtonMouseover, this);
    this.processKeypress = __bind(this.processKeypress, this);
    this.submit = __bind(this.submit, this);
    this.load = __bind(this.load, this);
    this.hide = __bind(this.hide, this);
    this.show = __bind(this.show, this);
    Editor.__super__.constructor.call(this, $(this.html)[0], options);
    this.fields = [];
    this.annotation = {};
  }

  Editor.prototype.show = function(event) {
    Util.preventEventDefault(event);
    this.element.removeClass(this.classes.hide);
    this.element.find('.annotator-save').addClass(this.classes.focus);
    this.checkOrientation();
    this.element.find(":input:first").focus();
    this.setupDraggables();
    return this.publish('show');
  };

  Editor.prototype.hide = function(event) {
    Util.preventEventDefault(event);
    this.element.addClass(this.classes.hide);
    return this.publish('hide');
  };

  Editor.prototype.load = function(annotation) {
    var field, _i, _len, _ref;
    this.annotation = annotation;
    this.publish('load', [this.annotation]);
    _ref = this.fields;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      field = _ref[_i];
      field.load(field.element, this.annotation);
    }
    return this.show();
  };

  Editor.prototype.submit = function(event) {
    var field, _i, _len, _ref;
    Util.preventEventDefault(event);
    _ref = this.fields;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      field = _ref[_i];
      field.submit(field.element, this.annotation);
    }
    this.publish('save', [this.annotation]);
    return this.hide();
  };

  Editor.prototype.addField = function(options) {
    var element, field, input;
    field = $.extend({
      id: 'annotator-field-' + Util.uuid(),
      type: 'input',
      label: '',
      load: function() {},
      submit: function() {}
    }, options);
    input = null;
    element = $('<li class="annotator-item" />');
    field.element = element[0];
    switch (field.type) {
      case 'textarea':
        input = $('<textarea />');
        break;
      case 'input':
      case 'checkbox':
        input = $('<input />');
        break;
      case 'select':
        input = $('<select />');
    }
    element.append(input);
    input.attr({
      id: field.id,
      placeholder: field.label
    });
    if (field.type === 'checkbox') {
      input[0].type = 'checkbox';
      element.addClass('annotator-checkbox');
      element.append($('<label />', {
        "for": field.id,
        html: field.label
      }));
    }
    this.element.find('ul:first').append(element);
    this.fields.push(field);
    return field.element;
  };

  Editor.prototype.checkOrientation = function() {
    var controls, list;
    Editor.__super__.checkOrientation.apply(this, arguments);
    list = this.element.find('ul');
    controls = this.element.find('.annotator-controls');
    if (this.element.hasClass(this.classes.invert.y)) {
      controls.insertBefore(list);
    } else if (controls.is(':first-child')) {
      controls.insertAfter(list);
    }
    return this;
  };

  Editor.prototype.processKeypress = function(event) {
    if (event.keyCode === 27) {
      return this.hide();
    } else if (event.keyCode === 13 && !event.shiftKey) {
      return this.submit();
    }
  };

  Editor.prototype.onCancelButtonMouseover = function() {
    return this.element.find('.' + this.classes.focus).removeClass(this.classes.focus);
  };

  Editor.prototype.setupDraggables = function() {
    var classes, controls, cornerItem, editor, mousedown, onMousedown, onMousemove, onMouseup, resize, textarea, throttle;
    this.element.find('.annotator-resize').remove();
    if (this.element.hasClass(this.classes.invert.y)) {
      cornerItem = this.element.find('.annotator-item:last');
    } else {
      cornerItem = this.element.find('.annotator-item:first');
    }
    if (cornerItem) {
      $('<span class="annotator-resize"></span>').appendTo(cornerItem);
    }
    mousedown = null;
    classes = this.classes;
    editor = this.element;
    textarea = null;
    resize = editor.find('.annotator-resize');
    controls = editor.find('.annotator-controls');
    throttle = false;
    onMousedown = function(event) {
      if (event.target === this) {
        mousedown = {
          element: this,
          top: event.pageY,
          left: event.pageX
        };
        textarea = editor.find('textarea:first');
        $(window).bind({
          'mouseup.annotator-editor-resize': onMouseup,
          'mousemove.annotator-editor-resize': onMousemove
        });
        return event.preventDefault();
      }
    };
    onMouseup = function() {
      mousedown = null;
      return $(window).unbind('.annotator-editor-resize');
    };
    onMousemove = (function(_this) {
      return function(event) {
        var diff, directionX, directionY, height, width;
        if (mousedown && throttle === false) {
          diff = {
            top: event.pageY - mousedown.top,
            left: event.pageX - mousedown.left
          };
          if (mousedown.element === resize[0]) {
            height = textarea.outerHeight();
            width = textarea.outerWidth();
            directionX = editor.hasClass(classes.invert.x) ? -1 : 1;
            directionY = editor.hasClass(classes.invert.y) ? 1 : -1;
            textarea.height(height + (diff.top * directionY));
            textarea.width(width + (diff.left * directionX));
            if (textarea.outerHeight() !== height) {
              mousedown.top = event.pageY;
            }
            if (textarea.outerWidth() !== width) {
              mousedown.left = event.pageX;
            }
          } else if (mousedown.element === controls[0]) {
            editor.css({
              top: parseInt(editor.css('top'), 10) + diff.top,
              left: parseInt(editor.css('left'), 10) + diff.left
            });
            mousedown.top = event.pageY;
            mousedown.left = event.pageX;
          }
          throttle = true;
          return setTimeout(function() {
            return throttle = false;
          }, 1000 / 60);
        }
      };
    })(this);
    resize.bind('mousedown', onMousedown);
    return controls.bind('mousedown', onMousedown);
  };

  return Editor;

})(Widget);

module.exports = Editor;


},{"./util":12,"./widget":14}],8:[function(_dereq_,module,exports){
var Delegator, Notification, Util,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Delegator = _dereq_('./class');

Util = _dereq_('./util');

Notification = (function(_super) {
  __extends(Notification, _super);

  Notification.prototype.events = {
    "click": "hide"
  };

  Notification.prototype.options = {
    html: "<div class='annotator-notice'></div>",
    classes: {
      show: "annotator-notice-show",
      info: "annotator-notice-info",
      success: "annotator-notice-success",
      error: "annotator-notice-error"
    }
  };

  function Notification(options) {
    this.hide = __bind(this.hide, this);
    this.show = __bind(this.show, this);
    Notification.__super__.constructor.call(this, $(this.options.html)[0], options);
  }

  Notification.prototype.show = function(message, status) {
    if (status == null) {
      status = Notification.INFO;
    }
    this.currentStatus = status;
    this._appendElement();
    $(this.element).addClass(this.options.classes.show).addClass(this.options.classes[this.currentStatus]).html(Util.escape(message || ""));
    setTimeout(this.hide, 5000);
    return this;
  };

  Notification.prototype.hide = function() {
    if (this.currentStatus == null) {
      this.currentStatus = Annotator.Notification.INFO;
    }
    $(this.element).removeClass(this.options.classes.show).removeClass(this.options.classes[this.currentStatus]);
    return this;
  };

  Notification.prototype._appendElement = function() {
    if (this.element.parentNode == null) {
      return $(this.element).appendTo(document.body);
    }
  };

  return Notification;

})(Delegator);

Notification.INFO = 'info';

Notification.SUCCESS = 'success';

Notification.ERROR = 'error';

module.exports = Notification;


},{"./class":6,"./util":12}],9:[function(_dereq_,module,exports){
var Range, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Util = _dereq_('./util');

Range = {};

Range.sniff = function(r) {
  if (r.commonAncestorContainer != null) {
    return new Range.BrowserRange(r);
  } else if (typeof r.start === "string") {
    return new Range.SerializedRange(r);
  } else if (r.start && typeof r.start === "object") {
    return new Range.NormalizedRange(r);
  } else {
    console.error(_t("Could not sniff range type"));
    return false;
  }
};

Range.nodeFromXPath = function(xpath, root) {
  var customResolver, evaluateXPath, namespace, node, segment;
  if (root == null) {
    root = document;
  }
  evaluateXPath = function(xp, nsResolver) {
    var exception;
    if (nsResolver == null) {
      nsResolver = null;
    }
    try {
      return document.evaluate('.' + xp, root, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch (_error) {
      exception = _error;
      console.log("XPath evaluation failed.");
      console.log("Trying fallback...");
      return Util.nodeFromXPath(xp, root);
    }
  };
  if (!$.isXMLDoc(document.documentElement)) {
    return evaluateXPath(xpath);
  } else {
    customResolver = document.createNSResolver(document.ownerDocument === null ? document.documentElement : document.ownerDocument.documentElement);
    node = evaluateXPath(xpath, customResolver);
    if (!node) {
      xpath = ((function() {
        var _i, _len, _ref, _results;
        _ref = xpath.split('/');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          segment = _ref[_i];
          if (segment && segment.indexOf(':') === -1) {
            _results.push(segment.replace(/^([a-z]+)/, 'xhtml:$1'));
          } else {
            _results.push(segment);
          }
        }
        return _results;
      })()).join('/');
      namespace = document.lookupNamespaceURI(null);
      customResolver = function(ns) {
        if (ns === 'xhtml') {
          return namespace;
        } else {
          return document.documentElement.getAttribute('xmlns:' + ns);
        }
      };
      node = evaluateXPath(xpath, customResolver);
    }
    return node;
  }
};

Range.RangeError = (function(_super) {
  __extends(RangeError, _super);

  function RangeError(type, message, parent) {
    this.type = type;
    this.message = message;
    this.parent = parent != null ? parent : null;
    RangeError.__super__.constructor.call(this, this.message);
  }

  return RangeError;

})(Error);

Range.BrowserRange = (function() {
  function BrowserRange(obj) {
    this.commonAncestorContainer = obj.commonAncestorContainer;
    this.startContainer = obj.startContainer;
    this.startOffset = obj.startOffset;
    this.endContainer = obj.endContainer;
    this.endOffset = obj.endOffset;
  }

  BrowserRange.prototype.normalize = function(root) {
    var n, node, nr, r;
    if (this.tainted) {
      console.error(_t("You may only call normalize() once on a BrowserRange!"));
      return false;
    } else {
      this.tainted = true;
    }
    r = {};
    if (this.startContainer.nodeType === Node.ELEMENT_NODE) {
      r.start = Util.getFirstTextNodeNotBefore(this.startContainer.childNodes[this.startOffset]);
      r.startOffset = 0;
    } else {
      r.start = this.startContainer;
      r.startOffset = this.startOffset;
    }
    if (this.endContainer.nodeType === Node.ELEMENT_NODE) {
      node = this.endContainer.childNodes[this.endOffset];
      if (node != null) {
        n = node;
        while ((n != null) && (n.nodeType !== Node.TEXT_NODE)) {
          n = n.firstChild;
        }
        if (n != null) {
          r.end = n;
          r.endOffset = 0;
        }
      }
      if (r.end == null) {
        if (this.endOffset) {
          node = this.endContainer.childNodes[this.endOffset - 1];
        } else {
          node = this.endContainer.previousSibling;
        }
        r.end = Util.getLastTextNodeUpTo(node);
        r.endOffset = r.end.nodeValue.length;
      }
    } else {
      r.end = this.endContainer;
      r.endOffset = this.endOffset;
    }
    nr = {};
    if (r.startOffset > 0) {
      if (r.start.nodeValue.length > r.startOffset) {
        nr.start = r.start.splitText(r.startOffset);
      } else {
        nr.start = r.start.nextSibling;
      }
    } else {
      nr.start = r.start;
    }
    if (r.start === r.end) {
      if (nr.start.nodeValue.length > (r.endOffset - r.startOffset)) {
        nr.start.splitText(r.endOffset - r.startOffset);
      }
      nr.end = nr.start;
    } else {
      if (r.end.nodeValue.length > r.endOffset) {
        r.end.splitText(r.endOffset);
      }
      nr.end = r.end;
    }
    nr.commonAncestor = this.commonAncestorContainer;
    while (nr.commonAncestor.nodeType !== Node.ELEMENT_NODE) {
      nr.commonAncestor = nr.commonAncestor.parentNode;
    }
    return new Range.NormalizedRange(nr);
  };

  BrowserRange.prototype.serialize = function(root, ignoreSelector) {
    return this.normalize(root).serialize(root, ignoreSelector);
  };

  return BrowserRange;

})();

Range.NormalizedRange = (function() {
  function NormalizedRange(obj) {
    this.commonAncestor = obj.commonAncestor;
    this.start = obj.start;
    this.end = obj.end;
  }

  NormalizedRange.prototype.normalize = function(root) {
    return this;
  };

  NormalizedRange.prototype.limit = function(bounds) {
    var nodes, parent, startParents, _i, _len, _ref;
    nodes = $.grep(this.textNodes(), function(node) {
      return node.parentNode === bounds || $.contains(bounds, node.parentNode);
    });
    if (!nodes.length) {
      return null;
    }
    this.start = nodes[0];
    this.end = nodes[nodes.length - 1];
    startParents = $(this.start).parents();
    _ref = $(this.end).parents();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      parent = _ref[_i];
      if (startParents.index(parent) !== -1) {
        this.commonAncestor = parent;
        break;
      }
    }
    return this;
  };

  NormalizedRange.prototype.serialize = function(root, ignoreSelector) {
    var end, serialization, start;
    serialization = function(node, isEnd) {
      var n, nodes, offset, origParent, textNodes, xpath, _i, _len;
      if (ignoreSelector) {
        origParent = $(node).parents(":not(" + ignoreSelector + ")").eq(0);
      } else {
        origParent = $(node).parent();
      }
      xpath = Util.xpathFromNode(origParent, root)[0];
      textNodes = Util.getTextNodes(origParent);
      nodes = textNodes.slice(0, textNodes.index(node));
      offset = 0;
      for (_i = 0, _len = nodes.length; _i < _len; _i++) {
        n = nodes[_i];
        offset += n.nodeValue.length;
      }
      if (isEnd) {
        return [xpath, offset + node.nodeValue.length];
      } else {
        return [xpath, offset];
      }
    };
    start = serialization(this.start);
    end = serialization(this.end, true);
    return new Range.SerializedRange({
      start: start[0],
      end: end[0],
      startOffset: start[1],
      endOffset: end[1]
    });
  };

  NormalizedRange.prototype.text = function() {
    var node;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.textNodes();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        _results.push(node.nodeValue);
      }
      return _results;
    }).call(this)).join('');
  };

  NormalizedRange.prototype.textNodes = function() {
    var end, start, textNodes, _ref;
    textNodes = Util.getTextNodes($(this.commonAncestor));
    _ref = [textNodes.index(this.start), textNodes.index(this.end)], start = _ref[0], end = _ref[1];
    return $.makeArray(textNodes.slice(start, +end + 1 || 9e9));
  };

  NormalizedRange.prototype.toRange = function() {
    var range;
    range = document.createRange();
    range.setStartBefore(this.start);
    range.setEndAfter(this.end);
    return range;
  };

  return NormalizedRange;

})();

Range.SerializedRange = (function() {
  function SerializedRange(obj) {
    this.start = obj.start;
    this.startOffset = obj.startOffset;
    this.end = obj.end;
    this.endOffset = obj.endOffset;
  }

  SerializedRange.prototype.normalize = function(root) {
    var contains, e, length, node, p, range, targetOffset, tn, _i, _j, _len, _len1, _ref, _ref1;
    range = {};
    _ref = ['start', 'end'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      p = _ref[_i];
      try {
        node = Range.nodeFromXPath(this[p], root);
      } catch (_error) {
        e = _error;
        throw new Range.RangeError(p, ("Error while finding " + p + " node: " + this[p] + ": ") + e, e);
      }
      if (!node) {
        throw new Range.RangeError(p, "Couldn't find " + p + " node: " + this[p]);
      }
      length = 0;
      targetOffset = this[p + 'Offset'];
      if (p === 'end') {
        targetOffset--;
      }
      _ref1 = Util.getTextNodes($(node));
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        tn = _ref1[_j];
        if (length + tn.nodeValue.length > targetOffset) {
          range[p + 'Container'] = tn;
          range[p + 'Offset'] = this[p + 'Offset'] - length;
          break;
        } else {
          length += tn.nodeValue.length;
        }
      }
      if (range[p + 'Offset'] == null) {
        throw new Range.RangeError("" + p + "offset", "Couldn't find offset " + this[p + 'Offset'] + " in element " + this[p]);
      }
    }
    contains = document.compareDocumentPosition == null ? function(a, b) {
      return a.contains(b);
    } : function(a, b) {
      return a.compareDocumentPosition(b) & 16;
    };
    $(range.startContainer).parents().each(function() {
      if (contains(this, range.endContainer)) {
        range.commonAncestorContainer = this;
        return false;
      }
    });
    return new Range.BrowserRange(range).normalize(root);
  };

  SerializedRange.prototype.serialize = function(root, ignoreSelector) {
    return this.normalize(root).serialize(root, ignoreSelector);
  };

  SerializedRange.prototype.toObject = function() {
    return {
      start: this.start,
      startOffset: this.startOffset,
      end: this.end,
      endOffset: this.endOffset
    };
  };

  return SerializedRange;

})();

module.exports = Range;


},{"./util":12}],10:[function(_dereq_,module,exports){
var Registry,
  __hasProp = {}.hasOwnProperty;

Registry = (function() {
  Registry.createApp = function(appModule, settings) {
    if (settings == null) {
      settings = {};
    }
    return (new this(settings)).run(appModule);
  };

  function Registry(settings) {
    this.settings = settings != null ? settings : {};
  }

  Registry.prototype.include = function(module) {
    module.configure(this);
    return this;
  };

  Registry.prototype.run = function(app) {
    var k, v;
    if (this.app) {
      throw new Error("Registry is already bound to a running application");
    }
    this.include(app);
    for (k in this) {
      if (!__hasProp.call(this, k)) continue;
      v = this[k];
      app[k] = v;
    }
    this.app = app;
    return app.run(this);
  };

  return Registry;

})();

module.exports = Registry;


},{}],11:[function(_dereq_,module,exports){
var StorageProvider;

StorageProvider = (function() {
  StorageProvider.configure = function(registry) {
    var klass, store, _ref;
    klass = (_ref = registry.settings.store) != null ? _ref.type : void 0;
    if (typeof klass === 'function') {
      store = new klass(registry.settings.store);
    } else {
      store = new this(registry);
    }
    return registry['store'] != null ? registry['store'] : registry['store'] = store;
  };

  function StorageProvider(registry) {
    this.registry = registry;
  }

  StorageProvider.prototype.id = (function() {
    var counter;
    counter = 0;
    return function() {
      return counter++;
    };
  })();

  StorageProvider.prototype.create = function(annotation) {
    var dfd;
    dfd = $.Deferred();
    if (annotation.id == null) {
      annotation.id = this.id();
    }
    dfd.resolve(annotation);
    return dfd.promise();
  };

  StorageProvider.prototype.update = function(annotation) {
    var dfd;
    dfd = $.Deferred();
    dfd.resolve(annotation);
    return dfd.promise();
  };

  StorageProvider.prototype["delete"] = function(annotation) {
    var dfd;
    dfd = $.Deferred();
    dfd.resolve(annotation);
    return dfd.promise();
  };

  StorageProvider.prototype.query = function(queryObj) {
    var dfd;
    dfd = $.Deferred();
    dfd.resolve([], {});
    return dfd.promise();
  };

  return StorageProvider;

})();

module.exports = StorageProvider;


},{}],12:[function(_dereq_,module,exports){
var Util, gettext, xpath, _gettext, _ref, _t;

xpath = _dereq_('./xpath');

gettext = null;

if (typeof Gettext !== "undefined" && Gettext !== null) {
  _gettext = new Gettext({
    domain: "annotator"
  });
  gettext = function(msgid) {
    return _gettext.gettext(msgid);
  };
} else {
  gettext = function(msgid) {
    return msgid;
  };
}

_t = function(msgid) {
  return gettext(msgid);
};

if (!(typeof jQuery !== "undefined" && jQuery !== null ? (_ref = jQuery.fn) != null ? _ref.jquery : void 0 : void 0)) {
  console.error(_t("Annotator requires jQuery: have you included lib/vendor/jquery.js?"));
}

if (!(JSON && JSON.parse && JSON.stringify)) {
  console.error(_t("Annotator requires a JSON implementation: have you included lib/vendor/json2.js?"));
}

Util = {};

Util.TranslationString = _t;

Util.flatten = function(array) {
  var flatten;
  flatten = function(ary) {
    var el, flat, _i, _len;
    flat = [];
    for (_i = 0, _len = ary.length; _i < _len; _i++) {
      el = ary[_i];
      flat = flat.concat(el && $.isArray(el) ? flatten(el) : el);
    }
    return flat;
  };
  return flatten(array);
};

Util.contains = function(parent, child) {
  var node;
  node = child;
  while (node != null) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

Util.getTextNodes = function(jq) {
  var getTextNodes;
  getTextNodes = function(node) {
    var nodes;
    if (node && node.nodeType !== Node.TEXT_NODE) {
      nodes = [];
      if (node.nodeType !== Node.COMMENT_NODE) {
        node = node.lastChild;
        while (node) {
          nodes.push(getTextNodes(node));
          node = node.previousSibling;
        }
      }
      return nodes.reverse();
    } else {
      return node;
    }
  };
  return jq.map(function() {
    return Util.flatten(getTextNodes(this));
  });
};

Util.getLastTextNodeUpTo = function(n) {
  var result;
  switch (n.nodeType) {
    case Node.TEXT_NODE:
      return n;
    case Node.ELEMENT_NODE:
      if (n.lastChild != null) {
        result = Util.getLastTextNodeUpTo(n.lastChild);
        if (result != null) {
          return result;
        }
      }
      break;
  }
  n = n.previousSibling;
  if (n != null) {
    return Util.getLastTextNodeUpTo(n);
  } else {
    return null;
  }
};

Util.getFirstTextNodeNotBefore = function(n) {
  var result;
  switch (n.nodeType) {
    case Node.TEXT_NODE:
      return n;
    case Node.ELEMENT_NODE:
      if (n.firstChild != null) {
        result = Util.getFirstTextNodeNotBefore(n.firstChild);
        if (result != null) {
          return result;
        }
      }
      break;
  }
  n = n.nextSibling;
  if (n != null) {
    return Util.getFirstTextNodeNotBefore(n);
  } else {
    return null;
  }
};

Util.readRangeViaSelection = function(range) {
  var sel;
  sel = Util.getGlobal().getSelection();
  sel.removeAllRanges();
  sel.addRange(range.toRange());
  return sel.toString();
};

Util.xpathFromNode = function(el, relativeRoot) {
  var exception, result;
  try {
    result = xpath.simpleXPathJQuery.call(el, relativeRoot);
  } catch (_error) {
    exception = _error;
    console.log("jQuery-based XPath construction failed! Falling back to manual.");
    result = xpath.simpleXPathPure.call(el, relativeRoot);
  }
  return result;
};

Util.nodeFromXPath = function(xp, root) {
  var idx, name, node, step, steps, _i, _len, _ref1;
  steps = xp.substring(1).split("/");
  node = root;
  for (_i = 0, _len = steps.length; _i < _len; _i++) {
    step = steps[_i];
    _ref1 = step.split("["), name = _ref1[0], idx = _ref1[1];
    idx = idx != null ? parseInt((idx != null ? idx.split("]") : void 0)[0]) : 1;
    node = xpath.findChild(node, name.toLowerCase(), idx);
  }
  return node;
};

Util.escape = function(html) {
  return html.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

Util.uuid = (function() {
  var counter;
  counter = 0;
  return function() {
    return counter++;
  };
})();

Util.getGlobal = function() {
  return (function() {
    return this;
  })();
};

Util.maxZIndex = function($elements) {
  var all, el;
  all = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = $elements.length; _i < _len; _i++) {
      el = $elements[_i];
      if ($(el).css('position') === 'static') {
        _results.push(-1);
      } else {
        _results.push(parseInt($(el).css('z-index'), 10) || -1);
      }
    }
    return _results;
  })();
  return Math.max.apply(Math, all);
};

Util.mousePosition = function(e, offsetEl) {
  var offset, _ref1;
  if ((_ref1 = $(offsetEl).css('position')) !== 'absolute' && _ref1 !== 'fixed' && _ref1 !== 'relative') {
    offsetEl = $(offsetEl).offsetParent()[0];
  }
  offset = $(offsetEl).offset();
  return {
    top: e.pageY - offset.top,
    left: e.pageX - offset.left
  };
};

Util.preventEventDefault = function(event) {
  return event != null ? typeof event.preventDefault === "function" ? event.preventDefault() : void 0 : void 0;
};

module.exports = Util;


},{"./xpath":15}],13:[function(_dereq_,module,exports){
var LinkParser, Util, Viewer, Widget, _t,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Util = _dereq_('./util');

Widget = _dereq_('./widget');

_t = Util.TranslationString;

Viewer = (function(_super) {
  __extends(Viewer, _super);

  Viewer.prototype.events = {
    ".annotator-edit click": "onEditClick",
    ".annotator-delete click": "onDeleteClick"
  };

  Viewer.prototype.classes = {
    hide: 'annotator-hide',
    showControls: 'annotator-visible'
  };

  Viewer.prototype.html = {
    element: "<div class=\"annotator-outer annotator-viewer\">\n  <ul class=\"annotator-widget annotator-listing\"></ul>\n</div>",
    item: "<li class=\"annotator-annotation annotator-item\">\n  <span class=\"annotator-controls\">\n    <a href=\"#\" title=\"View as webpage\" class=\"annotator-link\">View as webpage</a>\n    <button type=\"button\" title=\"Edit\" class=\"annotator-edit\">Edit</button>\n    <button type=\"button\" title=\"Delete\" class=\"annotator-delete\">Delete</button>\n  </span>\n</li>"
  };

  Viewer.prototype.options = {
    readOnly: false
  };

  function Viewer(options) {
    this.onDeleteClick = __bind(this.onDeleteClick, this);
    this.onEditClick = __bind(this.onEditClick, this);
    this.load = __bind(this.load, this);
    this.hide = __bind(this.hide, this);
    this.show = __bind(this.show, this);
    Viewer.__super__.constructor.call(this, $(this.html.element)[0], options);
    this.item = $(this.html.item)[0];
    this.fields = [];
    this.annotations = [];
  }

  Viewer.prototype.show = function(event) {
    var controls;
    Util.preventEventDefault(event);
    controls = this.element.find('.annotator-controls').addClass(this.classes.showControls);
    setTimeout(((function(_this) {
      return function() {
        return controls.removeClass(_this.classes.showControls);
      };
    })(this)), 500);
    this.element.removeClass(this.classes.hide);
    return this.checkOrientation().publish('show');
  };

  Viewer.prototype.isShown = function() {
    return !this.element.hasClass(this.classes.hide);
  };

  Viewer.prototype.hide = function(event) {
    Util.preventEventDefault(event);
    this.element.addClass(this.classes.hide);
    return this.publish('hide');
  };

  Viewer.prototype.load = function(annotations) {
    var annotation, controller, controls, del, edit, element, field, item, link, links, list, _i, _j, _len, _len1, _ref, _ref1;
    this.annotations = annotations || [];
    list = this.element.find('ul:first').empty();
    _ref = this.annotations;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      annotation = _ref[_i];
      item = $(this.item).clone().appendTo(list).data('annotation', annotation);
      controls = item.find('.annotator-controls');
      link = controls.find('.annotator-link');
      edit = controls.find('.annotator-edit');
      del = controls.find('.annotator-delete');
      links = new LinkParser(annotation.links || []).get('alternate', {
        'type': 'text/html'
      });
      if (links.length === 0 || (links[0].href == null)) {
        link.remove();
      } else {
        link.attr('href', links[0].href);
      }
      if (this.options.readOnly) {
        edit.remove();
        del.remove();
      } else {
        controller = {
          showEdit: function() {
            return edit.removeAttr('disabled');
          },
          hideEdit: function() {
            return edit.attr('disabled', 'disabled');
          },
          showDelete: function() {
            return del.removeAttr('disabled');
          },
          hideDelete: function() {
            return del.attr('disabled', 'disabled');
          }
        };
      }
      _ref1 = this.fields;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        field = _ref1[_j];
        element = $(field.element).clone().appendTo(item)[0];
        field.load(element, annotation, controller);
      }
    }
    this.publish('load', [this.annotations]);
    return this.show();
  };

  Viewer.prototype.addField = function(options) {
    var field;
    field = $.extend({
      load: function() {}
    }, options);
    field.element = $('<div />')[0];
    this.fields.push(field);
    field.element;
    return this;
  };

  Viewer.prototype.onEditClick = function(event) {
    return this.onButtonClick(event, 'edit');
  };

  Viewer.prototype.onDeleteClick = function(event) {
    return this.onButtonClick(event, 'delete');
  };

  Viewer.prototype.onButtonClick = function(event, type) {
    var item;
    item = $(event.target).parents('.annotator-annotation');
    return this.publish(type, [item.data('annotation')]);
  };

  return Viewer;

})(Widget);

LinkParser = (function() {
  function LinkParser(data) {
    this.data = data;
  }

  LinkParser.prototype.get = function(rel, cond) {
    var d, k, keys, match, v, _i, _len, _ref, _results;
    if (cond == null) {
      cond = {};
    }
    cond = $.extend({}, cond, {
      rel: rel
    });
    keys = (function() {
      var _results;
      _results = [];
      for (k in cond) {
        if (!__hasProp.call(cond, k)) continue;
        v = cond[k];
        _results.push(k);
      }
      return _results;
    })();
    _ref = this.data;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      d = _ref[_i];
      match = keys.reduce((function(m, k) {
        return m && (d[k] === cond[k]);
      }), true);
      if (match) {
        _results.push(d);
      } else {
        continue;
      }
    }
    return _results;
  };

  return LinkParser;

})();

module.exports = Viewer;


},{"./util":12,"./widget":14}],14:[function(_dereq_,module,exports){
var Delegator, Util, Widget,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Delegator = _dereq_('./class');

Util = _dereq_('./util');

Widget = (function(_super) {
  __extends(Widget, _super);

  Widget.prototype.classes = {
    hide: 'annotator-hide',
    invert: {
      x: 'annotator-invert-x',
      y: 'annotator-invert-y'
    }
  };

  function Widget(element, options) {
    Widget.__super__.constructor.apply(this, arguments);
    this.classes = $.extend({}, Widget.prototype.classes, this.classes);
  }

  Widget.prototype.destroy = function() {
    this.removeEvents();
    return this.element.remove();
  };

  Widget.prototype.checkOrientation = function() {
    var current, offset, viewport, widget, window;
    this.resetOrientation();
    window = $(Util.getGlobal());
    widget = this.element.children(":first");
    offset = widget.offset();
    viewport = {
      top: window.scrollTop(),
      right: window.width() + window.scrollLeft()
    };
    current = {
      top: offset.top,
      right: offset.left + widget.width()
    };
    if ((current.top - viewport.top) < 0) {
      this.invertY();
    }
    if ((current.right - viewport.right) > 0) {
      this.invertX();
    }
    return this;
  };

  Widget.prototype.resetOrientation = function() {
    this.element.removeClass(this.classes.invert.x).removeClass(this.classes.invert.y);
    return this;
  };

  Widget.prototype.invertX = function() {
    this.element.addClass(this.classes.invert.x);
    return this;
  };

  Widget.prototype.invertY = function() {
    this.element.addClass(this.classes.invert.y);
    return this;
  };

  Widget.prototype.isInvertedY = function() {
    return this.element.hasClass(this.classes.invert.y);
  };

  Widget.prototype.isInvertedX = function() {
    return this.element.hasClass(this.classes.invert.x);
  };

  return Widget;

})(Delegator);

module.exports = Widget;


},{"./class":6,"./util":12}],15:[function(_dereq_,module,exports){
var findChild, getNodeName, getNodePosition, simpleXPathJQuery, simpleXPathPure;

simpleXPathJQuery = function(relativeRoot) {
  var jq;
  jq = this.map(function() {
    var elem, idx, path, tagName;
    path = '';
    elem = this;
    while ((elem != null ? elem.nodeType : void 0) === Node.ELEMENT_NODE && elem !== relativeRoot) {
      tagName = elem.tagName.replace(":", "\\:");
      idx = $(elem.parentNode).children(tagName).index(elem) + 1;
      idx = "[" + idx + "]";
      path = "/" + elem.tagName.toLowerCase() + idx + path;
      elem = elem.parentNode;
    }
    return path;
  });
  return jq.get();
};

simpleXPathPure = function(relativeRoot) {
  var getPathSegment, getPathTo, jq, rootNode;
  getPathSegment = function(node) {
    var name, pos;
    name = getNodeName(node);
    pos = getNodePosition(node);
    return "" + name + "[" + pos + "]";
  };
  rootNode = relativeRoot;
  getPathTo = function(node) {
    var xpath;
    xpath = '';
    while (node !== rootNode) {
      if (node == null) {
        throw new Error("Called getPathTo on a node which was not a descendant of @rootNode. " + rootNode);
      }
      xpath = (getPathSegment(node)) + '/' + xpath;
      node = node.parentNode;
    }
    xpath = '/' + xpath;
    xpath = xpath.replace(/\/$/, '');
    return xpath;
  };
  jq = this.map(function() {
    var path;
    path = getPathTo(this);
    return path;
  });
  return jq.get();
};

findChild = function(node, type, index) {
  var child, children, found, name, _i, _len;
  if (!node.hasChildNodes()) {
    throw new Error("XPath error: node has no children!");
  }
  children = node.childNodes;
  found = 0;
  for (_i = 0, _len = children.length; _i < _len; _i++) {
    child = children[_i];
    name = getNodeName(child);
    if (name === type) {
      found += 1;
      if (found === index) {
        return child;
      }
    }
  }
  throw new Error("XPath error: wanted child not found.");
};

getNodeName = function(node) {
  var nodeName;
  nodeName = node.nodeName.toLowerCase();
  switch (nodeName) {
    case "#text":
      return "text()";
    case "#comment":
      return "comment()";
    case "#cdata-section":
      return "cdata-section()";
    default:
      return nodeName;
  }
};

getNodePosition = function(node) {
  var pos, tmp;
  pos = 0;
  tmp = node;
  while (tmp) {
    if (tmp.nodeName === node.nodeName) {
      pos++;
    }
    tmp = tmp.previousSibling;
  }
  return pos;
};

module.exports = {
  simpleXPathJQuery: simpleXPathJQuery,
  simpleXPathPure: simpleXPathPure,
  findChild: findChild
};


},{}]},{},[5])

(5)
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGtnL2Fubm90YXRvci5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9iYWNrYm9uZS1leHRlbmQtc3RhbmRhbG9uZS9iYWNrYm9uZS1leHRlbmQtc3RhbmRhbG9uZS5qcyIsImFubm90YXRpb25zLmNvZmZlZSIsImFubm90YXRvci5jb2ZmZWUiLCJjbGFzcy5jb2ZmZWUiLCJlZGl0b3IuY29mZmVlIiwibm90aWZpY2F0aW9uLmNvZmZlZSIsInJhbmdlLmNvZmZlZSIsInJlZ2lzdHJ5LmNvZmZlZSIsInN0b3JhZ2UuY29mZmVlIiwidXRpbC5jb2ZmZWUiLCJ2aWV3ZXIuY29mZmVlIiwid2lkZ2V0LmNvZmZlZSIsInhwYXRoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QW1CLGlCQUFuQjtBQUFBLEVBQ0EsaUJBQWlCLGVBRGpCO0FBQUEsRUFFQSxXQUFXLFNBRlg7Q0FoRkYiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogU3RhbmRhbG9uZSBleHRyYWN0aW9uIG9mIEJhY2tib25lLkV2ZW50cywgbm8gZXh0ZXJuYWwgZGVwZW5kZW5jeSByZXF1aXJlZC5cbiAqIERlZ3JhZGVzIG5pY2VseSB3aGVuIEJhY2tvbmUvdW5kZXJzY29yZSBhcmUgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnRcbiAqIGdsb2JhbCBjb250ZXh0LlxuICpcbiAqIE5vdGUgdGhhdCBkb2NzIHN1Z2dlc3QgdG8gdXNlIHVuZGVyc2NvcmUncyBgXy5leHRlbmQoKWAgbWV0aG9kIHRvIGFkZCBFdmVudHNcbiAqIHN1cHBvcnQgdG8gc29tZSBnaXZlbiBvYmplY3QuIEEgYG1peGluKClgIG1ldGhvZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgRXZlbnRzXG4gKiBwcm90b3R5cGUgdG8gYXZvaWQgdXNpbmcgdW5kZXJzY29yZSBmb3IgdGhhdCBzb2xlIHB1cnBvc2U6XG4gKlxuICogICAgIHZhciBteUV2ZW50RW1pdHRlciA9IEJhY2tib25lRXZlbnRzLm1peGluKHt9KTtcbiAqXG4gKiBPciBmb3IgYSBmdW5jdGlvbiBjb25zdHJ1Y3RvcjpcbiAqXG4gKiAgICAgZnVuY3Rpb24gTXlDb25zdHJ1Y3Rvcigpe31cbiAqICAgICBNeUNvbnN0cnVjdG9yLnByb3RvdHlwZS5mb28gPSBmdW5jdGlvbigpe31cbiAqICAgICBCYWNrYm9uZUV2ZW50cy5taXhpbihNeUNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gKlxuICogKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuICogKGMpIDIwMTMgTmljb2xhcyBQZXJyaWF1bHRcbiAqL1xuLyogZ2xvYmFsIGV4cG9ydHM6dHJ1ZSwgZGVmaW5lLCBtb2R1bGUgKi9cbihmdW5jdGlvbigpIHtcbiAgdmFyIHJvb3QgPSB0aGlzLFxuICAgICAgYnJlYWtlciA9IHt9LFxuICAgICAgbmF0aXZlRm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLFxuICAgICAgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICBpZENvdW50ZXIgPSAwO1xuXG4gIC8vIFJldHVybnMgYSBwYXJ0aWFsIGltcGxlbWVudGF0aW9uIG1hdGNoaW5nIHRoZSBtaW5pbWFsIEFQSSBzdWJzZXQgcmVxdWlyZWRcbiAgLy8gYnkgQmFja2JvbmUuRXZlbnRzXG4gIGZ1bmN0aW9uIG1pbmlzY29yZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAga2V5czogT2JqZWN0LmtleXMsXG5cbiAgICAgIHVuaXF1ZUlkOiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICAgICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gICAgICB9LFxuXG4gICAgICBoYXM6IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgICAgIH0sXG5cbiAgICAgIGVhY2g6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvbmNlOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICBmdW5jID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdmFyIF8gPSBtaW5pc2NvcmUoKSwgRXZlbnRzO1xuXG4gIC8vIEJhY2tib25lLkV2ZW50c1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBBIG1vZHVsZSB0aGF0IGNhbiBiZSBtaXhlZCBpbiB0byAqYW55IG9iamVjdCogaW4gb3JkZXIgdG8gcHJvdmlkZSBpdCB3aXRoXG4gIC8vIGN1c3RvbSBldmVudHMuIFlvdSBtYXkgYmluZCB3aXRoIGBvbmAgb3IgcmVtb3ZlIHdpdGggYG9mZmAgY2FsbGJhY2tcbiAgLy8gZnVuY3Rpb25zIHRvIGFuIGV2ZW50OyBgdHJpZ2dlcmAtaW5nIGFuIGV2ZW50IGZpcmVzIGFsbCBjYWxsYmFja3MgaW5cbiAgLy8gc3VjY2Vzc2lvbi5cbiAgLy9cbiAgLy8gICAgIHZhciBvYmplY3QgPSB7fTtcbiAgLy8gICAgIF8uZXh0ZW5kKG9iamVjdCwgQmFja2JvbmUuRXZlbnRzKTtcbiAgLy8gICAgIG9iamVjdC5vbignZXhwYW5kJywgZnVuY3Rpb24oKXsgYWxlcnQoJ2V4cGFuZGVkJyk7IH0pO1xuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIoJ2V4cGFuZCcpO1xuICAvL1xuICBFdmVudHMgPSB7XG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi4gUGFzc2luZyBgXCJhbGxcImAgd2lsbCBiaW5kXG4gICAgLy8gdGhlIGNhbGxiYWNrIHRvIGFsbCBldmVudHMgZmlyZWQuXG4gICAgb246IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb24nLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdIHx8ICh0aGlzLl9ldmVudHNbbmFtZV0gPSBbXSk7XG4gICAgICBldmVudHMucHVzaCh7Y2FsbGJhY2s6IGNhbGxiYWNrLCBjb250ZXh0OiBjb250ZXh0LCBjdHg6IGNvbnRleHQgfHwgdGhpc30pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gb25seSBiZSB0cmlnZ2VyZWQgYSBzaW5nbGUgdGltZS4gQWZ0ZXIgdGhlIGZpcnN0IHRpbWVcbiAgICAvLyB0aGUgY2FsbGJhY2sgaXMgaW52b2tlZCwgaXQgd2lsbCBiZSByZW1vdmVkLlxuICAgIG9uY2U6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb25jZScsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgb25jZSA9IF8ub25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5vZmYobmFtZSwgb25jZSk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICAgIG9uY2UuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICByZXR1cm4gdGhpcy5vbihuYW1lLCBvbmNlLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIG9uZSBvciBtYW55IGNhbGxiYWNrcy4gSWYgYGNvbnRleHRgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIHdpdGggdGhhdCBmdW5jdGlvbi4gSWYgYGNhbGxiYWNrYCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgdGhlIGV2ZW50LiBJZiBgbmFtZWAgaXMgbnVsbCwgcmVtb3ZlcyBhbGwgYm91bmRcbiAgICAvLyBjYWxsYmFja3MgZm9yIGFsbCBldmVudHMuXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgdmFyIHJldGFpbiwgZXYsIGV2ZW50cywgbmFtZXMsIGksIGwsIGosIGs7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhZXZlbnRzQXBpKHRoaXMsICdvZmYnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIW5hbWUgJiYgIWNhbGxiYWNrICYmICFjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbmFtZXMgPSBuYW1lID8gW25hbWVdIDogXy5rZXlzKHRoaXMuX2V2ZW50cyk7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgaWYgKGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IHJldGFpbiA9IFtdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayB8fCBjb250ZXh0KSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gZXZlbnRzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICBldiA9IGV2ZW50c1tqXTtcbiAgICAgICAgICAgICAgaWYgKChjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrLl9jYWxsYmFjaykgfHxcbiAgICAgICAgICAgICAgICAgIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGV2LmNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0YWluLnB1c2goZXYpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmV0YWluLmxlbmd0aCkgZGVsZXRlIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVHJpZ2dlciBvbmUgb3IgbWFueSBldmVudHMsIGZpcmluZyBhbGwgYm91bmQgY2FsbGJhY2tzLiBDYWxsYmFja3MgYXJlXG4gICAgLy8gcGFzc2VkIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBgdHJpZ2dlcmAgaXMsIGFwYXJ0IGZyb20gdGhlIGV2ZW50IG5hbWVcbiAgICAvLyAodW5sZXNzIHlvdSdyZSBsaXN0ZW5pbmcgb24gYFwiYWxsXCJgLCB3aGljaCB3aWxsIGNhdXNlIHlvdXIgY2FsbGJhY2sgdG9cbiAgICAvLyByZWNlaXZlIHRoZSB0cnVlIG5hbWUgb2YgdGhlIGV2ZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCkuXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAndHJpZ2dlcicsIG5hbWUsIGFyZ3MpKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICB2YXIgYWxsRXZlbnRzID0gdGhpcy5fZXZlbnRzLmFsbDtcbiAgICAgIGlmIChldmVudHMpIHRyaWdnZXJFdmVudHMoZXZlbnRzLCBhcmdzKTtcbiAgICAgIGlmIChhbGxFdmVudHMpIHRyaWdnZXJFdmVudHMoYWxsRXZlbnRzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRlbGwgdGhpcyBvYmplY3QgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gZWl0aGVyIHNwZWNpZmljIGV2ZW50cyAuLi4gb3JcbiAgICAvLyB0byBldmVyeSBvYmplY3QgaXQncyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvLlxuICAgIHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZGVsZXRlTGlzdGVuZXIgPSAhbmFtZSAmJiAhY2FsbGJhY2s7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBpZiAob2JqKSAobGlzdGVuZXJzID0ge30pW29iai5fbGlzdGVuZXJJZF0gPSBvYmo7XG4gICAgICBmb3IgKHZhciBpZCBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXJzW2lkXS5vZmYobmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgICBpZiAoZGVsZXRlTGlzdGVuZXIpIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbaWRdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gIH07XG5cbiAgLy8gUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gc3BsaXQgZXZlbnQgc3RyaW5ncy5cbiAgdmFyIGV2ZW50U3BsaXR0ZXIgPSAvXFxzKy87XG5cbiAgLy8gSW1wbGVtZW50IGZhbmN5IGZlYXR1cmVzIG9mIHRoZSBFdmVudHMgQVBJIHN1Y2ggYXMgbXVsdGlwbGUgZXZlbnRcbiAgLy8gbmFtZXMgYFwiY2hhbmdlIGJsdXJcImAgYW5kIGpRdWVyeS1zdHlsZSBldmVudCBtYXBzIGB7Y2hhbmdlOiBhY3Rpb259YFxuICAvLyBpbiB0ZXJtcyBvZiB0aGUgZXhpc3RpbmcgQVBJLlxuICB2YXIgZXZlbnRzQXBpID0gZnVuY3Rpb24ob2JqLCBhY3Rpb24sIG5hbWUsIHJlc3QpIHtcbiAgICBpZiAoIW5hbWUpIHJldHVybiB0cnVlO1xuXG4gICAgLy8gSGFuZGxlIGV2ZW50IG1hcHMuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG5hbWUpIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBba2V5LCBuYW1lW2tleV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHNwYWNlIHNlcGFyYXRlZCBldmVudCBuYW1lcy5cbiAgICBpZiAoZXZlbnRTcGxpdHRlci50ZXN0KG5hbWUpKSB7XG4gICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KGV2ZW50U3BsaXR0ZXIpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBbbmFtZXNbaV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gQSBkaWZmaWN1bHQtdG8tYmVsaWV2ZSwgYnV0IG9wdGltaXplZCBpbnRlcm5hbCBkaXNwYXRjaCBmdW5jdGlvbiBmb3JcbiAgLy8gdHJpZ2dlcmluZyBldmVudHMuIFRyaWVzIHRvIGtlZXAgdGhlIHVzdWFsIGNhc2VzIHNwZWVkeSAobW9zdCBpbnRlcm5hbFxuICAvLyBCYWNrYm9uZSBldmVudHMgaGF2ZSAzIGFyZ3VtZW50cykuXG4gIHZhciB0cmlnZ2VyRXZlbnRzID0gZnVuY3Rpb24oZXZlbnRzLCBhcmdzKSB7XG4gICAgdmFyIGV2LCBpID0gLTEsIGwgPSBldmVudHMubGVuZ3RoLCBhMSA9IGFyZ3NbMF0sIGEyID0gYXJnc1sxXSwgYTMgPSBhcmdzWzJdO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgpOyByZXR1cm47XG4gICAgICBjYXNlIDE6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSk7IHJldHVybjtcbiAgICAgIGNhc2UgMjogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMik7IHJldHVybjtcbiAgICAgIGNhc2UgMzogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMiwgYTMpOyByZXR1cm47XG4gICAgICBkZWZhdWx0OiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5hcHBseShldi5jdHgsIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbGlzdGVuTWV0aG9kcyA9IHtsaXN0ZW5UbzogJ29uJywgbGlzdGVuVG9PbmNlOiAnb25jZSd9O1xuXG4gIC8vIEludmVyc2lvbi1vZi1jb250cm9sIHZlcnNpb25zIG9mIGBvbmAgYW5kIGBvbmNlYC4gVGVsbCAqdGhpcyogb2JqZWN0IHRvXG4gIC8vIGxpc3RlbiB0byBhbiBldmVudCBpbiBhbm90aGVyIG9iamVjdCAuLi4ga2VlcGluZyB0cmFjayBvZiB3aGF0IGl0J3NcbiAgLy8gbGlzdGVuaW5nIHRvLlxuICBfLmVhY2gobGlzdGVuTWV0aG9kcywgZnVuY3Rpb24oaW1wbGVtZW50YXRpb24sIG1ldGhvZCkge1xuICAgIEV2ZW50c1ttZXRob2RdID0gZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCAodGhpcy5fbGlzdGVuZXJzID0ge30pO1xuICAgICAgdmFyIGlkID0gb2JqLl9saXN0ZW5lcklkIHx8IChvYmouX2xpc3RlbmVySWQgPSBfLnVuaXF1ZUlkKCdsJykpO1xuICAgICAgbGlzdGVuZXJzW2lkXSA9IG9iajtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIG9ialtpbXBsZW1lbnRhdGlvbl0obmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIEV2ZW50cy5iaW5kICAgPSBFdmVudHMub247XG4gIEV2ZW50cy51bmJpbmQgPSBFdmVudHMub2ZmO1xuXG4gIC8vIE1peGluIHV0aWxpdHlcbiAgRXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgICB2YXIgZXhwb3J0cyA9IFsnb24nLCAnb25jZScsICdvZmYnLCAndHJpZ2dlcicsICdzdG9wTGlzdGVuaW5nJywgJ2xpc3RlblRvJyxcbiAgICAgICAgICAgICAgICAgICAnbGlzdGVuVG9PbmNlJywgJ2JpbmQnLCAndW5iaW5kJ107XG4gICAgXy5lYWNoKGV4cG9ydHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gcHJvdG87XG4gIH07XG5cbiAgLy8gRXhwb3J0IEV2ZW50cyBhcyBCYWNrYm9uZUV2ZW50cyBkZXBlbmRpbmcgb24gY3VycmVudCBjb250ZXh0XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRXZlbnRzO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gRXZlbnRzO1xuICAgIH1cbiAgICBleHBvcnRzLkJhY2tib25lRXZlbnRzID0gRXZlbnRzO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1cbn0pKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lJyk7XG4iLCIoZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG4gIH1cbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGRlZmluaXRpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIHdpbmRvdy5CYWNrYm9uZUV4dGVuZCA9IGRlZmluaXRpb24oKTtcbiAgfVxufSkoZnVuY3Rpb24gKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgXG4gIC8vIG1pbmktdW5kZXJzY29yZVxuICB2YXIgXyA9IHtcbiAgICBoYXM6IGZ1bmN0aW9uIChvYmosIGtleSkge1xuICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gICAgfSxcbiAgXG4gICAgZXh0ZW5kOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIGZvciAodmFyIGk9MTsgaTxhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgfTtcblxuICAvLy8gRm9sbG93aW5nIGNvZGUgaXMgcGFzdGVkIGZyb20gQmFja2JvbmUuanMgLy8vXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvcnJlY3RseSBzZXQgdXAgdGhlIHByb3RvdHlwZSBjaGFpbiwgZm9yIHN1YmNsYXNzZXMuXG4gIC8vIFNpbWlsYXIgdG8gYGdvb2cuaW5oZXJpdHNgLCBidXQgdXNlcyBhIGhhc2ggb2YgcHJvdG90eXBlIHByb3BlcnRpZXMgYW5kXG4gIC8vIGNsYXNzIHByb3BlcnRpZXMgdG8gYmUgZXh0ZW5kZWQuXG4gIHZhciBleHRlbmQgPSBmdW5jdGlvbihwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuICAgIHZhciBjaGlsZDtcblxuICAgIC8vIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIG5ldyBzdWJjbGFzcyBpcyBlaXRoZXIgZGVmaW5lZCBieSB5b3VcbiAgICAvLyAodGhlIFwiY29uc3RydWN0b3JcIiBwcm9wZXJ0eSBpbiB5b3VyIGBleHRlbmRgIGRlZmluaXRpb24pLCBvciBkZWZhdWx0ZWRcbiAgICAvLyBieSB1cyB0byBzaW1wbHkgY2FsbCB0aGUgcGFyZW50J3MgY29uc3RydWN0b3IuXG4gICAgaWYgKHByb3RvUHJvcHMgJiYgXy5oYXMocHJvdG9Qcm9wcywgJ2NvbnN0cnVjdG9yJykpIHtcbiAgICAgIGNoaWxkID0gcHJvdG9Qcm9wcy5jb25zdHJ1Y3RvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgY2hpbGQgPSBmdW5jdGlvbigpeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgfVxuXG4gICAgLy8gQWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiwgaWYgc3VwcGxpZWQuXG4gICAgXy5leHRlbmQoY2hpbGQsIHBhcmVudCwgc3RhdGljUHJvcHMpO1xuXG4gICAgLy8gU2V0IHRoZSBwcm90b3R5cGUgY2hhaW4gdG8gaW5oZXJpdCBmcm9tIGBwYXJlbnRgLCB3aXRob3V0IGNhbGxpbmdcbiAgICAvLyBgcGFyZW50YCdzIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxuICAgIHZhciBTdXJyb2dhdGUgPSBmdW5jdGlvbigpeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH07XG4gICAgU3Vycm9nYXRlLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gICAgY2hpbGQucHJvdG90eXBlID0gbmV3IFN1cnJvZ2F0ZSgpO1xuXG4gICAgLy8gQWRkIHByb3RvdHlwZSBwcm9wZXJ0aWVzIChpbnN0YW5jZSBwcm9wZXJ0aWVzKSB0byB0aGUgc3ViY2xhc3MsXG4gICAgLy8gaWYgc3VwcGxpZWQuXG4gICAgaWYgKHByb3RvUHJvcHMpIF8uZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG5cbiAgICAvLyBTZXQgYSBjb252ZW5pZW5jZSBwcm9wZXJ0eSBpbiBjYXNlIHRoZSBwYXJlbnQncyBwcm90b3R5cGUgaXMgbmVlZGVkXG4gICAgLy8gbGF0ZXIuXG4gICAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcblxuICAgIHJldHVybiBjaGlsZDtcbiAgfTtcblxuICAvLyBFeHBvc2UgdGhlIGV4dGVuZCBmdW5jdGlvblxuICByZXR1cm4gZXh0ZW5kO1xufSk7XG4iLCJTdG9yYWdlUHJvdmlkZXIgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKVxuXG5cbiMgUHVibGljOiBQcm92aWRlcyBDUlVEIG1ldGhvZHMgZm9yIGFubm90YXRpb25zIHdoaWNoIGNhbGwgY29ycmVzcG9uZGluZyByZWdpc3RyeSBob29rcy5cbmNsYXNzIEFubm90YXRpb25Qcm92aWRlclxuXG4gIEBjb25maWd1cmU6IChyZWdpc3RyeSkgLT5cbiAgICByZWdpc3RyeVsnYW5ub3RhdGlvbnMnXSA/PSBuZXcgdGhpcyhyZWdpc3RyeSlcbiAgICByZWdpc3RyeS5pbmNsdWRlKFN0b3JhZ2VQcm92aWRlcilcblxuICBjb25zdHJ1Y3RvcjogKEByZWdpc3RyeSkgLT5cblxuICAjIENyZWF0ZXMgYW5kIHJldHVybnMgYSBuZXcgYW5ub3RhdGlvbiBvYmplY3QuXG4gICNcbiAgIyBSdW5zIHRoZSAnYmVmb3JlQ3JlYXRlQW5ub3RhdGlvbicgaG9vayB0byBhbGxvdyB0aGUgbmV3IGFubm90YXRpb24gdG9cbiAgIyBiZSBpbml0aWFsaXplZCBvciBwcmV2ZW50ZWQuXG4gICNcbiAgIyBSdW5zIHRoZSAnY3JlYXRlQW5ub3RhdGlvbicgaG9vayB3aGVuIHRoZSBuZXcgYW5ub3RhdGlvbiBpcyBpbml0aWFsaXplZC5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIC5jcmVhdGUoe30pXG4gICNcbiAgIyAgIHJlZ2lzdHJ5Lm9uICdiZWZvcmVBbm5vdGF0aW9uQ3JlYXRlZCcsIChhbm5vdGF0aW9uKSAtPlxuICAjICAgICBhbm5vdGF0aW9uLm15UHJvcGVydHkgPSAnVGhpcyBpcyBhIGN1c3RvbSBwcm9wZXJ0eSdcbiAgIyAgIHJlZ2lzdHJ5LmNyZWF0ZSh7fSkgIyBSZXNvbHZlcyB0byB7bXlQcm9wZXJ0eTogXCJUaGlzIGlzIGHigKZcIn1cbiAgI1xuICAjIFJldHVybnMgYSBQcm9taXNlIG9mIGFuIGFubm90YXRpb24gT2JqZWN0LlxuICBjcmVhdGU6IChvYmo9e30pIC0+XG4gICAgdGhpcy5fY3ljbGUob2JqLCAnY3JlYXRlJylcblxuICAjIFVwZGF0ZXMgYW4gYW5ub3RhdGlvbi5cbiAgI1xuICAjIFB1Ymxpc2hlcyB0aGUgJ2JlZm9yZUFubm90YXRpb25VcGRhdGVkJyBhbmQgJ2Fubm90YXRpb25VcGRhdGVkJyBldmVudHMuXG4gICMgTGlzdGVuZXJzIHdpc2hpbmcgdG8gbW9kaWZ5IGFuIHVwZGF0ZWQgYW5ub3RhdGlvbiBzaG91bGQgc3Vic2NyaWJlIHRvXG4gICMgJ2JlZm9yZUFubm90YXRpb25VcGRhdGVkJyB3aGlsZSBsaXN0ZW5lcnMgc3RvcmluZyBhbm5vdGF0aW9ucyBzaG91bGRcbiAgIyBzdWJzY3JpYmUgdG8gJ2Fubm90YXRpb25VcGRhdGVkJy5cbiAgI1xuICAjIGFubm90YXRpb24gLSBBbiBhbm5vdGF0aW9uIE9iamVjdCB0byB1cGRhdGUuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBhbm5vdGF0aW9uID0ge3RhZ3M6ICdhcHBsZXMgb3JhbmdlcyBwZWFycyd9XG4gICMgICByZWdpc3RyeS5vbiAnYmVmb3JlQW5ub3RhdGlvblVwZGF0ZWQnLCAoYW5ub3RhdGlvbikgLT5cbiAgIyAgICAgIyB2YWxpZGF0ZSBvciBtb2RpZnkgYSBwcm9wZXJ0eS5cbiAgIyAgICAgYW5ub3RhdGlvbi50YWdzID0gYW5ub3RhdGlvbi50YWdzLnNwbGl0KCcgJylcbiAgIyAgIHJlZ2lzdHJ5LnVwZGF0ZShhbm5vdGF0aW9uKVxuICAjICAgIyA9PiBSZXR1cm5zIFtcImFwcGxlc1wiLCBcIm9yYW5nZXNcIiwgXCJwZWFyc1wiXVxuICAjXG4gICMgUmV0dXJucyBhIFByb21pc2Ugb2YgYW4gYW5ub3RhdGlvbiBPYmplY3QuXG4gIHVwZGF0ZTogKG9iaikgLT5cbiAgICBpZiBub3Qgb2JqLmlkP1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImFubm90YXRpb24gbXVzdCBoYXZlIGFuIGlkIGZvciB1cGRhdGUoKVwiKVxuICAgIHRoaXMuX2N5Y2xlKG9iaiwgJ3VwZGF0ZScpXG5cbiAgIyBQdWJsaWM6IERlbGV0ZXMgdGhlIGFubm90YXRpb24uXG4gICNcbiAgIyBhbm5vdGF0aW9uIC0gQW4gYW5ub3RhdGlvbiBPYmplY3QgdG8gZGVsZXRlLlxuICAjXG4gICMgUmV0dXJucyBhIFByb21pc2Ugb2YgYW4gYW5ub3RhdGlvbiBPYmplY3QuXG4gIGRlbGV0ZTogKG9iaikgLT5cbiAgICBpZiBub3Qgb2JqLmlkP1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImFubm90YXRpb24gbXVzdCBoYXZlIGFuIGlkIGZvciBkZWxldGUoKVwiKVxuICAgIHRoaXMuX2N5Y2xlKG9iaiwgJ2RlbGV0ZScpXG5cbiAgIyBQdWJsaWM6IFF1ZXJpZXMgdGhlIHN0b3JlXG4gICNcbiAgIyBxdWVyeSAtIEFuIE9iamVjdCBkZWZpbmluZyBhIHF1ZXJ5LiBUaGlzIG1heSBiZSBpbnRlcnByZXRlZCBkaWZmZXJlbnRseSBieVxuICAjICAgICAgICAgZGlmZmVyZW50IHN0b3Jlcy5cbiAgI1xuICAjIFJldHVybnMgYSBQcm9taXNlIHJlc29sdmluZyB0byB0aGUgc3RvcmUgcmV0dXJuIHZhbHVlLlxuICBxdWVyeTogKHF1ZXJ5KSAtPlxuICAgIHJldHVybiBAcmVnaXN0cnlbJ3N0b3JlJ10ucXVlcnkocXVlcnkpXG5cbiAgIyBQdWJsaWM6IFF1ZXJpZXMgdGhlIHN0b3JlXG4gICNcbiAgIyBxdWVyeSAtIEFuIE9iamVjdCBkZWZpbmluZyBhIHF1ZXJ5LiBUaGlzIG1heSBiZSBpbnRlcnByZXRlZCBkaWZmZXJlbnRseSBieVxuICAjICAgICAgICAgZGlmZmVyZW50IHN0b3Jlcy5cbiAgI1xuICAjIFJldHVybnMgYSBQcm9taXNlIHJlc29sdmluZyB0byB0aGUgYW5ub3RhdGlvbnMuXG4gIGxvYWQ6IChxdWVyeSkgLT5cbiAgICByZXR1cm4gdGhpcy5xdWVyeShxdWVyeSlcblxuICAjIFByaXZhdGU6IGN5Y2xlIGEgc3RvcmUgZXZlbnQsIGtlZXBpbmcgdHJhY2sgb2YgdGhlIGFubm90YXRpb24gb2JqZWN0IGFuZFxuICAjIHVwZGF0aW5nIGl0IGFzIG5lY2Vzc2FyeS5cbiAgX2N5Y2xlOiAob2JqLCBzdG9yZUZ1bmMpIC0+XG4gICAgc2FmZUNvcHkgPSAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqKVxuICAgIGRlbGV0ZSBzYWZlQ29weS5fbG9jYWxcblxuICAgIEByZWdpc3RyeVsnc3RvcmUnXVtzdG9yZUZ1bmNdKHNhZmVDb3B5KVxuICAgICAgLnRoZW4gKHJldCkgPT5cbiAgICAgICAgIyBFbXB0eSBvYmplY3Qgd2l0aG91dCBjaGFuZ2luZyBpZGVudGl0eVxuICAgICAgICBmb3Igb3duIGssIHYgb2Ygb2JqXG4gICAgICAgICAgaWYgayAhPSAnX2xvY2FsJ1xuICAgICAgICAgICAgZGVsZXRlIG9ialtrXVxuXG4gICAgICAgICMgVXBkYXRlIHdpdGggc3RvcmUgcmV0dXJuIHZhbHVlXG4gICAgICAgICQuZXh0ZW5kKG9iaiwgcmV0KVxuXG4gICAgICAgIHJldHVybiBvYmogXG5cbm1vZHVsZS5leHBvcnRzID0gQW5ub3RhdGlvblByb3ZpZGVyXG4iLCJleHRlbmQgPSByZXF1aXJlICdiYWNrYm9uZS1leHRlbmQtc3RhbmRhbG9uZSdcblxuRGVsZWdhdG9yID0gcmVxdWlyZSAnLi9jbGFzcydcblJhbmdlID0gcmVxdWlyZSAnLi9yYW5nZSdcblV0aWwgPSByZXF1aXJlICcuL3V0aWwnXG5XaWRnZXQgPSByZXF1aXJlICcuL3dpZGdldCdcblZpZXdlciA9IHJlcXVpcmUgJy4vdmlld2VyJ1xuRWRpdG9yID0gcmVxdWlyZSAnLi9lZGl0b3InXG5Ob3RpZmljYXRpb24gPSByZXF1aXJlICcuL25vdGlmaWNhdGlvbidcblJlZ2lzdHJ5ID0gcmVxdWlyZSAnLi9yZWdpc3RyeSdcblxuQW5ub3RhdGlvblByb3ZpZGVyID0gcmVxdWlyZSAnLi9hbm5vdGF0aW9ucydcblxuX3QgPSBVdGlsLlRyYW5zbGF0aW9uU3RyaW5nXG5cblxuXG4jIFNlbGVjdGlvbiBhbmQgcmFuZ2UgY3JlYXRpb24gcmVmZXJlbmNlIGZvciB0aGUgZm9sbG93aW5nIGNvZGU6XG4jIGh0dHA6Ly93d3cucXVpcmtzbW9kZS5vcmcvZG9tL3JhbmdlX2ludHJvLmh0bWxcbiNcbiMgSSd2ZSByZW1vdmVkIGFueSBzdXBwb3J0IGZvciBJRSBUZXh0UmFuZ2UgKHNlZSBjb21taXQgZDcwODViZjIgZm9yIGNvZGUpXG4jIGZvciB0aGUgbW9tZW50LCBoYXZpbmcgbm8gbWVhbnMgb2YgdGVzdGluZyBpdC5cblxuIyBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBBbm5vdGF0b3Igb2JqZWN0LlxuX0Fubm90YXRvciA9IHRoaXMuQW5ub3RhdG9yXG5cbmhhbmRsZUVycm9yID0gLT5cbiAgY29uc29sZS5lcnJvci5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG5cbmNsYXNzIEFubm90YXRvciBleHRlbmRzIERlbGVnYXRvclxuICAjIEV2ZW50cyB0byBiZSBib3VuZCBvbiBBbm5vdGF0b3IjZWxlbWVudC5cbiAgZXZlbnRzOlxuICAgIFwiLmFubm90YXRvci1hZGRlciBidXR0b24gY2xpY2tcIjogICAgIFwib25BZGRlckNsaWNrXCJcbiAgICBcIi5hbm5vdGF0b3ItYWRkZXIgYnV0dG9uIG1vdXNlZG93blwiOiBcIm9uQWRkZXJNb3VzZWRvd25cIlxuICAgIFwiLmFubm90YXRvci1obCBtb3VzZW92ZXJcIjogICAgICAgICAgIFwib25IaWdobGlnaHRNb3VzZW92ZXJcIlxuICAgIFwiLmFubm90YXRvci1obCBtb3VzZW91dFwiOiAgICAgICAgICAgIFwic3RhcnRWaWV3ZXJIaWRlVGltZXJcIlxuXG4gIGh0bWw6XG4gICAgYWRkZXI6ICAgJzxkaXYgY2xhc3M9XCJhbm5vdGF0b3ItYWRkZXJcIj48YnV0dG9uIHR5cGU9XCJidXR0b25cIj4nICsgX3QoJ0Fubm90YXRlJykgKyAnPC9idXR0b24+PC9kaXY+J1xuICAgIHdyYXBwZXI6ICc8ZGl2IGNsYXNzPVwiYW5ub3RhdG9yLXdyYXBwZXJcIj48L2Rpdj4nXG5cbiAgb3B0aW9uczogIyBDb25maWd1cmF0aW9uIG9wdGlvbnNcblxuICAgIHN0b3JlOiBudWxsICMgU3RvcmUgcGx1Z2luIHRvIHVzZS4gSWYgbnVsbCwgQW5ub3RhdG9yIHdpbGwgdXNlIGEgZGVmYXVsdCBzdG9yZS5cblxuICAgIHJlYWRPbmx5OiBmYWxzZSAjIFN0YXJ0IEFubm90YXRvciBpbiByZWFkLW9ubHkgbW9kZS4gTm8gY29udHJvbHMgd2lsbCBiZSBzaG93bi5cblxuICAgIGxvYWRRdWVyeToge30gIyBJbml0aWFsIHF1ZXJ5IHRvIGxvYWQgQW5ub3RhdGlvbnNcblxuICBwbHVnaW5zOiB7fVxuXG4gIGVkaXRvcjogbnVsbFxuXG4gIHZpZXdlcjogbnVsbFxuXG4gIHNlbGVjdGVkUmFuZ2VzOiBudWxsXG5cbiAgbW91c2VJc0Rvd246IGZhbHNlXG5cbiAgaWdub3JlTW91c2V1cDogZmFsc2VcblxuICB2aWV3ZXJIaWRlVGltZXI6IG51bGxcblxuICAjIFB1YmxpYzogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGUgQW5ub3RhdG9yLiBSZXF1aXJlcyBhIERPTSBFbGVtZW50IGluXG4gICMgd2hpY2ggdG8gd2F0Y2ggZm9yIGFubm90YXRpb25zIGFzIHdlbGwgYXMgYW55IG9wdGlvbnMuXG4gICNcbiAgIyBOT1RFOiBJZiB0aGUgQW5ub3RhdG9yIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGN1cnJlbnQgYnJvd3NlciBpdCB3aWxsIG5vdFxuICAjIHBlcmZvcm0gYW55IHNldHVwIGFuZCBzaW1wbHkgcmV0dXJuIGEgYmFzaWMgb2JqZWN0LiBUaGlzIGFsbG93cyBwbHVnaW5zXG4gICMgdG8gc3RpbGwgYmUgbG9hZGVkIGJ1dCB3aWxsIG5vdCBmdW5jdGlvbiBhcyBleHBlY3RlZC4gSXQgaXMgcmVjY29tZW5kZWRcbiAgIyB0byBjYWxsIEFubm90YXRvci5zdXBwb3J0ZWQoKSBiZWZvcmUgY3JlYXRpbmcgdGhlIGluc3RhbmNlIG9yIHVzaW5nIHRoZVxuICAjIFVuc3VwcG9ydGVkIHBsdWdpbiB3aGljaCB3aWxsIG5vdGlmeSB1c2VycyB0aGF0IHRoZSBBbm5vdGF0b3Igd2lsbCBub3Qgd29yay5cbiAgI1xuICAjIGVsZW1lbnQgLSBBIERPTSBFbGVtZW50IGluIHdoaWNoIHRvIGFubm90YXRlLlxuICAjIG9wdGlvbnMgLSBBbiBvcHRpb25zIE9iamVjdC4gTk9URTogVGhlcmUgYXJlIGN1cnJlbnRseSBubyB1c2VyIG9wdGlvbnMuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBhbm5vdGF0b3IgPSBuZXcgQW5ub3RhdG9yKGRvY3VtZW50LmJvZHkpXG4gICNcbiAgIyAgICMgRXhhbXBsZSBvZiBjaGVja2luZyBmb3Igc3VwcG9ydC5cbiAgIyAgIGlmIEFubm90YXRvci5zdXBwb3J0ZWQoKVxuICAjICAgICBhbm5vdGF0b3IgPSBuZXcgQW5ub3RhdG9yKGRvY3VtZW50LmJvZHkpXG4gICMgICBlbHNlXG4gICMgICAgICMgRmFsbGJhY2sgZm9yIHVuc3VwcG9ydGVkIGJyb3dzZXJzLlxuICAjXG4gICMgUmV0dXJucyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgQW5ub3RhdG9yLlxuICBjb25zdHJ1Y3RvcjogKGVsZW1lbnQsIG9wdGlvbnMpIC0+XG4gICAgc3VwZXJcbiAgICBAcGx1Z2lucyA9IHt9XG5cbiAgICBBbm5vdGF0b3IuX2luc3RhbmNlcy5wdXNoKHRoaXMpXG5cbiAgICAjIFJldHVybiBlYXJseSBpZiB0aGUgYW5ub3RhdG9yIGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgcmV0dXJuIHRoaXMgdW5sZXNzIEFubm90YXRvci5zdXBwb3J0ZWQoKVxuXG4gICAgIyBDcmVhdGUgdGhlIHJlZ2lzdHJ5IGFuZCBzdGFydCB0aGUgYXBwbGljYXRpb25cbiAgICBSZWdpc3RyeS5jcmVhdGVBcHAodGhpcywgb3B0aW9ucylcblxuICAjIFB1YmxpYzogQ3JlYXRlcyBhIHN1YmNsYXNzIG9mIEFubm90YXRvci5cbiAgI1xuICAjIFNlZSB0aGUgZG9jdW1lbnRhdGlvbiBmcm9tIEJhY2tib25lOiBodHRwOi8vYmFja2JvbmVqcy5vcmcvI01vZGVsLWV4dGVuZFxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgdmFyIEV4dGVuZGVkQW5ub3RhdG9yID0gQW5ub3RhdG9yLmV4dGVuZCh7XG4gICMgICAgIHNldHVwQW5ub3RhdGlvbjogZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgIyAgICAgICAvLyBJbnZva2UgdGhlIGJ1aWx0LWluIGltcGxlbWVudGF0aW9uXG4gICMgICAgICAgdHJ5IHtcbiAgIyAgICAgICAgIEFubm90YXRvci5wcm90b3R5cGUuc2V0dXBBbm5vdGF0aW9uLmNhbGwodGhpcywgYW5ub3RhdGlvbik7XG4gICMgICAgICAgfSBjYXRjaCAoZSkge1xuICAjICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBBbm5vdGF0b3IuUmFuZ2UuUmFuZ2VFcnJvcikge1xuICAjICAgICAgICAgICAvLyBUcnkgdG8gbG9jYXRlIHRoZSBBbm5vdGF0aW9uIHVzaW5nIHRoZSBxdW90ZVxuICAjICAgICAgICAgfSBlbHNlIHtcbiAgIyAgICAgICAgICAgdGhyb3cgZTtcbiAgIyAgICAgICAgIH1cbiAgIyAgICAgICB9XG4gICNcbiAgIyAgICAgICByZXR1cm4gYW5ub3RhdGlvbjtcbiAgIyAgIH0pO1xuICAjXG4gICMgICB2YXIgYW5ub3RhdG9yID0gbmV3IEV4dGVuZGVkQW5ub3RhdG9yKGRvY3VtZW50LmJvZHksIC8qIHtvcHRpb25zfSAqLyk7XG4gIEBleHRlbmQ6IGV4dGVuZFxuXG4gICMgV3JhcHMgdGhlIGNoaWxkcmVuIG9mIEBlbGVtZW50IGluIGEgQHdyYXBwZXIgZGl2LiBOT1RFOiBUaGlzIG1ldGhvZCB3aWxsIGFsc29cbiAgIyByZW1vdmUgYW55IHNjcmlwdCBlbGVtZW50cyBpbnNpZGUgQGVsZW1lbnQgdG8gcHJldmVudCB0aGVtIHJlLWV4ZWN1dGluZy5cbiAgI1xuICAjIFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nLlxuICBfc2V0dXBXcmFwcGVyOiAtPlxuICAgIEB3cmFwcGVyID0gJChAaHRtbC53cmFwcGVyKVxuXG4gICAgIyBXZSBuZWVkIHRvIHJlbW92ZSBhbGwgc2NyaXB0cyB3aXRoaW4gdGhlIGVsZW1lbnQgYmVmb3JlIHdyYXBwaW5nIHRoZVxuICAgICMgY29udGVudHMgd2l0aGluIGEgZGl2LiBPdGhlcndpc2Ugd2hlbiBzY3JpcHRzIGFyZSByZWFwcGVuZGVkIHRvIHRoZSBET01cbiAgICAjIHRoZXkgd2lsbCByZS1leGVjdXRlLiBUaGlzIGlzIGFuIGlzc3VlIGZvciBzY3JpcHRzIHRoYXQgY2FsbFxuICAgICMgZG9jdW1lbnQud3JpdGUoKSAtIHN1Y2ggYXMgYWRzIC0gYXMgdGhleSB3aWxsIGNsZWFyIHRoZSBwYWdlLlxuICAgIEBlbGVtZW50LmZpbmQoJ3NjcmlwdCcpLnJlbW92ZSgpXG4gICAgQGVsZW1lbnQud3JhcElubmVyKEB3cmFwcGVyKVxuICAgIEB3cmFwcGVyID0gQGVsZW1lbnQuZmluZCgnLmFubm90YXRvci13cmFwcGVyJylcblxuICAgIHRoaXNcblxuICAjIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgQW5ub3RhdG9yLlZpZXdlciBhbmQgYXNzaWducyBpdCB0byB0aGUgQHZpZXdlclxuICAjIHByb3BlcnR5LCBhcHBlbmRzIGl0IHRvIHRoZSBAd3JhcHBlciBhbmQgc2V0cyB1cCBldmVudCBsaXN0ZW5lcnMuXG4gICNcbiAgIyBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZy5cbiAgX3NldHVwVmlld2VyOiAtPlxuICAgIEB2aWV3ZXIgPSBuZXcgQW5ub3RhdG9yLlZpZXdlcihyZWFkT25seTogQG9wdGlvbnMucmVhZE9ubHkpXG4gICAgQHZpZXdlci5oaWRlKClcbiAgICAgIC5vbihcImVkaXRcIiwgdGhpcy5vbkVkaXRBbm5vdGF0aW9uKVxuICAgICAgLm9uKFwiZGVsZXRlXCIsIChhbm5vdGF0aW9uKSA9PlxuICAgICAgICBAdmlld2VyLmhpZGUoKVxuICAgICAgICB0aGlzLnB1Ymxpc2goJ2JlZm9yZUFubm90YXRpb25EZWxldGVkJywgW2Fubm90YXRpb25dKVxuICAgICAgICAjIERlbGV0ZSBoaWdobGlnaHQgZWxlbWVudHMuXG4gICAgICAgIHRoaXMuY2xlYW51cEFubm90YXRpb24oYW5ub3RhdGlvbilcbiAgICAgICAgIyBEZWxldGUgYW5ub3RhdGlvblxuICAgICAgICB0aGlzLmFubm90YXRpb25zLmRlbGV0ZShhbm5vdGF0aW9uKVxuICAgICAgICAgIC5kb25lID0+IHRoaXMucHVibGlzaCgnYW5ub3RhdGlvbkRlbGV0ZWQnLCBbYW5ub3RhdGlvbl0pXG4gICAgICApXG4gICAgICAuYWRkRmllbGQoe1xuICAgICAgICBsb2FkOiAoZmllbGQsIGFubm90YXRpb24pID0+XG4gICAgICAgICAgaWYgYW5ub3RhdGlvbi50ZXh0XG4gICAgICAgICAgICAkKGZpZWxkKS5odG1sKFV0aWwuZXNjYXBlKGFubm90YXRpb24udGV4dCkpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJChmaWVsZCkuaHRtbChcIjxpPiN7X3QgJ05vIENvbW1lbnQnfTwvaT5cIilcbiAgICAgICAgICB0aGlzLnB1Ymxpc2goJ2Fubm90YXRpb25WaWV3ZXJUZXh0RmllbGQnLCBbZmllbGQsIGFubm90YXRpb25dKVxuICAgICAgfSlcbiAgICAgIC5lbGVtZW50LmFwcGVuZFRvKEB3cmFwcGVyKS5iaW5kKHtcbiAgICAgICAgXCJtb3VzZW92ZXJcIjogdGhpcy5jbGVhclZpZXdlckhpZGVUaW1lclxuICAgICAgICBcIm1vdXNlb3V0XCI6ICB0aGlzLnN0YXJ0Vmlld2VySGlkZVRpbWVyXG4gICAgICB9KVxuICAgIHRoaXNcblxuICAjIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgdGhlIEFubm90YXRvci5FZGl0b3IgYW5kIGFzc2lnbnMgaXQgdG8gQGVkaXRvci5cbiAgIyBBcHBlbmRzIHRoaXMgdG8gdGhlIEB3cmFwcGVyIGFuZCBzZXRzIHVwIGV2ZW50IGxpc3RlbmVycy5cbiAgI1xuICAjIFJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgX3NldHVwRWRpdG9yOiAtPlxuICAgIEBlZGl0b3IgPSBuZXcgQW5ub3RhdG9yLkVkaXRvcigpXG4gICAgQGVkaXRvci5oaWRlKClcbiAgICAgIC5vbignaGlkZScsIHRoaXMub25FZGl0b3JIaWRlKVxuICAgICAgLm9uKCdzYXZlJywgdGhpcy5vbkVkaXRvclN1Ym1pdClcbiAgICAgIC5hZGRGaWVsZCh7XG4gICAgICAgIHR5cGU6ICd0ZXh0YXJlYScsXG4gICAgICAgIGxhYmVsOiBfdCgnQ29tbWVudHMnKSArICdcXHUyMDI2J1xuICAgICAgICBsb2FkOiAoZmllbGQsIGFubm90YXRpb24pIC0+XG4gICAgICAgICAgJChmaWVsZCkuZmluZCgndGV4dGFyZWEnKS52YWwoYW5ub3RhdGlvbi50ZXh0IHx8ICcnKVxuICAgICAgICBzdWJtaXQ6IChmaWVsZCwgYW5ub3RhdGlvbikgLT5cbiAgICAgICAgICBhbm5vdGF0aW9uLnRleHQgPSAkKGZpZWxkKS5maW5kKCd0ZXh0YXJlYScpLnZhbCgpXG4gICAgICB9KVxuXG4gICAgQGVkaXRvci5lbGVtZW50LmFwcGVuZFRvKEB3cmFwcGVyKVxuICAgIHRoaXNcblxuICAjIFNldHMgdXAgdGhlIHNlbGVjdGlvbiBldmVudCBsaXN0ZW5lcnMgdG8gd2F0Y2ggbW91c2UgYWN0aW9ucyBvbiB0aGUgZG9jdW1lbnQuXG4gICNcbiAgIyBSZXR1cm5zIGl0c2VsZiBmb3IgY2hhaW5pbmcuXG4gIF9zZXR1cERvY3VtZW50RXZlbnRzOiAtPlxuICAgICQoZG9jdW1lbnQpLmJpbmQoe1xuICAgICAgXCJtb3VzZXVwXCI6ICAgdGhpcy5jaGVja0ZvckVuZFNlbGVjdGlvblxuICAgICAgXCJtb3VzZWRvd25cIjogdGhpcy5jaGVja0ZvclN0YXJ0U2VsZWN0aW9uXG4gICAgfSlcbiAgICB0aGlzXG5cbiAgIyBTZXRzIHVwIGFueSBkeW5hbWljYWxseSBjYWxjdWxhdGVkIENTUyBmb3IgdGhlIEFubm90YXRvci5cbiAgI1xuICAjIFJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgX3NldHVwRHluYW1pY1N0eWxlOiAtPlxuICAgIHN0eWxlID0gJCgnI2Fubm90YXRvci1keW5hbWljLXN0eWxlJylcblxuICAgIGlmICghc3R5bGUubGVuZ3RoKVxuICAgICAgc3R5bGUgPSAkKCc8c3R5bGUgaWQ9XCJhbm5vdGF0b3ItZHluYW1pYy1zdHlsZVwiPjwvc3R5bGU+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZClcblxuICAgIHNlbCA9ICcqJyArIChcIjpub3QoLmFubm90YXRvci0je3h9KVwiIGZvciB4IGluIFsnYWRkZXInLCAnb3V0ZXInLCAnbm90aWNlJywgJ2ZpbHRlciddKS5qb2luKCcnKVxuXG4gICAgIyB1c2UgdGhlIG1heGltdW0gei1pbmRleCBpbiB0aGUgcGFnZVxuICAgIG1heCA9IFV0aWwubWF4WkluZGV4KCQoZG9jdW1lbnQuYm9keSkuZmluZChzZWwpKVxuXG4gICAgIyBidXQgZG9uJ3QgZ28gc21hbGxlciB0aGFuIDEwMTAsIGJlY2F1c2UgdGhpcyBpc24ndCBidWxsZXRwcm9vZiAtLVxuICAgICMgZHluYW1pYyBlbGVtZW50cyBpbiB0aGUgcGFnZSAobm90aWZpY2F0aW9ucywgZGlhbG9ncywgZXRjLikgbWF5IHdlbGxcbiAgICAjIGhhdmUgaGlnaCB6LWluZGljZXMgdGhhdCB3ZSBjYW4ndCBjYXRjaCB1c2luZyB0aGUgYWJvdmUgbWV0aG9kLlxuICAgIG1heCA9IE1hdGgubWF4KG1heCwgMTAwMClcblxuICAgIHN0eWxlLnRleHQgW1xuICAgICAgXCIuYW5ub3RhdG9yLWFkZGVyLCAuYW5ub3RhdG9yLW91dGVyLCAuYW5ub3RhdG9yLW5vdGljZSB7XCJcbiAgICAgIFwiICB6LWluZGV4OiAje21heCArIDIwfTtcIlxuICAgICAgXCJ9XCJcbiAgICAgIFwiLmFubm90YXRvci1maWx0ZXIge1wiXG4gICAgICBcIiAgei1pbmRleDogI3ttYXggKyAxMH07XCJcbiAgICAgIFwifVwiXG4gICAgXS5qb2luKFwiXFxuXCIpXG5cbiAgICB0aGlzXG5cbiAgIyBQdWJsaWM6IExvYWQgYW5kIGRyYXcgYW5ub3RhdGlvbnMgZnJvbSBhIGdpdmVuIHF1ZXJ5LlxuICAjXG4gICMgcXVlcnkgLSB0aGUgcXVlcnkgdG8gcGFzcyB0byB0aGUgYmFja2VuZFxuICAjXG4gICMgUmV0dXJucyBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGxvYWRpbmcgaXMgY29tcGxldGUuXG4gIGxvYWQ6IChxdWVyeSkgLT5cbiAgICBAYW5ub3RhdGlvbnMubG9hZChxdWVyeSlcbiAgICAgIC50aGVuIChhbm5vdGF0aW9ucywgbWV0YSkgPT5cbiAgICAgICAgdGhpcy5sb2FkQW5ub3RhdGlvbnMoYW5ub3RhdGlvbnMpXG5cbiAgIyBQdWJsaWM6IERlc3Ryb3kgdGhlIGN1cnJlbnQgQW5ub3RhdG9yIGluc3RhbmNlLCB1bmJpbmRpbmcgYWxsIGV2ZW50cyBhbmRcbiAgIyBkaXNwb3Npbmcgb2YgYWxsIHJlbGV2YW50IGVsZW1lbnRzLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBkZXN0cm95OiAtPlxuICAgICQoZG9jdW1lbnQpLnVuYmluZCh7XG4gICAgICBcIm1vdXNldXBcIjogICB0aGlzLmNoZWNrRm9yRW5kU2VsZWN0aW9uXG4gICAgICBcIm1vdXNlZG93blwiOiB0aGlzLmNoZWNrRm9yU3RhcnRTZWxlY3Rpb25cbiAgICB9KVxuXG4gICAgJCgnI2Fubm90YXRvci1keW5hbWljLXN0eWxlJykucmVtb3ZlKClcblxuICAgIEBhZGRlci5yZW1vdmUoKVxuICAgIEB2aWV3ZXIuZGVzdHJveSgpXG4gICAgQGVkaXRvci5kZXN0cm95KClcblxuICAgIEB3cmFwcGVyLmZpbmQoJy5hbm5vdGF0b3ItaGwnKS5lYWNoIC0+XG4gICAgICAkKHRoaXMpLmNvbnRlbnRzKCkuaW5zZXJ0QmVmb3JlKHRoaXMpXG4gICAgICAkKHRoaXMpLnJlbW92ZSgpXG5cbiAgICBAd3JhcHBlci5jb250ZW50cygpLmluc2VydEJlZm9yZShAd3JhcHBlcilcbiAgICBAd3JhcHBlci5yZW1vdmUoKVxuICAgIEBlbGVtZW50LmRhdGEoJ2Fubm90YXRvcicsIG51bGwpXG5cbiAgICBmb3IgbmFtZSwgcGx1Z2luIG9mIEBwbHVnaW5zXG4gICAgICBAcGx1Z2luc1tuYW1lXS5kZXN0cm95KClcblxuICAgIHRoaXMucmVtb3ZlRXZlbnRzKClcbiAgICBpZHggPSBBbm5vdGF0b3IuX2luc3RhbmNlcy5pbmRleE9mKHRoaXMpXG4gICAgaWYgaWR4ICE9IC0xXG4gICAgICBBbm5vdGF0b3IuX2luc3RhbmNlcy5zcGxpY2UoaWR4LCAxKVxuXG4gICMgUHVibGljOiBHZXRzIHRoZSBjdXJyZW50IHNlbGVjdGlvbiBleGNsdWRpbmcgYW55IG5vZGVzIHRoYXQgZmFsbCBvdXRzaWRlIG9mXG4gICMgdGhlIEB3cmFwcGVyLiBUaGVuIHJldHVybnMgYW5kIEFycmF5IG9mIE5vcm1hbGl6ZWRSYW5nZSBpbnN0YW5jZXMuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIEEgc2VsZWN0aW9uIGluc2lkZSBAd3JhcHBlclxuICAjICAgYW5ub3RhdGlvbi5nZXRTZWxlY3RlZFJhbmdlcygpXG4gICMgICAjID0+IFJldHVybnMgW05vcm1hbGl6ZWRSYW5nZV1cbiAgI1xuICAjICAgIyBBIHNlbGVjdGlvbiBvdXRzaWRlIG9mIEB3cmFwcGVyXG4gICMgICBhbm5vdGF0aW9uLmdldFNlbGVjdGVkUmFuZ2VzKClcbiAgIyAgICMgPT4gUmV0dXJucyBbXVxuICAjXG4gICMgUmV0dXJucyBBcnJheSBvZiBOb3JtYWxpemVkUmFuZ2UgaW5zdGFuY2VzLlxuICBnZXRTZWxlY3RlZFJhbmdlczogLT5cbiAgICBzZWxlY3Rpb24gPSBVdGlsLmdldEdsb2JhbCgpLmdldFNlbGVjdGlvbigpXG5cbiAgICByYW5nZXMgPSBbXVxuICAgIHJhbmdlc1RvSWdub3JlID0gW11cbiAgICB1bmxlc3Mgc2VsZWN0aW9uLmlzQ29sbGFwc2VkXG4gICAgICByYW5nZXMgPSBmb3IgaSBpbiBbMC4uLnNlbGVjdGlvbi5yYW5nZUNvdW50XVxuICAgICAgICByID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoaSlcbiAgICAgICAgYnJvd3NlclJhbmdlID0gbmV3IFJhbmdlLkJyb3dzZXJSYW5nZShyKVxuICAgICAgICBub3JtZWRSYW5nZSA9IGJyb3dzZXJSYW5nZS5ub3JtYWxpemUoKS5saW1pdChAd3JhcHBlclswXSlcblxuICAgICAgICAjIElmIHRoZSBuZXcgcmFuZ2UgZmFsbHMgZnVsbHkgb3V0c2lkZSB0aGUgd3JhcHBlciwgd2VcbiAgICAgICAgIyBzaG91bGQgYWRkIGl0IGJhY2sgdG8gdGhlIGRvY3VtZW50IGJ1dCBub3QgcmV0dXJuIGl0IGZyb21cbiAgICAgICAgIyB0aGlzIG1ldGhvZFxuICAgICAgICByYW5nZXNUb0lnbm9yZS5wdXNoKHIpIGlmIG5vcm1lZFJhbmdlIGlzIG51bGxcblxuICAgICAgICBub3JtZWRSYW5nZVxuXG4gICAgICAjIEJyb3dzZXJSYW5nZSNub3JtYWxpemUoKSBtb2RpZmllcyB0aGUgRE9NIHN0cnVjdHVyZSBhbmQgZGVzZWxlY3RzIHRoZVxuICAgICAgIyB1bmRlcmx5aW5nIHRleHQgYXMgYSByZXN1bHQuIFNvIGhlcmUgd2UgcmVtb3ZlIHRoZSBzZWxlY3RlZCByYW5nZXMgYW5kXG4gICAgICAjIHJlYXBwbHkgdGhlIG5ldyBvbmVzLlxuICAgICAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpXG5cbiAgICBmb3IgciBpbiByYW5nZXNUb0lnbm9yZVxuICAgICAgc2VsZWN0aW9uLmFkZFJhbmdlKHIpXG5cbiAgICAjIFJlbW92ZSBhbnkgcmFuZ2VzIHRoYXQgZmVsbCBvdXRzaWRlIG9mIEB3cmFwcGVyLlxuICAgICQuZ3JlcCByYW5nZXMsIChyYW5nZSkgLT5cbiAgICAgICMgQWRkIHRoZSBub3JtZWQgcmFuZ2UgYmFjayB0byB0aGUgc2VsZWN0aW9uIGlmIGl0IGV4aXN0cy5cbiAgICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZS50b1JhbmdlKCkpIGlmIHJhbmdlXG4gICAgICByYW5nZVxuXG5cbiAgIyBQdWJsaWM6IEluaXRpYWxpc2VzIGFuIGFubm90YXRpb24gZnJvbSBhbiBvYmplY3QgcmVwcmVzZW50YXRpb24uIEl0IGZpbmRzXG4gICMgdGhlIHNlbGVjdGVkIHJhbmdlIGFuZCBoaWdsaWdodHMgdGhlIHNlbGVjdGlvbiBpbiB0aGUgRE9NLlxuICAjXG4gICMgYW5ub3RhdGlvbiAtIEFuIGFubm90YXRpb24gT2JqZWN0IHRvIGluaXRpYWxpc2UuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIENyZWF0ZSBhIGJyYW5kIG5ldyBhbm5vdGF0aW9uIGZyb20gdGhlIGN1cnJlbnRseSBzZWxlY3RlZCB0ZXh0LlxuICAjICAgYW5ub3RhdGlvbiA9IGFubm90YXRvci5zZXR1cEFubm90YXRpb24oe3JhbmdlczogYW5ub3RhdG9yLnNlbGVjdGVkUmFuZ2VzfSlcbiAgIyAgICMgYW5ub3RhdGlvbiBoYXMgbm93IGJlZW4gYXNzaWduZWQgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCByYW5nZVxuICAjICAgIyBhbmQgYSBoaWdobGlnaHQgYXBwZW5kZWQgdG8gdGhlIERPTS5cbiAgI1xuICAjICAgIyBBZGQgYW4gZXhpc3RpbmcgYW5ub3RhdGlvbiB0aGF0IGhhcyBiZWVuIHN0b3JlZCBlbHNld2VyZSB0byB0aGUgRE9NLlxuICAjICAgYW5ub3RhdGlvbiA9IGdldFN0b3JlZEFubm90YXRpb25XaXRoU2VyaWFsaXplZFJhbmdlcygpXG4gICMgICBhbm5vdGF0aW9uID0gYW5ub3RhdG9yLnNldHVwQW5ub3RhdGlvbihhbm5vdGF0aW9uKVxuICAjXG4gICMgUmV0dXJucyB0aGUgaW5pdGlhbGlzZWQgYW5ub3RhdGlvbi5cbiAgc2V0dXBBbm5vdGF0aW9uOiAoYW5ub3RhdGlvbikgLT5cbiAgICByb290ID0gQHdyYXBwZXJbMF1cblxuICAgIG5vcm1lZFJhbmdlcyA9IFtdXG4gICAgZm9yIHIgaW4gYW5ub3RhdGlvbi5yYW5nZXNcbiAgICAgIHRyeVxuICAgICAgICBub3JtZWRSYW5nZXMucHVzaChSYW5nZS5zbmlmZihyKS5ub3JtYWxpemUocm9vdCkpXG4gICAgICBjYXRjaCBlXG4gICAgICAgIGlmIGUgaW5zdGFuY2VvZiBSYW5nZS5SYW5nZUVycm9yXG4gICAgICAgICAgdGhpcy5wdWJsaXNoKCdyYW5nZU5vcm1hbGl6ZUZhaWwnLCBbYW5ub3RhdGlvbiwgciwgZV0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAjIE9oIEphdmFzY3JpcHQsIHdoeSB5b3Ugc28gY3JhcD8gVGhpcyB3aWxsIGxvc2UgdGhlIHRyYWNlYmFjay5cbiAgICAgICAgICB0aHJvdyBlXG5cbiAgICBhbm5vdGF0aW9uLnF1b3RlICAgICAgPSBbXVxuICAgIGFubm90YXRpb24ucmFuZ2VzICAgICA9IFtdXG4gICAgYW5ub3RhdGlvbi5fbG9jYWwgPSB7fVxuICAgIGFubm90YXRpb24uX2xvY2FsLmhpZ2hsaWdodHMgPSBbXVxuXG4gICAgZm9yIG5vcm1lZCBpbiBub3JtZWRSYW5nZXNcbiAgICAgIGFubm90YXRpb24ucXVvdGUucHVzaCAgICAgICQudHJpbShub3JtZWQudGV4dCgpKVxuICAgICAgYW5ub3RhdGlvbi5yYW5nZXMucHVzaCAgICAgbm9ybWVkLnNlcmlhbGl6ZShAd3JhcHBlclswXSwgJy5hbm5vdGF0b3ItaGwnKVxuICAgICAgJC5tZXJnZSBhbm5vdGF0aW9uLl9sb2NhbC5oaWdobGlnaHRzLCB0aGlzLmhpZ2hsaWdodFJhbmdlKG5vcm1lZClcblxuICAgICMgSm9pbiBhbGwgdGhlIHF1b3RlcyBpbnRvIG9uZSBzdHJpbmcuXG4gICAgYW5ub3RhdGlvbi5xdW90ZSA9IGFubm90YXRpb24ucXVvdGUuam9pbignIC8gJylcblxuICAgICMgU2F2ZSB0aGUgYW5ub3RhdGlvbiBkYXRhIG9uIGVhY2ggaGlnaGxpZ2h0ZXIgZWxlbWVudC5cbiAgICAkKGFubm90YXRpb24uX2xvY2FsLmhpZ2hsaWdodHMpLmRhdGEoJ2Fubm90YXRpb24nLCBhbm5vdGF0aW9uKVxuXG4gICAgYW5ub3RhdGlvblxuXG4gICMgUHVibGljOiBEZWxldGVzIHRoZSBhbm5vdGF0aW9uIGJ5IHJlbW92aW5nIHRoZSBoaWdobGlnaHQgZnJvbSB0aGUgRE9NLlxuICAjXG4gICMgYW5ub3RhdGlvbiAtIEFuIGFubm90YXRpb24gT2JqZWN0IHRvIGRlbGV0ZS5cbiAgI1xuICAjIFJldHVybnMgZGVsZXRlZCBhbm5vdGF0aW9uLlxuICBjbGVhbnVwQW5ub3RhdGlvbjogKGFubm90YXRpb24pIC0+XG4gICAgaWYgYW5ub3RhdGlvbi5fbG9jYWw/LmhpZ2hsaWdodHM/XG4gICAgICBmb3IgaCBpbiBhbm5vdGF0aW9uLl9sb2NhbC5oaWdobGlnaHRzIHdoZW4gaC5wYXJlbnROb2RlP1xuICAgICAgICAkKGgpLnJlcGxhY2VXaXRoKGguY2hpbGROb2RlcylcbiAgICAgIGRlbGV0ZSBhbm5vdGF0aW9uLl9sb2NhbC5oaWdobGlnaHRzXG5cbiAgICBhbm5vdGF0aW9uXG5cbiAgIyBQdWJsaWM6IExvYWRzIGFuIEFycmF5IG9mIGFubm90YXRpb25zIGludG8gdGhlIEBlbGVtZW50LiBCcmVha3MgdGhlIHRhc2tcbiAgIyBpbnRvIGNodW5rcyBvZiAxMCBhbm5vdGF0aW9ucy5cbiAgI1xuICAjIGFubm90YXRpb25zIC0gQW4gQXJyYXkgb2YgYW5ub3RhdGlvbiBPYmplY3RzLlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgbG9hZEFubm90YXRpb25zRnJvbVN0b3JlIChhbm5vdGF0aW9ucykgLT5cbiAgIyAgICAgYW5ub3RhdG9yLmxvYWRBbm5vdGF0aW9ucyhhbm5vdGF0aW9ucylcbiAgI1xuICAjIFJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgbG9hZEFubm90YXRpb25zOiAoYW5ub3RhdGlvbnM9W10pIC0+XG4gICAgbG9hZGVyID0gKGFubkxpc3Q9W10pID0+XG4gICAgICBub3cgPSBhbm5MaXN0LnNwbGljZSgwLDEwKVxuXG4gICAgICBmb3IgbiBpbiBub3dcbiAgICAgICAgdGhpcy5zZXR1cEFubm90YXRpb24obilcblxuICAgICAgIyBJZiB0aGVyZSBhcmUgbW9yZSB0byBkbywgZG8gdGhlbSBhZnRlciBhIDEwbXMgYnJlYWsgKGZvciBicm93c2VyXG4gICAgICAjIHJlc3BvbnNpdmVuZXNzKS5cbiAgICAgIGlmIGFubkxpc3QubGVuZ3RoID4gMFxuICAgICAgICBzZXRUaW1lb3V0KCgtPiBsb2FkZXIoYW5uTGlzdCkpLCAxMClcbiAgICAgIGVsc2VcbiAgICAgICAgdGhpcy5wdWJsaXNoICdhbm5vdGF0aW9uc0xvYWRlZCcsIFtjbG9uZV1cblxuICAgIGNsb25lID0gYW5ub3RhdGlvbnMuc2xpY2UoKVxuICAgIGxvYWRlciBhbm5vdGF0aW9uc1xuXG4gICAgdGhpc1xuXG4gICMgUHVibGljOiBDYWxscyB0aGUgU3RvcmUjZHVtcEFubm90YXRpb25zKCkgbWV0aG9kLlxuICAjXG4gICMgUmV0dXJucyBkdW1wZWQgYW5ub3RhdGlvbnMgQXJyYXkgb3IgZmFsc2UgaWYgU3RvcmUgaXMgbm90IGxvYWRlZC5cbiAgZHVtcEFubm90YXRpb25zOiAoKSAtPlxuICAgIGlmIEBwbHVnaW5zWydTdG9yZSddXG4gICAgICBAcGx1Z2luc1snU3RvcmUnXS5kdW1wQW5ub3RhdGlvbnMoKVxuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUud2FybihfdChcIkNhbid0IGR1bXAgYW5ub3RhdGlvbnMgd2l0aG91dCBTdG9yZSBwbHVnaW4uXCIpKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgIyBQdWJsaWM6IFdyYXBzIHRoZSBET00gTm9kZXMgd2l0aGluIHRoZSBwcm92aWRlZCByYW5nZSB3aXRoIGEgaGlnaGxpZ2h0XG4gICMgZWxlbWVudCBvZiB0aGUgc3BlY2lmaWVkIGNsYXNzwqBhbmQgcmV0dXJucyB0aGUgaGlnaGxpZ2h0IEVsZW1lbnRzLlxuICAjXG4gICMgbm9ybWVkUmFuZ2UgLSBBIE5vcm1hbGl6ZWRSYW5nZSB0byBiZSBoaWdobGlnaHRlZC5cbiAgIyBjc3NDbGFzcyAtIEEgQ1NTIGNsYXNzIHRvIHVzZSBmb3IgdGhlIGhpZ2hsaWdodCAoZGVmYXVsdDogJ2Fubm90YXRvci1obCcpXG4gICNcbiAgIyBSZXR1cm5zIGFuIGFycmF5IG9mIGhpZ2hsaWdodCBFbGVtZW50cy5cbiAgaGlnaGxpZ2h0UmFuZ2U6IChub3JtZWRSYW5nZSwgY3NzQ2xhc3M9J2Fubm90YXRvci1obCcpIC0+XG4gICAgd2hpdGUgPSAvXlxccyokL1xuXG4gICAgaGwgPSAkKFwiPHNwYW4gY2xhc3M9JyN7Y3NzQ2xhc3N9Jz48L3NwYW4+XCIpXG5cbiAgICAjIElnbm9yZSB0ZXh0IG5vZGVzIHRoYXQgY29udGFpbiBvbmx5IHdoaXRlc3BhY2UgY2hhcmFjdGVycy4gVGhpcyBwcmV2ZW50c1xuICAgICMgc3BhbnMgYmVpbmcgaW5qZWN0ZWQgYmV0d2VlbiBlbGVtZW50cyB0aGF0IGNhbiBvbmx5IGNvbnRhaW4gYSByZXN0cmljdGVkXG4gICAgIyBzdWJzZXQgb2Ygbm9kZXMgc3VjaCBhcyB0YWJsZSByb3dzIGFuZCBsaXN0cy4gVGhpcyBkb2VzIG1lYW4gdGhhdCB0aGVyZVxuICAgICMgbWF5IGJlIHRoZSBvZGQgYWJhbmRvbmVkIHdoaXRlc3BhY2Ugbm9kZSBpbiBhIHBhcmFncmFwaCB0aGF0IGlzIHNraXBwZWRcbiAgICAjIGJ1dCBiZXR0ZXIgdGhhbiBicmVha2luZyB0YWJsZSBsYXlvdXRzLlxuICAgIGZvciBub2RlIGluIG5vcm1lZFJhbmdlLnRleHROb2RlcygpIHdoZW4gbm90IHdoaXRlLnRlc3Qobm9kZS5ub2RlVmFsdWUpXG4gICAgICAkKG5vZGUpLndyYXBBbGwoaGwpLnBhcmVudCgpLnNob3coKVswXVxuXG4gICMgUHVibGljOiBoaWdobGlnaHQgYSBsaXN0IG9mIHJhbmdlc1xuICAjXG4gICMgbm9ybWVkUmFuZ2VzIC0gQW4gYXJyYXkgb2YgTm9ybWFsaXplZFJhbmdlcyB0byBiZSBoaWdobGlnaHRlZC5cbiAgIyBjc3NDbGFzcyAtIEEgQ1NTIGNsYXNzIHRvIHVzZSBmb3IgdGhlIGhpZ2hsaWdodCAoZGVmYXVsdDogJ2Fubm90YXRvci1obCcpXG4gICNcbiAgIyBSZXR1cm5zIGFuIGFycmF5IG9mIGhpZ2hsaWdodCBFbGVtZW50cy5cbiAgaGlnaGxpZ2h0UmFuZ2VzOiAobm9ybWVkUmFuZ2VzLCBjc3NDbGFzcz0nYW5ub3RhdG9yLWhsJykgLT5cbiAgICBoaWdobGlnaHRzID0gW11cbiAgICBmb3IgciBpbiBub3JtZWRSYW5nZXNcbiAgICAgICQubWVyZ2UgaGlnaGxpZ2h0cywgdGhpcy5oaWdobGlnaHRSYW5nZShyLCBjc3NDbGFzcylcbiAgICBoaWdobGlnaHRzXG5cbiAgIyBQdWJsaWM6IFJlZ2lzdGVycyBhIHBsdWdpbiB3aXRoIHRoZSBBbm5vdGF0b3IuIEEgcGx1Z2luIGNhbiBvbmx5IGJlXG4gICMgcmVnaXN0ZXJlZCBvbmNlLiBUaGUgcGx1Z2luIHdpbGwgYmUgaW5zdGFudGlhdGVkIGluIHRoZSBmb2xsb3dpbmcgb3JkZXIuXG4gICNcbiAgIyAxLiBBIG5ldyBpbnN0YW5jZSBvZiB0aGUgcGx1Z2luIHdpbGwgYmUgY3JlYXRlZCAocHJvdmlkaW5nIHRoZSBAZWxlbWVudCBhbmRcbiAgIyAgICBvcHRpb25zIGFzIHBhcmFtcykgdGhlbiBhc3NpZ25lZCB0byB0aGUgQHBsdWdpbnMgcmVnaXN0cnkuXG4gICMgMi4gVGhlIGN1cnJlbnQgQW5ub3RhdG9yIGluc3RhbmNlIHdpbGwgYmUgYXR0YWNoZWQgdG8gdGhlIHBsdWdpbi5cbiAgIyAzLiBUaGUgUGx1Z2luI3BsdWdpbkluaXQoKSBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgaWYgaXQgZXhpc3RzLlxuICAjXG4gICMgbmFtZSAgICAtIFBsdWdpbiB0byBpbnN0YW50aWF0ZS4gTXVzdCBiZSBpbiB0aGUgQW5ub3RhdG9yLlBsdWdpbnMgbmFtZXNwYWNlLlxuICAjIG9wdGlvbnMgLSBBbnkgb3B0aW9ucyB0byBiZSBwcm92aWRlZCB0byB0aGUgcGx1Z2luIGNvbnN0cnVjdG9yLlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgYW5ub3RhdG9yXG4gICMgICAgIC5hZGRQbHVnaW4oJ1RhZ3MnKVxuICAjICAgICAuYWRkUGx1Z2luKCdTdG9yZScsIHtcbiAgIyAgICAgICBwcmVmaXg6ICcvc3RvcmUnXG4gICMgICAgIH0pXG4gICMgICAgIC5hZGRQbHVnaW4oJ1Blcm1pc3Npb25zJywge1xuICAjICAgICAgIHVzZXI6ICdCaWxsJ1xuICAjICAgICB9KVxuICAjXG4gICMgUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmcuXG4gIGFkZFBsdWdpbjogKG5hbWUsIG9wdGlvbnMpIC0+XG4gICAgaWYgQHBsdWdpbnNbbmFtZV1cbiAgICAgIGNvbnNvbGUuZXJyb3IgX3QoXCJZb3UgY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSBpbnN0YW5jZSBvZiBhbnkgcGx1Z2luLlwiKVxuICAgIGVsc2VcbiAgICAgIGtsYXNzID0gQW5ub3RhdG9yLlBsdWdpbltuYW1lXVxuICAgICAgaWYgdHlwZW9mIGtsYXNzIGlzICdmdW5jdGlvbidcbiAgICAgICAgQHBsdWdpbnNbbmFtZV0gPSBuZXcga2xhc3MoQGVsZW1lbnRbMF0sIG9wdGlvbnMpXG4gICAgICAgIEBwbHVnaW5zW25hbWVdLmFubm90YXRvciA9IHRoaXNcbiAgICAgICAgQHBsdWdpbnNbbmFtZV0ucGx1Z2luSW5pdD8oKVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLmVycm9yIF90KFwiQ291bGQgbm90IGxvYWQgXCIpICsgbmFtZSArIF90KFwiIHBsdWdpbi4gSGF2ZSB5b3UgaW5jbHVkZWQgdGhlIGFwcHJvcHJpYXRlIDxzY3JpcHQ+IHRhZz9cIilcbiAgICB0aGlzICMgYWxsb3cgY2hhaW5pbmdcblxuICAjIFB1YmxpYzogV2FpdHMgZm9yIHRoZSBAZWRpdG9yIHRvIHN1Ym1pdCBvciBoaWRlLCByZXR1cm5pbmcgYSBwcm9taXNlIHRoYXRcbiAgIyBpcyByZXNvbHZlZCBvciByZWplY3RlZCBkZXBlbmRpbmcgb24gd2hldGhlciB0aGUgYW5ub3RhdGlvbiB3YXMgc2F2ZWQgb3JcbiAgIyBjYW5jZWxsZWQuXG4gIGVkaXRBbm5vdGF0aW9uOiAoYW5ub3RhdGlvbiwgcG9zaXRpb24pIC0+XG4gICAgZGZkID0gJC5EZWZlcnJlZCgpXG4gICAgcmVzb2x2ZSA9IGRmZC5yZXNvbHZlLmJpbmQoZGZkLCBhbm5vdGF0aW9uKVxuICAgIHJlamVjdCA9IGRmZC5yZWplY3QuYmluZChkZmQsIGFubm90YXRpb24pXG5cbiAgICB0aGlzLnNob3dFZGl0b3IoYW5ub3RhdGlvbiwgcG9zaXRpb24pXG4gICAgdGhpcy5zdWJzY3JpYmUoJ2Fubm90YXRpb25FZGl0b3JTdWJtaXQnLCByZXNvbHZlKVxuICAgIHRoaXMub25jZSAnYW5ub3RhdGlvbkVkaXRvckhpZGRlbicsID0+XG4gICAgICB0aGlzLnVuc3Vic2NyaWJlKCdhbm5vdGF0aW9uRWRpdG9yU3VibWl0JywgcmVzb2x2ZSlcbiAgICAgIHJlamVjdCgpIGlmIGRmZC5zdGF0ZSgpIGlzICdwZW5kaW5nJ1xuXG4gICAgZGZkLnByb21pc2UoKVxuXG4gICMgUHVibGljOiBMb2FkcyB0aGUgQGVkaXRvciB3aXRoIHRoZSBwcm92aWRlZCBhbm5vdGF0aW9uIGFuZCB1cGRhdGVzIGl0c1xuICAjIHBvc2l0aW9uIGluIHRoZSB3aW5kb3cuXG4gICNcbiAgIyBhbm5vdGF0aW9uIC0gQW4gYW5ub3RhdGlvbiB0byBsb2FkIGludG8gdGhlIGVkaXRvci5cbiAgIyBsb2NhdGlvbiAgIC0gUG9zaXRpb24gdG8gc2V0IHRoZSBFZGl0b3IgaW4gdGhlIGZvcm0ge3RvcDogeSwgbGVmdDogeH1cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIGFubm90YXRvci5zaG93RWRpdG9yKHt0ZXh0OiBcIm15IGNvbW1lbnRcIn0sIHt0b3A6IDM0LCBsZWZ0OiAyMzR9KVxuICAjXG4gICMgUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmcuXG4gIHNob3dFZGl0b3I6IChhbm5vdGF0aW9uLCBsb2NhdGlvbikgPT5cbiAgICBAZWRpdG9yLmVsZW1lbnQuY3NzKGxvY2F0aW9uKVxuICAgIEBlZGl0b3IubG9hZChhbm5vdGF0aW9uKVxuICAgIHRoaXMucHVibGlzaCgnYW5ub3RhdGlvbkVkaXRvclNob3duJywgW0BlZGl0b3IsIGFubm90YXRpb25dKVxuICAgIHRoaXNcblxuICAjIENhbGxiYWNrIG1ldGhvZCBjYWxsZWQgd2hlbiB0aGUgQGVkaXRvciBmaXJlcyB0aGUgXCJoaWRlXCIgZXZlbnQuIEl0c2VsZlxuICAjIHB1Ymxpc2hlcyB0aGUgJ2Fubm90YXRpb25FZGl0b3JIaWRkZW4nIGV2ZW50IGFuZCByZXNldHMgdGhlIEBpZ25vcmVNb3VzZXVwXG4gICMgcHJvcGVydHkgdG8gYWxsb3cgbGlzdGVuaW5nIHRvIG1vdXNlIGV2ZW50cy5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgb25FZGl0b3JIaWRlOiA9PlxuICAgIHRoaXMucHVibGlzaCgnYW5ub3RhdGlvbkVkaXRvckhpZGRlbicsIFtAZWRpdG9yXSlcbiAgICBAaWdub3JlTW91c2V1cCA9IGZhbHNlXG5cbiAgIyBDYWxsYmFjayBtZXRob2QgY2FsbGVkIHdoZW4gdGhlIEBlZGl0b3IgZmlyZXMgdGhlIFwic2F2ZVwiIGV2ZW50LiBJdHNlbGZcbiAgIyBwdWJsaXNoZXMgdGhlICdhbm5vdGF0aW9uRWRpdG9yU3VibWl0JyBldmVudCBhbmQgY3JlYXRlcy91cGRhdGVzIHRoZVxuICAjIGVkaXRlZCBhbm5vdGF0aW9uLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBvbkVkaXRvclN1Ym1pdDogKGFubm90YXRpb24pID0+XG4gICAgdGhpcy5wdWJsaXNoKCdhbm5vdGF0aW9uRWRpdG9yU3VibWl0JywgW0BlZGl0b3IsIGFubm90YXRpb25dKVxuXG4gICMgUHVibGljOiBMb2FkcyB0aGUgQHZpZXdlciB3aXRoIGFuIEFycmF5IG9mIGFubm90YXRpb25zIGFuZCBwb3NpdGlvbnMgaXRcbiAgIyBhdCB0aGUgbG9jYXRpb24gcHJvdmlkZWQuIENhbGxzIHRoZSAnYW5ub3RhdGlvblZpZXdlclNob3duJyBldmVudC5cbiAgI1xuICAjIGFubm90YXRpb24gLSBBbiBBcnJheSBvZiBhbm5vdGF0aW9ucyB0byBsb2FkIGludG8gdGhlIHZpZXdlci5cbiAgIyBsb2NhdGlvbiAgIC0gUG9zaXRpb24gdG8gc2V0IHRoZSBWaWV3ZXIgaW4gdGhlIGZvcm0ge3RvcDogeSwgbGVmdDogeH1cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIGFubm90YXRvci5zaG93Vmlld2VyKFxuICAjICAgIFt7dGV4dDogXCJteSBjb21tZW50XCJ9LCB7dGV4dDogXCJteSBvdGhlciBjb21tZW50XCJ9XSxcbiAgIyAgICB7dG9wOiAzNCwgbGVmdDogMjM0fSlcbiAgIyAgIClcbiAgI1xuICAjIFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nLlxuICBzaG93Vmlld2VyOiAoYW5ub3RhdGlvbnMsIGxvY2F0aW9uKSA9PlxuICAgIEB2aWV3ZXIuZWxlbWVudC5jc3MobG9jYXRpb24pXG4gICAgQHZpZXdlci5sb2FkKGFubm90YXRpb25zKVxuXG4gICAgdGhpcy5wdWJsaXNoKCdhbm5vdGF0aW9uVmlld2VyU2hvd24nLCBbQHZpZXdlciwgYW5ub3RhdGlvbnNdKVxuXG4gICMgQW5ub3RhdG9yI2VsZW1lbnQgZXZlbnQgY2FsbGJhY2suIEFsbG93cyAyNTBtcyBmb3IgbW91c2UgcG9pbnRlciB0byBnZXQgZnJvbVxuICAjIGFubm90YXRpb24gaGlnaGxpZ2h0IHRvIEB2aWV3ZXIgdG8gbWFuaXB1bGF0ZSBhbm5vdGF0aW9ucy4gSWYgdGltZXIgZXhwaXJlc1xuICAjIHRoZSBAdmlld2VyIGlzIGhpZGRlbi5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgc3RhcnRWaWV3ZXJIaWRlVGltZXI6ID0+XG4gICAgIyBEb24ndCBkbyB0aGlzIGlmIHRpbWVyIGhhcyBhbHJlYWR5IGJlZW4gc2V0IGJ5IGFub3RoZXIgYW5ub3RhdGlvbi5cbiAgICBpZiBub3QgQHZpZXdlckhpZGVUaW1lclxuICAgICAgQHZpZXdlckhpZGVUaW1lciA9IHNldFRpbWVvdXQgQHZpZXdlci5oaWRlLCAyNTBcblxuICAjIFZpZXdlciNlbGVtZW50IGV2ZW50IGNhbGxiYWNrLiBDbGVhcnMgdGhlIHRpbWVyIHNldCBieVxuICAjIEFubm90YXRvciNzdGFydFZpZXdlckhpZGVUaW1lcigpIHdoZW4gdGhlIEB2aWV3ZXIgaXMgbW91c2VkIG92ZXIuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIGNsZWFyVmlld2VySGlkZVRpbWVyOiAoKSA9PlxuICAgIGNsZWFyVGltZW91dChAdmlld2VySGlkZVRpbWVyKVxuICAgIEB2aWV3ZXJIaWRlVGltZXIgPSBmYWxzZVxuXG4gICMgQW5ub3RhdG9yI2VsZW1lbnQgY2FsbGJhY2suIFNldHMgdGhlIEBtb3VzZUlzRG93biBwcm9wZXJ0eSB1c2VkIHRvXG4gICMgZGV0ZXJtaW5lIGlmIGEgc2VsZWN0aW9uIG1heSBoYXZlIHN0YXJ0ZWQgdG8gdHJ1ZS4gQWxzbyBjYWxsc1xuICAjIEFubm90YXRvciNzdGFydFZpZXdlckhpZGVUaW1lcigpIHRvIGhpZGUgdGhlIEFubm90YXRvciN2aWV3ZXIuXG4gICNcbiAgIyBldmVudCAtIEEgbW91c2Vkb3duIEV2ZW50IG9iamVjdC5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgY2hlY2tGb3JTdGFydFNlbGVjdGlvbjogKGV2ZW50KSA9PlxuICAgIHVubGVzcyBldmVudCBhbmQgdGhpcy5pc0Fubm90YXRvcihldmVudC50YXJnZXQpXG4gICAgICB0aGlzLnN0YXJ0Vmlld2VySGlkZVRpbWVyKClcbiAgICBAbW91c2VJc0Rvd24gPSB0cnVlXG5cbiAgIyBBbm5vdGF0b3IjZWxlbWVudCBjYWxsYmFjay4gQ2hlY2tzIHRvIHNlZSBpZiBhIHNlbGVjdGlvbiBoYXMgYmVlbiBtYWRlXG4gICMgb24gbW91c2V1cCBhbmQgaWYgc28gZGlzcGxheXMgdGhlIEFubm90YXRvciNhZGRlci4gSWYgQGlnbm9yZU1vdXNldXAgaXNcbiAgIyBzZXQgd2lsbCBkbyBub3RoaW5nLiBBbHNvIHJlc2V0cyB0aGUgQG1vdXNlSXNEb3duIHByb3BlcnR5LlxuICAjXG4gICMgZXZlbnQgLSBBIG1vdXNldXAgRXZlbnQgb2JqZWN0LlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBjaGVja0ZvckVuZFNlbGVjdGlvbjogKGV2ZW50KSA9PlxuICAgIEBtb3VzZUlzRG93biA9IGZhbHNlXG5cbiAgICAjIFRoaXMgcHJldmVudHMgdGhlIG5vdGUgaW1hZ2UgZnJvbSBqdW1waW5nIGF3YXkgb24gdGhlIG1vdXNldXBcbiAgICAjIG9mIGEgY2xpY2sgb24gaWNvbi5cbiAgICBpZiBAaWdub3JlTW91c2V1cFxuICAgICAgcmV0dXJuXG5cbiAgICAjIEdldCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHJhbmdlcy5cbiAgICBAc2VsZWN0ZWRSYW5nZXMgPSB0aGlzLmdldFNlbGVjdGVkUmFuZ2VzKClcblxuICAgIGZvciByYW5nZSBpbiBAc2VsZWN0ZWRSYW5nZXNcbiAgICAgIGNvbnRhaW5lciA9IHJhbmdlLmNvbW1vbkFuY2VzdG9yXG4gICAgICBpZiAkKGNvbnRhaW5lcikuaGFzQ2xhc3MoJ2Fubm90YXRvci1obCcpXG4gICAgICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyKS5wYXJlbnRzKCdbY2xhc3MhPWFubm90YXRvci1obF0nKVswXVxuICAgICAgcmV0dXJuIGlmIHRoaXMuaXNBbm5vdGF0b3IoY29udGFpbmVyKVxuXG4gICAgaWYgZXZlbnQgYW5kIEBzZWxlY3RlZFJhbmdlcy5sZW5ndGhcbiAgICAgIEBhZGRlclxuICAgICAgICAuY3NzKFV0aWwubW91c2VQb3NpdGlvbihldmVudCwgQHdyYXBwZXJbMF0pKVxuICAgICAgICAuc2hvdygpXG4gICAgZWxzZVxuICAgICAgQGFkZGVyLmhpZGUoKVxuXG4gICMgUHVibGljOiBEZXRlcm1pbmVzIGlmIHRoZSBwcm92aWRlZCBlbGVtZW50IGlzIHBhcnQgb2YgdGhlIGFubm90YXRvciBwbHVnaW4uXG4gICMgVXNlZnVsIGZvciBpZ25vcmluZyBtb3VzZSBhY3Rpb25zIG9uIHRoZSBhbm5vdGF0b3IgZWxlbWVudHMuXG4gICMgTk9URTogVGhlIEB3cmFwcGVyIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGlzIGNoZWNrLlxuICAjXG4gICMgZWxlbWVudCAtIEFuIEVsZW1lbnQgb3IgVGV4dE5vZGUgdG8gY2hlY2suXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gICMgICBhbm5vdGF0b3IuaXNBbm5vdGF0b3Ioc3BhbikgIyA9PiBSZXR1cm5zIGZhbHNlXG4gICNcbiAgIyAgIGFubm90YXRvci5pc0Fubm90YXRvcihhbm5vdGF0b3Iudmlld2VyLmVsZW1lbnQpICMgPT4gUmV0dXJucyB0cnVlXG4gICNcbiAgIyBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgaXMgYSBjaGlsZCBvZiBhbiBhbm5vdGF0b3IgZWxlbWVudC5cbiAgaXNBbm5vdGF0b3I6IChlbGVtZW50KSAtPlxuICAgICEhJChlbGVtZW50KS5wYXJlbnRzKCkuYWRkQmFjaygpLmZpbHRlcignW2NsYXNzXj1hbm5vdGF0b3ItXScpLm5vdChAd3JhcHBlcikubGVuZ3RoXG5cbiAgY29uZmlndXJlOiAoQHJlZ2lzdHJ5KSAtPlxuICAgIHJlZ2lzdHJ5LmluY2x1ZGUoQW5ub3RhdGlvblByb3ZpZGVyKVxuXG4gIHJ1bjogKEByZWdpc3RyeSkgLT5cbiAgICAjIFNldCB1cCB0aGUgY29yZSBpbnRlcmZhY2UgY29tcG9uZW50c1xuICAgIHRoaXMuX3NldHVwRG9jdW1lbnRFdmVudHMoKSB1bmxlc3MgQG9wdGlvbnMucmVhZE9ubHlcbiAgICB0aGlzLl9zZXR1cFdyYXBwZXIoKS5fc2V0dXBWaWV3ZXIoKS5fc2V0dXBFZGl0b3IoKVxuICAgIHRoaXMuX3NldHVwRHluYW1pY1N0eWxlKClcblxuICAgICMgQ3JlYXRlIGFkZGVyXG4gICAgdGhpcy5hZGRlciA9ICQodGhpcy5odG1sLmFkZGVyKS5hcHBlbmRUbyhAd3JhcHBlcikuaGlkZSgpXG5cbiAgICAjIERvIGluaXRpYWwgbG9hZFxuICAgIGlmIEBvcHRpb25zLmxvYWRRdWVyeSB0aGVuIHRoaXMubG9hZChAb3B0aW9ucy5sb2FkUXVlcnkpXG5cbiAgIyBBbm5vdGF0b3IjZWxlbWVudCBjYWxsYmFjay4gRGlzcGxheXMgdmlld2VyIHdpdGggYWxsIGFubm90YXRpb25zXG4gICMgYXNzb2NpYXRlZCB3aXRoIGhpZ2hsaWdodCBFbGVtZW50cyB1bmRlciB0aGUgY3Vyc29yLlxuICAjXG4gICMgZXZlbnQgLSBBIG1vdXNlb3ZlciBFdmVudCBvYmplY3QuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIG9uSGlnaGxpZ2h0TW91c2VvdmVyOiAoZXZlbnQpID0+XG4gICAgIyBDYW5jZWwgYW55IHBlbmRpbmcgaGlkaW5nIG9mIHRoZSB2aWV3ZXIuXG4gICAgdGhpcy5jbGVhclZpZXdlckhpZGVUaW1lcigpXG5cbiAgICAjIERvbid0IGRvIGFueXRoaW5nIGlmIHdlJ3JlIG1ha2luZyBhIHNlbGVjdGlvbiBvclxuICAgICMgYWxyZWFkeSBkaXNwbGF5aW5nIHRoZSB2aWV3ZXJcbiAgICByZXR1cm4gZmFsc2UgaWYgQG1vdXNlSXNEb3duIG9yIEB2aWV3ZXIuaXNTaG93bigpXG5cbiAgICBhbm5vdGF0aW9ucyA9ICQoZXZlbnQudGFyZ2V0KVxuICAgICAgLnBhcmVudHMoJy5hbm5vdGF0b3ItaGwnKVxuICAgICAgLmFkZEJhY2soKVxuICAgICAgLm1hcCAtPiByZXR1cm4gJCh0aGlzKS5kYXRhKFwiYW5ub3RhdGlvblwiKVxuXG4gICAgdGhpcy5zaG93Vmlld2VyKCQubWFrZUFycmF5KGFubm90YXRpb25zKSwgVXRpbC5tb3VzZVBvc2l0aW9uKGV2ZW50LCBAd3JhcHBlclswXSkpXG5cbiAgIyBBbm5vdGF0b3IjZWxlbWVudCBjYWxsYmFjay4gU2V0cyBAaWdub3JlTW91c2V1cCB0byB0cnVlIHRvIHByZXZlbnRcbiAgIyB0aGUgYW5ub3RhdGlvbiBzZWxlY3Rpb24gZXZlbnRzIGZpcmluZyB3aGVuIHRoZSBhZGRlciBpcyBjbGlja2VkLlxuICAjXG4gICMgZXZlbnQgLSBBIG1vdXNlZG93biBFdmVudCBvYmplY3RcbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgb25BZGRlck1vdXNlZG93bjogKGV2ZW50KSA9PlxuICAgIGV2ZW50Py5wcmV2ZW50RGVmYXVsdCgpXG4gICAgQGlnbm9yZU1vdXNldXAgPSB0cnVlXG5cbiAgIyBBbm5vdGF0b3IjZWxlbWVudCBjYWxsYmFjay4gRGlzcGxheXMgdGhlIEBlZGl0b3IgaW4gcGxhY2Ugb2YgdGhlIEBhZGRlciBhbmRcbiAgIyBsb2FkcyBpbiBhIG5ld2x5IGNyZWF0ZWQgYW5ub3RhdGlvbiBPYmplY3QuIFRoZSBjbGljayBldmVudCBpcyB1c2VkIGFzIHdlbGxcbiAgIyBhcyB0aGUgbW91c2Vkb3duIHNvIHRoYXQgd2UgZ2V0IHRoZSA6YWN0aXZlIHN0YXRlIG9uIHRoZSBAYWRkZXIgd2hlbiBjbGlja2VkXG4gICNcbiAgIyBldmVudCAtIEEgbW91c2Vkb3duIEV2ZW50IG9iamVjdFxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBvbkFkZGVyQ2xpY2s6IChldmVudCkgPT5cbiAgICBldmVudD8ucHJldmVudERlZmF1bHQoKVxuXG4gICAgIyBIaWRlIHRoZSBhZGRlclxuICAgIHBvc2l0aW9uID0gQGFkZGVyLnBvc2l0aW9uKClcbiAgICBAYWRkZXIuaGlkZSgpXG4gICAgYW5ub3RhdGlvbiA9IHtyYW5nZXM6IEBzZWxlY3RlZFJhbmdlc31cblxuICAgICQud2hlbihhbm5vdGF0aW9uKVxuXG4gICAgICAuZG9uZSAoYW5ub3RhdGlvbikgPT5cbiAgICAgICAgdGhpcy5wdWJsaXNoKCdiZWZvcmVBbm5vdGF0aW9uQ3JlYXRlZCcsIFthbm5vdGF0aW9uXSlcblxuICAgICAgIyBTZXQgdXAgdGhlIGFubm90YXRpb25cbiAgICAgIC50aGVuIChhbm5vdGF0aW9uKSA9PlxuICAgICAgICB0aGlzLnNldHVwQW5ub3RhdGlvbihhbm5vdGF0aW9uKVxuXG4gICAgICAjIFNob3cgYSB0ZW1wb3JhcnkgaGlnaGxpZ2h0IHNvIHRoZSB1c2VyIGNhbiBzZWUgd2hhdCB0aGV5IHNlbGVjdGVkXG4gICAgICAuZG9uZSAoYW5ub3RhdGlvbikgPT5cbiAgICAgICAgJChhbm5vdGF0aW9uLl9sb2NhbC5oaWdobGlnaHRzKS5hZGRDbGFzcygnYW5ub3RhdG9yLWhsLXRlbXBvcmFyeScpXG5cbiAgICAgICMgRWRpdCB0aGUgYW5ub3RhdGlvblxuICAgICAgLnRoZW4gKGFubm90YXRpb24pID0+XG4gICAgICAgIHRoaXMuZWRpdEFubm90YXRpb24oYW5ub3RhdGlvbiwgcG9zaXRpb24pXG4gICAgICAudGhlbiAoYW5ub3RhdGlvbikgPT5cbiAgICAgICAgdGhpcy5hbm5vdGF0aW9ucy5jcmVhdGUoYW5ub3RhdGlvbilcbiAgICAgICAgICAjIEhhbmRsZSBzdG9yYWdlIGVycm9yc1xuICAgICAgICAgIC5mYWlsKGhhbmRsZUVycm9yKVxuXG4gICAgICAjIENsZWFuIHVwIHRoZSBoaWdobGlnaHRzXG4gICAgICAuZG9uZSAoYW5ub3RhdGlvbikgPT5cbiAgICAgICAgJChhbm5vdGF0aW9uLl9sb2NhbC5oaWdobGlnaHRzKS5yZW1vdmVDbGFzcygnYW5ub3RhdG9yLWhsLXRlbXBvcmFyeScpXG5cbiAgICAgIC5kb25lIChhbm5vdGF0aW9uKSA9PlxuICAgICAgICB0aGlzLnB1Ymxpc2goJ2Fubm90YXRpb25DcmVhdGVkJywgW2Fubm90YXRpb25dKVxuXG4gICAgICAjIENsZWFuIHVwIChpZiwgZm9yIGV4YW1wbGUsIGVkaXRpbmcgd2FzIGNhbmNlbGxlZCwgb3Igc3RvcmFnZSBmYWlsZWQpXG4gICAgICAuZmFpbCh0aGlzLmNsZWFudXBBbm5vdGF0aW9uKVxuXG4gICMgQW5ub3RhdG9yI3ZpZXdlciBjYWxsYmFjayBmdW5jdGlvbi4gRGlzcGxheXMgdGhlIEFubm90YXRvciNlZGl0b3IgaW4gdGhlXG4gICMgcG9zaXRpb25zIG9mIHRoZSBBbm5vdGF0b3Ijdmlld2VyIGFuZCBsb2FkcyB0aGUgcGFzc2VkIGFubm90YXRpb24gZm9yXG4gICMgZWRpdGluZy5cbiAgI1xuICAjIGFubm90YXRpb24gLSBBbiBhbm5vdGF0aW9uIE9iamVjdCBmb3IgZWRpdGluZy5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgb25FZGl0QW5ub3RhdGlvbjogKGFubm90YXRpb24pID0+XG4gICAgcG9zaXRpb24gPSBAdmlld2VyLmVsZW1lbnQucG9zaXRpb24oKVxuICAgIEB2aWV3ZXIuaGlkZSgpXG5cbiAgICAkLndoZW4oYW5ub3RhdGlvbilcblxuICAgICAgLmRvbmUgKGFubm90YXRpb24pID0+XG4gICAgICAgIHRoaXMucHVibGlzaCgnYmVmb3JlQW5ub3RhdGlvblVwZGF0ZWQnLCBbYW5ub3RhdGlvbl0pXG5cbiAgICAgIC50aGVuIChhbm5vdGF0aW9uKSA9PlxuICAgICAgICB0aGlzLmVkaXRBbm5vdGF0aW9uKGFubm90YXRpb24sIHBvc2l0aW9uKVxuICAgICAgLnRoZW4gKGFubm90YXRpb24pID0+XG4gICAgICAgIHRoaXMuYW5ub3RhdGlvbnMudXBkYXRlKGFubm90YXRpb24pXG4gICAgICAgICAgIyBIYW5kbGUgc3RvcmFnZSBlcnJvcnNcbiAgICAgICAgICAuZmFpbChoYW5kbGVFcnJvcilcblxuICAgICAgLmRvbmUgKGFubm90YXRpb24pID0+XG4gICAgICAgIHRoaXMucHVibGlzaCgnYW5ub3RhdGlvblVwZGF0ZWQnLCBbYW5ub3RhdGlvbl0pXG5cbiMgQ3JlYXRlIG5hbWVzcGFjZSBmb3IgQW5ub3RhdG9yIHBsdWdpbnNcbmNsYXNzIEFubm90YXRvci5QbHVnaW4gZXh0ZW5kcyBEZWxlZ2F0b3JcbiAgY29uc3RydWN0b3I6IChlbGVtZW50LCBvcHRpb25zKSAtPlxuICAgIHN1cGVyXG5cbiAgcGx1Z2luSW5pdDogLT5cblxuICBkZXN0cm95OiAtPlxuICAgIHRoaXMucmVtb3ZlRXZlbnRzKClcblxuIyBTbmlmZiB0aGUgYnJvd3NlciBlbnZpcm9ubWVudCBhbmQgYXR0ZW1wdCB0byBhZGQgbWlzc2luZyBmdW5jdGlvbmFsaXR5LlxuZyA9IFV0aWwuZ2V0R2xvYmFsKClcblxuaWYgbm90IGcuZG9jdW1lbnQ/LmV2YWx1YXRlP1xuICAkLmdldFNjcmlwdCgnaHR0cDovL2Fzc2V0cy5hbm5vdGF0ZWl0Lm9yZy92ZW5kb3IveHBhdGgubWluLmpzJylcblxuaWYgbm90IGcuZ2V0U2VsZWN0aW9uP1xuICAkLmdldFNjcmlwdCgnaHR0cDovL2Fzc2V0cy5hbm5vdGF0ZWl0Lm9yZy92ZW5kb3IvaWVyYW5nZS5taW4uanMnKVxuXG5pZiBub3QgZy5KU09OP1xuICAkLmdldFNjcmlwdCgnaHR0cDovL2Fzc2V0cy5hbm5vdGF0ZWl0Lm9yZy92ZW5kb3IvanNvbjIubWluLmpzJylcblxuIyBFbnN1cmUgdGhlIE5vZGUgY29uc3RhbnRzIGFyZSBkZWZpbmVkXG5pZiBub3QgZy5Ob2RlP1xuICBnLk5vZGUgPVxuICAgIEVMRU1FTlRfTk9ERSAgICAgICAgICAgICAgICA6ICAxXG4gICAgQVRUUklCVVRFX05PREUgICAgICAgICAgICAgIDogIDJcbiAgICBURVhUX05PREUgICAgICAgICAgICAgICAgICAgOiAgM1xuICAgIENEQVRBX1NFQ1RJT05fTk9ERSAgICAgICAgICA6ICA0XG4gICAgRU5USVRZX1JFRkVSRU5DRV9OT0RFICAgICAgIDogIDVcbiAgICBFTlRJVFlfTk9ERSAgICAgICAgICAgICAgICAgOiAgNlxuICAgIFBST0NFU1NJTkdfSU5TVFJVQ1RJT05fTk9ERSA6ICA3XG4gICAgQ09NTUVOVF9OT0RFICAgICAgICAgICAgICAgIDogIDhcbiAgICBET0NVTUVOVF9OT0RFICAgICAgICAgICAgICAgOiAgOVxuICAgIERPQ1VNRU5UX1RZUEVfTk9ERSAgICAgICAgICA6IDEwXG4gICAgRE9DVU1FTlRfRlJBR01FTlRfTk9ERSAgICAgIDogMTFcbiAgICBOT1RBVElPTl9OT0RFICAgICAgICAgICAgICAgOiAxMlxuXG5cbiMgRXhwb3J0IG90aGVyIG1vZHVsZXMgZm9yIHVzZSBpbiBwbHVnaW5zLlxuQW5ub3RhdG9yLkRlbGVnYXRvciA9IERlbGVnYXRvclxuQW5ub3RhdG9yLlJhbmdlID0gUmFuZ2VcbkFubm90YXRvci5VdGlsID0gVXRpbFxuQW5ub3RhdG9yLldpZGdldCA9IFdpZGdldFxuQW5ub3RhdG9yLlZpZXdlciA9IFZpZXdlclxuQW5ub3RhdG9yLkVkaXRvciA9IEVkaXRvclxuQW5ub3RhdG9yLk5vdGlmaWNhdGlvbiA9IE5vdGlmaWNhdGlvblxuXG4jIEF0dGFjaCBub3RpZmljYXRpb24gbWV0aG9kcyB0byB0aGUgQW5ub3RhdGlvbiBvYmplY3Rcbm5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb25cbkFubm90YXRvci5zaG93Tm90aWZpY2F0aW9uID0gbm90aWZpY2F0aW9uLnNob3dcbkFubm90YXRvci5oaWRlTm90aWZpY2F0aW9uID0gbm90aWZpY2F0aW9uLmhpZGVcblxuIyBFeHBvc2UgYSBnbG9iYWwgaW5zdGFuY2UgcmVnaXN0cnlcbkFubm90YXRvci5faW5zdGFuY2VzID0gW11cblxuIyBCaW5kIGdldHRleHQgaGVscGVyIHNvIHBsdWdpbnMgY2FuIHVzZSBsb2NhbGlzYXRpb24uXG5Bbm5vdGF0b3IuX3QgPSBfdFxuXG4jIFJldHVybnMgdHJ1ZSBpZiB0aGUgQW5ub3RhdG9yIGNhbiBiZSB1c2VkIGluIHRoZSBjdXJyZW50IGJyb3dzZXIuXG5Bbm5vdGF0b3Iuc3VwcG9ydGVkID0gLT4gKC0+ICEhdGhpcy5nZXRTZWxlY3Rpb24pKClcblxuIyBSZXN0b3JlcyB0aGUgQW5ub3RhdG9yIHByb3BlcnR5IG9uIHRoZSBnbG9iYWwgb2JqZWN0IHRvIGl0J3NcbiMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgdGhlIEFubm90YXRvci5cbkFubm90YXRvci5ub0NvbmZsaWN0ID0gLT5cbiAgVXRpbC5nZXRHbG9iYWwoKS5Bbm5vdGF0b3IgPSBfQW5ub3RhdG9yXG4gIHRoaXNcblxuIyBDcmVhdGUgZ2xvYmFsIGFjY2VzcyBmb3IgQW5ub3RhdG9yXG4kLmZuLmFubm90YXRvciA9IChvcHRpb25zKSAtPlxuICBhcmdzID0gQXJyYXk6OnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICB0aGlzLmVhY2ggLT5cbiAgICAjIGNoZWNrIHRoZSBkYXRhKCkgY2FjaGUsIGlmIGl0J3MgdGhlcmUgd2UnbGwgY2FsbCB0aGUgbWV0aG9kIHJlcXVlc3RlZFxuICAgIGluc3RhbmNlID0gJC5kYXRhKHRoaXMsICdhbm5vdGF0b3InKVxuICAgIGlmIGluc3RhbmNlXG4gICAgICBvcHRpb25zICYmIGluc3RhbmNlW29wdGlvbnNdLmFwcGx5KGluc3RhbmNlLCBhcmdzKVxuICAgIGVsc2VcbiAgICAgIGluc3RhbmNlID0gbmV3IEFubm90YXRvcih0aGlzLCBvcHRpb25zKVxuICAgICAgJC5kYXRhKHRoaXMsICdhbm5vdGF0b3InLCBpbnN0YW5jZSlcblxuXG4jIEV4cG9ydCBBbm5vdGF0b3Igb2JqZWN0LlxubW9kdWxlLmV4cG9ydHMgPSBBbm5vdGF0b3JcbiIsIlV0aWwgPSByZXF1aXJlICcuL3V0aWwnXG5cblxuIyBQdWJsaWM6IERlbGVnYXRvciBpcyB0aGUgYmFzZSBjbGFzcyB0aGF0IGFsbCBvZiBBbm5vdGF0b3JzIG9iamVjdHMgaW5oZXJpdFxuIyBmcm9tLiBJdCBwcm92aWRlcyBiYXNpYyBmdW5jdGlvbmFsaXR5IHN1Y2ggYXMgaW5zdGFuY2Ugb3B0aW9ucywgZXZlbnRcbiMgZGVsZWdhdGlvbiBhbmQgcHViL3N1YiBtZXRob2RzLlxuY2xhc3MgRGVsZWdhdG9yXG4gICMgUHVibGljOiBFdmVudHMgb2JqZWN0LiBUaGlzIGNvbnRhaW5zIGEga2V5L3BhaXIgaGFzaCBvZiBldmVudHMvbWV0aG9kcyB0aGF0XG4gICMgc2hvdWxkIGJlIGJvdW5kLiBTZWUgRGVsZWdhdG9yI2FkZEV2ZW50cygpIGZvciB1c2FnZS5cbiAgZXZlbnRzOiB7fVxuXG4gICMgUHVibGljOiBPcHRpb25zIG9iamVjdC4gRXh0ZW5kZWQgb24gaW5pdGlhbGlzYXRpb24uXG4gIG9wdGlvbnM6IHt9XG5cbiAgIyBBIGpRdWVyeSBvYmplY3Qgd3JhcHBpbmcgdGhlIERPTSBFbGVtZW50IHByb3ZpZGVkIG9uIGluaXRpYWxpc2F0aW9uLlxuICBlbGVtZW50OiBudWxsXG5cbiAgIyBQdWJsaWM6IENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRoYXQgc2V0cyB1cCB0aGUgaW5zdGFuY2UuIEJpbmRzIHRoZSBAZXZlbnRzXG4gICMgaGFzaCBhbmQgZXh0ZW5kcyB0aGUgQG9wdGlvbnMgb2JqZWN0LlxuICAjXG4gICMgZWxlbWVudCAtIFRoZSBET00gZWxlbWVudCB0aGF0IHRoaXMgaW50YW5jZSByZXByZXNlbnRzLlxuICAjIG9wdGlvbnMgLSBBbiBPYmplY3QgbGl0ZXJhbCBvZiBvcHRpb25zLlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgZWxlbWVudCAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXktZWxlbWVudCcpXG4gICMgICBpbnN0YW5jZSA9IG5ldyBEZWxlZ2F0b3IoZWxlbWVudCwge1xuICAjICAgICBvcHRpb246ICdteS1vcHRpb24nXG4gICMgICB9KVxuICAjXG4gICMgUmV0dXJucyBhIG5ldyBpbnN0YW5jZSBvZiBEZWxlZ2F0b3IuXG4gIGNvbnN0cnVjdG9yOiAoZWxlbWVudCwgb3B0aW9ucykgLT5cbiAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBAb3B0aW9ucywgb3B0aW9ucylcbiAgICBAZWxlbWVudCA9ICQoZWxlbWVudClcblxuICAgICMgRGVsZWdhdG9yIGNyZWF0ZXMgY2xvc3VyZXMgZm9yIGVhY2ggZXZlbnQgaXQgYmluZHMuIFRoaXMgaXMgYSBwcml2YXRlXG4gICAgIyByZWdpc3RyeSBvZiBjcmVhdGVkIGNsb3N1cmVzLCB1c2VkIHRvIGVuYWJsZSBldmVudCB1bmJpbmRpbmcuXG4gICAgQF9jbG9zdXJlcyA9IHt9XG5cbiAgICB0aGlzLmFkZEV2ZW50cygpXG5cbiAgIyBQdWJsaWM6IGJpbmRzIHRoZSBmdW5jdGlvbiBuYW1lcyBpbiB0aGUgQGV2ZW50cyBPYmplY3QgdG8gdGhlaXIgZXZlbnRzLlxuICAjXG4gICMgVGhlIEBldmVudHMgT2JqZWN0IHNob3VsZCBiZSBhIHNldCBvZiBrZXkvdmFsdWUgcGFpcnMgd2hlcmUgdGhlIGtleSBpcyB0aGVcbiAgIyBldmVudCBuYW1lIHdpdGggb3B0aW9uYWwgQ1NTIHNlbGVjdG9yLiBUaGUgdmFsdWUgc2hvdWxkIGJlIGEgU3RyaW5nIG1ldGhvZFxuICAjIG5hbWUgb24gdGhlIGN1cnJlbnQgY2xhc3MuXG4gICNcbiAgIyBUaGlzIGlzIGNhbGxlZCBieSB0aGUgZGVmYXVsdCBEZWxlZ2F0b3IgY29uc3RydWN0b3IgYW5kIHNvIHNob3VsZG4ndCB1c3VhbGx5XG4gICMgbmVlZCB0byBiZSBjYWxsZWQgYnkgdGhlIHVzZXIuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIFRoaXMgd2lsbCBiaW5kIHRoZSBjbGlja2VkRWxlbWVudCgpIG1ldGhvZCB0byB0aGUgY2xpY2sgZXZlbnQgb24gQGVsZW1lbnQuXG4gICMgICBAb3B0aW9ucyA9IHtcImNsaWNrXCI6IFwiY2xpY2tlZEVsZW1lbnRcIn1cbiAgI1xuICAjICAgIyBUaGlzIHdpbGwgZGVsZWdhdGUgdGhlIHN1Ym1pdEZvcm0oKSBtZXRob2QgdG8gdGhlIHN1Ym1pdCBldmVudCBvbiB0aGVcbiAgIyAgICMgZm9ybSB3aXRoaW4gdGhlIEBlbGVtZW50LlxuICAjICAgQG9wdGlvbnMgPSB7XCJmb3JtIHN1Ym1pdFwiOiBcInN1Ym1pdEZvcm1cIn1cbiAgI1xuICAjICAgIyBUaGlzIHdpbGwgYmluZCB0aGUgdXBkYXRlQW5ub3RhdGlvblN0b3JlKCkgbWV0aG9kIHRvIHRoZSBjdXN0b21cbiAgIyAgICMgYW5ub3RhdGlvbjpzYXZlIGV2ZW50LiBOT1RFOiBCZWNhdXNlIHRoaXMgaXMgYSBjdXN0b20gZXZlbnQgdGhlXG4gICMgICAjIERlbGVnYXRvciNzdWJzY3JpYmUoKSBtZXRob2Qgd2lsbCBiZSB1c2VkIGFuZCB1cGRhdGVBbm5vdGF0aW9uU3RvcmUoKVxuICAjICAgIyB3aWxsIG5vdCByZWNpZXZlIGFuIGV2ZW50IHBhcmFtZXRlciBsaWtlIHRoZSBwcmV2aW91cyB0d28gZXhhbXBsZXMuXG4gICMgICBAb3B0aW9ucyA9IHtcImFubm90YXRpb246c2F2ZVwiOiBcInVwZGF0ZUFubm90YXRpb25TdG9yZVwifVxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBhZGRFdmVudHM6IC0+XG4gICAgZm9yIGV2ZW50IGluIERlbGVnYXRvci5fcGFyc2VFdmVudHMoQGV2ZW50cylcbiAgICAgIHRoaXMuX2FkZEV2ZW50KGV2ZW50LnNlbGVjdG9yLCBldmVudC5ldmVudCwgZXZlbnQuZnVuY3Rpb25OYW1lKVxuXG4gICMgUHVibGljOiB1bmJpbmRzIGZ1bmN0aW9ucyBwcmV2aW91c2x5IGJvdW5kIHRvIGV2ZW50cyBieSBhZGRFdmVudHMoKS5cbiAgI1xuICAjIFRoZSBAZXZlbnRzIE9iamVjdCBzaG91bGQgYmUgYSBzZXQgb2Yga2V5L3ZhbHVlIHBhaXJzIHdoZXJlIHRoZSBrZXkgaXMgdGhlXG4gICMgZXZlbnQgbmFtZSB3aXRoIG9wdGlvbmFsIENTUyBzZWxlY3Rvci4gVGhlIHZhbHVlIHNob3VsZCBiZSBhIFN0cmluZyBtZXRob2RcbiAgIyBuYW1lIG9uIHRoZSBjdXJyZW50IGNsYXNzLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICByZW1vdmVFdmVudHM6IC0+XG4gICAgZm9yIGV2ZW50IGluIERlbGVnYXRvci5fcGFyc2VFdmVudHMoQGV2ZW50cylcbiAgICAgIHRoaXMuX3JlbW92ZUV2ZW50KGV2ZW50LnNlbGVjdG9yLCBldmVudC5ldmVudCwgZXZlbnQuZnVuY3Rpb25OYW1lKVxuXG4gICMgQmluZHMgYW4gZXZlbnQgdG8gYSBjYWxsYmFjayBmdW5jdGlvbiByZXByZXNlbnRlZCBieSBhIFN0cmluZy4gQSBzZWxlY3RvclxuICAjIGNhbiBiZSBwcm92aWRlZCBpbiBvcmRlciB0byB3YXRjaCBmb3IgZXZlbnRzIG9uIGEgY2hpbGQgZWxlbWVudC5cbiAgI1xuICAjIFRoZSBldmVudCBjYW4gYmUgYW55IHN0YW5kYXJkIGV2ZW50IHN1cHBvcnRlZCBieSBqUXVlcnkgb3IgYSBjdXN0b20gU3RyaW5nLlxuICAjIElmIGEgY3VzdG9tIHN0cmluZyBpcyB1c2VkIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aWxsIG5vdCByZWNlaXZlIGFuIGV2ZW50XG4gICMgb2JqZWN0IGFzIGl0cyBmaXJzdCBwYXJhbWV0ZXIuXG4gICNcbiAgIyBzZWxlY3RvciAgICAgLSBTZWxlY3RvciBTdHJpbmcgbWF0Y2hpbmcgY2hpbGQgZWxlbWVudHMuIChkZWZhdWx0OiAnJylcbiAgIyBldmVudCAgICAgICAgLSBUaGUgZXZlbnQgdG8gbGlzdGVuIGZvci5cbiAgIyBmdW5jdGlvbk5hbWUgLSBBIFN0cmluZyBmdW5jdGlvbiBuYW1lIHRvIGJpbmQgdG8gdGhlIGV2ZW50LlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgIyBMaXN0ZW5zIGZvciBhbGwgY2xpY2sgZXZlbnRzIG9uIGluc3RhbmNlLmVsZW1lbnQuXG4gICMgICBpbnN0YW5jZS5fYWRkRXZlbnQoJycsICdjbGljaycsICdvbkNsaWNrJylcbiAgI1xuICAjICAgIyBEZWxlZ2F0ZXMgdGhlIGluc3RhbmNlLm9uSW5wdXRGb2N1cygpIG1ldGhvZCB0byBmb2N1cyBldmVudHMgb24gYWxsXG4gICMgICAjIGZvcm0gaW5wdXRzIHdpdGhpbiBpbnN0YW5jZS5lbGVtZW50LlxuICAjICAgaW5zdGFuY2UuX2FkZEV2ZW50KCdmb3JtIDppbnB1dCcsICdmb2N1cycsICdvbklucHV0Rm9jdXMnKVxuICAjXG4gICMgUmV0dXJucyBpdHNlbGYuXG4gIF9hZGRFdmVudDogKHNlbGVjdG9yLCBldmVudCwgZnVuY3Rpb25OYW1lKSAtPlxuICAgIGNsb3N1cmUgPSA9PiB0aGlzW2Z1bmN0aW9uTmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG4gICAgaWYgc2VsZWN0b3IgPT0gJycgYW5kIERlbGVnYXRvci5faXNDdXN0b21FdmVudChldmVudClcbiAgICAgIHRoaXMuc3Vic2NyaWJlKGV2ZW50LCBjbG9zdXJlKVxuICAgIGVsc2VcbiAgICAgIEBlbGVtZW50LmRlbGVnYXRlKHNlbGVjdG9yLCBldmVudCwgY2xvc3VyZSlcblxuICAgIEBfY2xvc3VyZXNbXCIje3NlbGVjdG9yfS8je2V2ZW50fS8je2Z1bmN0aW9uTmFtZX1cIl0gPSBjbG9zdXJlXG5cbiAgICB0aGlzXG5cbiAgIyBVbmJpbmRzIGEgZnVuY3Rpb24gcHJldmlvdXNseSBib3VuZCB0byBhbiBldmVudCBieSB0aGUgX2FkZEV2ZW50IG1ldGhvZC5cbiAgI1xuICAjIFRha2VzIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBfYWRkRXZlbnQoKSwgYW5kIGFuIGV2ZW50IHdpbGwgb25seSBiZVxuICAjIHN1Y2Nlc3NmdWxseSB1bmJvdW5kIGlmIHRoZSBhcmd1bWVudHMgdG8gcmVtb3ZlRXZlbnQoKSBhcmUgZXhhY3RseSB0aGUgc2FtZVxuICAjIGFzIHRoZSBvcmlnaW5hbCBhcmd1bWVudHMgdG8gX2FkZEV2ZW50KCkuIFRoaXMgd291bGQgdXN1YWxseSBiZSBjYWxsZWQgYnlcbiAgIyBfcmVtb3ZlRXZlbnRzKCkuXG4gICNcbiAgIyBzZWxlY3RvciAgICAgLSBTZWxlY3RvciBTdHJpbmcgbWF0Y2hpbmcgY2hpbGQgZWxlbWVudHMuIChkZWZhdWx0OiAnJylcbiAgIyBldmVudCAgICAgICAgLSBUaGUgZXZlbnQgdG8gbGlzdGVuIGZvci5cbiAgIyBmdW5jdGlvbk5hbWUgLSBBIFN0cmluZyBmdW5jdGlvbiBuYW1lIHRvIGJpbmQgdG8gdGhlIGV2ZW50LlxuICAjXG4gICMgUmV0dXJucyBpdHNlbGYuXG4gIF9yZW1vdmVFdmVudDogKHNlbGVjdG9yLCBldmVudCwgZnVuY3Rpb25OYW1lKSAtPlxuICAgIGNsb3N1cmUgPSBAX2Nsb3N1cmVzW1wiI3tzZWxlY3Rvcn0vI3tldmVudH0vI3tmdW5jdGlvbk5hbWV9XCJdXG5cbiAgICBpZiBzZWxlY3RvciA9PSAnJyBhbmQgRGVsZWdhdG9yLl9pc0N1c3RvbUV2ZW50KGV2ZW50KVxuICAgICAgdGhpcy51bnN1YnNjcmliZShldmVudCwgY2xvc3VyZSlcbiAgICBlbHNlXG4gICAgICBAZWxlbWVudC51bmRlbGVnYXRlKHNlbGVjdG9yLCBldmVudCwgY2xvc3VyZSlcblxuICAgIGRlbGV0ZSBAX2Nsb3N1cmVzW1wiI3tzZWxlY3Rvcn0vI3tldmVudH0vI3tmdW5jdGlvbk5hbWV9XCJdXG5cbiAgICB0aGlzXG5cbiAgIyBQdWJsaWM6IEZpcmVzIGFuIGV2ZW50IGFuZCBjYWxscyBhbGwgc3Vic2NyaWJlZCBjYWxsYmFja3Mgd2l0aCBwYXJhbWV0ZXJzXG4gICMgcHJvdmlkZWQuIFRoaXMgaXMgZXNzZW50aWFsbHkgYW4gYWxpYXMgdG8gQmFja2JvbmUuRXZlbnRzIC50cmlnZ2VyKClcbiAgIyBleGNlcHQgdGhhdCB0aGUgYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4gYW4gQXJyYXkgYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXJcbiAgIyByYXRoZXIgdGhhbiB1c2luZyBhIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMuXG4gIHB1Ymxpc2g6IChuYW1lLCBhcmdzPVtdKSAtPlxuICAgIHRoaXMudHJpZ2dlci5hcHBseSh0aGlzLCBbbmFtZSwgYXJncy4uLl0pXG5cbiAgIyBQdWJsaWM6IEFuIGFsaWFzIGZvciAub24oKSBmcm9tIEJhY2tib25lLkV2ZW50c1xuICBzdWJzY3JpYmU6IChldmVudCwgY2FsbGJhY2ssIGNvbnRleHQ9dGhpcykgLT5cbiAgICB0aGlzLm9uKGV2ZW50LCBjYWxsYmFjaywgY29udGV4dClcblxuICAjIFB1YmxpYzogQW4gYWxpYXMgZm9yIC5vZmYoKSBmcm9tIEJhY2tib25lLkV2ZW50c1xuICB1bnN1YnNjcmliZTogKGV2ZW50LCBjYWxsYmFjaywgY29udGV4dD10aGlzKSAtPlxuICAgIHRoaXMub2ZmKGV2ZW50LCBjYWxsYmFjaywgY29udGV4dClcblxuXG4jIFBhcnNlIHRoZSBAZXZlbnRzIG9iamVjdCBvZiBhIERlbGVnYXRvciBpbnRvIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmluZ1xuIyBzdHJpbmctdmFsdWVkIFwic2VsZWN0b3JcIiwgXCJldmVudFwiLCBhbmQgXCJmdW5jXCIga2V5cy5cbkRlbGVnYXRvci5fcGFyc2VFdmVudHMgPSAoZXZlbnRzT2JqKSAtPlxuICAgIGV2ZW50cyA9IFtdXG4gICAgZm9yIHNlbCwgZnVuY3Rpb25OYW1lIG9mIGV2ZW50c09ialxuICAgICAgW3NlbGVjdG9yLi4uLCBldmVudF0gPSBzZWwuc3BsaXQgJyAnXG4gICAgICBldmVudHMucHVzaCh7XG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3Rvci5qb2luKCcgJyksXG4gICAgICAgIGV2ZW50OiBldmVudCxcbiAgICAgICAgZnVuY3Rpb25OYW1lOiBmdW5jdGlvbk5hbWVcbiAgICAgIH0pXG4gICAgcmV0dXJuIGV2ZW50c1xuXG5cbiMgTmF0aXZlIGpRdWVyeSBldmVudHMgdGhhdCBzaG91bGQgcmVjaWV2ZSBhbiBldmVudCBvYmplY3QuIFBsdWdpbnMgY2FuXG4jIGFkZCB0aGVpciBvd24gbWV0aG9kcyB0byB0aGlzIGlmIHJlcXVpcmVkLlxuRGVsZWdhdG9yLm5hdGl2ZXMgPSBkbyAtPlxuICBzcGVjaWFscyA9IChrZXkgZm9yIG93biBrZXksIHZhbCBvZiAkLmV2ZW50LnNwZWNpYWwpXG4gIFwiXCJcIlxuICBibHVyIGZvY3VzIGZvY3VzaW4gZm9jdXNvdXQgbG9hZCByZXNpemUgc2Nyb2xsIHVubG9hZCBjbGljayBkYmxjbGlja1xuICBtb3VzZWRvd24gbW91c2V1cCBtb3VzZW1vdmUgbW91c2VvdmVyIG1vdXNlb3V0IG1vdXNlZW50ZXIgbW91c2VsZWF2ZVxuICBjaGFuZ2Ugc2VsZWN0IHN1Ym1pdCBrZXlkb3duIGtleXByZXNzIGtleXVwIGVycm9yXG4gIFwiXCJcIi5zcGxpdCgvW15hLXpdKy8pLmNvbmNhdChzcGVjaWFscylcblxuXG4jIENoZWNrcyB0byBzZWUgaWYgdGhlIHByb3ZpZGVkIGV2ZW50IGlzIGEgRE9NIGV2ZW50IHN1cHBvcnRlZCBieSBqUXVlcnkgb3JcbiMgYSBjdXN0b20gdXNlciBldmVudC5cbiNcbiMgZXZlbnQgLSBTdHJpbmcgZXZlbnQgbmFtZS5cbiNcbiMgRXhhbXBsZXNcbiNcbiMgICBEZWxlZ2F0b3IuX2lzQ3VzdG9tRXZlbnQoJ2NsaWNrJykgICAgICAgICAgICAgICMgPT4gZmFsc2VcbiMgICBEZWxlZ2F0b3IuX2lzQ3VzdG9tRXZlbnQoJ21vdXNlZG93bicpICAgICAgICAgICMgPT4gZmFsc2VcbiMgICBEZWxlZ2F0b3IuX2lzQ3VzdG9tRXZlbnQoJ2Fubm90YXRpb246Y3JlYXRlZCcpICMgPT4gdHJ1ZVxuI1xuIyBSZXR1cm5zIHRydWUgaWYgZXZlbnQgaXMgYSBjdXN0b20gdXNlciBldmVudC5cbkRlbGVnYXRvci5faXNDdXN0b21FdmVudCA9IChldmVudCkgLT5cbiAgW2V2ZW50XSA9IGV2ZW50LnNwbGl0KCcuJylcbiAgJC5pbkFycmF5KGV2ZW50LCBEZWxlZ2F0b3IubmF0aXZlcykgPT0gLTFcblxuXG4jIE1peCBpbiBiYWNrYm9uZSBldmVudHNcbkJhY2tib25lRXZlbnRzID0gcmVxdWlyZSAnYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUnXG5CYWNrYm9uZUV2ZW50cy5taXhpbihEZWxlZ2F0b3I6OilcblxuIyBFeHBvcnQgRGVsZWdhdG9yIG9iamVjdFxubW9kdWxlLmV4cG9ydHMgPSBEZWxlZ2F0b3JcbiIsIlV0aWwgPSByZXF1aXJlICcuL3V0aWwnXG5XaWRnZXQgPSByZXF1aXJlICcuL3dpZGdldCdcblxuXG5fdCA9IFV0aWwuVHJhbnNsYXRpb25TdHJpbmdcblxuXG4jIFB1YmxpYzogQ3JlYXRlcyBhbiBlbGVtZW50IGZvciBlZGl0aW5nIGFubm90YXRpb25zLlxuY2xhc3MgRWRpdG9yIGV4dGVuZHMgV2lkZ2V0XG5cbiAgIyBFdmVudHMgdG8gYmUgYm91bmQgdG8gQGVsZW1lbnQuXG4gIGV2ZW50czpcbiAgICBcImZvcm0gc3VibWl0XCI6ICAgICAgICAgICAgICAgICBcInN1Ym1pdFwiXG4gICAgXCIuYW5ub3RhdG9yLXNhdmUgY2xpY2tcIjogICAgICAgXCJzdWJtaXRcIlxuICAgIFwiLmFubm90YXRvci1jYW5jZWwgY2xpY2tcIjogICAgIFwiaGlkZVwiXG4gICAgXCIuYW5ub3RhdG9yLWNhbmNlbCBtb3VzZW92ZXJcIjogXCJvbkNhbmNlbEJ1dHRvbk1vdXNlb3ZlclwiXG4gICAgXCJ0ZXh0YXJlYSBrZXlkb3duXCI6ICAgICAgICAgICAgXCJwcm9jZXNzS2V5cHJlc3NcIlxuXG4gICMgQ2xhc3NlcyB0byB0b2dnbGUgc3RhdGUuXG4gIGNsYXNzZXM6XG4gICAgaGlkZTogICdhbm5vdGF0b3ItaGlkZSdcbiAgICBmb2N1czogJ2Fubm90YXRvci1mb2N1cydcblxuICAjIEhUTUwgdGVtcGxhdGUgZm9yIEBlbGVtZW50LlxuICBodG1sOiBcIlwiXCJcbiAgICAgICAgPGRpdiBjbGFzcz1cImFubm90YXRvci1vdXRlciBhbm5vdGF0b3ItZWRpdG9yXCI+XG4gICAgICAgICAgPGZvcm0gY2xhc3M9XCJhbm5vdGF0b3Itd2lkZ2V0XCI+XG4gICAgICAgICAgICA8dWwgY2xhc3M9XCJhbm5vdGF0b3ItbGlzdGluZ1wiPjwvdWw+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYW5ub3RhdG9yLWNvbnRyb2xzXCI+XG4gICAgICAgICAgICAgIDxhIGhyZWY9XCIjY2FuY2VsXCIgY2xhc3M9XCJhbm5vdGF0b3ItY2FuY2VsXCI+XCJcIlwiICsgX3QoJ0NhbmNlbCcpICsgXCJcIlwiPC9hPlxuICAgICAgICAgICAgICA8YSBocmVmPVwiI3NhdmVcIiBjbGFzcz1cImFubm90YXRvci1zYXZlIGFubm90YXRvci1mb2N1c1wiPlwiXCJcIiArIF90KCdTYXZlJykgKyBcIlwiXCI8L2E+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBcIlwiXCJcblxuICBvcHRpb25zOiB7fSAjIENvbmZpZ3VyYXRpb24gb3B0aW9uc1xuXG4gICMgUHVibGljOiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIHRoZSBFZGl0b3Igb2JqZWN0LiBUaGlzIHdpbGwgY3JlYXRlIHRoZVxuICAjIEBlbGVtZW50IGZyb20gdGhlIEBodG1sIHN0cmluZyBhbmQgc2V0IHVwIGFsbCBldmVudHMuXG4gICNcbiAgIyBvcHRpb25zIC0gQW4gT2JqZWN0IGxpdGVyYWwgY29udGFpbmluZyBvcHRpb25zLiBUaGVyZSBhcmUgY3VycmVudGx5IG5vXG4gICMgICAgICAgICAgIG9wdGlvbnMgaW1wbGVtZW50ZWQuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIENyZWF0ZXMgYSBuZXcgZWRpdG9yLCBhZGRzIGEgY3VzdG9tIGZpZWxkIGFuZFxuICAjICAgIyBsb2FkcyBhbiBhbm5vdGF0aW9uIGZvciBlZGl0aW5nLlxuICAjICAgZWRpdG9yID0gbmV3IEFubm90YXRvci5FZGl0b3JcbiAgIyAgIGVkaXRvci5hZGRGaWVsZCh7XG4gICMgICAgIGxhYmVsOiAnTXkgY3VzdG9tIGlucHV0IGZpZWxkJyxcbiAgIyAgICAgdHlwZTogICd0ZXh0YXJlYSdcbiAgIyAgICAgbG9hZDogIHNvbWVMb2FkQ2FsbGJhY2tcbiAgIyAgICAgc2F2ZTogIHNvbWVTYXZlQ2FsbGJhY2tcbiAgIyAgIH0pXG4gICMgICBlZGl0b3IubG9hZChhbm5vdGF0aW9uKVxuICAjXG4gICMgUmV0dXJucyBhIG5ldyBFZGl0b3IgaW5zdGFuY2UuXG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucykgLT5cbiAgICBzdXBlciAkKEBodG1sKVswXSwgb3B0aW9uc1xuXG4gICAgQGZpZWxkcyA9IFtdXG4gICAgQGFubm90YXRpb24gPSB7fVxuXG4gICMgUHVibGljOiBEaXNwbGF5cyB0aGUgRWRpdG9yIGFuZCBmaXJlcyBhIFwic2hvd1wiIGV2ZW50LlxuICAjIENhbiBiZSB1c2VkIGFzIGFuIGV2ZW50IGNhbGxiYWNrIGFuZCB3aWxsIGNhbGwgRXZlbnQjcHJldmVudERlZmF1bHQoKVxuICAjIG9uIHRoZSBzdXBwbGllZCBldmVudC5cbiAgI1xuICAjIGV2ZW50IC0gRXZlbnQgb2JqZWN0IHByb3ZpZGVkIGlmIG1ldGhvZCBpcyBjYWxsZWQgYnkgZXZlbnRcbiAgIyAgICAgICAgIGxpc3RlbmVyIChkZWZhdWx0OnVuZGVmaW5lZClcbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgICMgRGlzcGxheXMgdGhlIGVkaXRvci5cbiAgIyAgIGVkaXRvci5zaG93KClcbiAgI1xuICAjICAgIyBEaXNwbGF5cyB0aGUgZWRpdG9yIG9uIGNsaWNrIChwcmV2ZW50cyBkZWZhdWx0IGFjdGlvbikuXG4gICMgICAkKCdhLnNob3ctZWRpdG9yJykuYmluZCgnY2xpY2snLCBlZGl0b3Iuc2hvdylcbiAgI1xuICAjIFJldHVybnMgaXRzZWxmLlxuICBzaG93OiAoZXZlbnQpID0+XG4gICAgVXRpbC5wcmV2ZW50RXZlbnREZWZhdWx0IGV2ZW50XG5cbiAgICBAZWxlbWVudC5yZW1vdmVDbGFzcyhAY2xhc3Nlcy5oaWRlKVxuICAgIEBlbGVtZW50LmZpbmQoJy5hbm5vdGF0b3Itc2F2ZScpLmFkZENsYXNzKEBjbGFzc2VzLmZvY3VzKVxuXG4gICAgIyBpbnZlcnQgaWYgbmVjZXNzYXJ5XG4gICAgdGhpcy5jaGVja09yaWVudGF0aW9uKClcblxuICAgICMgZ2l2ZSBtYWluIHRleHRhcmVhIGZvY3VzXG4gICAgQGVsZW1lbnQuZmluZChcIjppbnB1dDpmaXJzdFwiKS5mb2N1cygpXG5cbiAgICB0aGlzLnNldHVwRHJhZ2dhYmxlcygpXG5cbiAgICB0aGlzLnB1Ymxpc2goJ3Nob3cnKVxuXG5cbiAgIyBQdWJsaWM6IEhpZGVzIHRoZSBFZGl0b3IgYW5kIGZpcmVzIGEgXCJoaWRlXCIgZXZlbnQuIENhbiBiZSB1c2VkIGFzIGFuIGV2ZW50XG4gICMgY2FsbGJhY2sgYW5kIHdpbGwgY2FsbCBFdmVudCNwcmV2ZW50RGVmYXVsdCgpIG9uIHRoZSBzdXBwbGllZCBldmVudC5cbiAgI1xuICAjIGV2ZW50IC0gRXZlbnQgb2JqZWN0IHByb3ZpZGVkIGlmIG1ldGhvZCBpcyBjYWxsZWQgYnkgZXZlbnRcbiAgIyAgICAgICAgIGxpc3RlbmVyIChkZWZhdWx0OnVuZGVmaW5lZClcbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgICMgSGlkZXMgdGhlIGVkaXRvci5cbiAgIyAgIGVkaXRvci5oaWRlKClcbiAgI1xuICAjICAgIyBIaWRlIHRoZSBlZGl0b3Igb24gY2xpY2sgKHByZXZlbnRzIGRlZmF1bHQgYWN0aW9uKS5cbiAgIyAgICQoJ2EuaGlkZS1lZGl0b3InKS5iaW5kKCdjbGljaycsIGVkaXRvci5oaWRlKVxuICAjXG4gICMgUmV0dXJucyBpdHNlbGYuXG4gIGhpZGU6IChldmVudCkgPT5cbiAgICBVdGlsLnByZXZlbnRFdmVudERlZmF1bHQgZXZlbnRcblxuICAgIEBlbGVtZW50LmFkZENsYXNzKEBjbGFzc2VzLmhpZGUpXG4gICAgdGhpcy5wdWJsaXNoKCdoaWRlJylcblxuICAjIFB1YmxpYzogTG9hZHMgYW4gYW5ub3RhdGlvbiBpbnRvIHRoZSBFZGl0b3IgYW5kIGRpc3BsYXlzIGl0IHNldHRpbmdcbiAgIyBFZGl0b3IjYW5ub3RhdGlvbiB0byB0aGUgcHJvdmlkZWQgYW5ub3RhdGlvbi4gSXQgZmlyZXMgdGhlIFwibG9hZFwiIGV2ZW50XG4gICMgcHJvdmlkaW5nIHRoZSBjdXJyZW50IGFubm90YXRpb24gc3Vic2NyaWJlcnMgY2FuIG1vZGlmeSB0aGUgYW5ub3RhdGlvblxuICAjIGJlZm9yZSBpdCB1cGRhdGVzIHRoZSBlZGl0b3IgZmllbGRzLlxuICAjXG4gICMgYW5ub3RhdGlvbiAtIEFuIGFubm90YXRpb24gT2JqZWN0IHRvIGRpc3BsYXkgZm9yIGVkaXRpbmcuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIERpcGxheXMgdGhlIGVkaXRvciB3aXRoIHRoZSBhbm5vdGF0aW9uIGxvYWRlZC5cbiAgIyAgIGVkaXRvci5sb2FkKHt0ZXh0OiAnTXkgQW5ub3RhdGlvbid9KVxuICAjXG4gICMgICBlZGl0b3Iub24oJ2xvYWQnLCAoYW5ub3RhdGlvbikgLT5cbiAgIyAgICAgY29uc29sZS5sb2cgYW5ub3RhdGlvbi50ZXh0XG4gICMgICApLmxvYWQoe3RleHQ6ICdNeSBBbm5vdGF0aW9uJ30pXG4gICMgICAjID0+IE91dHB1dHMgXCJNeSBBbm5vdGF0aW9uXCJcbiAgI1xuICAjIFJldHVybnMgaXRzZWxmLlxuICBsb2FkOiAoYW5ub3RhdGlvbikgPT5cbiAgICBAYW5ub3RhdGlvbiA9IGFubm90YXRpb25cblxuICAgIHRoaXMucHVibGlzaCgnbG9hZCcsIFtAYW5ub3RhdGlvbl0pXG5cbiAgICBmb3IgZmllbGQgaW4gQGZpZWxkc1xuICAgICAgZmllbGQubG9hZChmaWVsZC5lbGVtZW50LCBAYW5ub3RhdGlvbilcblxuICAgIHRoaXMuc2hvdygpXG5cbiAgIyBQdWJsaWM6IEhpZGVzIHRoZSBFZGl0b3IgYW5kIHBhc3NlcyB0aGUgYW5ub3RhdGlvbiB0byBhbGwgcmVnaXN0ZXJlZCBmaWVsZHNcbiAgIyBzbyB0aGV5IGNhbiB1cGRhdGUgaXRzIHN0YXRlLiBJdCB0aGVuIGZpcmVzIHRoZSBcInNhdmVcIiBldmVudCBzbyB0aGF0IG90aGVyXG4gICMgcGFydGllcyBjYW4gZnVydGhlciBtb2RpZnkgdGhlIGFubm90YXRpb24uXG4gICMgQ2FuIGJlIHVzZWQgYXMgYW4gZXZlbnQgY2FsbGJhY2sgYW5kIHdpbGwgY2FsbCBFdmVudCNwcmV2ZW50RGVmYXVsdCgpIG9uIHRoZVxuICAjIHN1cHBsaWVkIGV2ZW50LlxuICAjXG4gICMgZXZlbnQgLSBFdmVudCBvYmplY3QgcHJvdmlkZWQgaWYgbWV0aG9kIGlzIGNhbGxlZCBieSBldmVudFxuICAjICAgICAgICAgbGlzdGVuZXIgKGRlZmF1bHQ6dW5kZWZpbmVkKVxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgIyBTdWJtaXRzIHRoZSBlZGl0b3IuXG4gICMgICBlZGl0b3Iuc3VibWl0KClcbiAgI1xuICAjICAgIyBTdWJtaXRzIHRoZSBlZGl0b3Igb24gY2xpY2sgKHByZXZlbnRzIGRlZmF1bHQgYWN0aW9uKS5cbiAgIyAgICQoJ2J1dHRvbi5zdWJtaXQtZWRpdG9yJykuYmluZCgnY2xpY2snLCBlZGl0b3Iuc3VibWl0KVxuICAjXG4gICMgICAjIEFwcGVuZHMgXCJDb21tZW50OiBcIiB0byB0aGUgYW5ub3RhdGlvbiBjb21tZW50IHRleHQuXG4gICMgICBlZGl0b3Iub24oJ3NhdmUnLCAoYW5ub3RhdGlvbikgLT5cbiAgIyAgICAgYW5ub3RhdGlvbi50ZXh0ID0gXCJDb21tZW50OiBcIiArIGFubm90YXRpb24udGV4dFxuICAjICAgKS5zdWJtaXQoKVxuICAjXG4gICMgUmV0dXJucyBpdHNlbGYuXG4gIHN1Ym1pdDogKGV2ZW50KSA9PlxuICAgIFV0aWwucHJldmVudEV2ZW50RGVmYXVsdCBldmVudFxuXG4gICAgZm9yIGZpZWxkIGluIEBmaWVsZHNcbiAgICAgIGZpZWxkLnN1Ym1pdChmaWVsZC5lbGVtZW50LCBAYW5ub3RhdGlvbilcblxuICAgIHRoaXMucHVibGlzaCgnc2F2ZScsIFtAYW5ub3RhdGlvbl0pXG5cbiAgICB0aGlzLmhpZGUoKVxuXG4gICMgUHVibGljOiBBZGRzIGFuIGFkZGlvbmFsIGZvcm0gZmllbGQgdG8gdGhlIGVkaXRvci4gQ2FsbGJhY2tzIGNhbiBiZSBwcm92aWRlZFxuICAjIHRvIHVwZGF0ZSB0aGUgdmlldyBhbmQgYW5vdGF0aW9ucyBvbiBsb2FkIGFuZCBzdWJtaXNzaW9uLlxuICAjXG4gICMgb3B0aW9ucyAtIEFuIG9wdGlvbnMgT2JqZWN0LiBPcHRpb25zIGFyZSBhcyBmb2xsb3dzOlxuICAjICAgICAgICAgICBpZCAgICAgLSBBIHVuaXF1ZSBpZCBmb3IgdGhlIGZvcm0gZWxlbWVudCB3aWxsIGFsc28gYmUgc2V0IGFzIHRoZVxuICAjICAgICAgICAgICAgICAgICAgICBcImZvclwiIGF0dHJ1YnV0ZSBvZiBhIGxhYmVsIGlmIHRoZXJlIGlzIG9uZS4gRGVmYXVsdHMgdG9cbiAgIyAgICAgICAgICAgICAgICAgICAgYSB0aW1lc3RhbXAuIChkZWZhdWx0OiBcImFubm90YXRvci1maWVsZC17dGltZXN0YW1wfVwiKVxuICAjICAgICAgICAgICB0eXBlICAgLSBJbnB1dCB0eXBlIFN0cmluZy4gT25lIG9mIFwiaW5wdXRcIiwgXCJ0ZXh0YXJlYVwiLFxuICAjICAgICAgICAgICAgICAgICAgICBcImNoZWNrYm94XCIsIFwic2VsZWN0XCIgKGRlZmF1bHQ6IFwiaW5wdXRcIilcbiAgIyAgICAgICAgICAgbGFiZWwgIC0gTGFiZWwgdG8gZGlzcGxheSBlaXRoZXIgaW4gYSBsYWJlbCBFbGVtZW50IG9yIGFzIHBsYWNlLVxuICAjICAgICAgICAgICAgICAgICAgICBob2xkZXIgdGV4dCBkZXBlbmRpbmcgb24gdGhlIHR5cGUuIChkZWZhdWx0OiBcIlwiKVxuICAjICAgICAgICAgICBsb2FkICAgLSBDYWxsYmFjayBGdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgZWRpdG9yIGlzIGxvYWRlZCB3aXRoIGFcbiAgIyAgICAgICAgICAgICAgICAgICAgbmV3IGFubm90YXRpb24uIFJlY2lldmVzIHRoZSBmaWVsZCA8bGk+IGVsZW1lbnQgYW5kIHRoZVxuICAjICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uIHRvIGJlIGxvYWRlZC5cbiAgIyAgICAgICAgICAgc3VibWl0IC0gQ2FsbGJhY2sgRnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIGVkaXRvciBpcyBzdWJtaXR0ZWQuXG4gICMgICAgICAgICAgICAgICAgICAgIFJlY2lldmVzIHRoZSBmaWVsZCA8bGk+IGVsZW1lbnQgYW5kIHRoZSBhbm5vdGF0aW9uIHRvIGJlXG4gICMgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWQuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIEFkZCBhIG5ldyBpbnB1dCBlbGVtZW50LlxuICAjICAgZWRpdG9yLmFkZEZpZWxkKHtcbiAgIyAgICAgbGFiZWw6IFwiVGFnc1wiLFxuICAjXG4gICMgICAgICMgVGhpcyBpcyBjYWxsZWQgd2hlbiB0aGUgZWRpdG9yIGlzIGxvYWRlZCB1c2UgaXQgdG8gdXBkYXRlIHlvdXIgaW5wdXQuXG4gICMgICAgIGxvYWQ6IChmaWVsZCwgYW5ub3RhdGlvbikgLT5cbiAgIyAgICAgICAjIERvIHNvbWV0aGluZyB3aXRoIHRoZSBhbm5vdGF0aW9uLlxuICAjICAgICAgIHZhbHVlID0gZ2V0VGFnU3RyaW5nKGFubm90YXRpb24udGFncylcbiAgIyAgICAgICAkKGZpZWxkKS5maW5kKCdpbnB1dCcpLnZhbCh2YWx1ZSlcbiAgI1xuICAjICAgICAjIFRoaXMgaXMgY2FsbGVkIHdoZW4gdGhlIGVkaXRvciBpcyBzdWJtaXR0ZWQgdXNlIGl0IHRvIHJldHJpZXZlIGRhdGFcbiAgIyAgICAgIyBmcm9tIHlvdXIgaW5wdXQgYW5kIHNhdmUgaXQgdG8gdGhlIGFubm90YXRpb24uXG4gICMgICAgIHN1Ym1pdDogKGZpZWxkLCBhbm5vdGF0aW9uKSAtPlxuICAjICAgICAgIHZhbHVlID0gJChmaWVsZCkuZmluZCgnaW5wdXQnKS52YWwoKVxuICAjICAgICAgIGFubm90YXRpb24udGFncyA9IGdldFRhZ3NGcm9tU3RyaW5nKHZhbHVlKVxuICAjICAgfSlcbiAgI1xuICAjICAgIyBBZGQgYSBuZXcgY2hlY2tib3ggZWxlbWVudC5cbiAgIyAgIGVkaXRvci5hZGRGaWVsZCh7XG4gICMgICAgIHR5cGU6ICdjaGVja2JveCcsXG4gICMgICAgIGlkOiAnYW5ub3RhdG9yLWZpZWxkLW15LWNoZWNrYm94JyxcbiAgIyAgICAgbGFiZWw6ICdBbGxvdyBhbnlvbmUgdG8gc2VlIHRoaXMgYW5ub3RhdGlvbicsXG4gICMgICAgIGxvYWQ6IChmaWVsZCwgYW5ub3RhdGlvbikgLT5cbiAgIyAgICAgICAjIENoZWNrIHdoYXQgc3RhdGUgb2YgaW5wdXQgc2hvdWxkIGJlLlxuICAjICAgICAgIGlmIGNoZWNrZWRcbiAgIyAgICAgICAgICQoZmllbGQpLmZpbmQoJ2lucHV0JykuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJylcbiAgIyAgICAgICBlbHNlXG4gICMgICAgICAgICAkKGZpZWxkKS5maW5kKCdpbnB1dCcpLnJlbW92ZUF0dHIoJ2NoZWNrZWQnKVxuXG4gICMgICAgIHN1Ym1pdDogKGZpZWxkLCBhbm5vdGF0aW9uKSAtPlxuICAjICAgICAgIGNoZWNrZWQgPSAkKGZpZWxkKS5maW5kKCdpbnB1dCcpLmlzKCc6Y2hlY2tlZCcpXG4gICMgICAgICAgIyBEbyBzb21ldGhpbmcuXG4gICMgICB9KVxuICAjXG4gICMgUmV0dXJucyB0aGUgY3JlYXRlZCA8bGk+IEVsZW1lbnQuXG4gIGFkZEZpZWxkOiAob3B0aW9ucykgLT5cbiAgICBmaWVsZCA9ICQuZXh0ZW5kKHtcbiAgICAgIGlkOiAgICAgJ2Fubm90YXRvci1maWVsZC0nICsgVXRpbC51dWlkKClcbiAgICAgIHR5cGU6ICAgJ2lucHV0J1xuICAgICAgbGFiZWw6ICAnJ1xuICAgICAgbG9hZDogICAtPlxuICAgICAgc3VibWl0OiAtPlxuICAgIH0sIG9wdGlvbnMpXG5cbiAgICBpbnB1dCA9IG51bGxcbiAgICBlbGVtZW50ID0gJCgnPGxpIGNsYXNzPVwiYW5ub3RhdG9yLWl0ZW1cIiAvPicpXG4gICAgZmllbGQuZWxlbWVudCA9IGVsZW1lbnRbMF1cblxuICAgIHN3aXRjaCAoZmllbGQudHlwZSlcbiAgICAgIHdoZW4gJ3RleHRhcmVhJyAgICAgICAgICB0aGVuIGlucHV0ID0gJCgnPHRleHRhcmVhIC8+JylcbiAgICAgIHdoZW4gJ2lucHV0JywgJ2NoZWNrYm94JyB0aGVuIGlucHV0ID0gJCgnPGlucHV0IC8+JylcbiAgICAgIHdoZW4gJ3NlbGVjdCcgdGhlbiBpbnB1dCA9ICQoJzxzZWxlY3QgLz4nKVxuXG4gICAgZWxlbWVudC5hcHBlbmQoaW5wdXQpXG5cbiAgICBpbnB1dC5hdHRyKHtcbiAgICAgIGlkOiBmaWVsZC5pZFxuICAgICAgcGxhY2Vob2xkZXI6IGZpZWxkLmxhYmVsXG4gICAgfSlcblxuICAgIGlmIGZpZWxkLnR5cGUgPT0gJ2NoZWNrYm94J1xuICAgICAgaW5wdXRbMF0udHlwZSA9ICdjaGVja2JveCdcbiAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2Fubm90YXRvci1jaGVja2JveCcpXG4gICAgICBlbGVtZW50LmFwcGVuZCgkKCc8bGFiZWwgLz4nLCB7Zm9yOiBmaWVsZC5pZCwgaHRtbDogZmllbGQubGFiZWx9KSlcblxuICAgIEBlbGVtZW50LmZpbmQoJ3VsOmZpcnN0JykuYXBwZW5kKGVsZW1lbnQpXG5cbiAgICBAZmllbGRzLnB1c2ggZmllbGRcblxuICAgIGZpZWxkLmVsZW1lbnRcblxuICBjaGVja09yaWVudGF0aW9uOiAtPlxuICAgIHN1cGVyXG5cbiAgICBsaXN0ID0gQGVsZW1lbnQuZmluZCgndWwnKVxuICAgIGNvbnRyb2xzID0gQGVsZW1lbnQuZmluZCgnLmFubm90YXRvci1jb250cm9scycpXG5cbiAgICBpZiBAZWxlbWVudC5oYXNDbGFzcyhAY2xhc3Nlcy5pbnZlcnQueSlcbiAgICAgIGNvbnRyb2xzLmluc2VydEJlZm9yZShsaXN0KVxuICAgIGVsc2UgaWYgY29udHJvbHMuaXMoJzpmaXJzdC1jaGlsZCcpXG4gICAgICBjb250cm9scy5pbnNlcnRBZnRlcihsaXN0KVxuXG4gICAgdGhpc1xuXG4gICMgRXZlbnQgY2FsbGJhY2suIExpc3RlbnMgZm9yIHRoZSBmb2xsb3dpbmcgc3BlY2lhbCBrZXlwcmVzc2VzLlxuICAjIC0gZXNjYXBlOiBIaWRlcyB0aGUgZWRpdG9yXG4gICMgLSBlbnRlcjogIFN1Ym1pdHMgdGhlIGVkaXRvclxuICAjXG4gICMgZXZlbnQgLSBBIGtleWRvd24gRXZlbnQgb2JqZWN0LlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nXG4gIHByb2Nlc3NLZXlwcmVzczogKGV2ZW50KSA9PlxuICAgIGlmIGV2ZW50LmtleUNvZGUgaXMgMjcgIyBcIkVzY2FwZVwiIGtleSA9PiBhYm9ydC5cbiAgICAgIHRoaXMuaGlkZSgpXG4gICAgZWxzZSBpZiBldmVudC5rZXlDb2RlIGlzIDEzIGFuZCAhZXZlbnQuc2hpZnRLZXlcbiAgICAgICMgSWYgXCJyZXR1cm5cIiB3YXMgcHJlc3NlZCB3aXRob3V0IHRoZSBzaGlmdCBrZXksIHdlJ3JlIGRvbmUuXG4gICAgICB0aGlzLnN1Ym1pdCgpXG5cbiAgIyBFdmVudCBjYWxsYmFjay4gUmVtb3ZlcyB0aGUgZm9jdXMgY2xhc3MgZnJvbSB0aGUgc3VibWl0IGJ1dHRvbiB3aGVuIHRoZVxuICAjIGNhbmNlbCBidXR0b24gaXMgaG92ZXJlZC5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZ1xuICBvbkNhbmNlbEJ1dHRvbk1vdXNlb3ZlcjogPT5cbiAgICBAZWxlbWVudC5maW5kKCcuJyArIEBjbGFzc2VzLmZvY3VzKS5yZW1vdmVDbGFzcyhAY2xhc3Nlcy5mb2N1cylcblxuICAjIFNldHMgdXAgbW91c2UgZXZlbnRzIGZvciByZXNpemluZyBhbmQgZHJhZ2dpbmcgdGhlIGVkaXRvciB3aW5kb3cuXG4gICMgd2luZG93IGV2ZW50cyBhcmUgYm91bmQgb25seSB3aGVuIG5lZWRlZCBhbmQgdGhyb3R0bGVkIHRvIG9ubHkgdXBkYXRlXG4gICMgdGhlIHBvc2l0aW9ucyBhdCBtb3N0IDYwIHRpbWVzIGEgc2Vjb25kLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBzZXR1cERyYWdnYWJsZXM6ICgpIC0+XG4gICAgQGVsZW1lbnQuZmluZCgnLmFubm90YXRvci1yZXNpemUnKS5yZW1vdmUoKVxuXG4gICAgIyBGaW5kIHRoZSBmaXJzdC9sYXN0IGl0ZW0gZWxlbWVudCBkZXBlbmRpbmcgb24gb3JpZW50YXRpb25cbiAgICBpZiBAZWxlbWVudC5oYXNDbGFzcyhAY2xhc3Nlcy5pbnZlcnQueSlcbiAgICAgIGNvcm5lckl0ZW0gPSBAZWxlbWVudC5maW5kKCcuYW5ub3RhdG9yLWl0ZW06bGFzdCcpXG4gICAgZWxzZVxuICAgICAgY29ybmVySXRlbSA9IEBlbGVtZW50LmZpbmQoJy5hbm5vdGF0b3ItaXRlbTpmaXJzdCcpXG5cbiAgICBpZiBjb3JuZXJJdGVtXG4gICAgICAkKCc8c3BhbiBjbGFzcz1cImFubm90YXRvci1yZXNpemVcIj48L3NwYW4+JykuYXBwZW5kVG8oY29ybmVySXRlbSlcblxuICAgIG1vdXNlZG93biA9IG51bGxcbiAgICBjbGFzc2VzICAgPSBAY2xhc3Nlc1xuICAgIGVkaXRvciAgICA9IEBlbGVtZW50XG4gICAgdGV4dGFyZWEgID0gbnVsbFxuICAgIHJlc2l6ZSAgICA9IGVkaXRvci5maW5kKCcuYW5ub3RhdG9yLXJlc2l6ZScpXG4gICAgY29udHJvbHMgID0gZWRpdG9yLmZpbmQoJy5hbm5vdGF0b3ItY29udHJvbHMnKVxuICAgIHRocm90dGxlICA9IGZhbHNlXG5cbiAgICBvbk1vdXNlZG93biA9IChldmVudCkgLT5cbiAgICAgIGlmIGV2ZW50LnRhcmdldCA9PSB0aGlzXG4gICAgICAgIG1vdXNlZG93biA9IHtcbiAgICAgICAgICBlbGVtZW50OiB0aGlzXG4gICAgICAgICAgdG9wOiAgICAgZXZlbnQucGFnZVlcbiAgICAgICAgICBsZWZ0OiAgICBldmVudC5wYWdlWFxuICAgICAgICB9XG5cbiAgICAgICAgIyBGaW5kIHRoZSBmaXJzdCB0ZXh0IGFyZWEgaWYgdGhlcmUgaXMgb25lLlxuICAgICAgICB0ZXh0YXJlYSA9IGVkaXRvci5maW5kKCd0ZXh0YXJlYTpmaXJzdCcpXG5cbiAgICAgICAgJCh3aW5kb3cpLmJpbmQoe1xuICAgICAgICAgICdtb3VzZXVwLmFubm90YXRvci1lZGl0b3ItcmVzaXplJzogICBvbk1vdXNldXBcbiAgICAgICAgICAnbW91c2Vtb3ZlLmFubm90YXRvci1lZGl0b3ItcmVzaXplJzogb25Nb3VzZW1vdmVcbiAgICAgICAgfSlcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gICAgb25Nb3VzZXVwID0gLT5cbiAgICAgIG1vdXNlZG93biA9IG51bGxcbiAgICAgICQod2luZG93KS51bmJpbmQgJy5hbm5vdGF0b3ItZWRpdG9yLXJlc2l6ZSdcblxuICAgIG9uTW91c2Vtb3ZlID0gKGV2ZW50KSA9PlxuICAgICAgaWYgbW91c2Vkb3duIGFuZCB0aHJvdHRsZSA9PSBmYWxzZVxuICAgICAgICBkaWZmID0ge1xuICAgICAgICAgIHRvcDogIGV2ZW50LnBhZ2VZIC0gbW91c2Vkb3duLnRvcFxuICAgICAgICAgIGxlZnQ6IGV2ZW50LnBhZ2VYIC0gbW91c2Vkb3duLmxlZnRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIG1vdXNlZG93bi5lbGVtZW50ID09IHJlc2l6ZVswXVxuICAgICAgICAgIGhlaWdodCA9IHRleHRhcmVhLm91dGVySGVpZ2h0KClcbiAgICAgICAgICB3aWR0aCAgPSB0ZXh0YXJlYS5vdXRlcldpZHRoKClcblxuICAgICAgICAgIGRpcmVjdGlvblggPSBpZiBlZGl0b3IuaGFzQ2xhc3MoY2xhc3Nlcy5pbnZlcnQueCkgdGhlbiAtMSBlbHNlICAxXG4gICAgICAgICAgZGlyZWN0aW9uWSA9IGlmIGVkaXRvci5oYXNDbGFzcyhjbGFzc2VzLmludmVydC55KSB0aGVuICAxIGVsc2UgLTFcblxuICAgICAgICAgIHRleHRhcmVhLmhlaWdodCBoZWlnaHQgKyAoZGlmZi50b3AgICogZGlyZWN0aW9uWSlcbiAgICAgICAgICB0ZXh0YXJlYS53aWR0aCAgd2lkdGggICsgKGRpZmYubGVmdCAqIGRpcmVjdGlvblgpXG5cbiAgICAgICAgICAjIE9ubHkgdXBkYXRlIHRoZSBtb3VzZWRvd24gb2JqZWN0IGlmIHRoZSBkaW1lbnNpb25zXG4gICAgICAgICAgIyBoYXZlIGNoYW5nZWQsIG90aGVyd2lzZSB0aGV5IGhhdmUgcmVhY2hlZCB0aGVpciBtaW5pbXVtXG4gICAgICAgICAgIyB2YWx1ZXMuXG4gICAgICAgICAgbW91c2Vkb3duLnRvcCAgPSBldmVudC5wYWdlWSB1bmxlc3MgdGV4dGFyZWEub3V0ZXJIZWlnaHQoKSA9PSBoZWlnaHRcbiAgICAgICAgICBtb3VzZWRvd24ubGVmdCA9IGV2ZW50LnBhZ2VYIHVubGVzcyB0ZXh0YXJlYS5vdXRlcldpZHRoKCkgID09IHdpZHRoXG5cbiAgICAgICAgZWxzZSBpZiBtb3VzZWRvd24uZWxlbWVudCA9PSBjb250cm9sc1swXVxuICAgICAgICAgIGVkaXRvci5jc3Moe1xuICAgICAgICAgICAgdG9wOiAgcGFyc2VJbnQoZWRpdG9yLmNzcygndG9wJyksIDEwKSAgKyBkaWZmLnRvcFxuICAgICAgICAgICAgbGVmdDogcGFyc2VJbnQoZWRpdG9yLmNzcygnbGVmdCcpLCAxMCkgKyBkaWZmLmxlZnRcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgbW91c2Vkb3duLnRvcCAgPSBldmVudC5wYWdlWVxuICAgICAgICAgIG1vdXNlZG93bi5sZWZ0ID0gZXZlbnQucGFnZVhcblxuICAgICAgICB0aHJvdHRsZSA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoLT5cbiAgICAgICAgICB0aHJvdHRsZSA9IGZhbHNlXG4gICAgICAgICwgMTAwMC82MClcblxuICAgIHJlc2l6ZS5iaW5kICAgJ21vdXNlZG93bicsIG9uTW91c2Vkb3duXG4gICAgY29udHJvbHMuYmluZCAnbW91c2Vkb3duJywgb25Nb3VzZWRvd25cblxuXG4jIEV4cG9ydCB0aGUgRWRpdG9yIG9iamVjdFxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JcbiIsIkRlbGVnYXRvciA9IHJlcXVpcmUgJy4vY2xhc3MnXG5VdGlsID0gcmVxdWlyZSAnLi91dGlsJ1xuXG5cbiMgUHVibGljOiBBIHNpbXBsZSBub3RpZmljYXRpb24gc3lzdGVtIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGlzcGxheSBpbmZvcm1hdGlvbixcbiMgd2FybmluZ3MgYW5kIGVycm9ycyB0byB0aGUgdXNlci4gRGlzcGxheSBvZiBub3RpZmljYXRpb25zIGFyZSBjb250cm9sbGVkXG4jIGNtcGxldGVseSBieSBDU1MgYnkgYWRkaW5nL3JlbW92aW5nIHRoZSBAb3B0aW9ucy5jbGFzc2VzLnNob3cgY2xhc3MuIFRoaXNcbiMgYWxsb3dzIHN0eWxpbmcvYW5pbWF0aW9uIHVzaW5nIENTUyByYXRoZXIgdGhhbiBoYXJkY29kaW5nIHN0eWxlcy5cbmNsYXNzIE5vdGlmaWNhdGlvbiBleHRlbmRzIERlbGVnYXRvclxuXG4gICMgU2V0cyBldmVudHMgdG8gYmUgYm91bmQgdG8gdGhlIEBlbGVtZW50LlxuICBldmVudHM6XG4gICAgXCJjbGlja1wiOiBcImhpZGVcIlxuXG4gICMgRGVmYXVsdCBvcHRpb25zLlxuICBvcHRpb25zOlxuICAgIGh0bWw6IFwiPGRpdiBjbGFzcz0nYW5ub3RhdG9yLW5vdGljZSc+PC9kaXY+XCJcbiAgICBjbGFzc2VzOlxuICAgICAgc2hvdzogICAgXCJhbm5vdGF0b3Itbm90aWNlLXNob3dcIlxuICAgICAgaW5mbzogICAgXCJhbm5vdGF0b3Itbm90aWNlLWluZm9cIlxuICAgICAgc3VjY2VzczogXCJhbm5vdGF0b3Itbm90aWNlLXN1Y2Nlc3NcIlxuICAgICAgZXJyb3I6ICAgXCJhbm5vdGF0b3Itbm90aWNlLWVycm9yXCJcblxuICAjIFB1YmxpYzogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiAgTm90aWZpY2F0aW9uIGFuZCBhcHBlbmRzIGl0IHRvIHRoZVxuICAjIGRvY3VtZW50IGJvZHkuXG4gICNcbiAgIyBvcHRpb25zIC0gVGhlIGZvbGxvd2luZyBvcHRpb25zIGNhbiBiZSBwcm92aWRlZC5cbiAgIyAgICAgICAgICAgY2xhc3NlcyAtIEEgT2JqZWN0IGxpdGVyYWwgb2YgY2xhc3NlcyB1c2VkIHRvIGRldGVybWluZSBzdGF0ZS5cbiAgIyAgICAgICAgICAgaHRtbCAgICAtIEFuIEhUTUwgc3RyaW5nIHVzZWQgdG8gY3JlYXRlIHRoZSBub3RpZmljYXRpb24uXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIERpc3BsYXlzIGEgbm90aWZpY2F0aW9uIHdpdGggdGhlIHRleHQgXCJIZWxsbyBXb3JsZFwiXG4gICMgICBub3RpZmljYXRpb24gPSBuZXcgQW5ub3RhdG9yLk5vdGlmaWNhdGlvblxuICAjICAgbm90aWZpY2F0aW9uLnNob3coXCJIZWxsbyBXb3JsZFwiKVxuICAjXG4gICMgUmV0dXJuc1xuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIgJChAb3B0aW9ucy5odG1sKVswXSwgb3B0aW9uc1xuXG4gICMgUHVibGljOiBEaXNwbGF5cyB0aGUgYW5ub3RhdGlvbiB3aXRoIG1lc3NhZ2UgYW5kIG9wdGlvbmFsIHN0YXR1cy4gVGhlXG4gICMgbWVzc2FnZSB3aWxsIGhpZGUgaXRzZWxmIGFmdGVyIDUgc2Vjb25kcyBvciBpZiB0aGUgdXNlciBjbGlja3Mgb24gaXQuXG4gICNcbiAgIyBtZXNzYWdlIC0gQSBtZXNzYWdlIFN0cmluZyB0byBkaXNwbGF5IChIVE1MIHdpbGwgYmUgZXNjYXBlZCkuXG4gICMgc3RhdHVzICAtIEEgc3RhdHVzIGNvbnN0YW50LiBUaGlzIHdpbGwgYXBwbHkgYSBjbGFzcyB0byB0aGUgZWxlbWVudCBmb3JcbiAgIyAgICAgICAgICAgc3R5bGluZy4gKGRlZmF1bHQ6IEFubm90YXRvci5Ob3RpZmljYXRpb24uSU5GTylcbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgICMgRGlzcGxheXMgYSBub3RpZmljYXRpb24gd2l0aCB0aGUgdGV4dCBcIkhlbGxvIFdvcmxkXCJcbiAgIyAgIG5vdGlmaWNhdGlvbi5zaG93KFwiSGVsbG8gV29ybGRcIilcbiAgI1xuICAjICAgIyBEaXNwbGF5cyBhIG5vdGlmaWNhdGlvbiB3aXRoIHRoZSB0ZXh0IFwiQW4gZXJyb3IgaGFzIG9jY3VycmVkXCJcbiAgIyAgIG5vdGlmaWNhdGlvbi5zaG93KFwiQW4gZXJyb3IgaGFzIG9jY3VycmVkXCIsIEFubm90YXRvci5Ob3RpZmljYXRpb24uRVJST1IpXG4gICNcbiAgIyBSZXR1cm5zIGl0c2VsZi5cbiAgc2hvdzogKG1lc3NhZ2UsIHN0YXR1cz1Ob3RpZmljYXRpb24uSU5GTykgPT5cbiAgICBAY3VycmVudFN0YXR1cyA9IHN0YXR1c1xuICAgIHRoaXMuX2FwcGVuZEVsZW1lbnQoKVxuXG4gICAgJChAZWxlbWVudClcbiAgICAgIC5hZGRDbGFzcyhAb3B0aW9ucy5jbGFzc2VzLnNob3cpXG4gICAgICAuYWRkQ2xhc3MoQG9wdGlvbnMuY2xhc3Nlc1tAY3VycmVudFN0YXR1c10pXG4gICAgICAuaHRtbChVdGlsLmVzY2FwZShtZXNzYWdlIHx8IFwiXCIpKVxuXG4gICAgc2V0VGltZW91dCB0aGlzLmhpZGUsIDUwMDBcbiAgICB0aGlzXG5cbiAgIyBQdWJsaWM6IEhpZGVzIHRoZSBub3RpZmljYXRpb24uXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIEhpZGVzIHRoZSBub3RpZmljYXRpb24uXG4gICMgICBub3RpZmljYXRpb24uaGlkZSgpXG4gICNcbiAgIyBSZXR1cm5zIGl0c2VsZi5cbiAgaGlkZTogPT5cbiAgICBAY3VycmVudFN0YXR1cyA/PSBBbm5vdGF0b3IuTm90aWZpY2F0aW9uLklORk9cbiAgICAkKEBlbGVtZW50KVxuICAgICAgLnJlbW92ZUNsYXNzKEBvcHRpb25zLmNsYXNzZXMuc2hvdylcbiAgICAgIC5yZW1vdmVDbGFzcyhAb3B0aW9ucy5jbGFzc2VzW0BjdXJyZW50U3RhdHVzXSlcbiAgICB0aGlzXG5cbiAgIyBQcml2YXRlOiBFbnN1cmVzIHRoZSBub3RpZmljYXRpb24gZWxlbWVudCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgZG9jdW1lbnRcbiAgIyB3aGVuIGl0IGlzIG5lZWRlZC5cbiAgX2FwcGVuZEVsZW1lbnQ6IC0+XG4gICAgaWYgbm90IEBlbGVtZW50LnBhcmVudE5vZGU/XG4gICAgICAkKEBlbGVtZW50KS5hcHBlbmRUbyhkb2N1bWVudC5ib2R5KVxuXG4jIENvbnN0YW50cyBmb3IgY29udHJvbGxpbmcgdGhlIGRpc3BsYXkgb2YgdGhlIG5vdGlmaWNhdGlvbi4gRWFjaCBjb25zdGFudFxuIyBhZGRzIGEgZGlmZmVyZW50IGNsYXNzIHRvIHRoZSBOb3RpZmljYXRpb24jZWxlbWVudC5cbk5vdGlmaWNhdGlvbi5JTkZPICAgID0gJ2luZm8nXG5Ob3RpZmljYXRpb24uU1VDQ0VTUyA9ICdzdWNjZXNzJ1xuTm90aWZpY2F0aW9uLkVSUk9SICAgPSAnZXJyb3InXG5cbiMgRXhwb3J0IE5vdGlmaWNhdGlvbiBvYmplY3Rcbm1vZHVsZS5leHBvcnRzID0gTm90aWZpY2F0aW9uXG4iLCJVdGlsID0gcmVxdWlyZSgnLi91dGlsJylcblxuXG5SYW5nZSA9IHt9XG5cbiMgUHVibGljOiBEZXRlcm1pbmVzIHRoZSB0eXBlIG9mIFJhbmdlIG9mIHRoZSBwcm92aWRlZCBvYmplY3QgYW5kIHJldHVybnNcbiMgYSBzdWl0YWJsZSBSYW5nZSBpbnN0YW5jZS5cbiNcbiMgciAtIEEgcmFuZ2UgT2JqZWN0LlxuI1xuIyBFeGFtcGxlc1xuI1xuIyAgIHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKVxuIyAgIFJhbmdlLnNuaWZmKHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApKVxuIyAgICMgPT4gUmV0dXJucyBhIEJyb3dzZXJSYW5nZSBpbnN0YW5jZS5cbiNcbiMgUmV0dXJucyBhIFJhbmdlIG9iamVjdCBvciBmYWxzZS5cblJhbmdlLnNuaWZmID0gKHIpIC0+XG4gIGlmIHIuY29tbW9uQW5jZXN0b3JDb250YWluZXI/XG4gICAgbmV3IFJhbmdlLkJyb3dzZXJSYW5nZShyKVxuICBlbHNlIGlmIHR5cGVvZiByLnN0YXJ0IGlzIFwic3RyaW5nXCJcbiAgICBuZXcgUmFuZ2UuU2VyaWFsaXplZFJhbmdlKHIpXG4gIGVsc2UgaWYgci5zdGFydCBhbmQgdHlwZW9mIHIuc3RhcnQgaXMgXCJvYmplY3RcIlxuICAgIG5ldyBSYW5nZS5Ob3JtYWxpemVkUmFuZ2UocilcbiAgZWxzZVxuICAgIGNvbnNvbGUuZXJyb3IoX3QoXCJDb3VsZCBub3Qgc25pZmYgcmFuZ2UgdHlwZVwiKSlcbiAgICBmYWxzZVxuXG4jIFB1YmxpYzogRmluZHMgYW4gRWxlbWVudCBOb2RlIHVzaW5nIGFuIFhQYXRoIHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudCByb290LlxuI1xuIyBJZiB0aGUgZG9jdW1lbnQgaXMgc2VydmVkIGFzIGFwcGxpY2F0aW9uL3hodG1sK3htbCBpdCB3aWxsIHRyeSBhbmQgcmVzb2x2ZVxuIyBhbnkgbmFtZXNwYWNlcyB3aXRoaW4gdGhlIFhQYXRoLlxuI1xuIyB4cGF0aCAtIEFuIFhQYXRoIFN0cmluZyB0byBxdWVyeS5cbiNcbiMgRXhhbXBsZXNcbiNcbiMgICBub2RlID0gUmFuZ2Uubm9kZUZyb21YUGF0aCgnL2h0bWwvYm9keS9kaXYvcFsyXScpXG4jICAgaWYgbm9kZVxuIyAgICAgIyBEbyBzb21ldGhpbmcgd2l0aCB0aGUgbm9kZS5cbiNcbiMgUmV0dXJucyB0aGUgTm9kZSBpZiBmb3VuZCBvdGhlcndpc2UgbnVsbC5cblJhbmdlLm5vZGVGcm9tWFBhdGggPSAoeHBhdGgsIHJvb3Q9ZG9jdW1lbnQpIC0+XG4gIGV2YWx1YXRlWFBhdGggPSAoeHAsIG5zUmVzb2x2ZXI9bnVsbCkgLT5cbiAgICB0cnlcbiAgICAgIGRvY3VtZW50LmV2YWx1YXRlKCcuJyArIHhwLCByb290LCBuc1Jlc29sdmVyLCBYUGF0aFJlc3VsdC5GSVJTVF9PUkRFUkVEX05PREVfVFlQRSwgbnVsbCkuc2luZ2xlTm9kZVZhbHVlXG4gICAgY2F0Y2ggZXhjZXB0aW9uXG4gICAgICAjIFRoZXJlIGFyZSBjYXNlcyB3aGVuIHRoZSBldmFsdWF0aW9uIGZhaWxzLCBiZWNhdXNlIHRoZVxuICAgICAgIyBIVE1MIGRvY3VtZW50cyBjb250YWlucyBub2RlcyB3aXRoIGludmFsaWQgbmFtZXMsXG4gICAgICAjIGZvciBleGFtcGxlIHRhZ3Mgd2l0aCBlcXVhbCBzaWducyBpbiB0aGVtLCBvciBzb21ldGhpbmcgbGlrZSB0aGF0LlxuICAgICAgIyBJbiB0aGVzZSBjYXNlcywgdGhlIFhQYXRoIGV4cHJlc3Npb25zIHdpbGwgaGF2ZSB0aGVzZSBhYm9taW5hdGlvbnMsXG4gICAgICAjIHRvbywgYW5kIHRoZW4gdGhleSBjYW4gbm90IGJlIGV2YWx1YXRlZC5cbiAgICAgICMgSW4gdGhlc2UgY2FzZXMsIHdlIGdldCBhbiBYUGF0aEV4Y2VwdGlvbiwgd2l0aCBlcnJvciBjb2RlIDUyLlxuICAgICAgIyBTZWUgaHR0cDovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTMtWFBhdGgveHBhdGguaHRtbCNYUGF0aEV4Y2VwdGlvblxuICAgICAgIyBUaGlzIGRvZXMgbm90IG5lY2Vzc2FyaWx5IG1ha2UgYW55IHNlbnNlLCBidXQgdGhpcyB3aGF0IHdlIHNlZVxuICAgICAgIyBoYXBwZW5pbmcuXG4gICAgICBjb25zb2xlLmxvZyBcIlhQYXRoIGV2YWx1YXRpb24gZmFpbGVkLlwiXG4gICAgICBjb25zb2xlLmxvZyBcIlRyeWluZyBmYWxsYmFjay4uLlwiXG4gICAgICAjIFdlIGhhdmUgYSBhbiAnZXZhbHVhdG9yJyBmb3IgdGhlIHJlYWxseSBzaW1wbGUgZXhwcmVzc2lvbnMgdGhhdFxuICAgICAgIyBzaG91bGQgd29yayBmb3IgdGhlIHNpbXBsZSBleHByZXNzaW9ucyB3ZSBnZW5lcmF0ZS5cbiAgICAgIFV0aWwubm9kZUZyb21YUGF0aCh4cCwgcm9vdClcblxuICBpZiBub3QgJC5pc1hNTERvYyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcbiAgICBldmFsdWF0ZVhQYXRoIHhwYXRoXG4gIGVsc2VcbiAgICAjIFdlJ3JlIGluIGFuIFhNTCBkb2N1bWVudCwgY3JlYXRlIGEgbmFtZXNwYWNlIHJlc29sdmVyIGZ1bmN0aW9uIHRvIHRyeVxuICAgICMgYW5kIHJlc29sdmUgYW55IG5hbWVzcGFjZXMgaW4gdGhlIGN1cnJlbnQgZG9jdW1lbnQuXG4gICAgIyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9ET00vZG9jdW1lbnQuY3JlYXRlTlNSZXNvbHZlclxuICAgIGN1c3RvbVJlc29sdmVyID0gZG9jdW1lbnQuY3JlYXRlTlNSZXNvbHZlcihcbiAgICAgIGlmIGRvY3VtZW50Lm93bmVyRG9jdW1lbnQgPT0gbnVsbFxuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcbiAgICAgIGVsc2VcbiAgICAgICAgZG9jdW1lbnQub3duZXJEb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcbiAgICApXG4gICAgbm9kZSA9IGV2YWx1YXRlWFBhdGggeHBhdGgsIGN1c3RvbVJlc29sdmVyXG5cbiAgICB1bmxlc3Mgbm9kZVxuICAgICAgIyBJZiB0aGUgcHJldmlvdXMgc2VhcmNoIGZhaWxlZCB0byBmaW5kIGEgbm9kZSB0aGVuIHdlIG11c3QgdHJ5IHRvXG4gICAgICAjIHByb3ZpZGUgYSBjdXN0b20gbmFtZXNwYWNlIHJlc29sdmVyIHRvIHRha2UgaW50byBhY2NvdW50IHRoZSBkZWZhdWx0XG4gICAgICAjIG5hbWVzcGFjZS4gV2UgYWxzbyBwcmVmaXggYWxsIG5vZGUgbmFtZXMgd2l0aCBhIGN1c3RvbSB4aHRtbCBuYW1lc3BhY2VcbiAgICAgICMgZWcuICdkaXYnID0+ICd4aHRtbDpkaXYnLlxuICAgICAgeHBhdGggPSAoZm9yIHNlZ21lbnQgaW4geHBhdGguc3BsaXQgJy8nXG4gICAgICAgIGlmIHNlZ21lbnQgYW5kIHNlZ21lbnQuaW5kZXhPZignOicpID09IC0xXG4gICAgICAgICAgc2VnbWVudC5yZXBsYWNlKC9eKFthLXpdKykvLCAneGh0bWw6JDEnKVxuICAgICAgICBlbHNlIHNlZ21lbnRcbiAgICAgICkuam9pbignLycpXG5cbiAgICAgICMgRmluZCB0aGUgZGVmYXVsdCBkb2N1bWVudCBuYW1lc3BhY2UuXG4gICAgICBuYW1lc3BhY2UgPSBkb2N1bWVudC5sb29rdXBOYW1lc3BhY2VVUkkgbnVsbFxuXG4gICAgICAjIFRyeSBhbmQgcmVzb2x2ZSB0aGUgbmFtZXNwYWNlLCBmaXJzdCBzZWVpbmcgaWYgaXQgaXMgYW4geGh0bWwgbm9kZVxuICAgICAgIyBvdGhlcndpc2UgY2hlY2sgdGhlIGhlYWQgYXR0cmlidXRlcy5cbiAgICAgIGN1c3RvbVJlc29sdmVyICA9IChucykgLT5cbiAgICAgICAgaWYgbnMgPT0gJ3hodG1sJyB0aGVuIG5hbWVzcGFjZVxuICAgICAgICBlbHNlIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3htbG5zOicgKyBucylcblxuICAgICAgbm9kZSA9IGV2YWx1YXRlWFBhdGggeHBhdGgsIGN1c3RvbVJlc29sdmVyXG4gICAgbm9kZVxuXG5jbGFzcyBSYW5nZS5SYW5nZUVycm9yIGV4dGVuZHMgRXJyb3JcbiAgY29uc3RydWN0b3I6IChAdHlwZSwgQG1lc3NhZ2UsIEBwYXJlbnQ9bnVsbCkgLT5cbiAgICBzdXBlcihAbWVzc2FnZSlcblxuIyBQdWJsaWM6IENyZWF0ZXMgYSB3cmFwcGVyIGFyb3VuZCBhIHJhbmdlIG9iamVjdCBvYnRhaW5lZCBmcm9tIGEgRE9NU2VsZWN0aW9uLlxuY2xhc3MgUmFuZ2UuQnJvd3NlclJhbmdlXG5cbiAgIyBQdWJsaWM6IENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgQnJvd3NlclJhbmdlLlxuICAjXG4gICMgb2JqZWN0IC0gQSByYW5nZSBvYmplY3Qgb2J0YWluZWQgdmlhIERPTVNlbGVjdGlvbiNnZXRSYW5nZUF0KCkuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKClcbiAgIyAgIHJhbmdlID0gbmV3IFJhbmdlLkJyb3dzZXJSYW5nZShzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKSlcbiAgI1xuICAjIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgQnJvd3NlclJhbmdlLlxuICBjb25zdHJ1Y3RvcjogKG9iaikgLT5cbiAgICBAY29tbW9uQW5jZXN0b3JDb250YWluZXIgPSBvYmouY29tbW9uQW5jZXN0b3JDb250YWluZXJcbiAgICBAc3RhcnRDb250YWluZXIgICAgICAgICAgPSBvYmouc3RhcnRDb250YWluZXJcbiAgICBAc3RhcnRPZmZzZXQgICAgICAgICAgICAgPSBvYmouc3RhcnRPZmZzZXRcbiAgICBAZW5kQ29udGFpbmVyICAgICAgICAgICAgPSBvYmouZW5kQ29udGFpbmVyXG4gICAgQGVuZE9mZnNldCAgICAgICAgICAgICAgID0gb2JqLmVuZE9mZnNldFxuXG4gICMgUHVibGljOiBub3JtYWxpemUgd29ya3MgYXJvdW5kIHRoZSBmYWN0IHRoYXQgYnJvd3NlcnMgZG9uJ3QgZ2VuZXJhdGVcbiAgIyByYW5nZXMvc2VsZWN0aW9ucyBpbiBhIGNvbnNpc3RlbnQgbWFubmVyLiBTb21lIChTYWZhcmkpIHdpbGwgY3JlYXRlXG4gICMgcmFuZ2VzIHRoYXQgaGF2ZSAoc2F5KSBhIHRleHROb2RlIHN0YXJ0Q29udGFpbmVyIGFuZCBlbGVtZW50Tm9kZVxuICAjIGVuZENvbnRhaW5lci4gT3RoZXJzIChGaXJlZm94KSBzZWVtIHRvIG9ubHkgZXZlciBnZW5lcmF0ZVxuICAjIHRleHROb2RlL3RleHROb2RlIG9yIGVsZW1lbnROb2RlL2VsZW1lbnROb2RlIHBhaXJzLlxuICAjXG4gICMgUmV0dXJucyBhbiBpbnN0YW5jZSBvZiBSYW5nZS5Ob3JtYWxpemVkUmFuZ2VcbiAgbm9ybWFsaXplOiAocm9vdCkgLT5cbiAgICBpZiBAdGFpbnRlZFxuICAgICAgY29uc29sZS5lcnJvcihfdChcIllvdSBtYXkgb25seSBjYWxsIG5vcm1hbGl6ZSgpIG9uY2Ugb24gYSBCcm93c2VyUmFuZ2UhXCIpKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgZWxzZVxuICAgICAgQHRhaW50ZWQgPSB0cnVlXG5cbiAgICByID0ge31cblxuICAgICMgTG9vayBhdCB0aGUgc3RhcnRcbiAgICBpZiBAc3RhcnRDb250YWluZXIubm9kZVR5cGUgaXMgTm9kZS5FTEVNRU5UX05PREVcbiAgICAgICMgV2UgYXJlIGRlYWxpbmcgd2l0aCBlbGVtZW50IG5vZGVzICBcbiAgICAgIHIuc3RhcnQgPSBVdGlsLmdldEZpcnN0VGV4dE5vZGVOb3RCZWZvcmUgQHN0YXJ0Q29udGFpbmVyLmNoaWxkTm9kZXNbQHN0YXJ0T2Zmc2V0XVxuICAgICAgci5zdGFydE9mZnNldCA9IDBcbiAgICBlbHNlXG4gICAgICAjIFdlIGFyZSBkZWFsaW5nIHdpdGggc2ltcGxlIHRleHQgbm9kZXNcbiAgICAgIHIuc3RhcnQgPSBAc3RhcnRDb250YWluZXJcbiAgICAgIHIuc3RhcnRPZmZzZXQgPSBAc3RhcnRPZmZzZXRcblxuICAgICMgTG9vayBhdCB0aGUgZW5kXG4gICAgaWYgQGVuZENvbnRhaW5lci5ub2RlVHlwZSBpcyBOb2RlLkVMRU1FTlRfTk9ERVxuICAgICAgIyBHZXQgc3BlY2lmaWVkIG5vZGUuXG4gICAgICBub2RlID0gQGVuZENvbnRhaW5lci5jaGlsZE5vZGVzW0BlbmRPZmZzZXRdXG5cbiAgICAgIGlmIG5vZGU/ICMgRG9lcyB0aGF0IG5vZGUgZXhpc3Q/XG4gICAgICAgICMgTG9vayBmb3IgYSB0ZXh0IG5vZGUgZWl0aGVyIGF0IHRoZSBpbW1lZGlhdGUgYmVnaW5uaW5nIG9mIG5vZGVcbiAgICAgICAgbiA9IG5vZGVcbiAgICAgICAgd2hpbGUgbj8gYW5kIChuLm5vZGVUeXBlIGlzbnQgTm9kZS5URVhUX05PREUpXG4gICAgICAgICAgbiA9IG4uZmlyc3RDaGlsZFxuICAgICAgICBpZiBuPyAjIERpZCB3ZSBmaW5kIGEgdGV4dCBub2RlIGF0IHRoZSBzdGFydCBvZiB0aGlzIGVsZW1lbnQ/XG4gICAgICAgICAgci5lbmQgPSBuXG4gICAgICAgICAgci5lbmRPZmZzZXQgPSAwXG5cbiAgICAgIHVubGVzcyByLmVuZD8gIFxuICAgICAgICAjIFdlIG5lZWQgdG8gZmluZCBhIHRleHQgbm9kZSBpbiB0aGUgcHJldmlvdXMgc2libGluZyBvZiB0aGUgbm9kZSBhdCB0aGVcbiAgICAgICAgIyBnaXZlbiBvZmZzZXQsIGlmIG9uZSBleGlzdHMsIG9yIGluIHRoZSBwcmV2aW91cyBzaWJsaW5nIG9mIGl0cyBjb250YWluZXIuXG4gICAgICAgIGlmIEBlbmRPZmZzZXRcbiAgICAgICAgICBub2RlID0gQGVuZENvbnRhaW5lci5jaGlsZE5vZGVzW0BlbmRPZmZzZXQgLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbm9kZSA9IEBlbmRDb250YWluZXIucHJldmlvdXNTaWJsaW5nXG4gICAgICAgIHIuZW5kID0gVXRpbC5nZXRMYXN0VGV4dE5vZGVVcFRvIG5vZGVcbiAgICAgICAgci5lbmRPZmZzZXQgPSByLmVuZC5ub2RlVmFsdWUubGVuZ3RoXG5cbiAgICBlbHNlICMgV2UgYXJlIGRlYWxpbmcgd2l0aCBzaW1wbGUgdGV4dCBub2Rlc1xuICAgICAgci5lbmQgPSBAZW5kQ29udGFpbmVyXG4gICAgICByLmVuZE9mZnNldCA9IEBlbmRPZmZzZXRcblxuICAgICMgV2UgaGF2ZSBjb2xsZWN0ZWQgdGhlIGluaXRpYWwgZGF0YS5cblxuICAgICMgTm93IGxldCdzIHN0YXJ0IHRvIHNsaWNlICYgZGljZSB0aGUgdGV4dCBlbGVtZW50cyFcbiAgICBuciA9IHt9XG5cbiAgICBpZiByLnN0YXJ0T2Zmc2V0ID4gMFxuICAgICAgIyBEbyB3ZSByZWFsbHkgaGF2ZSB0byBjdXQ/XG4gICAgICBpZiByLnN0YXJ0Lm5vZGVWYWx1ZS5sZW5ndGggPiByLnN0YXJ0T2Zmc2V0XG4gICAgICAgICMgWWVzLiBDdXQuXG4gICAgICAgIG5yLnN0YXJ0ID0gci5zdGFydC5zcGxpdFRleHQoci5zdGFydE9mZnNldClcbiAgICAgIGVsc2VcbiAgICAgICAgIyBBdm9pZCBzcGxpdHRpbmcgb2ZmIHplcm8tbGVuZ3RoIHBpZWNlcy5cbiAgICAgICAgbnIuc3RhcnQgPSByLnN0YXJ0Lm5leHRTaWJsaW5nXG4gICAgZWxzZVxuICAgICAgbnIuc3RhcnQgPSByLnN0YXJ0XG5cbiAgICAjIGlzIHRoZSB3aG9sZSBzZWxlY3Rpb24gaW5zaWRlIG9uZSB0ZXh0IGVsZW1lbnQgP1xuICAgIGlmIHIuc3RhcnQgaXMgci5lbmRcbiAgICAgIGlmIG5yLnN0YXJ0Lm5vZGVWYWx1ZS5sZW5ndGggPiAoci5lbmRPZmZzZXQgLSByLnN0YXJ0T2Zmc2V0KVxuICAgICAgICBuci5zdGFydC5zcGxpdFRleHQoci5lbmRPZmZzZXQgLSByLnN0YXJ0T2Zmc2V0KVxuICAgICAgbnIuZW5kID0gbnIuc3RhcnRcbiAgICBlbHNlICMgbm8sIHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvbiBpcyBpbiBhIHNlcGFyYXRlIHRleHQgZWxlbWVudFxuICAgICAgIyBkb2VzIHRoZSBlbmQgbmVlZCB0byBiZSBjdXQ/XG4gICAgICBpZiByLmVuZC5ub2RlVmFsdWUubGVuZ3RoID4gci5lbmRPZmZzZXRcbiAgICAgICAgci5lbmQuc3BsaXRUZXh0KHIuZW5kT2Zmc2V0KVxuICAgICAgbnIuZW5kID0gci5lbmRcblxuICAgICMgTWFrZSBzdXJlIHRoZSBjb21tb24gYW5jZXN0b3IgaXMgYW4gZWxlbWVudCBub2RlLlxuICAgIG5yLmNvbW1vbkFuY2VzdG9yID0gQGNvbW1vbkFuY2VzdG9yQ29udGFpbmVyXG4gICAgd2hpbGUgbnIuY29tbW9uQW5jZXN0b3Iubm9kZVR5cGUgaXNudCBOb2RlLkVMRU1FTlRfTk9ERVxuICAgICAgbnIuY29tbW9uQW5jZXN0b3IgPSBuci5jb21tb25BbmNlc3Rvci5wYXJlbnROb2RlXG5cbiAgICBuZXcgUmFuZ2UuTm9ybWFsaXplZFJhbmdlKG5yKVxuXG4gICMgUHVibGljOiBDcmVhdGVzIGEgcmFuZ2Ugc3VpdGFibGUgZm9yIHN0b3JhZ2UuXG4gICNcbiAgIyByb290ICAgICAgICAgICAtIEEgcm9vdCBFbGVtZW50IGZyb20gd2hpY2ggdG8gYW5jaG9yIHRoZSBzZXJpYWxpc2F0aW9uLlxuICAjIGlnbm9yZVNlbGVjdG9yIC0gQSBzZWxlY3RvciBTdHJpbmcgb2YgZWxlbWVudHMgdG8gaWdub3JlLiBGb3IgZXhhbXBsZVxuICAjICAgICAgICAgICAgICAgICAgZWxlbWVudHMgaW5qZWN0ZWQgYnkgdGhlIGFubm90YXRvci5cbiAgI1xuICAjIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgU2VyaWFsaXplZFJhbmdlLlxuICBzZXJpYWxpemU6IChyb290LCBpZ25vcmVTZWxlY3RvcikgLT5cbiAgICB0aGlzLm5vcm1hbGl6ZShyb290KS5zZXJpYWxpemUocm9vdCwgaWdub3JlU2VsZWN0b3IpXG5cbiMgUHVibGljOiBBIG5vcm1hbGlzZWQgcmFuZ2UgaXMgbW9zdCBjb21tb25seSB1c2VkIHRocm91Z2hvdXQgdGhlIGFubm90YXRvci5cbiMgaXRzIHRoZSByZXN1bHQgb2YgYSBkZXNlcmlhbGlzZWQgU2VyaWFsaXplZFJhbmdlIG9yIGEgQnJvd3NlclJhbmdlIHdpdGhcbiMgb3V0IGJyb3dzZXIgaW5jb25zaXN0ZW5jaWVzLlxuY2xhc3MgUmFuZ2UuTm9ybWFsaXplZFJhbmdlXG5cbiAgIyBQdWJsaWM6IENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYSBOb3JtYWxpemVkUmFuZ2UuXG4gICNcbiAgIyBUaGlzIGlzIHVzdWFsbHkgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSAubm9ybWFsaXplKCkgbWV0aG9kIG9uIG9uZSBvZiB0aGVcbiAgIyBvdGhlciBSYW5nZSBjbGFzc2VzIHJhdGhlciB0aGFuIG1hbnVhbGx5LlxuICAjXG4gICMgb2JqIC0gQW4gT2JqZWN0IGxpdGVyYWwuIFNob3VsZCBoYXZlIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllcy5cbiAgIyAgICAgICBjb21tb25BbmNlc3RvcjogQSBFbGVtZW50IHRoYXQgZW5jb21wYXNzZXMgYm90aCB0aGUgc3RhcnQgYW5kIGVuZCBub2Rlc1xuICAjICAgICAgIHN0YXJ0OiAgICAgICAgICBUaGUgZmlyc3QgVGV4dE5vZGUgaW4gdGhlIHJhbmdlLlxuICAjICAgICAgIGVuZCAgICAgICAgICAgICBUaGUgbGFzdCBUZXh0Tm9kZSBpbiB0aGUgcmFuZ2UuXG4gICNcbiAgIyBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIE5vcm1hbGl6ZWRSYW5nZS5cbiAgY29uc3RydWN0b3I6IChvYmopIC0+XG4gICAgQGNvbW1vbkFuY2VzdG9yID0gb2JqLmNvbW1vbkFuY2VzdG9yXG4gICAgQHN0YXJ0ICAgICAgICAgID0gb2JqLnN0YXJ0XG4gICAgQGVuZCAgICAgICAgICAgID0gb2JqLmVuZFxuXG4gICMgUHVibGljOiBGb3IgQVBJIGNvbnNpc3RlbmN5LlxuICAjXG4gICMgUmV0dXJucyBpdHNlbGYuXG4gIG5vcm1hbGl6ZTogKHJvb3QpIC0+XG4gICAgdGhpc1xuXG4gICMgUHVibGljOiBMaW1pdHMgdGhlIG5vZGVzIHdpdGhpbiB0aGUgTm9ybWFsaXplZFJhbmdlIHRvIHRob3NlIGNvbnRhaW5lZFxuICAjIHdpdGhpbmcgdGhlIGJvdW5kcyBwYXJhbWV0ZXIuIEl0IHJldHVybnMgYW4gdXBkYXRlZCByYW5nZSB3aXRoIGFsbFxuICAjIHByb3BlcnRpZXMgdXBkYXRlZC4gTk9URTogTWV0aG9kIHJldHVybnMgbnVsbCBpZiBhbGwgbm9kZXMgZmFsbCBvdXRzaWRlXG4gICMgb2YgdGhlIGJvdW5kcy5cbiAgI1xuICAjIGJvdW5kcyAtIEFuIEVsZW1lbnQgdG8gbGltaXQgdGhlIHJhbmdlIHRvLlxuICAjXG4gICMgUmV0dXJucyB1cGRhdGVkIHNlbGYgb3IgbnVsbC5cbiAgbGltaXQ6IChib3VuZHMpIC0+XG4gICAgbm9kZXMgPSAkLmdyZXAgdGhpcy50ZXh0Tm9kZXMoKSwgKG5vZGUpIC0+XG4gICAgICBub2RlLnBhcmVudE5vZGUgPT0gYm91bmRzIG9yICQuY29udGFpbnMoYm91bmRzLCBub2RlLnBhcmVudE5vZGUpXG5cbiAgICByZXR1cm4gbnVsbCB1bmxlc3Mgbm9kZXMubGVuZ3RoXG5cbiAgICBAc3RhcnQgPSBub2Rlc1swXVxuICAgIEBlbmQgICA9IG5vZGVzW25vZGVzLmxlbmd0aCAtIDFdXG5cbiAgICBzdGFydFBhcmVudHMgPSAkKEBzdGFydCkucGFyZW50cygpXG4gICAgZm9yIHBhcmVudCBpbiAkKEBlbmQpLnBhcmVudHMoKVxuICAgICAgaWYgc3RhcnRQYXJlbnRzLmluZGV4KHBhcmVudCkgIT0gLTFcbiAgICAgICAgQGNvbW1vbkFuY2VzdG9yID0gcGFyZW50XG4gICAgICAgIGJyZWFrXG4gICAgdGhpc1xuXG4gICMgQ29udmVydCB0aGlzIHJhbmdlIGludG8gYW4gb2JqZWN0IGNvbnNpc3Rpbmcgb2YgdHdvIHBhaXJzIG9mICh4cGF0aCxcbiAgIyBjaGFyYWN0ZXIgb2Zmc2V0KSwgd2hpY2ggY2FuIGJlIGVhc2lseSBzdG9yZWQgaW4gYSBkYXRhYmFzZS5cbiAgI1xuICAjIHJvb3QgLSAgICAgICAgICAgVGhlIHJvb3QgRWxlbWVudCByZWxhdGl2ZSB0byB3aGljaCBYUGF0aHMgc2hvdWxkIGJlIGNhbGN1bGF0ZWRcbiAgIyBpZ25vcmVTZWxlY3RvciAtIEEgc2VsZWN0b3IgU3RyaW5nIG9mIGVsZW1lbnRzIHRvIGlnbm9yZS4gRm9yIGV4YW1wbGVcbiAgIyAgICAgICAgICAgICAgICAgIGVsZW1lbnRzIGluamVjdGVkIGJ5IHRoZSBhbm5vdGF0b3IuXG4gICNcbiAgIyBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIFNlcmlhbGl6ZWRSYW5nZS5cbiAgc2VyaWFsaXplOiAocm9vdCwgaWdub3JlU2VsZWN0b3IpIC0+XG5cbiAgICBzZXJpYWxpemF0aW9uID0gKG5vZGUsIGlzRW5kKSAtPlxuICAgICAgaWYgaWdub3JlU2VsZWN0b3JcbiAgICAgICAgb3JpZ1BhcmVudCA9ICQobm9kZSkucGFyZW50cyhcIjpub3QoI3tpZ25vcmVTZWxlY3Rvcn0pXCIpLmVxKDApXG4gICAgICBlbHNlXG4gICAgICAgIG9yaWdQYXJlbnQgPSAkKG5vZGUpLnBhcmVudCgpXG5cbiAgICAgIHhwYXRoID0gVXRpbC54cGF0aEZyb21Ob2RlKG9yaWdQYXJlbnQsIHJvb3QpWzBdXG4gICAgICB0ZXh0Tm9kZXMgPSBVdGlsLmdldFRleHROb2RlcyhvcmlnUGFyZW50KVxuXG4gICAgICAjIENhbGN1bGF0ZSByZWFsIG9mZnNldCBhcyB0aGUgY29tYmluZWQgbGVuZ3RoIG9mIGFsbCB0aGVcbiAgICAgICMgcHJlY2VkaW5nIHRleHROb2RlIHNpYmxpbmdzLiBXZSBpbmNsdWRlIHRoZSBsZW5ndGggb2YgdGhlXG4gICAgICAjIG5vZGUgaWYgaXQncyB0aGUgZW5kIG5vZGUuXG4gICAgICBub2RlcyA9IHRleHROb2Rlcy5zbGljZSgwLCB0ZXh0Tm9kZXMuaW5kZXgobm9kZSkpXG4gICAgICBvZmZzZXQgPSAwXG4gICAgICBmb3IgbiBpbiBub2Rlc1xuICAgICAgICBvZmZzZXQgKz0gbi5ub2RlVmFsdWUubGVuZ3RoXG5cbiAgICAgIGlmIGlzRW5kIHRoZW4gW3hwYXRoLCBvZmZzZXQgKyBub2RlLm5vZGVWYWx1ZS5sZW5ndGhdIGVsc2UgW3hwYXRoLCBvZmZzZXRdXG5cbiAgICBzdGFydCA9IHNlcmlhbGl6YXRpb24oQHN0YXJ0KVxuICAgIGVuZCAgID0gc2VyaWFsaXphdGlvbihAZW5kLCB0cnVlKVxuXG4gICAgbmV3IFJhbmdlLlNlcmlhbGl6ZWRSYW5nZSh7XG4gICAgICAjIFhQYXRoIHN0cmluZ3NcbiAgICAgIHN0YXJ0OiBzdGFydFswXVxuICAgICAgZW5kOiBlbmRbMF1cbiAgICAgICMgQ2hhcmFjdGVyIG9mZnNldHMgKGludGVnZXIpXG4gICAgICBzdGFydE9mZnNldDogc3RhcnRbMV1cbiAgICAgIGVuZE9mZnNldDogZW5kWzFdXG4gICAgfSlcblxuICAjIFB1YmxpYzogQ3JlYXRlcyBhIGNvbmNhdGVuYXRlZCBTdHJpbmcgb2YgdGhlIGNvbnRlbnRzIG9mIGFsbCB0aGUgdGV4dCBub2Rlc1xuICAjIHdpdGhpbiB0aGUgcmFuZ2UuXG4gICNcbiAgIyBSZXR1cm5zIGEgU3RyaW5nLlxuICB0ZXh0OiAtPlxuICAgIChmb3Igbm9kZSBpbiB0aGlzLnRleHROb2RlcygpXG4gICAgICBub2RlLm5vZGVWYWx1ZVxuICAgICkuam9pbiAnJ1xuXG4gICMgUHVibGljOiBGZXRjaGVzIG9ubHkgdGhlIHRleHQgbm9kZXMgd2l0aGluIHRoIHJhbmdlLlxuICAjXG4gICMgUmV0dXJucyBhbiBBcnJheSBvZiBUZXh0Tm9kZSBpbnN0YW5jZXMuXG4gIHRleHROb2RlczogLT5cbiAgICB0ZXh0Tm9kZXMgPSBVdGlsLmdldFRleHROb2RlcygkKHRoaXMuY29tbW9uQW5jZXN0b3IpKVxuICAgIFtzdGFydCwgZW5kXSA9IFt0ZXh0Tm9kZXMuaW5kZXgodGhpcy5zdGFydCksIHRleHROb2Rlcy5pbmRleCh0aGlzLmVuZCldXG4gICAgIyBSZXR1cm4gdGhlIHRleHROb2RlcyB0aGF0IGZhbGwgYmV0d2VlbiB0aGUgc3RhcnQgYW5kIGVuZCBpbmRleGVzLlxuICAgICQubWFrZUFycmF5IHRleHROb2Rlc1tzdGFydC4uZW5kXVxuXG4gICMgUHVibGljOiBDb252ZXJ0cyB0aGUgTm9ybWFsaXplZCByYW5nZSB0byBhIG5hdGl2ZSBicm93c2VyIHJhbmdlLlxuICAjXG4gICMgU2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9ET00vcmFuZ2VcbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKVxuICAjICAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpXG4gICMgICBzZWxlY3Rpb24uYWRkUmFuZ2Uobm9ybWVkUmFuZ2UudG9SYW5nZSgpKVxuICAjXG4gICMgUmV0dXJucyBhIFJhbmdlIG9iamVjdC5cbiAgdG9SYW5nZTogLT5cbiAgICByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKClcbiAgICByYW5nZS5zZXRTdGFydEJlZm9yZShAc3RhcnQpXG4gICAgcmFuZ2Uuc2V0RW5kQWZ0ZXIoQGVuZClcbiAgICByYW5nZVxuXG4jIFB1YmxpYzogQSByYW5nZSBzdWl0YWJsZSBmb3Igc3RvcmluZyBpbiBsb2NhbCBzdG9yYWdlIG9yIHNlcmlhbGl6aW5nIHRvIEpTT04uXG5jbGFzcyBSYW5nZS5TZXJpYWxpemVkUmFuZ2VcblxuICAjIFB1YmxpYzogQ3JlYXRlcyBhIFNlcmlhbGl6ZWRSYW5nZVxuICAjXG4gICMgb2JqIC0gVGhlIHN0b3JlZCBvYmplY3QuIEl0IHNob3VsZCBoYXZlIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllcy5cbiAgIyAgICAgICBzdGFydDogICAgICAgQW4geHBhdGggdG8gdGhlIEVsZW1lbnQgY29udGFpbmluZyB0aGUgZmlyc3QgVGV4dE5vZGVcbiAgIyAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUgdG8gdGhlIHJvb3QgRWxlbWVudC5cbiAgIyAgICAgICBzdGFydE9mZnNldDogVGhlIG9mZnNldCB0byB0aGUgc3RhcnQgb2YgdGhlIHNlbGVjdGlvbiBmcm9tIG9iai5zdGFydC5cbiAgIyAgICAgICBlbmQ6ICAgICAgICAgQW4geHBhdGggdG8gdGhlIEVsZW1lbnQgY29udGFpbmluZyB0aGUgbGFzdCBUZXh0Tm9kZVxuICAjICAgICAgICAgICAgICAgICAgICByZWxhdGl2ZSB0byB0aGUgcm9vdCBFbGVtZW50LlxuICAjICAgICAgIHN0YXJ0T2Zmc2V0OiBUaGUgb2Zmc2V0IHRvIHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvbiBmcm9tIG9iai5lbmQuXG4gICNcbiAgIyBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIFNlcmlhbGl6ZWRSYW5nZVxuICBjb25zdHJ1Y3RvcjogKG9iaikgLT5cbiAgICBAc3RhcnQgICAgICAgPSBvYmouc3RhcnRcbiAgICBAc3RhcnRPZmZzZXQgPSBvYmouc3RhcnRPZmZzZXRcbiAgICBAZW5kICAgICAgICAgPSBvYmouZW5kXG4gICAgQGVuZE9mZnNldCAgID0gb2JqLmVuZE9mZnNldFxuXG4gICMgUHVibGljOiBDcmVhdGVzIGEgTm9ybWFsaXplZFJhbmdlLlxuICAjXG4gICMgcm9vdCAtIFRoZSByb290IEVsZW1lbnQgZnJvbSB3aGljaCB0aGUgWFBhdGhzIHdlcmUgZ2VuZXJhdGVkLlxuICAjXG4gICMgUmV0dXJucyBhIE5vcm1hbGl6ZWRSYW5nZSBpbnN0YW5jZS5cbiAgbm9ybWFsaXplOiAocm9vdCkgLT5cbiAgICByYW5nZSA9IHt9XG5cbiAgICBmb3IgcCBpbiBbJ3N0YXJ0JywgJ2VuZCddXG4gICAgICB0cnlcbiAgICAgICAgbm9kZSA9IFJhbmdlLm5vZGVGcm9tWFBhdGgodGhpc1twXSwgcm9vdClcbiAgICAgIGNhdGNoIGVcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlLlJhbmdlRXJyb3IocCwgXCJFcnJvciB3aGlsZSBmaW5kaW5nICN7cH0gbm9kZTogI3t0aGlzW3BdfTogXCIgKyBlLCBlKVxuXG4gICAgICBpZiBub3Qgbm9kZVxuICAgICAgICB0aHJvdyBuZXcgUmFuZ2UuUmFuZ2VFcnJvcihwLCBcIkNvdWxkbid0IGZpbmQgI3twfSBub2RlOiAje3RoaXNbcF19XCIpXG5cbiAgICAgICMgVW5mb3J0dW5hdGVseSwgd2UgKmNhbid0KiBndWFyYW50ZWUgb25seSBvbmUgdGV4dE5vZGUgcGVyXG4gICAgICAjIGVsZW1lbnROb2RlLCBzbyB3ZSBoYXZlIHRvIHdhbGsgYWxvbmcgdGhlIGVsZW1lbnQncyB0ZXh0Tm9kZXMgdW50aWxcbiAgICAgICMgdGhlIGNvbWJpbmVkIGxlbmd0aCBvZiB0aGUgdGV4dE5vZGVzIHRvIHRoYXQgcG9pbnQgZXhjZWVkcyBvclxuICAgICAgIyBtYXRjaGVzIHRoZSB2YWx1ZSBvZiB0aGUgb2Zmc2V0LlxuICAgICAgbGVuZ3RoID0gMFxuICAgICAgdGFyZ2V0T2Zmc2V0ID0gdGhpc1twICsgJ09mZnNldCddXG5cbiAgICAgICMgUmFuZ2UgZXhjbHVkZXMgaXRzIGVuZHBvaW50IGJlY2F1c2UgaXQgZGVzY3JpYmVzIHRoZSBib3VuZGFyeSBwb3NpdGlvbi5cbiAgICAgICMgVGFyZ2V0IHRoZSBzdHJpbmcgaW5kZXggb2YgdGhlIGxhc3QgY2hhcmFjdGVyIGluc2lkZSB0aGUgcmFuZ2UuXG4gICAgICBpZiBwIGlzICdlbmQnIHRoZW4gdGFyZ2V0T2Zmc2V0LS1cblxuICAgICAgZm9yIHRuIGluIFV0aWwuZ2V0VGV4dE5vZGVzKCQobm9kZSkpXG4gICAgICAgIGlmIChsZW5ndGggKyB0bi5ub2RlVmFsdWUubGVuZ3RoID4gdGFyZ2V0T2Zmc2V0KVxuICAgICAgICAgIHJhbmdlW3AgKyAnQ29udGFpbmVyJ10gPSB0blxuICAgICAgICAgIHJhbmdlW3AgKyAnT2Zmc2V0J10gPSB0aGlzW3AgKyAnT2Zmc2V0J10gLSBsZW5ndGhcbiAgICAgICAgICBicmVha1xuICAgICAgICBlbHNlXG4gICAgICAgICAgbGVuZ3RoICs9IHRuLm5vZGVWYWx1ZS5sZW5ndGhcblxuICAgICAgIyBJZiB3ZSBmYWxsIG9mZiB0aGUgZW5kIG9mIHRoZSBmb3IgbG9vcCB3aXRob3V0IGhhdmluZyBzZXRcbiAgICAgICMgJ3N0YXJ0T2Zmc2V0Jy8nZW5kT2Zmc2V0JywgdGhlIGVsZW1lbnQgaGFzIHNob3J0ZXIgY29udGVudCB0aGFuIHdoZW5cbiAgICAgICMgd2UgYW5ub3RhdGVkLCBzbyB0aHJvdyBhbiBlcnJvcjpcbiAgICAgIGlmIG5vdCByYW5nZVtwICsgJ09mZnNldCddP1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2UuUmFuZ2VFcnJvcihcIiN7cH1vZmZzZXRcIiwgXCJDb3VsZG4ndCBmaW5kIG9mZnNldCAje3RoaXNbcCArICdPZmZzZXQnXX0gaW4gZWxlbWVudCAje3RoaXNbcF19XCIpXG5cbiAgICAjIEhlcmUncyBhbiBlbGVnYW50IG5leHQgc3RlcC4uLlxuICAgICNcbiAgICAjICAgcmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXIgPSAkKHJhbmdlLnN0YXJ0Q29udGFpbmVyKS5wYXJlbnRzKCkuaGFzKHJhbmdlLmVuZENvbnRhaW5lcilbMF1cbiAgICAjXG4gICAgIyAuLi5idXQgdW5mb3J0dW5hdGVseSBOb2RlLmNvbnRhaW5zKCkgaXMgYnJva2VuIGluIFNhZmFyaSA1LjEuNSAoNzUzNC41NS4zKVxuICAgICMgYW5kIHByZXN1bWFibHkgb3RoZXIgZWFybGllciB2ZXJzaW9ucyBvZiBXZWJLaXQuIEluIHBhcnRpY3VsYXIsIGluIGFcbiAgICAjIGRvY3VtZW50IGxpa2VcbiAgICAjXG4gICAgIyAgIDxwPkhlbGxvPC9wPlxuICAgICNcbiAgICAjIHRoZSBjb2RlXG4gICAgI1xuICAgICMgICBwID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3AnKVswXVxuICAgICMgICBwLmNvbnRhaW5zKHAuZmlyc3RDaGlsZClcbiAgICAjXG4gICAgIyByZXR1cm5zIGBmYWxzZWAuIFlheS5cbiAgICAjXG4gICAgIyBTbyBpbnN0ZWFkLCB3ZSBzdGVwIHRocm91Z2ggdGhlIHBhcmVudHMgZnJvbSB0aGUgYm90dG9tIHVwIGFuZCB1c2VcbiAgICAjIE5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24oKSB0byBkZWNpZGUgd2hlbiB0byBzZXQgdGhlXG4gICAgIyBjb21tb25BbmNlc3RvckNvbnRhaW5lciBhbmQgYmFpbCBvdXQuXG5cbiAgICBjb250YWlucyA9XG4gICAgICBpZiBub3QgZG9jdW1lbnQuY29tcGFyZURvY3VtZW50UG9zaXRpb24/XG4gICAgICAgICMgSUVcbiAgICAgICAgKGEsIGIpIC0+IGEuY29udGFpbnMoYilcbiAgICAgIGVsc2VcbiAgICAgICAgIyBFdmVyeW9uZSBlbHNlXG4gICAgICAgIChhLCBiKSAtPiBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIpICYgMTZcblxuICAgICQocmFuZ2Uuc3RhcnRDb250YWluZXIpLnBhcmVudHMoKS5lYWNoIC0+XG4gICAgICBpZiBjb250YWlucyh0aGlzLCByYW5nZS5lbmRDb250YWluZXIpXG4gICAgICAgIHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyID0gdGhpc1xuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIG5ldyBSYW5nZS5Ccm93c2VyUmFuZ2UocmFuZ2UpLm5vcm1hbGl6ZShyb290KVxuXG4gICMgUHVibGljOiBDcmVhdGVzIGEgcmFuZ2Ugc3VpdGFibGUgZm9yIHN0b3JhZ2UuXG4gICNcbiAgIyByb290ICAgICAgICAgICAtIEEgcm9vdCBFbGVtZW50IGZyb20gd2hpY2ggdG8gYW5jaG9yIHRoZSBzZXJpYWxpc2F0aW9uLlxuICAjIGlnbm9yZVNlbGVjdG9yIC0gQSBzZWxlY3RvciBTdHJpbmcgb2YgZWxlbWVudHMgdG8gaWdub3JlLiBGb3IgZXhhbXBsZVxuICAjICAgICAgICAgICAgICAgICAgZWxlbWVudHMgaW5qZWN0ZWQgYnkgdGhlIGFubm90YXRvci5cbiAgI1xuICAjIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgU2VyaWFsaXplZFJhbmdlLlxuICBzZXJpYWxpemU6IChyb290LCBpZ25vcmVTZWxlY3RvcikgLT5cbiAgICB0aGlzLm5vcm1hbGl6ZShyb290KS5zZXJpYWxpemUocm9vdCwgaWdub3JlU2VsZWN0b3IpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdGhlIHJhbmdlIGFzIGFuIE9iamVjdCBsaXRlcmFsLlxuICB0b09iamVjdDogLT5cbiAgICB7XG4gICAgICBzdGFydDogQHN0YXJ0XG4gICAgICBzdGFydE9mZnNldDogQHN0YXJ0T2Zmc2V0XG4gICAgICBlbmQ6IEBlbmRcbiAgICAgIGVuZE9mZnNldDogQGVuZE9mZnNldFxuICAgIH1cblxuXG4jIEV4cG9ydCBSYW5nZSBvYmplY3QuXG5tb2R1bGUuZXhwb3J0cyA9IFJhbmdlXG4iLCIjIFJlZ2lzdHJ5IGlzIGEgZmFjdG9yeSBmb3IgYW5ub3RhdG9yIGFwcGxpY2F0aW9ucyBwcm92aWRpbmcgYSBzaW1wbGUgcnVudGltZVxuIyBleHRlbnNpb24gaW50ZXJmYWNlIGFuZCBhcHBsaWNhdGlvbiBsb2FkZXIuIEl0IGlzIHVzZWQgdG8gcGFzcyBzZXR0aW5ncyB0b1xuIyBleHRlbnNpb24gbW9kdWxlcyBhbmQgcHJvdmlkZSBhIG1lYW5zIGJ5IHdoaWNoIGV4dGVuc2lvbnMgY2FuIGV4cG9ydFxuIyBmdW5jdGlvbmFsaXR5IHRvIGFwcGxpY2F0aW9ucy5cbmNsYXNzIFJlZ2lzdHJ5XG5cbiAgIyBQdWJsaWM6IENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgYXBwbGljYXRpb24gZGVmaW5lZCBieSB0aGUgcHJvdmlkZWRcbiAgIyBtb2R1bGUuIFRoZSBhcHBsaWNhdGlvbiB3aWxsIHJlY2VpdmUgYSBuZXcgcmVnaXN0cnkgaW5zdGFuY2Ugd2hvc2Ugc2V0dGluZ3NcbiAgIyBtYXkgYmUgcHJvdmlkZWQgYXMgYSBzZWNvbmQgYXJndW1lbnQgdG8gdGhpcyBtZXRob2QuIFRoZSByZWdpc3RyeSB3aWxsXG4gICMgaW1tZWRpYXRlbHkgaW52b2tlIHRoZSBydW4gY2FsbGJhY2sgb2YgdGhlIG1vZHVsZS5cbiAgQGNyZWF0ZUFwcDogKGFwcE1vZHVsZSwgc2V0dGluZ3M9e30pIC0+XG4gICAgKG5ldyB0aGlzKHNldHRpbmdzKSkucnVuKGFwcE1vZHVsZSlcblxuICBjb25zdHJ1Y3RvcjogKEBzZXR0aW5ncz17fSkgLT5cblxuICAjIFB1YmxpYzogSW5jbHVkZSBhIG1vZHVsZS4gQSBtb2R1bGUgaXMgYW55IE9iamVjdCB3aXRoIGEgZnVjdGlvbiBwcm9wZXJ0eVxuICAjIG5hbWVkICdjb25maWd1cmVgLiBUaGlzIGZ1bmN0aW9uIGlzIGltbWVkaWF0ZWx5IGludm9rZWQgd2l0aCB0aGUgcmVnaXN0cnlcbiAgIyBpbnN0YW5jZSBhcyB0aGUgb25seSBhcmd1bWVudC5cbiAgaW5jbHVkZTogKG1vZHVsZSkgLT5cbiAgICBtb2R1bGUuY29uZmlndXJlKHRoaXMpXG4gICAgdGhpc1xuXG4gICMgUHVibGljOiBSdW4gYW4gYXBwbGljYXRpb24uIEFuIGFwcGxpY2F0aW9uIGlzIGEgbW9kdWxlIHdpdGggYSBmdW5jdGlvblxuICAjIHByb3BlcnR5IG5hbWVkICdydW4nLiBUaGUgYXBwbGljYXRpb24gaXMgaW1tZWRpYXRlbHkgaW5jbHVkZWQgYW5kIGl0cyBydW5cbiAgIyBjYWxsYmFjayBpbnZva2VkIHdpdGggdGhlIHJlZ2lzdHJ5IGluc3RhbmNlIGFzIHRoZSBvbmx5IGFyZ3VtZW50LlxuICBydW46IChhcHApIC0+XG4gICAgaWYgdGhpcy5hcHBcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlZ2lzdHJ5IGlzIGFscmVhZHkgYm91bmQgdG8gYSBydW5uaW5nIGFwcGxpY2F0aW9uXCIpXG5cbiAgICB0aGlzLmluY2x1ZGUoYXBwKVxuXG4gICAgZm9yIG93biBrLCB2IG9mIHRoaXNcbiAgICAgIGFwcFtrXSA9IHZcblxuICAgIHRoaXMuYXBwID0gYXBwXG4gICAgYXBwLnJ1bih0aGlzKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZ2lzdHJ5XG4iLCIjIFB1YmxpYzogQWRkcyBwZXJzaXN0ZW5jZSBob29rcyBmb3IgYW5ub3RhdGlvbnMuXG5jbGFzcyBTdG9yYWdlUHJvdmlkZXJcblxuICBAY29uZmlndXJlOiAocmVnaXN0cnkpIC0+XG4gICAga2xhc3MgPSByZWdpc3RyeS5zZXR0aW5ncy5zdG9yZT8udHlwZVxuXG4gICAgaWYgdHlwZW9mKGtsYXNzKSBpcyAnZnVuY3Rpb24nXG4gICAgICBzdG9yZSA9IG5ldyBrbGFzcyhyZWdpc3RyeS5zZXR0aW5ncy5zdG9yZSlcbiAgICBlbHNlXG4gICAgICBzdG9yZSA9IG5ldyB0aGlzKHJlZ2lzdHJ5KVxuXG4gICAgcmVnaXN0cnlbJ3N0b3JlJ10gPz0gc3RvcmVcblxuICBjb25zdHJ1Y3RvcjogKEByZWdpc3RyeSkgLT5cblxuICAjIFB1YmxpYzogZ2V0IGFuIHVuaXF1ZSBpZGVudGlmaWVyXG4gIGlkOiAoLT4gY291bnRlciA9IDA7IC0+IGNvdW50ZXIrKykoKVxuXG4gICMgUHVibGljOiBjcmVhdGUgYW4gYW5ub3RhdGlvblxuICAjXG4gICMgYW5ub3RhdGlvbiAtIEFuIGFubm90YXRpb24gT2JqZWN0IHRvIGNyZWF0ZS5cbiAgI1xuICAjIFJldHVybnMgYSBwcm9taXNlIG9mIHRoZSBuZXcgYW5ub3RhdGlvbiBPYmplY3QuXG4gIGNyZWF0ZTogKGFubm90YXRpb24pIC0+XG4gICAgZGZkID0gJC5EZWZlcnJlZCgpXG4gICAgaWYgbm90IGFubm90YXRpb24uaWQ/XG4gICAgICBhbm5vdGF0aW9uLmlkID0gdGhpcy5pZCgpXG4gICAgZGZkLnJlc29sdmUoYW5ub3RhdGlvbilcbiAgICByZXR1cm4gZGZkLnByb21pc2UoKVxuXG4gICMgUHVibGljOiB1cGRhdGUgYW4gYW5ub3RhdGlvblxuICAjXG4gICMgYW5ub3RhdGlvbiAtIEFuIGFubm90YXRpb24gT2JqZWN0IHRvIGJlIHVwZGF0ZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEgcHJvbWlzZSBvZiB0aGUgdXBkYXRlZCBhbm5vdGF0aW9uIE9iamVjdC5cbiAgdXBkYXRlOiAoYW5ub3RhdGlvbikgLT5cbiAgICBkZmQgPSAkLkRlZmVycmVkKClcbiAgICBkZmQucmVzb2x2ZShhbm5vdGF0aW9uKVxuICAgIHJldHVybiBkZmQucHJvbWlzZSgpXG5cbiAgIyBQdWJsaWM6IGRlbGV0ZSBhbiBhbm5vdGF0aW9uXG4gICNcbiAgIyBhbm5vdGF0aW9uIC0gQW4gYW5ub3RhdGlvbiBPYmplY3QgdG8gYmUgZGVsZXRlZC5cbiAgI1xuICAjIFJldHVybnMgYSBwcm9taXNlIG9mIHRoZSByZXN1bHQgb2YgdGhlIGRlbGV0ZSBvcGVyYXRpb24uXG4gIGRlbGV0ZTogKGFubm90YXRpb24pIC0+XG4gICAgZGZkID0gJC5EZWZlcnJlZCgpXG4gICAgZGZkLnJlc29sdmUoYW5ub3RhdGlvbilcbiAgICByZXR1cm4gZGZkLnByb21pc2UoKVxuXG4gICMgUHVibGljOiBxdWVyeSB0aGUgc3RvcmUgZm9yIGFubm90YXRpb25zXG4gICNcbiAgIyBSZXR1cm5zIGEgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIHF1ZXJ5IHJlc3VsdHMgYW5kIHF1ZXJ5IG1ldGFkYXRhLlxuICBxdWVyeTogKHF1ZXJ5T2JqKSAtPlxuICAgIGRmZCA9ICQuRGVmZXJyZWQoKVxuICAgIGRmZC5yZXNvbHZlKFtdLCB7fSlcbiAgICByZXR1cm4gZGZkLnByb21pc2UoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0b3JhZ2VQcm92aWRlclxuIiwieHBhdGggPSByZXF1aXJlICcuL3hwYXRoJ1xuXG5cbiMgSTE4TlxuZ2V0dGV4dCA9IG51bGxcblxuaWYgR2V0dGV4dD9cbiAgX2dldHRleHQgPSBuZXcgR2V0dGV4dChkb21haW46IFwiYW5ub3RhdG9yXCIpXG4gIGdldHRleHQgPSAobXNnaWQpIC0+IF9nZXR0ZXh0LmdldHRleHQobXNnaWQpXG5lbHNlXG4gIGdldHRleHQgPSAobXNnaWQpIC0+IG1zZ2lkXG5cbl90ID0gKG1zZ2lkKSAtPiBnZXR0ZXh0KG1zZ2lkKVxuXG51bmxlc3MgalF1ZXJ5Py5mbj8uanF1ZXJ5XG4gIGNvbnNvbGUuZXJyb3IoX3QoXCJBbm5vdGF0b3IgcmVxdWlyZXMgalF1ZXJ5OiBoYXZlIHlvdSBpbmNsdWRlZCBsaWIvdmVuZG9yL2pxdWVyeS5qcz9cIikpXG5cbnVubGVzcyBKU09OIGFuZCBKU09OLnBhcnNlIGFuZCBKU09OLnN0cmluZ2lmeVxuICBjb25zb2xlLmVycm9yKF90KFwiQW5ub3RhdG9yIHJlcXVpcmVzIGEgSlNPTiBpbXBsZW1lbnRhdGlvbjogaGF2ZSB5b3UgaW5jbHVkZWQgbGliL3ZlbmRvci9qc29uMi5qcz9cIikpXG5cblV0aWwgPSB7fVxuXG4jIFB1YmxpYzogQ3JlYXRlIGEgR2V0dGV4dCB0cmFuc2xhdGVkIHN0cmluZyBmcm9tIGEgbWVzc2FnZSBpZFxuI1xuIyBSZXR1cm5zIGEgU3RyaW5nXG5VdGlsLlRyYW5zbGF0aW9uU3RyaW5nID0gX3RcblxuXG4jIFB1YmxpYzogRmxhdHRlbiBhIG5lc3RlZCBhcnJheSBzdHJ1Y3R1cmVcbiNcbiMgUmV0dXJucyBhbiBhcnJheVxuVXRpbC5mbGF0dGVuID0gKGFycmF5KSAtPlxuICBmbGF0dGVuID0gKGFyeSkgLT5cbiAgICBmbGF0ID0gW11cblxuICAgIGZvciBlbCBpbiBhcnlcbiAgICAgIGZsYXQgPSBmbGF0LmNvbmNhdChpZiBlbCBhbmQgJC5pc0FycmF5KGVsKSB0aGVuIGZsYXR0ZW4oZWwpIGVsc2UgZWwpXG5cbiAgICByZXR1cm4gZmxhdFxuXG4gIGZsYXR0ZW4oYXJyYXkpXG5cbiMgUHVibGljOiBkZWNpZGVzIHdoZXRoZXIgbm9kZSBBIGlzIGFuIGFuY2VzdG9yIG9mIG5vZGUgQi5cbiNcbiMgVGhpcyBmdW5jdGlvbiBwdXJwb3NlZnVsbHkgaWdub3JlcyB0aGUgbmF0aXZlIGJyb3dzZXIgZnVuY3Rpb24gZm9yIHRoaXMsXG4jIGJlY2F1c2UgaXQgYWN0cyB3ZWlyZCBpbiBQaGFudG9tSlMuXG4jIElzc3VlOiBodHRwczovL2dpdGh1Yi5jb20vYXJpeWEvcGhhbnRvbWpzL2lzc3Vlcy8xMTQ3OVxuVXRpbC5jb250YWlucyA9IChwYXJlbnQsIGNoaWxkKSAtPlxuICBub2RlID0gY2hpbGRcbiAgd2hpbGUgbm9kZT9cbiAgICBpZiBub2RlIGlzIHBhcmVudCB0aGVuIHJldHVybiB0cnVlXG4gICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuICByZXR1cm4gZmFsc2VcblxuIyBQdWJsaWM6IEZpbmRzIGFsbCB0ZXh0IG5vZGVzIHdpdGhpbiB0aGUgZWxlbWVudHMgaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi5cbiNcbiMgUmV0dXJucyBhIG5ldyBqUXVlcnkgY29sbGVjdGlvbiBvZiB0ZXh0IG5vZGVzLlxuVXRpbC5nZXRUZXh0Tm9kZXMgPSAoanEpIC0+XG4gIGdldFRleHROb2RlcyA9IChub2RlKSAtPlxuICAgIGlmIG5vZGUgYW5kIG5vZGUubm9kZVR5cGUgIT0gTm9kZS5URVhUX05PREVcbiAgICAgIG5vZGVzID0gW11cblxuICAgICAgIyBJZiBub3QgYSBjb21tZW50IHRoZW4gdHJhdmVyc2UgY2hpbGRyZW4gY29sbGVjdGluZyB0ZXh0IG5vZGVzLlxuICAgICAgIyBXZSB0cmF2ZXJzZSB0aGUgY2hpbGQgbm9kZXMgbWFudWFsbHkgcmF0aGVyIHRoYW4gdXNpbmcgdGhlIC5jaGlsZE5vZGVzXG4gICAgICAjIHByb3BlcnR5IGJlY2F1c2UgSUU5IGRvZXMgbm90IHVwZGF0ZSB0aGUgLmNoaWxkTm9kZXMgcHJvcGVydHkgYWZ0ZXJcbiAgICAgICMgLnNwbGl0VGV4dCgpIGlzIGNhbGxlZCBvbiBhIGNoaWxkIHRleHQgbm9kZS5cbiAgICAgIGlmIG5vZGUubm9kZVR5cGUgIT0gTm9kZS5DT01NRU5UX05PREVcbiAgICAgICAgIyBTdGFydCBhdCB0aGUgbGFzdCBjaGlsZCBhbmQgd2FsayBiYWNrd2FyZHMgdGhyb3VnaCBzaWJsaW5ncy5cbiAgICAgICAgbm9kZSA9IG5vZGUubGFzdENoaWxkXG4gICAgICAgIHdoaWxlIG5vZGVcbiAgICAgICAgICBub2Rlcy5wdXNoIGdldFRleHROb2Rlcyhub2RlKVxuICAgICAgICAgIG5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZ1xuXG4gICAgICAjIEZpbmFsbHkgcmV2ZXJzZSB0aGUgYXJyYXkgc28gdGhhdCBub2RlcyBhcmUgaW4gdGhlIGNvcnJlY3Qgb3JkZXIuXG4gICAgICByZXR1cm4gbm9kZXMucmV2ZXJzZSgpXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIG5vZGVcblxuICBqcS5tYXAgLT4gVXRpbC5mbGF0dGVuKGdldFRleHROb2Rlcyh0aGlzKSlcblxuIyBQdWJsaWM6IGRldGVybWluZSB0aGUgbGFzdCB0ZXh0IG5vZGUgaW5zaWRlIG9yIGJlZm9yZSB0aGUgZ2l2ZW4gbm9kZVxuVXRpbC5nZXRMYXN0VGV4dE5vZGVVcFRvID0gKG4pIC0+XG4gIHN3aXRjaCBuLm5vZGVUeXBlXG4gICAgd2hlbiBOb2RlLlRFWFRfTk9ERVxuICAgICAgcmV0dXJuIG4gIyBXZSBoYXZlIGZvdW5kIG91ciB0ZXh0IG5vZGUuXG4gICAgd2hlbiBOb2RlLkVMRU1FTlRfTk9ERVxuICAgICAgIyBUaGlzIGlzIGFuIGVsZW1lbnQsIHdlIG5lZWQgdG8gZGlnIGluXG4gICAgICBpZiBuLmxhc3RDaGlsZD8gIyBEb2VzIGl0IGhhdmUgY2hpbGRyZW4gYXQgYWxsP1xuICAgICAgICByZXN1bHQgPSBVdGlsLmdldExhc3RUZXh0Tm9kZVVwVG8gbi5sYXN0Q2hpbGRcbiAgICAgICAgaWYgcmVzdWx0PyB0aGVuIHJldHVybiByZXN1bHQgICAgICAgIFxuICAgIGVsc2VcbiAgICAgICMgTm90IGEgdGV4dCBub2RlLCBhbmQgbm90IGFuIGVsZW1lbnQgbm9kZS5cbiAgIyBDb3VsZCBub3QgZmluZCBhIHRleHQgbm9kZSBpbiBjdXJyZW50IG5vZGUsIGdvIGJhY2t3YXJkc1xuICBuID0gbi5wcmV2aW91c1NpYmxpbmdcbiAgaWYgbj9cbiAgICBVdGlsLmdldExhc3RUZXh0Tm9kZVVwVG8gblxuICBlbHNlXG4gICAgbnVsbFxuXG4jIFB1YmxpYzogZGV0ZXJtaW5lIHRoZSBmaXJzdCB0ZXh0IG5vZGUgaW4gb3IgYWZ0ZXIgdGhlIGdpdmVuIGpRdWVyeSBub2RlLlxuVXRpbC5nZXRGaXJzdFRleHROb2RlTm90QmVmb3JlID0gKG4pIC0+XG4gIHN3aXRjaCBuLm5vZGVUeXBlXG4gICAgd2hlbiBOb2RlLlRFWFRfTk9ERVxuICAgICAgcmV0dXJuIG4gIyBXZSBoYXZlIGZvdW5kIG91ciB0ZXh0IG5vZGUuXG4gICAgd2hlbiBOb2RlLkVMRU1FTlRfTk9ERVxuICAgICAgIyBUaGlzIGlzIGFuIGVsZW1lbnQsIHdlIG5lZWQgdG8gZGlnIGluXG4gICAgICBpZiBuLmZpcnN0Q2hpbGQ/ICMgRG9lcyBpdCBoYXZlIGNoaWxkcmVuIGF0IGFsbD9cbiAgICAgICAgcmVzdWx0ID0gVXRpbC5nZXRGaXJzdFRleHROb2RlTm90QmVmb3JlIG4uZmlyc3RDaGlsZFxuICAgICAgICBpZiByZXN1bHQ/IHRoZW4gcmV0dXJuIHJlc3VsdFxuICAgIGVsc2VcbiAgICAgICMgTm90IGEgdGV4dCBvciBhbiBlbGVtZW50IG5vZGUuXG4gICMgQ291bGQgbm90IGZpbmQgYSB0ZXh0IG5vZGUgaW4gY3VycmVudCBub2RlLCBnbyBmb3J3YXJkXG4gIG4gPSBuLm5leHRTaWJsaW5nXG4gIGlmIG4/XG4gICAgVXRpbC5nZXRGaXJzdFRleHROb2RlTm90QmVmb3JlIG5cbiAgZWxzZVxuICAgIG51bGxcblxuIyBQdWJsaWM6IHJlYWQgb3V0IHRoZSB0ZXh0IHZhbHVlIG9mIGEgcmFuZ2UgdXNpbmcgdGhlIHNlbGVjdGlvbiBBUElcbiNcbiMgVGhpcyBtZXRob2Qgc2VsZWN0cyB0aGUgc3BlY2lmaWVkIHJhbmdlLCBhbmQgYXNrcyBmb3IgdGhlIHN0cmluZ1xuIyB2YWx1ZSBvZiB0aGUgc2VsZWN0aW9uLiBXaGF0IHRoaXMgcmV0dXJucyBpcyB2ZXJ5IGNsb3NlIHRvIHdoYXQgdGhlIHVzZXJcbiMgYWN0dWFsbHkgc2Vlcy5cblV0aWwucmVhZFJhbmdlVmlhU2VsZWN0aW9uID0gKHJhbmdlKSAtPlxuICBzZWwgPSBVdGlsLmdldEdsb2JhbCgpLmdldFNlbGVjdGlvbigpICMgR2V0IHRoZSBicm93c2VyIHNlbGVjdGlvbiBvYmplY3RcbiAgc2VsLnJlbW92ZUFsbFJhbmdlcygpICAgICAgICAgICAgICAgICAjIGNsZWFyIHRoZSBzZWxlY3Rpb25cbiAgc2VsLmFkZFJhbmdlIHJhbmdlLnRvUmFuZ2UoKSAgICAgICAgICAjIFNlbGVjdCB0aGUgcmFuZ2VcbiAgc2VsLnRvU3RyaW5nKCkgICAgICAgICAgICAgICAgICAgICAgICAjIFJlYWQgb3V0IHRoZSBzZWxlY3Rpb25cblxuVXRpbC54cGF0aEZyb21Ob2RlID0gKGVsLCByZWxhdGl2ZVJvb3QpIC0+XG4gIHRyeVxuICAgIHJlc3VsdCA9IHhwYXRoLnNpbXBsZVhQYXRoSlF1ZXJ5LmNhbGwgZWwsIHJlbGF0aXZlUm9vdFxuICBjYXRjaCBleGNlcHRpb25cbiAgICBjb25zb2xlLmxvZyBcImpRdWVyeS1iYXNlZCBYUGF0aCBjb25zdHJ1Y3Rpb24gZmFpbGVkISBGYWxsaW5nIGJhY2sgdG8gbWFudWFsLlwiXG4gICAgcmVzdWx0ID0geHBhdGguc2ltcGxlWFBhdGhQdXJlLmNhbGwgZWwsIHJlbGF0aXZlUm9vdFxuICByZXN1bHRcblxuVXRpbC5ub2RlRnJvbVhQYXRoID0gKHhwLCByb290KSAtPlxuICBzdGVwcyA9IHhwLnN1YnN0cmluZygxKS5zcGxpdChcIi9cIilcbiAgbm9kZSA9IHJvb3RcbiAgZm9yIHN0ZXAgaW4gc3RlcHNcbiAgICBbbmFtZSwgaWR4XSA9IHN0ZXAuc3BsaXQgXCJbXCJcbiAgICBpZHggPSBpZiBpZHg/IHRoZW4gcGFyc2VJbnQgKGlkeD8uc3BsaXQgXCJdXCIpWzBdIGVsc2UgMVxuICAgIG5vZGUgPSB4cGF0aC5maW5kQ2hpbGQgbm9kZSwgbmFtZS50b0xvd2VyQ2FzZSgpLCBpZHhcblxuICBub2RlXG5cblV0aWwuZXNjYXBlID0gKGh0bWwpIC0+XG4gIGh0bWxcbiAgICAucmVwbGFjZSgvJig/IVxcdys7KS9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuXG5VdGlsLnV1aWQgPSAoLT4gY291bnRlciA9IDA7IC0+IGNvdW50ZXIrKykoKVxuXG5VdGlsLmdldEdsb2JhbCA9IC0+ICgtPiB0aGlzKSgpXG5cbiMgUmV0dXJuIHRoZSBtYXhpbXVtIHotaW5kZXggb2YgYW55IGVsZW1lbnQgaW4gJGVsZW1lbnRzIChhIGpRdWVyeSBjb2xsZWN0aW9uKS5cblV0aWwubWF4WkluZGV4ID0gKCRlbGVtZW50cykgLT5cbiAgYWxsID0gZm9yIGVsIGluICRlbGVtZW50c1xuICAgICAgICAgIGlmICQoZWwpLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJ1xuICAgICAgICAgICAgLTFcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXJzZUludCgkKGVsKS5jc3MoJ3otaW5kZXgnKSwgMTApIG9yIC0xXG4gIE1hdGgubWF4LmFwcGx5KE1hdGgsIGFsbClcblxuVXRpbC5tb3VzZVBvc2l0aW9uID0gKGUsIG9mZnNldEVsKSAtPlxuICAjIElmIHRoZSBvZmZzZXQgZWxlbWVudCBpcyBub3QgYSBwb3NpdGlvbmluZyByb290IHVzZSBpdHMgb2Zmc2V0IHBhcmVudFxuICB1bmxlc3MgJChvZmZzZXRFbCkuY3NzKCdwb3NpdGlvbicpIGluIFsnYWJzb2x1dGUnLCAnZml4ZWQnLCAncmVsYXRpdmUnXVxuICAgIG9mZnNldEVsID0gJChvZmZzZXRFbCkub2Zmc2V0UGFyZW50KClbMF1cbiAgb2Zmc2V0ID0gJChvZmZzZXRFbCkub2Zmc2V0KClcbiAge1xuICAgIHRvcDogIGUucGFnZVkgLSBvZmZzZXQudG9wLFxuICAgIGxlZnQ6IGUucGFnZVggLSBvZmZzZXQubGVmdFxuICB9XG5cbiMgQ2hlY2tzIHRvIHNlZSBpZiBhbiBldmVudCBwYXJhbWV0ZXIgaXMgcHJvdmlkZWQgYW5kIGNvbnRhaW5zIHRoZSBwcmV2ZW50XG4jIGRlZmF1bHQgbWV0aG9kLiBJZiBpdCBkb2VzIGl0IGNhbGxzIGl0LlxuI1xuIyBUaGlzIGlzIHVzZWZ1bCBmb3IgbWV0aG9kcyB0aGF0IGNhbiBiZSBvcHRpb25hbGx5IHVzZWQgYXMgY2FsbGJhY2tzXG4jIHdoZXJlIHRoZSBleGlzdGFuY2Ugb2YgdGhlIHBhcmFtZXRlciBtdXN0IGJlIGNoZWNrZWQgYmVmb3JlIGNhbGxpbmcuXG5VdGlsLnByZXZlbnRFdmVudERlZmF1bHQgPSAoZXZlbnQpIC0+XG4gIGV2ZW50Py5wcmV2ZW50RGVmYXVsdD8oKVxuXG5cbiMgRXhwb3J0IFV0aWwgb2JqZWN0XG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxcbiIsIlV0aWwgPSByZXF1aXJlICcuL3V0aWwnXG5XaWRnZXQgPSByZXF1aXJlICcuL3dpZGdldCdcblxuXG5fdCA9IFV0aWwuVHJhbnNsYXRpb25TdHJpbmdcblxuXG4jIFB1YmxpYzogQ3JlYXRlcyBhbiBlbGVtZW50IGZvciB2aWV3aW5nIGFubm90YXRpb25zLlxuY2xhc3MgVmlld2VyIGV4dGVuZHMgV2lkZ2V0XG5cbiAgIyBFdmVudHMgdG8gYmUgYm91bmQgdG8gdGhlIEBlbGVtZW50LlxuICBldmVudHM6XG4gICAgXCIuYW5ub3RhdG9yLWVkaXQgY2xpY2tcIjogICBcIm9uRWRpdENsaWNrXCJcbiAgICBcIi5hbm5vdGF0b3ItZGVsZXRlIGNsaWNrXCI6IFwib25EZWxldGVDbGlja1wiXG5cbiAgIyBDbGFzc2VzIGZvciB0b2dnbGluZyBhbm5vdGF0b3Igc3RhdGUuXG4gIGNsYXNzZXM6XG4gICAgaGlkZTogJ2Fubm90YXRvci1oaWRlJ1xuICAgIHNob3dDb250cm9sczogJ2Fubm90YXRvci12aXNpYmxlJ1xuXG4gICMgSFRNTCB0ZW1wbGF0ZXMgZm9yIEBlbGVtZW50IGFuZCBAaXRlbSBwcm9wZXJ0aWVzLlxuICBodG1sOlxuICAgIGVsZW1lbnQ6XCJcIlwiXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYW5ub3RhdG9yLW91dGVyIGFubm90YXRvci12aWV3ZXJcIj5cbiAgICAgICAgICAgICAgPHVsIGNsYXNzPVwiYW5ub3RhdG9yLXdpZGdldCBhbm5vdGF0b3ItbGlzdGluZ1wiPjwvdWw+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgIGl0ZW06ICAgXCJcIlwiXG4gICAgICAgICAgICA8bGkgY2xhc3M9XCJhbm5vdGF0b3ItYW5ub3RhdGlvbiBhbm5vdGF0b3ItaXRlbVwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImFubm90YXRvci1jb250cm9sc1wiPlxuICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgdGl0bGU9XCJWaWV3IGFzIHdlYnBhZ2VcIiBjbGFzcz1cImFubm90YXRvci1saW5rXCI+VmlldyBhcyB3ZWJwYWdlPC9hPlxuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHRpdGxlPVwiRWRpdFwiIGNsYXNzPVwiYW5ub3RhdG9yLWVkaXRcIj5FZGl0PC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgdGl0bGU9XCJEZWxldGVcIiBjbGFzcz1cImFubm90YXRvci1kZWxldGVcIj5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICMgQ29uZmlndXJhdGlvbiBvcHRpb25zXG4gIG9wdGlvbnM6XG4gICAgcmVhZE9ubHk6IGZhbHNlICMgU3RhcnQgdGhlIHZpZXdlciBpbiByZWFkLW9ubHkgbW9kZS4gTm8gY29udHJvbHMgd2lsbCBiZSBzaG93bi5cblxuICAjIFB1YmxpYzogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGUgVmlld2VyIG9iamVjdC4gVGhpcyB3aWxsIGNyZWF0ZSB0aGVcbiAgIyBAZWxlbWVudCBmcm9tIHRoZSBAaHRtbC5lbGVtZW50IHN0cmluZyBhbmQgc2V0IHVwIGFsbCBldmVudHMuXG4gICNcbiAgIyBvcHRpb25zIC0gQW4gT2JqZWN0IGxpdGVyYWwgY29udGFpbmluZyBvcHRpb25zLlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgIyBDcmVhdGVzIGEgbmV3IHZpZXdlciwgYWRkcyBhIGN1c3RvbSBmaWVsZCBhbmQgZGlzcGxheXMgYW4gYW5ub3RhdGlvbi5cbiAgIyAgIHZpZXdlciA9IG5ldyBBbm5vdGF0b3IuVmlld2VyKClcbiAgIyAgIHZpZXdlci5hZGRGaWVsZCh7XG4gICMgICAgIGxvYWQ6IHNvbWVMb2FkQ2FsbGJhY2tcbiAgIyAgIH0pXG4gICMgICB2aWV3ZXIubG9hZChhbm5vdGF0aW9uKVxuICAjXG4gICMgUmV0dXJucyBhIG5ldyBWaWV3ZXIgaW5zdGFuY2UuXG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucykgLT5cbiAgICBzdXBlciAkKEBodG1sLmVsZW1lbnQpWzBdLCBvcHRpb25zXG5cbiAgICBAaXRlbSAgID0gJChAaHRtbC5pdGVtKVswXVxuICAgIEBmaWVsZHMgPSBbXVxuICAgIEBhbm5vdGF0aW9ucyA9IFtdXG5cbiAgIyBQdWJsaWM6IERpc3BsYXlzIHRoZSBWaWV3ZXIgYW5kIGZpcnN0IHRoZSBcInNob3dcIiBldmVudC4gQ2FuIGJlIHVzZWQgYXMgYW5cbiAgIyBldmVudCBjYWxsYmFjayBhbmQgd2lsbCBjYWxsIEV2ZW50I3ByZXZlbnREZWZhdWx0KCkgb24gdGhlIHN1cHBsaWVkIGV2ZW50LlxuICAjXG4gICMgZXZlbnQgLSBFdmVudCBvYmplY3QgcHJvdmlkZWQgaWYgbWV0aG9kIGlzIGNhbGxlZCBieSBldmVudFxuICAjICAgICAgICAgbGlzdGVuZXIgKGRlZmF1bHQ6dW5kZWZpbmVkKVxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgIyBEaXNwbGF5cyB0aGUgZWRpdG9yLlxuICAjICAgdmlld2VyLnNob3coKVxuICAjXG4gICMgICAjIERpc3BsYXlzIHRoZSB2aWV3ZXIgb24gY2xpY2sgKHByZXZlbnRzIGRlZmF1bHQgYWN0aW9uKS5cbiAgIyAgICQoJ2Euc2hvdy12aWV3ZXInKS5iaW5kKCdjbGljaycsIHZpZXdlci5zaG93KVxuICAjXG4gICMgUmV0dXJucyBpdHNlbGYuXG4gIHNob3c6IChldmVudCkgPT5cbiAgICBVdGlsLnByZXZlbnRFdmVudERlZmF1bHQgZXZlbnRcblxuICAgIGNvbnRyb2xzID0gQGVsZW1lbnRcbiAgICAgIC5maW5kKCcuYW5ub3RhdG9yLWNvbnRyb2xzJylcbiAgICAgIC5hZGRDbGFzcyhAY2xhc3Nlcy5zaG93Q29udHJvbHMpXG4gICAgc2V0VGltZW91dCgoPT4gY29udHJvbHMucmVtb3ZlQ2xhc3MoQGNsYXNzZXMuc2hvd0NvbnRyb2xzKSksIDUwMClcblxuICAgIEBlbGVtZW50LnJlbW92ZUNsYXNzKEBjbGFzc2VzLmhpZGUpXG4gICAgdGhpcy5jaGVja09yaWVudGF0aW9uKCkucHVibGlzaCgnc2hvdycpXG5cbiAgIyBQdWJsaWM6IENoZWNrcyB0byBzZWUgaWYgdGhlIFZpZXdlciBpcyBjdXJyZW50bHkgZGlzcGxheWVkLlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgdmlld2VyLnNob3coKVxuICAjICAgdmlld2VyLmlzU2hvd24oKSAjID0+IFJldHVybnMgdHJ1ZVxuICAjXG4gICMgICB2aWV3ZXIuaGlkZSgpXG4gICMgICB2aWV3ZXIuaXNTaG93bigpICMgPT4gUmV0dXJucyBmYWxzZVxuICAjXG4gICMgUmV0dXJucyB0cnVlIGlmIHRoZSBWaWV3ZXIgaXMgdmlzaWJsZS5cbiAgaXNTaG93bjogLT5cbiAgICBub3QgQGVsZW1lbnQuaGFzQ2xhc3MoQGNsYXNzZXMuaGlkZSlcblxuICAjIFB1YmxpYzogSGlkZXMgdGhlIEVkaXRvciBhbmQgZmlyZXMgdGhlIFwiaGlkZVwiIGV2ZW50LiBDYW4gYmUgdXNlZCBhcyBhbiBldmVudFxuICAjIGNhbGxiYWNrIGFuZCB3aWxsIGNhbGwgRXZlbnQjcHJldmVudERlZmF1bHQoKSBvbiB0aGUgc3VwcGxpZWQgZXZlbnQuXG4gICNcbiAgIyBldmVudCAtIEV2ZW50IG9iamVjdCBwcm92aWRlZCBpZiBtZXRob2QgaXMgY2FsbGVkIGJ5IGV2ZW50XG4gICMgICAgICAgICBsaXN0ZW5lciAoZGVmYXVsdDp1bmRlZmluZWQpXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICAjIEhpZGVzIHRoZSBlZGl0b3IuXG4gICMgICB2aWV3ZXIuaGlkZSgpXG4gICNcbiAgIyAgICMgSGlkZSB0aGUgdmlld2VyIG9uIGNsaWNrIChwcmV2ZW50cyBkZWZhdWx0IGFjdGlvbikuXG4gICMgICAkKCdhLmhpZGUtdmlld2VyJykuYmluZCgnY2xpY2snLCB2aWV3ZXIuaGlkZSlcbiAgI1xuICAjIFJldHVybnMgaXRzZWxmLlxuICBoaWRlOiAoZXZlbnQpID0+XG4gICAgVXRpbC5wcmV2ZW50RXZlbnREZWZhdWx0IGV2ZW50XG5cbiAgICBAZWxlbWVudC5hZGRDbGFzcyhAY2xhc3Nlcy5oaWRlKVxuICAgIHRoaXMucHVibGlzaCgnaGlkZScpXG5cbiAgIyBQdWJsaWM6IExvYWRzIGFubm90YXRpb25zIGludG8gdGhlIHZpZXdlciBhbmQgc2hvd3MgaXQuIEZpcmVzIHRoZSBcImxvYWRcIlxuICAjIGV2ZW50IG9uY2UgdGhlIHZpZXdlciBpcyBsb2FkZWQgcGFzc2luZyB0aGUgYW5ub3RhdGlvbnMgaW50byB0aGUgY2FsbGJhY2suXG4gICNcbiAgIyBhbm5vdGF0aW9uIC0gQW4gQXJyYXkgb2YgYW5ub3RhdGlvbiBlbGVtZW50cy5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIHZpZXdlci5sb2FkKFthbm5vdGF0aW9uMSwgYW5ub3RhdGlvbjIsIGFubm90YXRpb24zXSlcbiAgI1xuICAjIFJldHVybnMgaXRzbGVmLlxuICBsb2FkOiAoYW5ub3RhdGlvbnMpID0+XG4gICAgQGFubm90YXRpb25zID0gYW5ub3RhdGlvbnMgfHwgW11cblxuICAgIGxpc3QgPSBAZWxlbWVudC5maW5kKCd1bDpmaXJzdCcpLmVtcHR5KClcbiAgICBmb3IgYW5ub3RhdGlvbiBpbiBAYW5ub3RhdGlvbnNcbiAgICAgIGl0ZW0gPSAkKEBpdGVtKS5jbG9uZSgpLmFwcGVuZFRvKGxpc3QpLmRhdGEoJ2Fubm90YXRpb24nLCBhbm5vdGF0aW9uKVxuICAgICAgY29udHJvbHMgPSBpdGVtLmZpbmQoJy5hbm5vdGF0b3ItY29udHJvbHMnKVxuXG4gICAgICBsaW5rID0gY29udHJvbHMuZmluZCgnLmFubm90YXRvci1saW5rJylcbiAgICAgIGVkaXQgPSBjb250cm9scy5maW5kKCcuYW5ub3RhdG9yLWVkaXQnKVxuICAgICAgZGVsICA9IGNvbnRyb2xzLmZpbmQoJy5hbm5vdGF0b3ItZGVsZXRlJylcblxuICAgICAgbGlua3MgPSBuZXcgTGlua1BhcnNlcihhbm5vdGF0aW9uLmxpbmtzIG9yIFtdKS5nZXQoJ2FsdGVybmF0ZScsIHsndHlwZSc6ICd0ZXh0L2h0bWwnfSlcbiAgICAgIGlmIGxpbmtzLmxlbmd0aCBpcyAwIG9yIG5vdCBsaW5rc1swXS5ocmVmP1xuICAgICAgICBsaW5rLnJlbW92ZSgpXG4gICAgICBlbHNlXG4gICAgICAgIGxpbmsuYXR0cignaHJlZicsIGxpbmtzWzBdLmhyZWYpXG5cbiAgICAgIGlmIEBvcHRpb25zLnJlYWRPbmx5XG4gICAgICAgIGVkaXQucmVtb3ZlKClcbiAgICAgICAgZGVsLnJlbW92ZSgpXG4gICAgICBlbHNlXG4gICAgICAgIGNvbnRyb2xsZXIgPSB7XG4gICAgICAgICAgc2hvd0VkaXQ6IC0+IGVkaXQucmVtb3ZlQXR0cignZGlzYWJsZWQnKVxuICAgICAgICAgIGhpZGVFZGl0OiAtPiBlZGl0LmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJylcbiAgICAgICAgICBzaG93RGVsZXRlOiAtPiBkZWwucmVtb3ZlQXR0cignZGlzYWJsZWQnKVxuICAgICAgICAgIGhpZGVEZWxldGU6IC0+IGRlbC5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpXG4gICAgICAgIH1cblxuICAgICAgZm9yIGZpZWxkIGluIEBmaWVsZHNcbiAgICAgICAgZWxlbWVudCA9ICQoZmllbGQuZWxlbWVudCkuY2xvbmUoKS5hcHBlbmRUbyhpdGVtKVswXVxuICAgICAgICBmaWVsZC5sb2FkKGVsZW1lbnQsIGFubm90YXRpb24sIGNvbnRyb2xsZXIpXG5cbiAgICB0aGlzLnB1Ymxpc2goJ2xvYWQnLCBbQGFubm90YXRpb25zXSlcblxuICAgIHRoaXMuc2hvdygpXG5cbiAgIyBQdWJsaWM6IEFkZHMgYW4gYWRkaW9uYWwgZmllbGQgdG8gYW4gYW5ub3RhdGlvbiB2aWV3LiBBIGNhbGxiYWNrIGNhbiBiZVxuICAjIHByb3ZpZGVkIHRvIHVwZGF0ZSB0aGUgdmlldyBvbiBsb2FkLlxuICAjXG4gICMgb3B0aW9ucyAtIEFuIG9wdGlvbnMgT2JqZWN0LiBPcHRpb25zIGFyZSBhcyBmb2xsb3dzOlxuICAjICAgICAgICAgICBsb2FkIC0gQ2FsbGJhY2sgRnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIHZpZXcgaXMgbG9hZGVkIHdpdGggYW5cbiAgIyAgICAgICAgICAgICAgICAgIGFubm90YXRpb24uIFJlY2lldmVzIGEgbmV3bHkgY3JlYXRlZCBjbG9uZSBvZiBAaXRlbSBhbmRcbiAgIyAgICAgICAgICAgICAgICAgIHRoZSBhbm5vdGF0aW9uIHRvIGJlIGRpc3BsYXllZCAoaXQgd2lsbCBiZSBjYWxsZWQgb25jZVxuICAjICAgICAgICAgICAgICAgICAgZm9yIGVhY2ggYW5ub3RhdGlvbiBiZWluZyBsb2FkZWQpLlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgIyBEaXNwbGF5IGEgdXNlciBuYW1lLlxuICAjICAgdmlld2VyLmFkZEZpZWxkKHtcbiAgIyAgICAgIyBUaGlzIGlzIGNhbGxlZCB3aGVuIHRoZSB2aWV3ZXIgaXMgbG9hZGVkLlxuICAjICAgICBsb2FkOiAoZmllbGQsIGFubm90YXRpb24pIC0+XG4gICMgICAgICAgZmllbGQgPSAkKGZpZWxkKVxuICAjXG4gICMgICAgICAgaWYgYW5ub3RhdGlvbi51c2VyXG4gICMgICAgICAgICBmaWVsZC50ZXh0KGFubm90YXRpb24udXNlcikgIyBEaXNwbGF5IHRoZSB1c2VyXG4gICMgICAgICAgZWxzZVxuICAjICAgICAgICAgZmllbGQucmVtb3ZlKCkgICAgICAgICAgICAgICMgRG8gbm90IGRpc3BsYXkgdGhlIGZpZWxkLlxuICAjICAgfSlcbiAgI1xuICAjIFJldHVybnMgaXRzZWxmLlxuICBhZGRGaWVsZDogKG9wdGlvbnMpIC0+XG4gICAgZmllbGQgPSAkLmV4dGVuZCh7XG4gICAgICBsb2FkOiAtPlxuICAgIH0sIG9wdGlvbnMpXG5cbiAgICBmaWVsZC5lbGVtZW50ID0gJCgnPGRpdiAvPicpWzBdXG4gICAgQGZpZWxkcy5wdXNoIGZpZWxkXG4gICAgZmllbGQuZWxlbWVudFxuICAgIHRoaXNcblxuICAjIENhbGxiYWNrIGZ1bmN0aW9uOiBjYWxsZWQgd2hlbiB0aGUgZWRpdCBidXR0b24gaXMgY2xpY2tlZC5cbiAgI1xuICAjIGV2ZW50IC0gQW4gRXZlbnQgb2JqZWN0LlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBvbkVkaXRDbGljazogKGV2ZW50KSA9PlxuICAgIHRoaXMub25CdXR0b25DbGljayhldmVudCwgJ2VkaXQnKVxuXG4gICMgQ2FsbGJhY2sgZnVuY3Rpb246IGNhbGxlZCB3aGVuIHRoZSBkZWxldGUgYnV0dG9uIGlzIGNsaWNrZWQuXG4gICNcbiAgIyBldmVudCAtIEFuIEV2ZW50IG9iamVjdC5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgb25EZWxldGVDbGljazogKGV2ZW50KSA9PlxuICAgIHRoaXMub25CdXR0b25DbGljayhldmVudCwgJ2RlbGV0ZScpXG5cbiAgIyBGaXJlcyBhbiBldmVudCBvZiB0eXBlIGFuZCBwYXNzZXMgaW4gdGhlIGFzc29jaWF0ZWQgYW5ub3RhdGlvbi5cbiAgI1xuICAjIGV2ZW50IC0gQW4gRXZlbnQgb2JqZWN0LlxuICAjIHR5cGUgIC0gVGhlIHR5cGUgb2YgZXZlbnQgdG8gZmlyZS4gRWl0aGVyIFwiZWRpdFwiIG9yIFwiZGVsZXRlXCIuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIG9uQnV0dG9uQ2xpY2s6IChldmVudCwgdHlwZSkgLT5cbiAgICBpdGVtID0gJChldmVudC50YXJnZXQpLnBhcmVudHMoJy5hbm5vdGF0b3ItYW5ub3RhdGlvbicpXG5cbiAgICB0aGlzLnB1Ymxpc2godHlwZSwgW2l0ZW0uZGF0YSgnYW5ub3RhdGlvbicpXSlcblxuIyBQcml2YXRlOiBzaW1wbGUgcGFyc2VyIGZvciBoeXBlcm1lZGlhIGxpbmsgc3RydWN0dXJlXG4jXG4jIEV4YW1wbGVzOlxuI1xuIyAgIGxpbmtzID0gW1xuIyAgICAgeyByZWw6ICdhbHRlcm5hdGUnLCBocmVmOiAnaHR0cDovL2V4YW1wbGUuY29tL3BhZ2VzLzE0Lmpzb24nLCB0eXBlOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiMgICAgIHsgcmVsOiAncHJldic6IGhyZWY6ICdodHRwOi8vZXhhbXBsZS5jb20vcGFnZXMvMTMnIH1cbiMgICBdXG4jXG4jICAgbHAgPSBMaW5rUGFyc2VyKGxpbmtzKVxuIyAgIGxwLmdldCgnYWx0ZXJuYXRlJykgICAgICAgICAgICAgICAgICAgICAgIyA9PiBbIHsgcmVsOiAnYWx0ZXJuYXRlJywgaHJlZjogJ2h0dHA6Ly8uLi4nLCAuLi4gfSBdXG4jICAgbHAuZ2V0KCdhbHRlcm5hdGUnLCB7dHlwZTogJ3RleHQvaHRtbCd9KSAjID0+IFtdXG4jXG5jbGFzcyBMaW5rUGFyc2VyXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEpIC0+XG5cbiAgZ2V0OiAocmVsLCBjb25kPXt9KSAtPlxuICAgIGNvbmQgPSAkLmV4dGVuZCh7fSwgY29uZCwge3JlbDogcmVsfSlcbiAgICBrZXlzID0gKGsgZm9yIG93biBrLCB2IG9mIGNvbmQpXG4gICAgZm9yIGQgaW4gQGRhdGFcbiAgICAgIG1hdGNoID0ga2V5cy5yZWR1Y2UgKChtLCBrKSAtPiBtIGFuZCAoZFtrXSBpcyBjb25kW2tdKSksIHRydWVcbiAgICAgIGlmIG1hdGNoXG4gICAgICAgIGRcbiAgICAgIGVsc2VcbiAgICAgICAgY29udGludWVcblxuXG4jIEV4cG9ydCB0aGUgVmlld2VyIG9iamVjdFxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXJcbiIsIkRlbGVnYXRvciA9IHJlcXVpcmUgJy4vY2xhc3MnXG5VdGlsID0gcmVxdWlyZSAnLi91dGlsJ1xuXG5cbiMgUHVibGljOiBCYXNlIGNsYXNzIGZvciB0aGUgRWRpdG9yIGFuZCBWaWV3ZXIgZWxlbWVudHMuIENvbnRhaW5zIG1ldGhvZHMgdGhhdFxuIyBhcmUgc2hhcmVkIGJldHdlZW4gdGhlIHR3by5cbmNsYXNzIFdpZGdldCBleHRlbmRzIERlbGVnYXRvclxuICAjIENsYXNzZXMgdXNlZCB0byBhbHRlciB0aGUgd2lkZ2V0cyBzdGF0ZS5cbiAgY2xhc3NlczpcbiAgICBoaWRlOiAnYW5ub3RhdG9yLWhpZGUnXG4gICAgaW52ZXJ0OlxuICAgICAgeDogJ2Fubm90YXRvci1pbnZlcnQteCdcbiAgICAgIHk6ICdhbm5vdGF0b3ItaW52ZXJ0LXknXG5cbiAgIyBQdWJsaWM6IENyZWF0ZXMgYSBuZXcgV2lkZ2V0IGluc3RhbmNlLlxuICAjXG4gICMgZWxlbWVudCAtIFRoZSBFbGVtZW50IHRoYXQgcmVwcmVzZW50cyB0aGUgd2lkZ2V0IGluIHRoZSBET00uXG4gICMgb3B0aW9ucyAtIEFuIE9iamVjdCBsaXRlcmFsIG9mIG9wdGlvbnMuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgIyAgIHdpZGdldCAgPSBuZXcgQW5ub3RhdG9yLldpZGdldChlbGVtZW50KVxuICAjXG4gICMgUmV0dXJucyBhIG5ldyBXaWRnZXQgaW5zdGFuY2UuXG4gIGNvbnN0cnVjdG9yOiAoZWxlbWVudCwgb3B0aW9ucykgLT5cbiAgICBzdXBlclxuICAgIEBjbGFzc2VzID0gJC5leHRlbmQge30sIFdpZGdldC5wcm90b3R5cGUuY2xhc3NlcywgQGNsYXNzZXNcblxuICAjIFB1YmxpYzogVW5iaW5kIHRoZSB3aWRnZXQncyBldmVudHMgYW5kIHJlbW92ZSBpdHMgZWxlbWVudCBmcm9tIHRoZSBET00uXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIGRlc3Ryb3k6IC0+XG4gICAgdGhpcy5yZW1vdmVFdmVudHMoKVxuICAgIEBlbGVtZW50LnJlbW92ZSgpXG5cbiAgY2hlY2tPcmllbnRhdGlvbjogLT5cbiAgICB0aGlzLnJlc2V0T3JpZW50YXRpb24oKVxuXG4gICAgd2luZG93ICAgPSAkKFV0aWwuZ2V0R2xvYmFsKCkpXG4gICAgd2lkZ2V0ICAgPSBAZWxlbWVudC5jaGlsZHJlbihcIjpmaXJzdFwiKVxuICAgIG9mZnNldCAgID0gd2lkZ2V0Lm9mZnNldCgpXG4gICAgdmlld3BvcnQgPSB7XG4gICAgICB0b3A6ICAgd2luZG93LnNjcm9sbFRvcCgpLFxuICAgICAgcmlnaHQ6IHdpbmRvdy53aWR0aCgpICsgd2luZG93LnNjcm9sbExlZnQoKVxuICAgIH1cbiAgICBjdXJyZW50ID0ge1xuICAgICAgdG9wOiAgIG9mZnNldC50b3BcbiAgICAgIHJpZ2h0OiBvZmZzZXQubGVmdCArIHdpZGdldC53aWR0aCgpXG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQudG9wIC0gdmlld3BvcnQudG9wKSA8IDBcbiAgICAgIHRoaXMuaW52ZXJ0WSgpXG5cbiAgICBpZiAoY3VycmVudC5yaWdodCAtIHZpZXdwb3J0LnJpZ2h0KSA+IDBcbiAgICAgIHRoaXMuaW52ZXJ0WCgpXG5cbiAgICB0aGlzXG5cbiAgIyBQdWJsaWM6IFJlc2V0cyBvcmllbnRhdGlvbiBvZiB3aWRnZXQgb24gdGhlIFggJiBZIGF4aXMuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICB3aWRnZXQucmVzZXRPcmllbnRhdGlvbigpICMgV2lkZ2V0IGlzIG9yaWdpbmFsIHdheSB1cC5cbiAgI1xuICAjIFJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgcmVzZXRPcmllbnRhdGlvbjogLT5cbiAgICBAZWxlbWVudC5yZW1vdmVDbGFzcyhAY2xhc3Nlcy5pbnZlcnQueCkucmVtb3ZlQ2xhc3MoQGNsYXNzZXMuaW52ZXJ0LnkpXG4gICAgdGhpc1xuXG4gICMgUHVibGljOiBJbnZlcnRzIHRoZSB3aWRnZXQgb24gdGhlIFggYXhpcy5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIHdpZGdldC5pbnZlcnRYKCkgIyBXaWRnZXQgaXMgbm93IHJpZ2h0IGFsaWduZWQuXG4gICNcbiAgIyBSZXR1cm5zIGl0c2VsZiBmb3IgY2hhaW5pbmcuXG4gIGludmVydFg6IC0+XG4gICAgQGVsZW1lbnQuYWRkQ2xhc3MgQGNsYXNzZXMuaW52ZXJ0LnhcbiAgICB0aGlzXG5cbiAgIyBQdWJsaWM6IEludmVydHMgdGhlIHdpZGdldCBvbiB0aGUgWSBheGlzLlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgd2lkZ2V0LmludmVydFkoKSAjIFdpZGdldCBpcyBub3cgdXBzaWRlIGRvd24uXG4gICNcbiAgIyBSZXR1cm5zIGl0c2VsZiBmb3IgY2hhaW5pbmcuXG4gIGludmVydFk6IC0+XG4gICAgQGVsZW1lbnQuYWRkQ2xhc3MgQGNsYXNzZXMuaW52ZXJ0LnlcbiAgICB0aGlzXG5cbiAgIyBQdWJsaWM6IEZpbmQgb3V0IHdoZXRoZXIgb3Igbm90IHRoZSB3aWRnZXQgaXMgY3VycmVudGx5IHVwc2lkZSBkb3duXG4gICNcbiAgIyBSZXR1cm5zIGEgYm9vbGVhbjogdHJ1ZSBpZiB0aGUgd2lkZ2V0IGlzIHVwc2lkZSBkb3duXG4gIGlzSW52ZXJ0ZWRZOiAtPlxuICAgIEBlbGVtZW50Lmhhc0NsYXNzIEBjbGFzc2VzLmludmVydC55XG5cbiAgIyBQdWJsaWM6IEZpbmQgb3V0IHdoZXRoZXIgb3Igbm90IHRoZSB3aWRnZXQgaXMgY3VycmVudGx5IHJpZ2h0IGFsaWduZWRcbiAgI1xuICAjIFJldHVybnMgYSBib29sZWFuOiB0cnVlIGlmIHRoZSB3aWRnZXQgaXMgcmlnaHQgYWxpZ25lZFxuICBpc0ludmVydGVkWDogLT5cbiAgICBAZWxlbWVudC5oYXNDbGFzcyBAY2xhc3Nlcy5pbnZlcnQueFxuXG5cbiMgRXhwb3J0IHRoZSBXaWRnZXQgb2JqZWN0XG5tb2R1bGUuZXhwb3J0cyA9IFdpZGdldFxuIiwiIyBBIHNpbXBsZSBYUGF0aCBldmFsdWF0b3IgdXNpbmcgalF1ZXJ5IHdoaWNoIGNhbiBldmFsdWF0ZSBxdWVyaWVzIG9mXG5zaW1wbGVYUGF0aEpRdWVyeSA9IChyZWxhdGl2ZVJvb3QpIC0+XG4gIGpxID0gdGhpcy5tYXAgLT5cbiAgICBwYXRoID0gJydcbiAgICBlbGVtID0gdGhpc1xuXG4gICAgd2hpbGUgZWxlbT8ubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUgYW5kIGVsZW0gaXNudCByZWxhdGl2ZVJvb3RcbiAgICAgIHRhZ05hbWUgPSBlbGVtLnRhZ05hbWUucmVwbGFjZShcIjpcIiwgXCJcXFxcOlwiKVxuICAgICAgaWR4ID0gJChlbGVtLnBhcmVudE5vZGUpLmNoaWxkcmVuKHRhZ05hbWUpLmluZGV4KGVsZW0pICsgMVxuXG4gICAgICBpZHggID0gXCJbI3tpZHh9XVwiXG4gICAgICBwYXRoID0gXCIvXCIgKyBlbGVtLnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIGlkeCArIHBhdGhcbiAgICAgIGVsZW0gPSBlbGVtLnBhcmVudE5vZGVcblxuICAgIHBhdGhcblxuICBqcS5nZXQoKVxuXG4jIEEgc2ltcGxlIFhQYXRoIGV2YWx1YXRvciB1c2luZyBvbmx5IHN0YW5kYXJkIERPTSBtZXRob2RzIHdoaWNoIGNhblxuIyBldmFsdWF0ZSBxdWVyaWVzIG9mIHRoZSBmb3JtIC90YWdbaW5kZXhdL3RhZ1tpbmRleF0uXG5zaW1wbGVYUGF0aFB1cmUgPSAocmVsYXRpdmVSb290KSAtPlxuXG4gIGdldFBhdGhTZWdtZW50ID0gKG5vZGUpIC0+XG4gICAgbmFtZSA9IGdldE5vZGVOYW1lIG5vZGVcbiAgICBwb3MgPSBnZXROb2RlUG9zaXRpb24gbm9kZVxuICAgIFwiI3tuYW1lfVsje3Bvc31dXCJcblxuICByb290Tm9kZSA9IHJlbGF0aXZlUm9vdFxuXG4gIGdldFBhdGhUbyA9IChub2RlKSAtPlxuICAgIHhwYXRoID0gJyc7XG4gICAgd2hpbGUgbm9kZSAhPSByb290Tm9kZVxuICAgICAgdW5sZXNzIG5vZGU/XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIkNhbGxlZCBnZXRQYXRoVG8gb24gYSBub2RlIHdoaWNoIHdhcyBub3QgYSBkZXNjZW5kYW50IG9mIEByb290Tm9kZS4gXCIgKyByb290Tm9kZVxuICAgICAgeHBhdGggPSAoZ2V0UGF0aFNlZ21lbnQgbm9kZSkgKyAnLycgKyB4cGF0aFxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuICAgIHhwYXRoID0gJy8nICsgeHBhdGhcbiAgICB4cGF0aCA9IHhwYXRoLnJlcGxhY2UgL1xcLyQvLCAnJ1xuICAgIHhwYXRoXG5cbiAganEgPSB0aGlzLm1hcCAtPlxuICAgIHBhdGggPSBnZXRQYXRoVG8gdGhpc1xuXG4gICAgcGF0aFxuXG4gIGpxLmdldCgpXG5cbmZpbmRDaGlsZCA9IChub2RlLCB0eXBlLCBpbmRleCkgLT5cbiAgdW5sZXNzIG5vZGUuaGFzQ2hpbGROb2RlcygpXG4gICAgdGhyb3cgbmV3IEVycm9yIFwiWFBhdGggZXJyb3I6IG5vZGUgaGFzIG5vIGNoaWxkcmVuIVwiXG4gIGNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzXG4gIGZvdW5kID0gMFxuICBmb3IgY2hpbGQgaW4gY2hpbGRyZW5cbiAgICBuYW1lID0gZ2V0Tm9kZU5hbWUgY2hpbGRcbiAgICBpZiBuYW1lIGlzIHR5cGVcbiAgICAgIGZvdW5kICs9IDFcbiAgICAgIGlmIGZvdW5kIGlzIGluZGV4XG4gICAgICAgIHJldHVybiBjaGlsZFxuICB0aHJvdyBuZXcgRXJyb3IgXCJYUGF0aCBlcnJvcjogd2FudGVkIGNoaWxkIG5vdCBmb3VuZC5cIlxuXG4jIEdldCB0aGUgbm9kZSBuYW1lIGZvciB1c2UgaW4gZ2VuZXJhdGluZyBhbiB4cGF0aCBleHByZXNzaW9uLlxuZ2V0Tm9kZU5hbWUgPSAobm9kZSkgLT5cbiAgICBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuICAgIHN3aXRjaCBub2RlTmFtZVxuICAgICAgd2hlbiBcIiN0ZXh0XCIgdGhlbiByZXR1cm4gXCJ0ZXh0KClcIlxuICAgICAgd2hlbiBcIiNjb21tZW50XCIgdGhlbiByZXR1cm4gXCJjb21tZW50KClcIlxuICAgICAgd2hlbiBcIiNjZGF0YS1zZWN0aW9uXCIgdGhlbiByZXR1cm4gXCJjZGF0YS1zZWN0aW9uKClcIlxuICAgICAgZWxzZSByZXR1cm4gbm9kZU5hbWVcblxuIyBHZXQgdGhlIGluZGV4IG9mIHRoZSBub2RlIGFzIGl0IGFwcGVhcnMgaW4gaXRzIHBhcmVudCdzIGNoaWxkIGxpc3RcbmdldE5vZGVQb3NpdGlvbiA9IChub2RlKSAtPlxuICBwb3MgPSAwXG4gIHRtcCA9IG5vZGVcbiAgd2hpbGUgdG1wXG4gICAgaWYgdG1wLm5vZGVOYW1lIGlzIG5vZGUubm9kZU5hbWVcbiAgICAgIHBvcysrXG4gICAgdG1wID0gdG1wLnByZXZpb3VzU2libGluZ1xuICBwb3NcblxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIHNpbXBsZVhQYXRoSlF1ZXJ5OiBzaW1wbGVYUGF0aEpRdWVyeVxuICBzaW1wbGVYUGF0aFB1cmU6IHNpbXBsZVhQYXRoUHVyZVxuICBmaW5kQ2hpbGQ6IGZpbmRDaGlsZFxuIl19