/*
** Annotator v2.0.0-dev-dev-9dfff13
** https://github.com/okfn/annotator/
**
** Copyright 2014, the Annotator project contributors.
** Dual licensed under the MIT and GPLv3 licenses.
** https://github.com/okfn/annotator/blob/master/LICENSE
**
** Built at: 2014-03-06 10:35:31Z
*/
!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Annotator=e():"undefined"!=typeof global?global.Annotator=e():"undefined"!=typeof self&&(self.Annotator=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('annotator');
require('annotator-plugin-permissions');

},{"annotator":"VH1sEA","annotator-plugin-permissions":"RaW8Hs"}],"VH1sEA":[function(require,module,exports){
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
},{}],"RaW8Hs":[function(require,module,exports){
var Annotator,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Annotator = require('annotator');

Annotator.Plugin.Permissions = (function(_super) {
  __extends(Permissions, _super);

  Permissions.prototype.options = {
    showViewPermissionsCheckbox: true,
    showEditPermissionsCheckbox: true,
    userId: function(user) {
      return user;
    },
    userString: function(user) {
      return user;
    },
    userAuthorize: function(action, annotation, user) {
      var token, tokens, _i, _len;
      if (annotation.permissions) {
        tokens = annotation.permissions[action] || [];
        if (tokens.length === 0) {
          return true;
        }
        for (_i = 0, _len = tokens.length; _i < _len; _i++) {
          token = tokens[_i];
          if (this.userId(user) === token) {
            return true;
          }
        }
        return false;
      } else if (annotation.user) {
        if (user) {
          return this.userId(user) === this.userId(annotation.user);
        } else {
          return false;
        }
      }
      return true;
    },
    user: '',
    permissions: {
      'read': [],
      'update': [],
      'delete': [],
      'admin': []
    }
  };

  function Permissions(element, options) {
    this._setAuthFromToken = __bind(this._setAuthFromToken, this);
    this.updateViewer = __bind(this.updateViewer, this);
    this.updateAnnotationPermissions = __bind(this.updateAnnotationPermissions, this);
    this.updatePermissionsField = __bind(this.updatePermissionsField, this);
    this.addFieldsToAnnotation = __bind(this.addFieldsToAnnotation, this);
    Permissions.__super__.constructor.apply(this, arguments);
    if (this.options.user) {
      this.setUser(this.options.user);
      delete this.options.user;
    }
  }

  Permissions.prototype.pluginInit = function() {
    var createCallback, self,
      _this = this;
    if (!Annotator.supported()) {
      return;
    }
    this.annotator.subscribe('beforeAnnotationCreated', this.addFieldsToAnnotation);
    self = this;
    createCallback = function(method, type) {
      return function(field, annotation) {
        return self[method].call(self, type, field, annotation);
      };
    };
    if (!this.user && this.annotator.plugins.Auth) {
      this.annotator.plugins.Auth.withToken(this._setAuthFromToken);
    }
    if (this.options.showViewPermissionsCheckbox === true) {
      this.annotator.editor.addField({
        type: 'checkbox',
        label: Annotator._t('Allow anyone to <strong>view</strong> this annotation'),
        load: createCallback('updatePermissionsField', 'read'),
        submit: createCallback('updateAnnotationPermissions', 'read')
      });
    }
    if (this.options.showEditPermissionsCheckbox === true) {
      this.annotator.editor.addField({
        type: 'checkbox',
        label: Annotator._t('Allow anyone to <strong>edit</strong> this annotation'),
        load: createCallback('updatePermissionsField', 'update'),
        submit: createCallback('updateAnnotationPermissions', 'update')
      });
    }
    this.annotator.viewer.addField({
      load: this.updateViewer
    });
    if (this.annotator.plugins.Filter) {
      return this.annotator.plugins.Filter.addFilter({
        label: Annotator._t('User'),
        property: 'user',
        isFiltered: function(input, user) {
          var keyword, _i, _len, _ref;
          user = _this.options.userString(user);
          if (!(input && user)) {
            return false;
          }
          _ref = input.split(/\s*/);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            keyword = _ref[_i];
            if (user.indexOf(keyword) === -1) {
              return false;
            }
          }
          return true;
        }
      });
    }
  };

  Permissions.prototype.setUser = function(user) {
    return this.user = user;
  };

  Permissions.prototype.addFieldsToAnnotation = function(annotation) {
    if (annotation) {
      annotation.permissions = this.options.permissions;
      if (this.user) {
        return annotation.user = this.user;
      }
    }
  };

  Permissions.prototype.authorize = function(action, annotation, user) {
    if (user === void 0) {
      user = this.user;
    }
    if (this.options.userAuthorize) {
      return this.options.userAuthorize.call(this.options, action, annotation, user);
    } else {
      return true;
    }
  };

  Permissions.prototype.updatePermissionsField = function(action, field, annotation) {
    var input;
    field = $(field).show();
    input = field.find('input').removeAttr('disabled');
    if (!this.authorize('admin', annotation)) {
      field.hide();
    }
    if (this.authorize(action, annotation || {}, null)) {
      return input.attr('checked', 'checked');
    } else {
      return input.removeAttr('checked');
    }
  };

  Permissions.prototype.updateAnnotationPermissions = function(type, field, annotation) {
    var dataKey;
    if (!annotation.permissions) {
      annotation.permissions = this.options.permissions;
    }
    dataKey = type + '-permissions';
    if ($(field).find('input').is(':checked')) {
      return annotation.permissions[type] = [];
    } else {
      return annotation.permissions[type] = [this.options.userId(this.user)];
    }
  };

  Permissions.prototype.updateViewer = function(field, annotation, controls) {
    var user, username;
    field = $(field);
    username = this.options.userString(annotation.user);
    if (annotation.user && username && typeof username === 'string') {
      user = Annotator.Util.escape(this.options.userString(annotation.user));
      field.html(user).addClass('annotator-user');
    } else {
      field.remove();
    }
    if (controls) {
      if (!this.authorize('update', annotation)) {
        controls.hideEdit();
      }
      if (!this.authorize('delete', annotation)) {
        return controls.hideDelete();
      }
    }
  };

  Permissions.prototype._setAuthFromToken = function(token) {
    return this.setUser(token.userId);
  };

  return Permissions;

})(Annotator.Plugin);

module.exports = Annotator.Plugin.Permissions;


},{"annotator":"VH1sEA"}],"annotator-plugin-permissions":[function(require,module,exports){
module.exports=require('RaW8Hs');
},{}]},{},[1])

(1)
})
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGtnL2Fubm90YXRvci5wZXJtaXNzaW9ucy5qcyIsInNvdXJjZXMiOlsiLi4vZmFrZV8xYzQzMDIxMy5qcyIsIm5hbWVzcGFjZS5jb2ZmZWUiLCJwbHVnaW4vcGVybWlzc2lvbnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBOztBQ0dBOztBQUFBLElBQWUsd0NBQWY7Q0FBQSxFQUFPLENBQVA7Q0FBQTs7QUFDQSxJQUFrQiw0Q0FBbEI7O0dBQVEsQ0FBUjtHQUFBO0NBREE7O0FBRUEsSUFBa0IsNENBQWxCOztHQUFRLENBQVI7R0FBQTtDQUZBOztBQUdBLENBSEEsRUFHWSxDQUFJLEVBSGhCLEdBR0E7OztDQUc4QixDQUE5QixDQUF1QyxDQUFYLEVBQWYsQ0FBMEI7Q0FOdkM7O0FBV0EsQ0FYQSxFQVdpQixHQUFYLENBQU4sRUFYQTs7Ozs7O0FDTEE7R0FBQTs7a1NBQUE7O0FBQUEsR0FBWSxNQUFaLEVBQVk7O0FBaUJOLENBakJOLEtBaUJzQixHQUFQO0NBR2I7O0NBQUEsRUFHRSxJQUhGO0NBR0UsQ0FBNkIsRUFBN0I7Q0FBQSxDQUc2QixFQUE3QjtDQUhBLENBWVEsRUFBUixLQUFTO0NBQUQsWUFBVTtDQVpsQixJQVlRO0NBWlIsQ0FxQlksRUFBWixLQUFhLENBQWI7Q0FBWSxZQUFVO0NBckJ0QixJQXFCWTtDQXJCWixDQXFFZSxFQUFmLEVBQWUsR0FBQyxDQUFELEdBQWY7Q0FFRTtDQUFBLEdBQUcsRUFBSCxJQUFhLENBQWI7Q0FDRSxFQUFTLENBQWtDLEVBQTNDLElBQW1CLENBQWE7Q0FFaEMsR0FBRyxDQUFpQixDQUFYLEVBQVQ7Q0FFRSxnQkFBTztTQUpUO0FBTUE7NkJBQUE7Q0FDRSxHQUFHLENBQXFCLENBQXJCLElBQUg7Q0FDRSxrQkFBTztXQUZYO0NBQUEsUUFOQTtDQVdBLGNBQU87Q0FHVSxHQUFYLEVBZlIsSUFla0I7Q0FDaEIsR0FBRyxJQUFIO0NBQ0UsR0FBVyxDQUFpQixDQUFyQixJ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Qjs7Q0F4T3hCLENBK1BvQyxDQUFQLE1BQUMsQ0FBRCxpQkFBN0I7Q0FDRTtBQUFxRCxDQUFyRCxTQUErRCxDQUEvRDtDQUFBLEVBQXlCLENBQUMsRUFBMUIsQ0FBaUMsR0FBdkIsQ0FBVjtLQUFBO0NBQUEsRUFFVSxDQUFWLFVBRkE7Q0FJQSxDQUFHLEVBQUgsQ0FBRztDQUNVLEVBQW9CLENBQVIsTUFBYixDQUFhLEVBQXZCO01BREY7Q0FPYSxFQUFvQixDQUFSLEVBQVMsQ0FBUSxHQUE5QixDQUFhLEVBQXZCO0tBWnlCO0NBL1A3QixFQStQNkI7O0NBL1A3QixDQXFSc0IsQ0FBUixNQUFDLENBQUQsRUFBZDtDQUNFO0NBQUEsRUFBUSxDQUFSO0NBQUEsRUFFVyxDQUFYLEdBQW1CLENBQW5CLEVBQVc7QUFDeUIsQ0FBcEMsSUFBdUQsQ0FBbkIsRUFBakMsRUFBVTtDQUNYLEVBQU8sQ0FBUCxHQUFxQyxFQUFyQixDQUFhO0NBQTdCLEdBQ0EsQ0FBSyxDQUFMO01BRkY7Q0FJRSxJQUFLLENBQUw7S0FQRjtDQVNBO0FBQytCLENBQTdCLENBQXNELEVBQXRELElBQTZCO0NBQTdCO09BQUE7QUFDNkIsQ0FBN0IsQ0FBc0QsRUFBdEQsSUFBNkI7Q0FBcEIsT0FBRCxFQUFSO09BRkY7S0FWWTtDQXJSZCxFQXFSYzs7Q0FyUmQsRUF3U21CLE1BQUMsUUFBcEI7Q0FDTyxHQUFELENBQWMsQ0FBbEI7Q0F6U0YsRUF3U21COztDQXhTbkI7O0NBSHlDLFFBQVM7O0FBK1NwRCxDQWhVQSxFQWdVaUIsR0FBWCxDQUFOLEVBQTBCLEVBaFUxQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnYW5ub3RhdG9yJyk7XG5yZXF1aXJlKCdhbm5vdGF0b3ItcGx1Z2luLXBlcm1pc3Npb25zJyk7XG4iLCIjIEluIG9yZGVyIHRvIGJ1aWxkIHBvcnRhYmxlIGV4dGVuc2lvbiBidW5kbGVzIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCBBTUQgYW5kXG4jIHNjcmlwdCBjb25jYXRlbmF0aW9uIHBsdWdpbnMgYXJlIGJ1aWx0IHdpdGggdGhpcyBtb2R1bGUgYXMgJ2Fubm90YXRvcicuXG5cbiMgQW5ub3RhdG9yIHdpbGwgZXhwb3J0IGl0c2VsZiBnbG9iYWxseSB3aGVuIHRoZSBidWlsdCBVTUQgbW9kdWxlcyBhcmUgdXNlZCBpblxuIyBhIGxlZ2FjeSBlbnZpcm9ubWVudCBvZiBzaW1wbGUgc2NyaXB0IGNvbmNhdGVuYXRpb24uXG5zZWxmID0gc2VsZiBpZiBzZWxmP1xuc2VsZiA/PSBnbG9iYWwgaWYgZ2xvYmFsP1xuc2VsZiA/PSB3aW5kb3cgaWYgd2luZG93P1xuQW5ub3RhdG9yID0gc2VsZj8uQW5ub3RhdG9yXG5cbiMgSW4gYSBwdXJlIEFNRCBlbnZpcm9ubWVudCwgQW5ub3RhdG9yIG1heSBub3QgYmUgZXhwb3J0ZWQgZ2xvYmFsbHkuXG5Bbm5vdGF0b3IgPz0gaWYgc2VsZj8uZGVmaW5lPy5hbWQgdGhlbiBzZWxmPy5yZXF1aXJlKCdhbm5vdGF0b3InKVxuXG4jIE5vdGU6IHdoZW4gd29ya2luZyBpbiBhIENvbW1vbkpTIGVudmlyb25tZW50IGFuZCBidW5kbGluZyByZXF1aXJlbWVudHMgaW50b1xuIyBhcHBsaWNhdGlvbnMgdGhlbiByZXF1aXJlIGNhbGxzIHNob3VsZCByZWZlciB0byBtb2R1bGVzIGZyb20gdGhlIG5wbSBsaWJcbiMgZGlyZWN0b3J5IG9mIGFubm90YXRvciBwYWNrYWdlIGFuZCBhdm9pZCB0aGlzIGFsdG9nZXRoZXIuXG5tb2R1bGUuZXhwb3J0cyA9IEFubm90YXRvclxuIiwiQW5ub3RhdG9yID0gcmVxdWlyZSgnYW5ub3RhdG9yJylcblxuXG4jIFB1YmxpYzogUGx1Z2luIGZvciBzZXR0aW5nIHBlcm1pc3Npb25zIG9uIG5ld2x5IGNyZWF0ZWQgYW5ub3RhdGlvbnMgYXMgd2VsbCBhc1xuIyBtYW5hZ2luZyB1c2VyIHBlcm1pc3Npb25zIHN1Y2ggYXMgdmlld2luZy9lZGl0aW5nL2RlbGV0aW5nIGFubm90aW9ucy5cbiNcbiMgZWxlbWVudCAtIEEgRE9NIEVsZW1lbnQgdXBvbiB3aGljaCBldmVudHMgYXJlIGJvdW5kLiBXaGVuIGluaXRpYWxpc2VkIGJ5XG4jICAgICAgICAgICB0aGUgQW5ub3RhdG9yIGl0IGlzIHRoZSBBbm5vdGF0b3IgZWxlbWVudC5cbiMgb3B0aW9ucyAtIEFuIE9iamVjdCBsaXRlcmFsIGNvbnRhaW5pbmcgY3VzdG9tIG9wdGlvbnMuXG4jXG4jIEV4YW1wbGVzXG4jXG4jICAgbmV3IEFubm90YXRvci5wbHVnaW4uUGVybWlzc2lvbnMoYW5ub3RhdG9yLmVsZW1lbnQsIHtcbiMgICAgIHVzZXI6ICdBbGljZSdcbiMgICB9KVxuI1xuIyBSZXR1cm5zIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBQZXJtaXNzaW9ucyBPYmplY3QuXG5jbGFzcyBBbm5vdGF0b3IuUGx1Z2luLlBlcm1pc3Npb25zIGV4dGVuZHMgQW5ub3RhdG9yLlBsdWdpblxuXG4gICMgQSBPYmplY3QgbGl0ZXJhbCBvZiBkZWZhdWx0IG9wdGlvbnMgZm9yIHRoZSBjbGFzcy5cbiAgb3B0aW9uczpcblxuICAgICMgRGlzcGxheXMgYW4gXCJBbnlvbmUgY2FuIHZpZXcgdGhpcyBhbm5vdGF0aW9uXCIgY2hlY2tib3ggaW4gdGhlIEVkaXRvci5cbiAgICBzaG93Vmlld1Blcm1pc3Npb25zQ2hlY2tib3g6IHRydWVcblxuICAgICMgRGlzcGxheXMgYW4gXCJBbnlvbmUgY2FuIGVkaXQgdGhpcyBhbm5vdGF0aW9uXCIgY2hlY2tib3ggaW4gdGhlIEVkaXRvci5cbiAgICBzaG93RWRpdFBlcm1pc3Npb25zQ2hlY2tib3g6IHRydWVcblxuICAgICMgUHVibGljOiBVc2VkIGJ5IHRoZSBwbHVnaW4gdG8gZGV0ZXJtaW5lIGEgdW5pcXVlIGlkIGZvciB0aGUgQHVzZXIgcHJvcGVydHkuXG4gICAgIyBCeSBkZWZhdWx0IHRoaXMgYWNjZXB0cyBhbmQgcmV0dXJucyB0aGUgdXNlciBTdHJpbmcgYnV0IGNhbiBiZSBvdmVyLVxuICAgICMgcmlkZGVuIGluIHRoZSBAb3B0aW9ucyBvYmplY3QgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yLlxuICAgICNcbiAgICAjIHVzZXIgLSBBIFN0cmluZyB1c2VybmFtZSBvciBudWxsIGlmIG5vIHVzZXIgaXMgc2V0LlxuICAgICNcbiAgICAjIFJldHVybnMgdGhlIFN0cmluZyBwcm92aWRlZCBhcyB1c2VyIG9iamVjdC5cbiAgICB1c2VySWQ6ICh1c2VyKSAtPiB1c2VyXG5cbiAgICAjIFB1YmxpYzogVXNlZCBieSB0aGUgcGx1Z2luIHRvIGRldGVybWluZSBhIGRpc3BsYXkgbmFtZSBmb3IgdGhlIEB1c2VyXG4gICAgIyBwcm9wZXJ0eS4gQnkgZGVmYXVsdCB0aGlzIGFjY2VwdHMgYW5kIHJldHVybnMgdGhlIHVzZXIgU3RyaW5nIGJ1dCBjYW4gYmVcbiAgICAjIG92ZXItcmlkZGVuIGluIHRoZSBAb3B0aW9ucyBvYmplY3QgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yLlxuICAgICNcbiAgICAjIHVzZXIgLSBBIFN0cmluZyB1c2VybmFtZSBvciBudWxsIGlmIG5vIHVzZXIgaXMgc2V0LlxuICAgICNcbiAgICAjIFJldHVybnMgdGhlIFN0cmluZyBwcm92aWRlZCBhcyB1c2VyIG9iamVjdFxuICAgIHVzZXJTdHJpbmc6ICh1c2VyKSAtPiB1c2VyXG5cbiAgICAjIFB1YmxpYzogVXNlZCBieSBQZXJtaXNzaW9ucyNhdXRob3JpemUgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSB1c2VyIGNhblxuICAgICMgcGVyZm9ybSBhbiBhY3Rpb24gb24gYW4gYW5ub3RhdGlvbi4gT3ZlcnJpZGluZyB0aGlzIGZ1bmN0aW9uIGFsbG93c1xuICAgICMgYSBmYXIgbW9yZSBjb21wbGV4IHBlcm1pc3Npb25zIHN5c3llbS5cbiAgICAjXG4gICAgIyBCeSBkZWZhdWx0IHRoaXMgYXV0aG9yaXplcyB0aGUgYWN0aW9uIGlmIGFueSBvZiB0aHJlZSBzY2VuYXJpb3MgYXJlIHRydWU6XG4gICAgI1xuICAgICMgICAgIDEpIHRoZSBhbm5vdGF0aW9uIGhhcyBhICdwZXJtaXNzaW9ucycgb2JqZWN0LCBhbmQgZWl0aGVyIHRoZSBmaWVsZCBmb3JcbiAgICAjICAgICAgICB0aGUgc3BlY2lmaWVkIGFjdGlvbiBpcyBtaXNzaW5nLCBlbXB0eSwgb3IgY29udGFpbnMgdGhlIHVzZXJJZCBvZiB0aGVcbiAgICAjICAgICAgICBjdXJyZW50IHVzZXIsIGkuZS4gQG9wdGlvbnMudXNlcklkKEB1c2VyKVxuICAgICNcbiAgICAjICAgICAyKSB0aGUgYW5ub3RhdGlvbiBoYXMgYSAndXNlcicgcHJvcGVydHksIGFuZCBAb3B0aW9ucy51c2VySWQoQHVzZXIpIG1hdGNoZXNcbiAgICAjICAgICAgICAnYW5ub3RhdGlvbi51c2VyJ1xuICAgICNcbiAgICAjICAgICAzKSB0aGUgYW5ub3RhdGlvbiBoYXMgbm8gJ3Blcm1pc3Npb25zJyBvciAndXNlcicgcHJvcGVydGllc1xuICAgICNcbiAgICAjIGFubm90YXRpb24gLSBUaGUgYW5ub3RhdGlvbiBvbiB3aGljaCB0aGUgYWN0aW9uIGlzIGJlaW5nIHJlcXVlc3RlZC5cbiAgICAjIGFjdGlvbiAtIFRoZSBhY3Rpb24gYmVpbmcgcmVxdWVzdGVkOiBlLmcuICd1cGRhdGUnLCAnZGVsZXRlJy5cbiAgICAjIHVzZXIgLSBUaGUgdXNlciBvYmplY3QgKG9yIHN0cmluZykgcmVxdWVzdGluZyB0aGUgYWN0aW9uLiBUaGlzIGlzIHVzdWFsbHlcbiAgICAjICAgICAgICBhdXRvbWF0aWNhbGx5IHBhc3NlZCBieSBQZXJtaXNzaW9ucyNhdXRob3JpemUgYXMgdGhlIGN1cnJlbnQgdXNlciAoQHVzZXIpXG4gICAgI1xuICAgICMgICBwZXJtaXNzaW9ucy5zZXRVc2VyKG51bGwpXG4gICAgIyAgIHBlcm1pc3Npb25zLmF1dGhvcml6ZSgndXBkYXRlJywge30pXG4gICAgIyAgICMgPT4gdHJ1ZVxuICAgICNcbiAgICAjICAgcGVybWlzc2lvbnMuc2V0VXNlcignYWxpY2UnKVxuICAgICMgICBwZXJtaXNzaW9ucy5hdXRob3JpemUoJ3VwZGF0ZScsIHt1c2VyOiAnYWxpY2UnfSlcbiAgICAjICAgIyA9PiB0cnVlXG4gICAgIyAgIHBlcm1pc3Npb25zLmF1dGhvcml6ZSgndXBkYXRlJywge3VzZXI6ICdib2InfSlcbiAgICAjICAgIyA9PiBmYWxzZVxuICAgICNcbiAgICAjICAgcGVybWlzc2lvbnMuc2V0VXNlcignYWxpY2UnKVxuICAgICMgICBwZXJtaXNzaW9ucy5hdXRob3JpemUoJ3VwZGF0ZScsIHtcbiAgICAjICAgICB1c2VyOiAnYm9iJyxcbiAgICAjICAgICBwZXJtaXNzaW9uczogWyd1cGRhdGUnOiBbJ2FsaWNlJywgJ2JvYiddXVxuICAgICMgICB9KVxuICAgICMgICAjID0+IHRydWVcbiAgICAjICAgcGVybWlzc2lvbnMuYXV0aG9yaXplKCdkZXN0cm95Jywge1xuICAgICMgICAgIHVzZXI6ICdib2InLFxuICAgICMgICAgIHBlcm1pc3Npb25zOiBbXG4gICAgIyAgICAgICAndXBkYXRlJzogWydhbGljZScsICdib2InXVxuICAgICMgICAgICAgJ2Rlc3Ryb3knOiBbJ2JvYiddXG4gICAgIyAgICAgXVxuICAgICMgICB9KVxuICAgICMgICAjID0+IGZhbHNlXG4gICAgI1xuICAgICMgUmV0dXJucyBhIEJvb2xlYW4sIHRydWUgaWYgdGhlIHVzZXIgaXMgYXV0aG9yaXNlZCBmb3IgdGhlIHRva2VuIHByb3ZpZGVkLlxuICAgIHVzZXJBdXRob3JpemU6IChhY3Rpb24sIGFubm90YXRpb24sIHVzZXIpIC0+XG4gICAgICAjIEZpbmUtZ3JhaW5lZCBjdXN0b20gYXV0aG9yaXphdGlvblxuICAgICAgaWYgYW5ub3RhdGlvbi5wZXJtaXNzaW9uc1xuICAgICAgICB0b2tlbnMgPSBhbm5vdGF0aW9uLnBlcm1pc3Npb25zW2FjdGlvbl0gfHwgW11cblxuICAgICAgICBpZiB0b2tlbnMubGVuZ3RoID09IDBcbiAgICAgICAgICAjIEVtcHR5IG9yIG1pc3NpbmcgdG9rZW5zIGFycmF5OiBhbnlvbmUgY2FuIHBlcmZvcm0gYWN0aW9uLlxuICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgZm9yIHRva2VuIGluIHRva2Vuc1xuICAgICAgICAgIGlmIHRoaXMudXNlcklkKHVzZXIpID09IHRva2VuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgICMgTm8gdG9rZW5zIG1hdGNoZWQ6IGFjdGlvbiBzaG91bGQgbm90IGJlIHBlcmZvcm1lZC5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgICMgQ29hcnNlLWdyYWluZWQgYXV0aG9yaXphdGlvblxuICAgICAgZWxzZSBpZiBhbm5vdGF0aW9uLnVzZXJcbiAgICAgICAgaWYgdXNlclxuICAgICAgICAgIHJldHVybiB0aGlzLnVzZXJJZCh1c2VyKSA9PSB0aGlzLnVzZXJJZChhbm5vdGF0aW9uLnVzZXIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgIyBObyBhdXRob3JpemF0aW9uIGluZm8gb24gYW5ub3RhdGlvbjogZnJlZS1mb3ItYWxsIVxuICAgICAgdHJ1ZVxuXG4gICAgIyBEZWZhdWx0IHVzZXIgb2JqZWN0LlxuICAgIHVzZXI6ICcnXG5cbiAgICAjIERlZmF1bHQgcGVybWlzc2lvbnMgZm9yIGFsbCBhbm5vdGF0aW9ucy4gQW55b25lIGNhbiBkbyBhbnl0aGluZ1xuICAgICMgKGFzc3VtaW5nIGRlZmF1bHQgdXNlckF1dGhvcml6ZSBmdW5jdGlvbikuXG4gICAgcGVybWlzc2lvbnM6IHtcbiAgICAgICdyZWFkJzogICBbXVxuICAgICAgJ3VwZGF0ZSc6IFtdXG4gICAgICAnZGVsZXRlJzogW11cbiAgICAgICdhZG1pbic6ICBbXVxuICAgIH1cblxuICAjIFRoZSBjb25zdHJ1Y3RvciBjYWxsZWQgd2hlbiBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgUGVybWlzc2lvbnNcbiAgIyBwbHVnaW4gaXMgY3JlYXRlZC4gU2VlIGNsYXNzIGRvY3VtZW50YXRpb24gZm9yIHVzYWdlLlxuICAjXG4gICMgZWxlbWVudCAtIEEgRE9NIEVsZW1lbnQgdXBvbiB3aGljaCBldmVudHMgYXJlIGJvdW5kLi5cbiAgIyBvcHRpb25zIC0gQW4gT2JqZWN0IGxpdGVyYWwgY29udGFpbmluZyBjdXN0b20gb3B0aW9ucy5cbiAgI1xuICAjIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgdGhlIFBlcm1pc3Npb25zIG9iamVjdC5cbiAgY29uc3RydWN0b3I6IChlbGVtZW50LCBvcHRpb25zKSAtPlxuICAgIHN1cGVyXG5cbiAgICBpZiBAb3B0aW9ucy51c2VyXG4gICAgICB0aGlzLnNldFVzZXIoQG9wdGlvbnMudXNlcilcbiAgICAgIGRlbGV0ZSBAb3B0aW9ucy51c2VyXG5cbiAgIyBQdWJsaWM6IEluaXRpYWxpemVzIHRoZSBwbHVnaW4gYW5kIHJlZ2lzdGVycyBmaWVsZHMgd2l0aCB0aGVcbiAgIyBBbm5vdGF0b3IuRWRpdG9yIGFuZCBBbm5vdGF0b3IuVmlld2VyLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBwbHVnaW5Jbml0OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQW5ub3RhdG9yLnN1cHBvcnRlZCgpXG5cbiAgICBAYW5ub3RhdG9yLnN1YnNjcmliZSgnYmVmb3JlQW5ub3RhdGlvbkNyZWF0ZWQnLCB0aGlzLmFkZEZpZWxkc1RvQW5ub3RhdGlvbilcblxuICAgIHNlbGYgPSB0aGlzXG4gICAgY3JlYXRlQ2FsbGJhY2sgPSAobWV0aG9kLCB0eXBlKSAtPlxuICAgICAgKGZpZWxkLCBhbm5vdGF0aW9uKSAtPiBzZWxmW21ldGhvZF0uY2FsbChzZWxmLCB0eXBlLCBmaWVsZCwgYW5ub3RhdGlvbilcblxuICAgICMgU2V0IHVwIHVzZXIgYW5kIGRlZmF1bHQgcGVybWlzc2lvbnMgZnJvbSBhdXRoIHRva2VuIGlmIG5vbmUgY3VycmVudGx5IGdpdmVuXG4gICAgaWYgIUB1c2VyIGFuZCBAYW5ub3RhdG9yLnBsdWdpbnMuQXV0aFxuICAgICAgQGFubm90YXRvci5wbHVnaW5zLkF1dGgud2l0aFRva2VuKHRoaXMuX3NldEF1dGhGcm9tVG9rZW4pXG5cbiAgICBpZiBAb3B0aW9ucy5zaG93Vmlld1Blcm1pc3Npb25zQ2hlY2tib3ggPT0gdHJ1ZVxuICAgICAgQGFubm90YXRvci5lZGl0b3IuYWRkRmllbGQoe1xuICAgICAgICB0eXBlOiAgICdjaGVja2JveCdcbiAgICAgICAgbGFiZWw6ICBBbm5vdGF0b3IuX3QoJ0FsbG93IGFueW9uZSB0byA8c3Ryb25nPnZpZXc8L3N0cm9uZz4gdGhpcyBhbm5vdGF0aW9uJylcbiAgICAgICAgbG9hZDogICBjcmVhdGVDYWxsYmFjaygndXBkYXRlUGVybWlzc2lvbnNGaWVsZCcsICdyZWFkJylcbiAgICAgICAgc3VibWl0OiBjcmVhdGVDYWxsYmFjaygndXBkYXRlQW5ub3RhdGlvblBlcm1pc3Npb25zJywgJ3JlYWQnKVxuICAgICAgfSlcblxuICAgIGlmIEBvcHRpb25zLnNob3dFZGl0UGVybWlzc2lvbnNDaGVja2JveCA9PSB0cnVlXG4gICAgICBAYW5ub3RhdG9yLmVkaXRvci5hZGRGaWVsZCh7XG4gICAgICAgIHR5cGU6ICAgJ2NoZWNrYm94J1xuICAgICAgICBsYWJlbDogIEFubm90YXRvci5fdCgnQWxsb3cgYW55b25lIHRvIDxzdHJvbmc+ZWRpdDwvc3Ryb25nPiB0aGlzIGFubm90YXRpb24nKVxuICAgICAgICBsb2FkOiAgIGNyZWF0ZUNhbGxiYWNrKCd1cGRhdGVQZXJtaXNzaW9uc0ZpZWxkJywgJ3VwZGF0ZScpXG4gICAgICAgIHN1Ym1pdDogY3JlYXRlQ2FsbGJhY2soJ3VwZGF0ZUFubm90YXRpb25QZXJtaXNzaW9ucycsICd1cGRhdGUnKVxuICAgICAgfSlcblxuICAgICMgU2V0dXAgdGhlIGRpc3BsYXkgb2YgYW5ub3RhdGlvbnMgaW4gdGhlIFZpZXdlci5cbiAgICBAYW5ub3RhdG9yLnZpZXdlci5hZGRGaWVsZCh7XG4gICAgICBsb2FkOiB0aGlzLnVwZGF0ZVZpZXdlclxuICAgIH0pXG5cbiAgICAjIEFkZCBhIGZpbHRlciB0byB0aGUgRmlsdGVyIHBsdWdpbiBpZiBsb2FkZWQuXG4gICAgaWYgQGFubm90YXRvci5wbHVnaW5zLkZpbHRlclxuICAgICAgQGFubm90YXRvci5wbHVnaW5zLkZpbHRlci5hZGRGaWx0ZXIoe1xuICAgICAgICBsYWJlbDogQW5ub3RhdG9yLl90KCdVc2VyJylcbiAgICAgICAgcHJvcGVydHk6ICd1c2VyJ1xuICAgICAgICBpc0ZpbHRlcmVkOiAoaW5wdXQsIHVzZXIpID0+XG4gICAgICAgICAgdXNlciA9IEBvcHRpb25zLnVzZXJTdHJpbmcodXNlcilcblxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgaW5wdXQgYW5kIHVzZXJcbiAgICAgICAgICBmb3Iga2V5d29yZCBpbiAoaW5wdXQuc3BsaXQgL1xccyovKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIHVzZXIuaW5kZXhPZihrZXl3b3JkKSA9PSAtMVxuXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH0pXG5cbiAgIyBQdWJsaWM6IFNldHMgdGhlIFBlcm1pc3Npb25zI3VzZXIgcHJvcGVydHkuXG4gICNcbiAgIyB1c2VyIC0gQSBTdHJpbmcgb3IgT2JqZWN0IHRvIHJlcHJlc2VudCB0aGUgY3VycmVudCB1c2VyLlxuICAjXG4gICMgRXhhbXBsZXNcbiAgI1xuICAjICAgcGVybWlzc2lvbnMuc2V0VXNlcignQWxpY2UnKVxuICAjXG4gICMgICBwZXJtaXNzaW9ucy5zZXRVc2VyKHtpZDogMzUsIG5hbWU6ICdBbGljZSd9KVxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBzZXRVc2VyOiAodXNlcikgLT5cbiAgICBAdXNlciA9IHVzZXJcblxuICAjIEV2ZW50IGNhbGxiYWNrOiBBcHBlbmRzIHRoZSBAdXNlciBhbmQgQG9wdGlvbnMucGVybWlzc2lvbnMgb2JqZWN0cyB0byB0aGVcbiAgIyBwcm92aWRlZCBhbm5vdGF0aW9uIG9iamVjdC4gT25seSBhcHBlbmRzIHRoZSB1c2VyIGlmIG9uZSBoYXMgYmVlbiBzZXQuXG4gICNcbiAgIyBhbm5vdGF0aW9uIC0gQW4gYW5ub3RhdGlvbiBvYmplY3QuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBhbm5vdGF0aW9uID0ge3RleHQ6ICdNeSBjb21tZW50J31cbiAgIyAgIHBlcm1pc3Npb25zLmFkZEZpZWxkc1RvQW5ub3RhdGlvbihhbm5vdGF0aW9uKVxuICAjICAgY29uc29sZS5sb2coYW5ub3RhdGlvbilcbiAgIyAgICMgPT4ge3RleHQ6ICdNeSBjb21tZW50JywgcGVybWlzc2lvbnM6IHsuLi59fVxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBhZGRGaWVsZHNUb0Fubm90YXRpb246IChhbm5vdGF0aW9uKSA9PlxuICAgIGlmIGFubm90YXRpb25cbiAgICAgIGFubm90YXRpb24ucGVybWlzc2lvbnMgPSBAb3B0aW9ucy5wZXJtaXNzaW9uc1xuICAgICAgaWYgQHVzZXJcbiAgICAgICAgYW5ub3RhdGlvbi51c2VyID0gQHVzZXJcblxuICAjIFB1YmxpYzogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBhY3Rpb24gY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGVcbiAgIyBhbm5vdGF0aW9uLiBUaGlzIHVzZXMgdGhlIHVzZXItY29uZmlndXJhYmxlICd1c2VyQXV0aG9yaXplJyBtZXRob2QgdG9cbiAgIyBkZXRlcm1pbmUgaWYgYW4gYW5ub3RhdGlvbiBpcyBhbm5vdGF0YWJsZS4gU2VlIHRoZSBkZWZhdWx0IG1ldGhvZCBmb3JcbiAgIyBkb2N1bWVudGF0aW9uIG9uIGl0cyBiZWhhdmlvdXIuXG4gICNcbiAgIyBSZXR1cm5zIGEgQm9vbGVhbiwgdHJ1ZSBpZiB0aGUgYWN0aW9uIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlIGFubm90YXRpb24uXG4gIGF1dGhvcml6ZTogKGFjdGlvbiwgYW5ub3RhdGlvbiwgdXNlcikgLT5cbiAgICB1c2VyID0gQHVzZXIgaWYgdXNlciA9PSB1bmRlZmluZWRcblxuICAgIGlmIEBvcHRpb25zLnVzZXJBdXRob3JpemVcbiAgICAgIHJldHVybiBAb3B0aW9ucy51c2VyQXV0aG9yaXplLmNhbGwoQG9wdGlvbnMsIGFjdGlvbiwgYW5ub3RhdGlvbiwgdXNlcilcblxuICAgIGVsc2UgIyB1c2VyQXV0aG9yaXplIG51bGxlZCBvdXQ6IGZyZWUtZm9yLWFsbCFcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgIyBGaWVsZCBjYWxsYmFjazogVXBkYXRlcyB0aGUgc3RhdGUgb2YgdGhlIFwiYW55b25lIGNhbuKAplwiIGNoZWNrYm94ZXNcbiAgI1xuICAjIGFjdGlvbiAgICAgLSBUaGUgYWN0aW9uIFN0cmluZywgZWl0aGVyIFwidmlld1wiIG9yIFwidXBkYXRlXCJcbiAgIyBmaWVsZCAgICAgIC0gQSBET00gRWxlbWVudCBjb250YWluaW5nIGEgZm9ybSBpbnB1dC5cbiAgIyBhbm5vdGF0aW9uIC0gQW4gYW5ub3RhdGlvbiBPYmplY3QuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHVwZGF0ZVBlcm1pc3Npb25zRmllbGQ6IChhY3Rpb24sIGZpZWxkLCBhbm5vdGF0aW9uKSA9PlxuICAgIGZpZWxkID0gJChmaWVsZCkuc2hvdygpXG4gICAgaW5wdXQgPSBmaWVsZC5maW5kKCdpbnB1dCcpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJylcblxuICAgICMgRG8gbm90IHNob3cgZmllbGQgaWYgY3VycmVudCB1c2VyIGlzIG5vdCBhZG1pbi5cbiAgICBmaWVsZC5oaWRlKCkgdW5sZXNzIHRoaXMuYXV0aG9yaXplKCdhZG1pbicsIGFubm90YXRpb24pXG5cbiAgICAjIFNlZSBpZiB3ZSBjYW4gYXV0aG9yaXNlIHdpdGhvdXQgYSB1c2VyLlxuICAgIGlmIHRoaXMuYXV0aG9yaXplKGFjdGlvbiwgYW5ub3RhdGlvbiB8fCB7fSwgbnVsbClcbiAgICAgIGlucHV0LmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpXG4gICAgZWxzZVxuICAgICAgaW5wdXQucmVtb3ZlQXR0cignY2hlY2tlZCcpXG5cblxuICAjIEZpZWxkIGNhbGxiYWNrOiB1cGRhdGVzIHRoZSBhbm5vdGF0aW9uLnBlcm1pc3Npb25zIG9iamVjdCBiYXNlZCBvbiB0aGUgc3RhdGVcbiAgIyBvZiB0aGUgZmllbGQgY2hlY2tib3guIElmIGl0IGlzIGNoZWNrZWQgdGhlbiBwZXJtaXNzaW9ucyBhcmUgc2V0IHRvIHdvcmxkXG4gICMgd3JpdGFibGUgb3RoZXJ3aXNlIHRoZXkgdXNlIHRoZSBvcmlnaW5hbCBzZXR0aW5ncy5cbiAgI1xuICAjIGFjdGlvbiAgICAgLSBUaGUgYWN0aW9uIFN0cmluZywgZWl0aGVyIFwidmlld1wiIG9yIFwidXBkYXRlXCJcbiAgIyBmaWVsZCAgICAgIC0gQSBET00gRWxlbWVudCByZXByZXNlbnRpbmcgdGhlIGFubm90YXRpb24gZWRpdG9yLlxuICAjIGFubm90YXRpb24gLSBBbiBhbm5vdGF0aW9uIE9iamVjdC5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgdXBkYXRlQW5ub3RhdGlvblBlcm1pc3Npb25zOiAodHlwZSwgZmllbGQsIGFubm90YXRpb24pID0+XG4gICAgYW5ub3RhdGlvbi5wZXJtaXNzaW9ucyA9IEBvcHRpb25zLnBlcm1pc3Npb25zIHVubGVzcyBhbm5vdGF0aW9uLnBlcm1pc3Npb25zXG5cbiAgICBkYXRhS2V5ID0gdHlwZSArICctcGVybWlzc2lvbnMnXG5cbiAgICBpZiAkKGZpZWxkKS5maW5kKCdpbnB1dCcpLmlzKCc6Y2hlY2tlZCcpXG4gICAgICBhbm5vdGF0aW9uLnBlcm1pc3Npb25zW3R5cGVdID0gW11cbiAgICBlbHNlXG4gICAgICAjIENsZWFybHksIHRoZSBwZXJtaXNzaW9ucyBtb2RlbCBhbGxvd3MgZm9yIG1vcmUgY29tcGxleCBlbnRyaWVzIHRoYW4gdGhpcyxcbiAgICAgICMgYnV0IG91ciBVSSBwcmVzZW50cyBhIGNoZWNrYm94LCBzbyB3ZSBjYW4gb25seSBpbnRlcnByZXQgXCJwcmV2ZW50IG90aGVyc1xuICAgICAgIyBmcm9tIHZpZXdpbmdcIiBhcyBtZWFuaW5nIFwiYWxsb3cgb25seSBtZSB0byB2aWV3XCIuIFRoaXMgbWF5IHdhbnQgY2hhbmdpbmdcbiAgICAgICMgaW4gdGhlIGZ1dHVyZS5cbiAgICAgIGFubm90YXRpb24ucGVybWlzc2lvbnNbdHlwZV0gPSBbQG9wdGlvbnMudXNlcklkKEB1c2VyKV1cblxuICAjIEZpZWxkIGNhbGxiYWNrOiB1cGRhdGVzIHRoZSBhbm5vdGF0aW9uIHZpZXdlciB0byBpbmx1ZGUgdGhlIGRpc3BsYXkgbmFtZVxuICAjIGZvciB0aGUgdXNlciBvYnRhaW5lZCB0aHJvdWdoIFBlcm1pc3Npb25zI29wdGlvbnMudXNlclN0cmluZygpLlxuICAjXG4gICMgZmllbGQgICAgICAtIEEgRElWIEVsZW1lbnQgcmVwcmVzZW50aW5nIHRoZSBhbm5vdGF0aW9uIGZpZWxkLlxuICAjIGFubm90YXRpb24gLSBBbiBhbm5vdGF0aW9uIE9iamVjdCB0byBkaXNwbGF5LlxuICAjIGNvbnRyb2xzICAgLSBBIGNvbnRyb2wgT2JqZWN0IHRvIHRvZ2dsZSB0aGUgZGlzcGxheSBvZiBhbm5vdGF0aW9uIGNvbnRyb2xzLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICB1cGRhdGVWaWV3ZXI6IChmaWVsZCwgYW5ub3RhdGlvbiwgY29udHJvbHMpID0+XG4gICAgZmllbGQgPSAkKGZpZWxkKVxuXG4gICAgdXNlcm5hbWUgPSBAb3B0aW9ucy51c2VyU3RyaW5nIGFubm90YXRpb24udXNlclxuICAgIGlmIGFubm90YXRpb24udXNlciBhbmQgdXNlcm5hbWUgYW5kIHR5cGVvZiB1c2VybmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgdXNlciA9IEFubm90YXRvci5VdGlsLmVzY2FwZShAb3B0aW9ucy51c2VyU3RyaW5nKGFubm90YXRpb24udXNlcikpXG4gICAgICBmaWVsZC5odG1sKHVzZXIpLmFkZENsYXNzKCdhbm5vdGF0b3ItdXNlcicpXG4gICAgZWxzZVxuICAgICAgZmllbGQucmVtb3ZlKClcblxuICAgIGlmIGNvbnRyb2xzXG4gICAgICBjb250cm9scy5oaWRlRWRpdCgpICAgdW5sZXNzIHRoaXMuYXV0aG9yaXplKCd1cGRhdGUnLCBhbm5vdGF0aW9uKVxuICAgICAgY29udHJvbHMuaGlkZURlbGV0ZSgpIHVubGVzcyB0aGlzLmF1dGhvcml6ZSgnZGVsZXRlJywgYW5ub3RhdGlvbilcblxuICAjIFNldHMgdGhlIFBlcm1pc3Npb25zI3VzZXIgcHJvcGVydHkgb24gdGhlIGJhc2lzIG9mIGEgcmVjZWl2ZWQgYXV0aFRva2VuLlxuICAjXG4gICMgdG9rZW4gLSB0aGUgYXV0aFRva2VuIHJlY2VpdmVkIGJ5IHRoZSBBdXRoIHBsdWdpblxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBfc2V0QXV0aEZyb21Ub2tlbjogKHRva2VuKSA9PlxuICAgIHRoaXMuc2V0VXNlcih0b2tlbi51c2VySWQpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBBbm5vdGF0b3IuUGx1Z2luLlBlcm1pc3Npb25zXG4iXX0=