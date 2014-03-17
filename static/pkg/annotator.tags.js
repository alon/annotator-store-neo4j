/*
** Annotator v2.0.0-dev-dev-9dfff13
** https://github.com/okfn/annotator/
**
** Copyright 2014, the Annotator project contributors.
** Dual licensed under the MIT and GPLv3 licenses.
** https://github.com/okfn/annotator/blob/master/LICENSE
**
** Built at: 2014-03-06 10:35:40Z
*/
!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Annotator=e():"undefined"!=typeof global?global.Annotator=e():"undefined"!=typeof self&&(self.Annotator=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('annotator');
require('annotator-plugin-tags');

},{"annotator":"VH1sEA","annotator-plugin-tags":"Zc7fM9"}],"VH1sEA":[function(require,module,exports){
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
},{}],"Zc7fM9":[function(require,module,exports){
var Annotator, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Annotator = require('annotator');

Annotator.Plugin.Tags = (function(_super) {
  __extends(Tags, _super);

  function Tags() {
    this.setAnnotationTags = __bind(this.setAnnotationTags, this);
    this.updateField = __bind(this.updateField, this);
    _ref = Tags.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Tags.prototype.options = {
    parseTags: function(string) {
      var tags;
      string = $.trim(string);
      tags = [];
      if (string) {
        tags = string.split(/\s+/);
      }
      return tags;
    },
    stringifyTags: function(array) {
      return array.join(" ");
    }
  };

  Tags.prototype.field = null;

  Tags.prototype.input = null;

  Tags.prototype.pluginInit = function() {
    if (!Annotator.supported()) {
      return;
    }
    this.field = this.annotator.editor.addField({
      label: Annotator._t('Add some tags here') + '\u2026',
      load: this.updateField,
      submit: this.setAnnotationTags
    });
    this.annotator.viewer.addField({
      load: this.updateViewer
    });
    if (this.annotator.plugins.Filter) {
      this.annotator.plugins.Filter.addFilter({
        label: Annotator._t('Tag'),
        property: 'tags',
        isFiltered: Annotator.Plugin.Tags.filterCallback
      });
    }
    return this.input = $(this.field).find(':input');
  };

  Tags.prototype.parseTags = function(string) {
    return this.options.parseTags(string);
  };

  Tags.prototype.stringifyTags = function(array) {
    return this.options.stringifyTags(array);
  };

  Tags.prototype.updateField = function(field, annotation) {
    var value;
    value = '';
    if (annotation.tags) {
      value = this.stringifyTags(annotation.tags);
    }
    return this.input.val(value);
  };

  Tags.prototype.setAnnotationTags = function(field, annotation) {
    return annotation.tags = this.parseTags(this.input.val());
  };

  Tags.prototype.updateViewer = function(field, annotation) {
    field = $(field);
    if (annotation.tags && $.isArray(annotation.tags) && annotation.tags.length) {
      return field.addClass('annotator-tags').html(function() {
        var string;
        return string = $.map(annotation.tags, function(tag) {
          return '<span class="annotator-tag">' + Annotator.Util.escape(tag) + '</span>';
        }).join(' ');
      });
    } else {
      return field.remove();
    }
  };

  return Tags;

})(Annotator.Plugin);

Annotator.Plugin.Tags.filterCallback = function(input, tags) {
  var keyword, keywords, matches, tag, _i, _j, _len, _len1;
  if (tags == null) {
    tags = [];
  }
  matches = 0;
  keywords = [];
  if (input) {
    keywords = input.split(/\s+/g);
    for (_i = 0, _len = keywords.length; _i < _len; _i++) {
      keyword = keywords[_i];
      if (tags.length) {
        for (_j = 0, _len1 = tags.length; _j < _len1; _j++) {
          tag = tags[_j];
          if (tag.indexOf(keyword) !== -1) {
            matches += 1;
          }
        }
      }
    }
  }
  return matches === keywords.length;
};

module.exports = Annotator.Plugin.Tags;


},{"annotator":"VH1sEA"}],"annotator-plugin-tags":[function(require,module,exports){
module.exports=require('Zc7fM9');
},{}]},{},[1])

(1)
})
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGtnL2Fubm90YXRvci50YWdzLmpzIiwic291cmNlcyI6WyIuLi9mYWtlXzM1OGY5ZWI4LmpzIiwibmFtZXNwYWNlLmNvZmZlZSIsInBsdWdpbi90YWdzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTs7QUNHQTs7QUFBQSxJQUFlLHdDQUFmO0NBQUEsRUFBTyxDQUFQO0NBQUE7O0FBQ0EsSUFBa0IsNENBQWxCOztHQUFRLENBQVI7R0FBQTtDQURBOztBQUVBLElBQWtCLDRDQUFsQjs7R0FBUSxDQUFSO0dBQUE7Q0FGQTs7QUFHQSxDQUhBLEVBR1ksQ0FBSSxFQUhoQixHQUdBOzs7Q0FHOEIsQ0FBOUIsQ0FBdUMsQ0FBWCxFQUFmLENBQTBCO0NBTnZDOztBQVdBLENBWEEsRUFXaUIsR0FBWCxDQUFOLEVBWEE7Ozs7OztBQ0xBO0dBQUE7O2tTQUFBOztBQUFBLEdBQVksTUFBWixFQUFZOztBQUtOLENBTE4sS0FLc0IsR0FBUDtDQUViOzs7Ozs7O0NBQUE7O0NBQUEsRUFJRSxJQUpGO0NBSUUsQ0FBVyxFQUFYLEVBQVcsR0FBWDtDQUNFO0NBQUEsRUFBUyxHQUFUO0NBQUEsRUFFTyxDQUFQO0NBQ0EsR0FBOEIsRUFBOUI7Q0FBQSxFQUFPLENBQVAsQ0FBTyxDQUFNLEVBQWI7T0FIQTtDQURTLFlBS1Q7Q0FMRixJQUFXO0NBQVgsQ0FTZSxFQUFmLENBQWUsSUFBQyxJQUFoQjtDQUNRLEVBQU4sRUFBSyxRQUFMO0NBVkYsSUFTZTtDQWJqQjs7Q0FBQSxFQWtCTyxDQWxCUCxDQWtCQTs7Q0FsQkEsRUFzQk8sQ0F0QlAsQ0FzQkE7O0NBdEJBLEVBNkJZLE9BQVo7QUFDZ0IsQ0FBZCxRQUF1QjtDQUF2QjtLQUFBO0NBQUEsRUFFUyxDQUFULEVBQTBCLEVBQWpCLENBQVU7Q0FBaUIsQ0FDMUIsQ0FBcUMsRUFBN0MsR0FEa0MsQ0FDakIsV0FBVDtDQUQwQixDQUUxQixFQUFSLE9BRmtDO0NBQUEsQ0FHMUIsRUFBSSxFQUFaLFdBSGtDO0NBRnBDLEtBRVM7Q0FGVCxHQVFBLEVBQWlCLEVBQWpCLENBQVU7Q0FBaUIsQ0FDbkIsRUFBTixRQUR5QjtDQVIzQixLQVFBO0NBS0EsTUFBcUIsRUFBUjtDQUNYLEdBQUMsRUFBRCxDQUFrQixFQUFSO0NBQ1IsQ0FBTyxHQUFQLElBQWdCO0NBQWhCLENBQ1UsSUFEVixFQUNBO0NBREEsQ0FFWSxFQUFxQixFQUFMLEVBQTVCLENBQXFCLENBQXJCLElBRkE7Q0FERjtLQWRGO0NBbUJDLEVBQVEsQ0FBUixDQUFELEdBQVMsR0FBVDtDQWpERixFQTZCWTs7Q0E3QlosRUE2RFcsTUFBWDtDQUNHLEtBQUQsQ0FBUSxFQUFSO0NBOURGLEVBNkRXOztDQTdEWCxFQTBFZSxNQUFDLElBQWhCO0NBQ0csSUFBRCxFQUFRLElBQVI7Q0EzRUYsRUEwRWU7O0NBMUVmLENBMEZxQixDQUFSLE1BQUMsQ0FBRCxDQUFiO0NBQ0U7Q0FBQSxFQUFRLENBQVI7Q0FDQSxTQUF5RDtDQUF6RCxFQUFRLENBQUksQ0FBWixLQUFxQyxHQUE3QjtLQURSO0NBR0MsRUFBRCxDQUFDLENBQUssTUFBTjtDQTlGRixFQTBGYTs7Q0ExRmIsQ0ErRzJCLENBQVIsTUFBQyxDQUFELE9BQW5CO0NBQ2EsRUFBTyxDQUFsQixDQUF1QyxJQUFyQixDQUFSLENBQVY7Q0FoSEYsRUErR21COztDQS9HbkIsQ0ErSHNCLENBQVIsTUFBQyxDQUFELEVBQWQ7Q0FDRSxFQUFRLENBQVI7Q0FFQSxNQUF1QixHQUFWO0NBQ0wsRUFBZ0MsQ0FBdEMsQ0FBSyxHQUFMLENBQXNDLElBQXRDO0NBQ0U7Q0FBVSxDQUFxQixDQUF0QixHQUFULEdBQWdDLENBQVAsS0FBekI7Q0FDK0MsRUFBVixDQUFjLEVBQWQsR0FBUyxRQUExQztDQURLLFFBQXNCO0NBRGpDLE1BQXNDO01BRHhDO0NBT1EsSUFBRCxDQUFMO0tBVlU7Q0EvSGQsRUErSGM7O0NBL0hkOztDQUZrQyxRQUFTOztBQTBKN0MsQ0EvSkEsQ0ErSitDLENBQVIsQ0FBbEIsQ0FBa0IsQ0FBdkIsR0FBUCxLQUFUO0NBQ0U7O0dBRG9ELENBQVA7R0FDN0M7Q0FBQSxFQUFXLElBQVg7Q0FBQSxDQUNBLENBQVcsS0FBWDtDQUNBLEdBQUcsQ0FBSDtDQUNFLEVBQVcsQ0FBWCxDQUFnQixDQUFMLEVBQVg7QUFDQTs2QkFBQTtDQUFrQyxHQUFMO0FBQzNCO3lCQUFBO0FBQTJELENBQXJCLEVBQUQsQ0FBSCxDQUF3QixFQUF4QjtDQUFsQyxHQUFXLEdBQVg7V0FBQTtDQUFBO09BREY7Q0FBQSxJQUZGO0dBRkE7Q0FPb0IsSUFBVCxFQUFYLENBQW1CLENBQW5CO0NBUnFDOztBQVd2QyxDQTFLQSxFQTBLaUIsQ0ExS2pCLEVBMEtNLENBQU4sRUFBMEIiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ2Fubm90YXRvcicpO1xucmVxdWlyZSgnYW5ub3RhdG9yLXBsdWdpbi10YWdzJyk7XG4iLCIjIEluIG9yZGVyIHRvIGJ1aWxkIHBvcnRhYmxlIGV4dGVuc2lvbiBidW5kbGVzIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCBBTUQgYW5kXG4jIHNjcmlwdCBjb25jYXRlbmF0aW9uIHBsdWdpbnMgYXJlIGJ1aWx0IHdpdGggdGhpcyBtb2R1bGUgYXMgJ2Fubm90YXRvcicuXG5cbiMgQW5ub3RhdG9yIHdpbGwgZXhwb3J0IGl0c2VsZiBnbG9iYWxseSB3aGVuIHRoZSBidWlsdCBVTUQgbW9kdWxlcyBhcmUgdXNlZCBpblxuIyBhIGxlZ2FjeSBlbnZpcm9ubWVudCBvZiBzaW1wbGUgc2NyaXB0IGNvbmNhdGVuYXRpb24uXG5zZWxmID0gc2VsZiBpZiBzZWxmP1xuc2VsZiA/PSBnbG9iYWwgaWYgZ2xvYmFsP1xuc2VsZiA/PSB3aW5kb3cgaWYgd2luZG93P1xuQW5ub3RhdG9yID0gc2VsZj8uQW5ub3RhdG9yXG5cbiMgSW4gYSBwdXJlIEFNRCBlbnZpcm9ubWVudCwgQW5ub3RhdG9yIG1heSBub3QgYmUgZXhwb3J0ZWQgZ2xvYmFsbHkuXG5Bbm5vdGF0b3IgPz0gaWYgc2VsZj8uZGVmaW5lPy5hbWQgdGhlbiBzZWxmPy5yZXF1aXJlKCdhbm5vdGF0b3InKVxuXG4jIE5vdGU6IHdoZW4gd29ya2luZyBpbiBhIENvbW1vbkpTIGVudmlyb25tZW50IGFuZCBidW5kbGluZyByZXF1aXJlbWVudHMgaW50b1xuIyBhcHBsaWNhdGlvbnMgdGhlbiByZXF1aXJlIGNhbGxzIHNob3VsZCByZWZlciB0byBtb2R1bGVzIGZyb20gdGhlIG5wbSBsaWJcbiMgZGlyZWN0b3J5IG9mIGFubm90YXRvciBwYWNrYWdlIGFuZCBhdm9pZCB0aGlzIGFsdG9nZXRoZXIuXG5tb2R1bGUuZXhwb3J0cyA9IEFubm90YXRvclxuIiwiQW5ub3RhdG9yID0gcmVxdWlyZSgnYW5ub3RhdG9yJylcblxuXG4jIFB1YmxpYzogVGFncyBwbHVnaW4gYWxsb3dzIHVzZXJzIHRvIHRhZyB0aGllciBhbm5vdGF0aW9ucyB3aXRoIG1ldGFkYXRhXG4jIHN0b3JlZCBpbiBhbiBBcnJheSBvbiB0aGUgYW5ub3RhdGlvbiBhcyB0YWdzLlxuY2xhc3MgQW5ub3RhdG9yLlBsdWdpbi5UYWdzIGV4dGVuZHMgQW5ub3RhdG9yLlBsdWdpblxuXG4gIG9wdGlvbnM6XG4gICAgIyBDb25maWd1cmFibGUgZnVuY3Rpb24gd2hpY2ggYWNjZXB0cyBhIHN0cmluZyAodGhlIGNvbnRlbnRzKVxuICAgICMgb2YgdGhlIHRhZ3MgaW5wdXQgYXMgYW4gYXJndW1lbnQsIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mXG4gICAgIyB0YWdzLlxuICAgIHBhcnNlVGFnczogKHN0cmluZykgLT5cbiAgICAgIHN0cmluZyA9ICQudHJpbShzdHJpbmcpXG5cbiAgICAgIHRhZ3MgPSBbXVxuICAgICAgdGFncyA9IHN0cmluZy5zcGxpdCgvXFxzKy8pIGlmIHN0cmluZ1xuICAgICAgdGFnc1xuXG4gICAgIyBDb25maWd1cmFibGUgZnVuY3Rpb24gd2hpY2ggYWNjZXB0cyBhbiBhcnJheSBvZiB0YWdzIGFuZFxuICAgICMgcmV0dXJucyBhIHN0cmluZyB3aGljaCB3aWxsIGJlIHVzZWQgdG8gZmlsbCB0aGUgdGFncyBpbnB1dC5cbiAgICBzdHJpbmdpZnlUYWdzOiAoYXJyYXkpIC0+XG4gICAgICBhcnJheS5qb2luKFwiIFwiKVxuXG4gICMgVGhlIGZpZWxkIGVsZW1lbnQgYWRkZWQgdG8gdGhlIEFubm90YXRvci5FZGl0b3Igd3JhcHBlZCBpbiBqUXVlcnkuIENhY2hlZCB0b1xuICAjIHNhdmUgaGF2aW5nIHRvIHJlY3JlYXRlIGl0IGV2ZXJ5dGltZSB0aGUgZWRpdG9yIGlzIGRpc3BsYXllZC5cbiAgZmllbGQ6IG51bGxcblxuICAjIFRoZSBpbnB1dCBlbGVtZW50IGFkZGVkIHRvIHRoZSBBbm5vdGF0b3IuRWRpdG9yIHdyYXBwZWQgaW4galF1ZXJ5LiBDYWNoZWQgdG9cbiAgIyBzYXZlIGhhdmluZyB0byByZWNyZWF0ZSBpdCBldmVyeXRpbWUgdGhlIGVkaXRvciBpcyBkaXNwbGF5ZWQuXG4gIGlucHV0OiBudWxsXG5cbiAgIyBQdWJsaWM6IEluaXRpYWxpc2VzIHRoZSBwbHVnaW4gYW5kIGFkZHMgY3VzdG9tIGZpZWxkcyB0byBib3RoIHRoZVxuICAjIGFubm90YXRvciB2aWV3ZXIgYW5kIGVkaXRvci4gVGhlIHBsdWdpbiBhbHNvIGNoZWNrcyBpZiB0aGUgYW5ub3RhdG9yIGlzXG4gICMgc3VwcG9ydGVkIGJ5IHRoZSBjdXJyZW50IGJyb3dzZXIuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHBsdWdpbkluaXQ6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBBbm5vdGF0b3Iuc3VwcG9ydGVkKClcblxuICAgIEBmaWVsZCA9IEBhbm5vdGF0b3IuZWRpdG9yLmFkZEZpZWxkKHtcbiAgICAgIGxhYmVsOiAgQW5ub3RhdG9yLl90KCdBZGQgc29tZSB0YWdzIGhlcmUnKSArICdcXHUyMDI2J1xuICAgICAgbG9hZDogICB0aGlzLnVwZGF0ZUZpZWxkXG4gICAgICBzdWJtaXQ6IHRoaXMuc2V0QW5ub3RhdGlvblRhZ3NcbiAgICB9KVxuXG4gICAgQGFubm90YXRvci52aWV3ZXIuYWRkRmllbGQoe1xuICAgICAgbG9hZDogdGhpcy51cGRhdGVWaWV3ZXJcbiAgICB9KVxuXG4gICAgIyBBZGQgYSBmaWx0ZXIgdG8gdGhlIEZpbHRlciBwbHVnaW4gaWYgbG9hZGVkLlxuICAgIGlmIEBhbm5vdGF0b3IucGx1Z2lucy5GaWx0ZXJcbiAgICAgIEBhbm5vdGF0b3IucGx1Z2lucy5GaWx0ZXIuYWRkRmlsdGVyXG4gICAgICAgIGxhYmVsOiBBbm5vdGF0b3IuX3QoJ1RhZycpXG4gICAgICAgIHByb3BlcnR5OiAndGFncydcbiAgICAgICAgaXNGaWx0ZXJlZDogQW5ub3RhdG9yLlBsdWdpbi5UYWdzLmZpbHRlckNhbGxiYWNrXG5cbiAgICBAaW5wdXQgPSAkKEBmaWVsZCkuZmluZCgnOmlucHV0JylcblxuICAjIFB1YmxpYzogRXh0cmFjdHMgdGFncyBmcm9tIHRoZSBwcm92aWRlZCBTdHJpbmcuXG4gICNcbiAgIyBzdHJpbmcgLSBBIFN0cmluZyBvZiB0YWdzIHNlcGVyYXRlZCBieSBzcGFjZXMuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBwbHVnaW4ucGFyc2VUYWdzKCdjYWtlIGNob2NvbGF0ZSBjYWJiYWdlJylcbiAgIyAgICMgPT4gWydjYWtlJywgJ2Nob2NvbGF0ZScsICdjYWJiYWdlJ11cbiAgI1xuICAjIFJldHVybnMgQXJyYXkgb2YgcGFyc2VkIHRhZ3MuXG4gIHBhcnNlVGFnczogKHN0cmluZykgLT5cbiAgICBAb3B0aW9ucy5wYXJzZVRhZ3Moc3RyaW5nKVxuXG4gICMgUHVibGljOiBUYWtlcyBhbiBhcnJheSBvZiB0YWdzIGFuZCBzZXJpYWxpc2VzIHRoZW0gaW50byBhIFN0cmluZy5cbiAgI1xuICAjIGFycmF5IC0gQW4gQXJyYXkgb2YgdGFncy5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIHBsdWdpbi5zdHJpbmdpZnlUYWdzKFsnY2FrZScsICdjaG9jb2xhdGUnLCAnY2FiYmFnZSddKVxuICAjICAgIyA9PiAnY2FrZSBjaG9jb2xhdGUgY2FiYmFnZSdcbiAgI1xuICAjIFJldHVybnMgQXJyYXkgb2YgcGFyc2VkIHRhZ3MuXG4gIHN0cmluZ2lmeVRhZ3M6IChhcnJheSkgLT5cbiAgICBAb3B0aW9ucy5zdHJpbmdpZnlUYWdzKGFycmF5KVxuXG4gICMgQW5ub3RhdG9yLkVkaXRvciBjYWxsYmFjayBmdW5jdGlvbi4gVXBkYXRlcyB0aGUgQGlucHV0IGZpZWxkIHdpdGggdGhlXG4gICMgdGFncyBhdHRhY2hlZCB0byB0aGUgcHJvdmlkZWQgYW5ub3RhdGlvbi5cbiAgI1xuICAjIGZpZWxkICAgICAgLSBUaGUgdGFncyBmaWVsZCBFbGVtZW50IGNvbnRhaW5pbmcgdGhlIGlucHV0IEVsZW1lbnQuXG4gICMgYW5ub3RhdGlvbiAtIEFuIGFubm90YXRpb24gb2JqZWN0IHRvIGJlIGVkaXRlZC5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIGZpZWxkID0gJCgnPGxpPjxpbnB1dCAvPjwvbGk+JylbMF1cbiAgIyAgIHBsdWdpbi51cGRhdGVGaWVsZChmaWVsZCwge3RhZ3M6IFsnYXBwbGVzJywgJ29yYW5nZXMnLCAnY2FrZSddfSlcbiAgIyAgIGZpZWxkLnZhbHVlICMgPT4gUmV0dXJucyAnYXBwbGVzIG9yYW5nZXMgY2FrZSdcbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgdXBkYXRlRmllbGQ6IChmaWVsZCwgYW5ub3RhdGlvbikgPT5cbiAgICB2YWx1ZSA9ICcnXG4gICAgdmFsdWUgPSB0aGlzLnN0cmluZ2lmeVRhZ3MoYW5ub3RhdGlvbi50YWdzKSBpZiBhbm5vdGF0aW9uLnRhZ3NcblxuICAgIEBpbnB1dC52YWwodmFsdWUpXG5cbiAgIyBBbm5vdGF0b3IuRWRpdG9yIGNhbGxiYWNrIGZ1bmN0aW9uLiBVcGRhdGVzIHRoZSBhbm5vdGF0aW9uIGZpZWxkIHdpdGggdGhlXG4gICMgZGF0YSByZXRyaWV2ZWQgZnJvbSB0aGUgQGlucHV0IHByb3BlcnR5LlxuICAjXG4gICMgZmllbGQgICAgICAtIFRoZSB0YWdzIGZpZWxkIEVsZW1lbnQgY29udGFpbmluZyB0aGUgaW5wdXQgRWxlbWVudC5cbiAgIyBhbm5vdGF0aW9uIC0gQW4gYW5ub3RhdGlvbiBvYmplY3QgdG8gYmUgdXBkYXRlZC5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIGFubm90YXRpb24gPSB7fVxuICAjICAgZmllbGQgPSAkKCc8bGk+PGlucHV0IHZhbHVlPVwiY2FrZSBjaG9jb2xhdGUgY2FiYmFnZVwiIC8+PC9saT4nKVswXVxuICAjXG4gICMgICBwbHVnaW4uc2V0QW5ub3RhdGlvblRhZ3MoZmllbGQsIGFubm90YXRpb24pXG4gICMgICBhbm5vdGF0aW9uLnRhZ3MgIyA9PiBSZXR1cm5zIFsnY2FrZScsICdjaG9jb2xhdGUnLCAnY2FiYmFnZSddXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHNldEFubm90YXRpb25UYWdzOiAoZmllbGQsIGFubm90YXRpb24pID0+XG4gICAgYW5ub3RhdGlvbi50YWdzID0gdGhpcy5wYXJzZVRhZ3MoQGlucHV0LnZhbCgpKVxuXG4gICMgQW5ub3RhdG9yLlZpZXdlciBjYWxsYmFjayBmdW5jdGlvbi4gVXBkYXRlcyB0aGUgYW5ub3RhdGlvbiBkaXNwbGF5IHdpdGggdGFnc1xuICAjIHJlbW92ZXMgdGhlIGZpZWxkIGZyb20gdGhlIFZpZXdlciBpZiB0aGVyZSBhcmUgbm8gdGFncyB0byBkaXNwbGF5LlxuICAjXG4gICMgZmllbGQgICAgICAtIFRoZSBFbGVtZW50IHRvIHBvcHVsYXRlIHdpdGggdGFncy5cbiAgIyBhbm5vdGF0aW9uIC0gQW4gYW5ub3RhdGlvbiBvYmplY3QgdG8gYmUgZGlzcGxheS5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIGZpZWxkID0gJCgnPGRpdiAvPicpWzBdXG4gICMgICBwbHVnaW4udXBkYXRlRmllbGQoZmllbGQsIHt0YWdzOiBbJ2FwcGxlcyddfSlcbiAgIyAgIGZpZWxkLmlubmVySFRNTCAjID0+IFJldHVybnMgJzxzcGFuIGNsYXNzPVwiYW5ub3RhdG9yLXRhZ1wiPmFwcGxlczwvc3Bhbj4nXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHVwZGF0ZVZpZXdlcjogKGZpZWxkLCBhbm5vdGF0aW9uKSAtPlxuICAgIGZpZWxkID0gJChmaWVsZClcblxuICAgIGlmIGFubm90YXRpb24udGFncyBhbmQgJC5pc0FycmF5KGFubm90YXRpb24udGFncykgYW5kIGFubm90YXRpb24udGFncy5sZW5ndGhcbiAgICAgIGZpZWxkLmFkZENsYXNzKCdhbm5vdGF0b3ItdGFncycpLmh0bWwoLT5cbiAgICAgICAgc3RyaW5nID0gJC5tYXAoYW5ub3RhdGlvbi50YWdzLCh0YWcpIC0+XG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJhbm5vdGF0b3ItdGFnXCI+JyArIEFubm90YXRvci5VdGlsLmVzY2FwZSh0YWcpICsgJzwvc3Bhbj4nXG4gICAgICAgICkuam9pbignICcpXG4gICAgICApXG4gICAgZWxzZVxuICAgICAgZmllbGQucmVtb3ZlKClcblxuIyBDaGVja3MgYW4gaW5wdXQgc3RyaW5nIG9mIGtleXdvcmRzIGFnYWluc3QgYW4gYXJyYXkgb2YgdGFncy4gSWYgdGhlIGtleXdvcmRzXG4jIG1hdGNoIF9hbGxfIHRhZ3MgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZS4gVGhpcyBzaG91bGQgYmUgdXNlZCBhcyBhIGNhbGxiYWNrXG4jIGluIHRoZSBGaWx0ZXIgcGx1Z2luLlxuI1xuIyBpbnB1dCAtIEEgU3RyaW5nIG9mIGtleXdvcmRzIGZyb20gYSBpbnB1dCBmaWVsZC5cbiNcbiMgRXhhbXBsZXNcbiNcbiMgICBUYWdzLmZpbHRlckNhbGxiYWNrKCdjYXQgZG9nIG1vdXNlJywgWydjYXQnLCAnZG9nJywgJ21vdXNlJ10pIC8vPT4gdHJ1ZVxuIyAgIFRhZ3MuZmlsdGVyQ2FsbGJhY2soJ2NhdCBkb2cnLCBbJ2NhdCcsICdkb2cnLCAnbW91c2UnXSkgLy89PiB0cnVlXG4jICAgVGFncy5maWx0ZXJDYWxsYmFjaygnY2F0IGRvZycsIFsnY2F0J10pIC8vPT4gZmFsc2VcbiNcbiMgUmV0dXJucyB0cnVlIGlmIHRoZSBpbnB1dCBrZXl3b3JkcyBtYXRjaCBhbGwgdGFncy5cbkFubm90YXRvci5QbHVnaW4uVGFncy5maWx0ZXJDYWxsYmFjayA9IChpbnB1dCwgdGFncyA9IFtdKSAtPlxuICBtYXRjaGVzICA9IDBcbiAga2V5d29yZHMgPSBbXVxuICBpZiBpbnB1dFxuICAgIGtleXdvcmRzID0gaW5wdXQuc3BsaXQoL1xccysvZylcbiAgICBmb3Iga2V5d29yZCBpbiBrZXl3b3JkcyB3aGVuIHRhZ3MubGVuZ3RoXG4gICAgICBtYXRjaGVzICs9IDEgZm9yIHRhZyBpbiB0YWdzIHdoZW4gdGFnLmluZGV4T2Yoa2V5d29yZCkgIT0gLTFcblxuICBtYXRjaGVzID09IGtleXdvcmRzLmxlbmd0aFxuXG5cbm1vZHVsZS5leHBvcnRzID0gQW5ub3RhdG9yLlBsdWdpbi5UYWdzXG4iXX0=