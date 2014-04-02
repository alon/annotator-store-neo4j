/*
** Annotator v2.0.0-dev-2312690
** https://github.com/okfn/annotator/
**
** Copyright 2014, the Annotator project contributors.
** Dual licensed under the MIT and GPLv3 licenses.
** https://github.com/okfn/annotator/blob/master/LICENSE
**
** Built at: 2014-03-07 15:34:19Z
*/
var rhizi_url = "http://rhizi-demo.herokuapp.com/";

!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.Annotator=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"VH1sEA":[function(_dereq_,module,exports){
(function (global){
var Annotator, self, _ref;

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


_dereq_('annotator-plugin-store');

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"annotator-plugin-store":"FjGiuh"}],"annotator":[function(_dereq_,module,exports){
module.exports=_dereq_('VH1sEA');
},{}],"FjGiuh":[function(_dereq_,module,exports){
var Annotator,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Annotator = _dereq_('annotator');

Annotator.Plugin.Store = (function() {
  Store.prototype.options = {
    annotationData: {},
    emulateHTTP: false,
    emulateJSON: false,
    prefix: '/store',
    urls: {
      create: '/annotations',
      read: '/annotations/:id',
      update: '/annotations/:id',
      destroy: '/annotations/:id',
      search: '/search'
    }
  };

  function Store(options) {
    this._onError = __bind(this._onError, this);
    this.options = $.extend(true, {}, this.options, options);
  }

  Store.prototype.create = function(anno) {
    // create function switch

     return this.create_rhizi(anno); // rhizi backend
    //return this.create_python(anno); // python backend
  }
  
  Store.prototype.create_rhizi = function(anno) {
    // send node creation POST request directly to rhizi
    
    // prep request data
    post_dict = {
        'name': anno['text'],
        'description': anno['text'],
        'quote': anno['quote'],  // actual text quoted by annotation
        'tags': anno['tags'],
        'shouldLoad': 'true',
        // 'color' : '#444444',
        // 'size' : '0..100',
        'url': ''}

    // prep request
    req_opts = {
            type: 'POST',
            dataType: "json",
            data: JSON.stringify(post_dict),
            contentType: "application/json; charset=utf-8",
            error: this._onError,
            complete: function (xhr, text) {
                //console.log(jQuery.parseJSON(text.responseText));
                var id = $.parseJSON(xhr.responseText)['_id'];
                jQuery(function() { setTimeout(function(){
                  window.open(rhizi_url + '?nodeID=' + id);
                  }, 2000)
                });
            }
    };
    
    request = $.ajax(rhizi_url + 'create_node', req_opts);
    return request;
  }
  
  Store.prototype.create_python = function(anno) {
    anno.uri = document.location.href;
    
    ret = this._apiRequest('create', anno);
    this.common();
    return ret;
  };

  Store.prototype.update = function(annotation) {
    return this._apiRequest('update', annotation);
  };

  Store.prototype["delete"] = function(annotation) {
    return this._apiRequest('destroy', annotation);
  };

  Store.prototype.query = function(queryObj) {
    var dfd;
    dfd = $.Deferred();
    this._apiRequest('search', queryObj).done(function(obj) {
      var rows;
      rows = obj.rows;
      delete obj.rows;
      return dfd.resolve(rows, obj);
    }).fail(function() {
      return dfd.reject.apply(dfd, arguments);
    });
    return dfd.promise();
  };

  Store.prototype._apiRequest = function(action, obj) {
    var id, options, request, url;
    id = obj && obj.id;
    url = this._urlFor(action, id);
    options = this._apiRequestOptions(action, obj);
    request = $.ajax(url, options);
    request._id = id;
    request._action = action;
    return request;
  };

  Store.prototype._apiRequestOptions = function(action, obj) {
    var data, method, opts;
    method = this._methodFor(action);
    opts = {
      type: method,
      dataType: "json",
      error: this._onError
    };
    if (this.options.emulateHTTP && (method === 'PUT' || method === 'DELETE')) {
      opts.headers = $.extend(opts.headers, {
        'X-HTTP-Method-Override': method
      });
      opts.type = 'POST';
    }
    if (action === "search") {
      opts = $.extend(opts, {
        data: obj
      });
      return opts;
    }
    data = obj && JSON.stringify(obj);
    if (this.options.emulateJSON) {
      opts.data = {
        json: data
      };
      if (this.options.emulateHTTP) {
        opts.data._method = method;
      }
      return opts;
    }
    opts = $.extend(opts, {
      data: data,
      contentType: "application/json; charset=utf-8"
    });
    return opts;
  };

  Store.prototype._urlFor = function(action, id) {
    var url;
    url = this.options.prefix != null ? this.options.prefix : '';
    url += this.options.urls[action];
    url = url.replace(/\/:id/, id != null ? '/' + id : '');
    url = url.replace(/:id/, id != null ? id : '');
    return url;
  };

  Store.prototype._methodFor = function(action) {
    var table;
    table = {
      'create': 'POST',
      'read': 'GET',
      'update': 'PUT',
      'destroy': 'DELETE',
      'search': 'GET'
    };
    return table[action];
  };

  Store.prototype._onError = function(xhr) {
    var action, message;
    action = xhr._action;
    message = Annotator._t("Sorry we could not ") + action + Annotator._t(" this annotation");
    if (xhr._action === 'search') {
      message = Annotator._t("Sorry we could not search the store for annotations");
    } else if (xhr._action === 'read' && !xhr._id) {
      message = Annotator._t("Sorry we could not ") + action + Annotator._t(" the annotations from the store");
    }
    switch (xhr.status) {
      case 401:
        message = Annotator._t("Sorry you are not allowed to ") + action + Annotator._t(" this annotation");
        break;
      case 404:
        message = Annotator._t("Sorry we could not connect to the annotations store");
        break;
      case 500:
        message = Annotator._t("Sorry something went wrong with the annotation store");
    }
    Annotator.showNotification(message, Annotator.Notification.ERROR);
    return console.error(Annotator._t("API request failed:") + (" '" + xhr.status + "'"));
  };

  return Store;

})();

module.exports = Annotator.Plugin.Store;


},{"annotator":"VH1sEA"}],"annotator-plugin-store":[function(_dereq_,module,exports){
module.exports=_dereq_('FjGiuh');
},{}]},{},["VH1sEA"])

("VH1sEA")
});

// #
// sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGtnL2Fubm90YXRvci5zdG9yZS5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5hbWVzcGFjZS5jb2ZmZWUiLCJwbHVnaW4vc3RvcmUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTtBQ0tBOztBQUFBO0FBQUEsU0FBTyxJQUFQO0NBQUE7O0FBQ0E7O0lBQUEsT0FBUTtHQUFSO0NBREE7O0FBRUE7O0lBQUEsT0FBUTtHQUFSO0NBRkE7O0FBQUE7OztFQU1BLHNCQUFhO0NBTmI7O0FBQUE7Ozs7Ozs7Ozs7QUNMQTtFQUFBOztBQUFBLFlBQVksUUFBUSxXQUFSLENBQVo7O0FBQUEsU0FvQmUsQ0FBQyxNQUFNLENBQUM7QUFHckIsNEJBSUU7QUFBQSxvQkFBZ0IsRUFBaEI7QUFBQSxJQU9BLGFBQWEsS0FQYjtBQUFBLElBV0EsYUFBYSxLQVhiO0FBQUEsSUFlQSxRQUFRLFFBZlI7QUFBQSxJQTBCQSxNQUNFO0FBQUEsY0FBUyxjQUFUO0FBQUEsTUFDQSxNQUFTLGtCQURUO0FBQUEsTUFFQSxRQUFTLGtCQUZUO0FBQUEsTUFHQSxTQUFTLGtCQUhUO0FBQUEsTUFJQSxRQUFTLFNBSlQ7S0EzQkY7R0FKRjs7QUFxRGEsaUJBQUMsT0FBRDtBQUNYO0FBQUEsUUFBQyxRQUFELEdBQVcsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFULEVBQWUsRUFBZixFQUFtQixJQUFDLFFBQXBCLEVBQTZCLE9BQTdCLENBQVgsQ0FEVztFQUFBLENBckRiOztBQUFBLGtCQW9FQSxTQUFRLFNBQUMsVUFBRDtXQUNOLElBQUksQ0FBQyxXQUFMLENBQWlCLFFBQWpCLEVBQTJCLFVBQTNCLEVBRE07RUFBQSxDQXBFUjs7QUFBQSxrQkFtRkEsU0FBUSxTQUFDLFVBQUQ7V0FDTixJQUFJLENBQUMsV0FBTCxDQUFpQixRQUFqQixFQUEyQixVQUEzQixFQURNO0VB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LENBQWEsa0JBQWIsQ0FBbkUsQ0FEaEI7QUFDTztBQURQLFdBRU8sR0FGUDtBQUVnQixrQkFBVSxTQUFTLENBQUMsRUFBVixDQUFhLHFEQUFiLENBQVYsQ0FGaEI7QUFFTztBQUZQLFdBR08sR0FIUDtBQUdnQixrQkFBVSxTQUFTLENBQUMsRUFBVixDQUFhLHNEQUFiLENBQVYsQ0FIaEI7QUFBQSxLQVJBO0FBQUEsSUFhQSxTQUFTLENBQUMsZ0JBQVYsQ0FBMkIsT0FBM0IsRUFBb0MsU0FBUyxDQUFDLFlBQVksQ0FBQyxLQUEzRCxDQWJBO1dBZUEsT0FBTyxDQUFDLEtBQVIsQ0FBYyxTQUFTLENBQUMsRUFBVixDQUFhLHFCQUFiLElBQXNDLENBQUMsT0FBRyxHQUFHLENBQUMsTUFBUCxHQUFlLEdBQWhCLENBQXBELEVBaEJRO0VBQUEsQ0FsUFY7O2VBQUE7O0lBdkJGOztBQUFBLE1BNFJNLENBQUMsT0FBUCxHQUFpQixTQUFTLENBQUMsTUFBTSxDQUFDLEtBNVJsQyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIyBJbiBvcmRlciB0byBidWlsZCBwb3J0YWJsZSBleHRlbnNpb24gYnVuZGxlcyB0aGF0IGNhbiBiZSB1c2VkIHdpdGggQU1EIGFuZFxuIyBzY3JpcHQgY29uY2F0ZW5hdGlvbiBwbHVnaW5zIGFyZSBidWlsdCB3aXRoIHRoaXMgbW9kdWxlIGFzICdhbm5vdGF0b3InLlxuXG4jIEFubm90YXRvciB3aWxsIGV4cG9ydCBpdHNlbGYgZ2xvYmFsbHkgd2hlbiB0aGUgYnVpbHQgVU1EIG1vZHVsZXMgYXJlIHVzZWQgaW5cbiMgYSBsZWdhY3kgZW52aXJvbm1lbnQgb2Ygc2ltcGxlIHNjcmlwdCBjb25jYXRlbmF0aW9uLlxuc2VsZiA9IHNlbGYgaWYgc2VsZj9cbnNlbGYgPz0gZ2xvYmFsIGlmIGdsb2JhbD9cbnNlbGYgPz0gd2luZG93IGlmIHdpbmRvdz9cbkFubm90YXRvciA9IHNlbGY/LkFubm90YXRvclxuXG4jIEluIGEgcHVyZSBBTUQgZW52aXJvbm1lbnQsIEFubm90YXRvciBtYXkgbm90IGJlIGV4cG9ydGVkIGdsb2JhbGx5LlxuQW5ub3RhdG9yID89IGlmIHNlbGY/LmRlZmluZT8uYW1kIHRoZW4gc2VsZj8ucmVxdWlyZSgnYW5ub3RhdG9yJylcblxuIyBOb3RlOiB3aGVuIHdvcmtpbmcgaW4gYSBDb21tb25KUyBlbnZpcm9ubWVudCBhbmQgYnVuZGxpbmcgcmVxdWlyZW1lbnRzIGludG9cbiMgYXBwbGljYXRpb25zIHRoZW4gcmVxdWlyZSBjYWxscyBzaG91bGQgcmVmZXIgdG8gbW9kdWxlcyBmcm9tIHRoZSBucG0gbGliXG4jIGRpcmVjdG9yeSBvZiBhbm5vdGF0b3IgcGFja2FnZSBhbmQgYXZvaWQgdGhpcyBhbHRvZ2V0aGVyLlxubW9kdWxlLmV4cG9ydHMgPSBBbm5vdGF0b3JcbiIsIkFubm90YXRvciA9IHJlcXVpcmUoJ2Fubm90YXRvcicpXG5cblxuIyBQdWJsaWM6IFRoZSBTdG9yZSBwbHVnaW4gY2FuIGJlIHVzZWQgdG8gcGVyc2lzdCBhbm5vdGF0aW9ucyB0byBhIGRhdGFiYXNlXG4jIHJ1bm5pbmcgb24geW91ciBzZXJ2ZXIuIEl0IGhhcyBhIHNpbXBsZSBjdXN0b21pc2FibGUgaW50ZXJmYWNlIHRoYXQgY2FuIGJlXG4jIGltcGxlbWVudGVkIHdpdGggYW55IHdlYiBmcmFtZXdvcmsuIEl0IHdvcmtzIGJ5IGxpc3RlbmluZyB0byBldmVudHMgcHVibGlzaGVkXG4jIGJ5IHRoZSBBbm5vdGF0b3IgYW5kIG1ha2luZyBhcHByb3ByaWF0ZSByZXF1ZXN0cyB0byB0aGUgc2VydmVyIGRlcGVuZGluZyBvblxuIyB0aGUgZXZlbnQuXG4jXG4jIFRoZSBzdG9yZSBoYW5kbGVzIGZpdmUgZGlzdGluY3QgYWN0aW9ucyBcInJlYWRcIiwgXCJzZWFyY2hcIiwgXCJjcmVhdGVcIiwgXCJ1cGRhdGVcIlxuIyBhbmQgXCJkZXN0b3J5XCIuIFRoZSByZXF1ZXN0cyBtYWRlIGNhbiBiZSBjdXN0b21pc2VkIHdpdGggb3B0aW9ucyB3aGVuIHRoZVxuIyBwbHVnaW4gaXMgYWRkZWQgdG8gdGhlIEFubm90YXRvci4gQ3VzdG9tIGhlYWRlcnMgY2FuIGFsc28gYmUgc2VudCB3aXRoIGV2ZXJ5XG4jIHJlcXVlc3QgYnkgc2V0dGluZyBhICQuZGF0YSBrZXkgb24gdGhlIEFubm90YXRpb24jZWxlbWVudCBjb250YWluaW5nIGhlYWRlcnNcbiMgdG8gc2VuZC4gZS5nOlxuI1xuIyAgIGFubm90YXRvci5lbGVtZW50LmRhdGEoJ2Fubm90YXRpb246aGVhZGVycycsIHtcbiMgICAgICdYLU15LUN1c3RvbS1IZWFkZXInOiAnTXlDdXN0b21WYWx1ZSdcbiMgICB9KVxuI1xuIyBUaGlzIGhlYWRlciB3aWxsIG5vdyBiZSBzZW50IHdpdGggZXZlcnkgcmVxdWVzdC5cbmNsYXNzIEFubm90YXRvci5QbHVnaW4uU3RvcmVcblxuICAjIFVzZXIgY3VzdG9taXNhYmxlIG9wdGlvbnMgYXZhaWxhYmxlLlxuICBvcHRpb25zOlxuXG4gICAgIyBDdXN0b20gbWV0YSBkYXRhIHRoYXQgd2lsbCBiZSBhdHRhY2hlZCB0byBldmVyeSBhbm5vdGF0aW9uIHRoYXQgaXMgc2VudFxuICAgICMgdG8gdGhlIHNlcnZlci4gVGhpcyBfd2lsbF8gb3ZlcnJpZGUgcHJldmlvdXMgdmFsdWVzLlxuICAgIGFubm90YXRpb25EYXRhOiB7fVxuXG4gICAgIyBTaG91bGQgdGhlIHBsdWdpbiBlbXVsYXRlIEhUVFAgbWV0aG9kcyBsaWtlIFBVVCBhbmQgREVMRVRFIGZvclxuICAgICMgaW50ZXJhY3Rpb24gd2l0aCBsZWdhY3kgd2ViIHNlcnZlcnM/IFNldHRpbmcgdGhpcyB0byBgdHJ1ZWAgd2lsbCBmYWtlXG4gICAgIyBIVFRQIGBQVVRgIGFuZCBgREVMRVRFYCByZXF1ZXN0cyB3aXRoIGFuIEhUVFAgYFBPU1RgLCBhbmQgd2lsbCBzZXQgdGhlXG4gICAgIyByZXF1ZXN0IGhlYWRlciBgWC1IVFRQLU1ldGhvZC1PdmVycmlkZWAgd2l0aCB0aGUgbmFtZSBvZiB0aGUgZGVzaXJlZFxuICAgICMgbWV0aG9kLlxuICAgIGVtdWxhdGVIVFRQOiBmYWxzZVxuXG4gICAgIyBTaG91bGQgdGhlIHBsdWdpbiBlbXVsYXRlIEpTT04gUE9TVC9QVVQgcGF5bG9hZHMgYnkgc2VuZGluZyBpdHMgcmVxdWVzdHNcbiAgICAjIGFzIGFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCB3aXRoIGEgc2luZ2xlIGtleSwgXCJqc29uXCJcbiAgICBlbXVsYXRlSlNPTjogZmFsc2VcblxuICAgICMgVGhpcyBpcyB0aGUgQVBJIGVuZHBvaW50LiBJZiB0aGUgc2VydmVyIHN1cHBvcnRzIENyb3NzIE9yaWdpbiBSZXNvdXJjZVxuICAgICMgU2hhcmluZyAoQ09SUykgYSBmdWxsIFVSTCBjYW4gYmUgdXNlZCBoZXJlLlxuICAgIHByZWZpeDogJy9zdG9yZSdcblxuICAgICMgVGhlIHNlcnZlciBVUkxzIGZvciBlYWNoIGF2YWlsYWJsZSBhY3Rpb24uIFRoZXNlIFVSTHMgY2FuIGJlIGFueXRoaW5nIGJ1dFxuICAgICMgbXVzdCByZXNwb25kIHRvIHRoZSBhcHByb3ByYWl0ZSBIVFRQIG1ldGhvZC4gVGhlIHRva2VuIFwiOmlkXCIgY2FuIGJlIHVzZWRcbiAgICAjIGFueXdoZXJlIGluIHRoZSBVUkwgYW5kIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCB0aGUgYW5ub3RhdGlvbiBpZC5cbiAgICAjXG4gICAgIyByZWFkOiAgICBHRVRcbiAgICAjIGNyZWF0ZTogIFBPU1RcbiAgICAjIHVwZGF0ZTogIFBVVFxuICAgICMgZGVzdHJveTogREVMRVRFXG4gICAgIyBzZWFyY2g6ICBHRVRcbiAgICB1cmxzOlxuICAgICAgY3JlYXRlOiAgJy9hbm5vdGF0aW9ucydcbiAgICAgIHJlYWQ6ICAgICcvYW5ub3RhdGlvbnMvOmlkJ1xuICAgICAgdXBkYXRlOiAgJy9hbm5vdGF0aW9ucy86aWQnXG4gICAgICBkZXN0cm95OiAnL2Fubm90YXRpb25zLzppZCdcbiAgICAgIHNlYXJjaDogICcvc2VhcmNoJ1xuXG4gICMgUHVibGljOiBUaGUgY29udHNydWN0b3IgaW5pdGFpbGFzZXMgdGhlIFN0b3JlIGluc3RhbmNlLiBJdCByZXF1aXJlcyB0aGVcbiAgIyBBbm5vdGF0b3IjZWxlbWVudCBhbmQgYW4gT2JqZWN0IG9mIG9wdGlvbnMuXG4gICNcbiAgIyBlbGVtZW50IC0gVGhpcyBtdXN0IGJlIHRoZSBBbm5vdGF0b3IjZWxlbWVudCBpbiBvcmRlciB0byBsaXN0ZW4gZm9yIGV2ZW50cy5cbiAgIyBvcHRpb25zIC0gQW4gT2JqZWN0IG9mIGtleS92YWx1ZSB1c2VyIG9wdGlvbnMuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBzdG9yZSA9IG5ldyBBbm5vdGF0b3IuUGx1Z2luLlN0b3JlKEFubm90YXRvci5lbGVtZW50LCB7XG4gICMgICAgIHByZWZpeDogJ2h0dHA6Ly9hbm5vdGF0ZWl0Lm9yZycsXG4gICMgICAgIGFubm90YXRpb25EYXRhOiB7XG4gICMgICAgICAgdXJpOiB3aW5kb3cubG9jYXRpb24uaHJlZlxuICAjICAgICB9XG4gICMgICB9KVxuICAjXG4gICMgUmV0dXJucyBhIG5ldyBpbnN0YW5jZSBvZiBTdG9yZS5cbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBvcHRpb25zLCBvcHRpb25zKVxuXG4gICMgUHVibGljOiBDYWxsYmFjayBtZXRob2QgZm9yIGFubm90YXRpb25DcmVhdGVkIGV2ZW50LiBSZWNlaXZlcyBhbiBhbm5vdGF0aW9uXG4gICMgYW5kIHNlbmRzIGEgUE9TVCByZXF1ZXN0IHRvIHRoZSBzZXJ2ZXIgdXNpbmcgdGhlIFVSSSBmb3IgdGhlIFwiY3JlYXRlXCIgYWN0aW9uLlxuICAjXG4gICMgYW5ub3RhdGlvbiAtIEFuIGFubm90YXRpb24gT2JqZWN0IHRoYXQgd2FzIGNyZWF0ZWQuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBzdG9yZS5hbm5vdGF0aW9uQ3JlYXRlZCh7dGV4dDogXCJteSBuZXcgYW5ub3RhdGlvbiBjb21tZW50XCJ9KVxuICAjICAgIyA9PiBSZXN1bHRzIGluIGFuIEhUVFAgUE9TVCByZXF1ZXN0IHRvIHRoZSBzZXJ2ZXIgY29udGFpbmluZyB0aGVcbiAgIyAgICMgICAgYW5ub3RhdGlvbiBhcyBzZXJpYWxpc2VkIEpTT04uXG4gICNcbiAgIyBSZXR1cm5zIGEganFYSFIgb2JqZWN0LlxuICBjcmVhdGU6IChhbm5vdGF0aW9uKSAtPlxuICAgIHRoaXMuX2FwaVJlcXVlc3QoJ2NyZWF0ZScsIGFubm90YXRpb24pXG5cbiAgIyBQdWJsaWM6IENhbGxiYWNrIG1ldGhvZCBmb3IgYW5ub3RhdGlvblVwZGF0ZWQgZXZlbnQuIFJlY2VpdmVzIGFuIGFubm90YXRpb25cbiAgIyBhbmQgc2VuZHMgYSBQVVQgcmVxdWVzdCB0byB0aGUgc2V2ZXIgdXNpbmcgdGhlIFVSSSBmb3IgdGhlIFwidXBkYXRlXCIgYWN0aW9uLlxuICAjXG4gICMgYW5ub3RhdGlvbiAtIEFuIGFubm90YXRpb24gT2JqZWN0IHRoYXQgd2FzIHVwZGF0ZWQuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBzdG9yZS5hbm5vdGF0aW9uVXBkYXRlZCh7aWQ6IFwiYmxhaFwiLCB0ZXh0OiBcInVwZGF0ZWQgYW5ub3RhdGlvbiBjb21tZW50XCJ9KVxuICAjICAgIyA9PiBSZXN1bHRzIGluIGFuIEhUVFAgUFVUIHJlcXVlc3QgdG8gdGhlIHNlcnZlciBjb250YWluaW5nIHRoZVxuICAjICAgIyAgICBhbm5vdGF0aW9uIGFzIHNlcmlhbGlzZWQgSlNPTi5cbiAgI1xuICAjIFJldHVybnMgYSBqcVhIUiBvYmplY3QuXG4gIHVwZGF0ZTogKGFubm90YXRpb24pIC0+XG4gICAgdGhpcy5fYXBpUmVxdWVzdCgndXBkYXRlJywgYW5ub3RhdGlvbilcblxuICAjIFB1YmxpYzogQ2FsbGJhY2sgbWV0aG9kIGZvciBhbm5vdGF0aW9uRGVsZXRlZCBldmVudC4gUmVjZWl2ZXMgYW4gYW5ub3RhdGlvblxuICAjIGFuZCBzZW5kcyBhIERFTEVURSByZXF1ZXN0IHRvIHRoZSBzZXJ2ZXIgdXNpbmcgdGhlIFVSSSBmb3IgdGhlIGRlc3Ryb3lcbiAgIyBhY3Rpb24uXG4gICNcbiAgIyBhbm5vdGF0aW9uIC0gQW4gYW5ub3RhdGlvbiBPYmplY3QgdGhhdCB3YXMgZGVsZXRlZC5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIHN0b3JlLmFubm90YXRpb25EZWxldGVkKHt0ZXh0OiBcIm15IG5ldyBhbm5vdGF0aW9uIGNvbW1lbnRcIn0pXG4gICMgICAjID0+IFJlc3VsdHMgaW4gYW4gSFRUUCBERUxFVEUgcmVxdWVzdCB0byB0aGUgc2VydmVyLlxuICAjXG4gICMgUmV0dXJucyBhIGpxWEhSIG9iamVjdC5cbiAgZGVsZXRlOiAoYW5ub3RhdGlvbikgLT5cbiAgICB0aGlzLl9hcGlSZXF1ZXN0KCdkZXN0cm95JywgYW5ub3RhdGlvbilcblxuICAjIFB1YmxpYzogU2VhcmNoZXMgZm9yIGFubm90YXRpb25zIG1hdGNoaW5nIHRoZSBzcGVjaWZpZWQgcXVlcnkuXG4gICNcbiAgIyBSZXR1cm5zIGEgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIHF1ZXJ5IHJlc3VsdHMgYW5kIHF1ZXJ5IG1ldGFkYXRhLlxuICBxdWVyeTogKHF1ZXJ5T2JqKSAtPlxuICAgIGRmZCA9ICQuRGVmZXJyZWQoKVxuICAgIHRoaXMuX2FwaVJlcXVlc3QoJ3NlYXJjaCcsIHF1ZXJ5T2JqKVxuICAgICAgLmRvbmUgKG9iaikgLT5cbiAgICAgICAgcm93cyA9IG9iai5yb3dzXG4gICAgICAgIGRlbGV0ZSBvYmoucm93c1xuICAgICAgICBkZmQucmVzb2x2ZShyb3dzLCBvYmopXG4gICAgICAuZmFpbCAoKSAtPlxuICAgICAgICBkZmQucmVqZWN0LmFwcGx5KGRmZCwgYXJndW1lbnRzKVxuICAgIHJldHVybiBkZmQucHJvbWlzZSgpXG5cbiAgIyBDYWxsYmFjayBtZXRob2QgZm9yIFN0b3JlI2xvYWRBbm5vdGF0aW9uc0Zyb21TZWFyY2goKS4gUHJvY2Vzc2VzIHRoZSBkYXRhXG4gICMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyIChhIEpTT04gYXJyYXkgb2YgYW5ub3RhdGlvbiBPYmplY3RzKSBhbmQgdXBkYXRlc1xuICAjIHRoZSByZWdpc3RyeSBhcyB3ZWxsIGFzIGxvYWRpbmcgdGhlbSBpbnRvIHRoZSBBbm5vdGF0b3IuXG4gICMgUmV0dXJucyB0aGUgalF1ZXJ5IFhNTEh0dHBSZXF1ZXN0IHdyYXBwZXIgZW5hYmxpbmcgYWRkaXRpb25hbCBjYWxsYmFja3MgdG9cbiAgIyBiZSBhcHBsaWVkIGFzIHdlbGwgYXMgY3VzdG9tIGVycm9yIGhhbmRsaW5nLlxuICAjXG4gICMgYWN0aW9uICAgIC0gVGhlIGFjdGlvbiBTdHJpbmcgZWcuIFwicmVhZFwiLCBcInNlYXJjaFwiLCBcImNyZWF0ZVwiLCBcInVwZGF0ZVwiXG4gICMgICAgICAgICAgICAgb3IgXCJkZXN0b3J5XCIuXG4gICMgb2JqICAgICAgIC0gVGhlIGRhdGEgdG8gYmUgc2VudCwgZWl0aGVyIGFubm90YXRpb24gb2JqZWN0IG9yIHF1ZXJ5IHN0cmluZy5cbiAgIyBvblN1Y2Nlc3MgLSBBIGNhbGxiYWNrIEZ1bmN0aW9uIHRvIGNhbGwgb24gc3VjY2Vzc2Z1bCByZXF1ZXN0LlxuICAjXG4gICMgRXhhbXBsZXM6XG4gICNcbiAgIyAgIHN0b3JlLl9hcGlSZXF1ZXN0KCdyZWFkJywge2lkOiA0fSwgKGRhdGEpIC0+IGNvbnNvbGUubG9nKGRhdGEpKVxuICAjICAgIyA9PiBPdXRwdXRzIHRoZSBhbm5vdGF0aW9uIHJldHVybmVkIGZyb20gdGhlIHNlcnZlci5cbiAgI1xuICAjIFJldHVybnMgWE1MSHR0cFJlcXVlc3Qgb2JqZWN0LlxuICBfYXBpUmVxdWVzdDogKGFjdGlvbiwgb2JqKSAtPlxuICAgIGlkID0gb2JqICYmIG9iai5pZFxuICAgIHVybCA9IHRoaXMuX3VybEZvcihhY3Rpb24sIGlkKVxuICAgIG9wdGlvbnMgPSB0aGlzLl9hcGlSZXF1ZXN0T3B0aW9ucyhhY3Rpb24sIG9iailcblxuICAgIHJlcXVlc3QgPSAkLmFqYXgodXJsLCBvcHRpb25zKVxuXG4gICAgIyBBcHBlbmQgdGhlIGlkIGFuZCBhY3Rpb24gdG8gdGhlIHJlcXVlc3Qgb2JqZWN0XG4gICAgIyBmb3IgdXNlIGluIHRoZSBlcnJvciBjYWxsYmFjay5cbiAgICByZXF1ZXN0Ll9pZCA9IGlkXG4gICAgcmVxdWVzdC5fYWN0aW9uID0gYWN0aW9uXG4gICAgcmVxdWVzdFxuXG4gICMgQnVpbGRzIGFuIG9wdGlvbnMgb2JqZWN0IHN1aXRhYmxlIGZvciB1c2UgaW4gYSBqUXVlcnkuYWpheCgpIGNhbGwuXG4gICNcbiAgIyBhY3Rpb24gICAgLSBUaGUgYWN0aW9uIFN0cmluZyBlZy4gXCJyZWFkXCIsIFwic2VhcmNoXCIsIFwiY3JlYXRlXCIsIFwidXBkYXRlXCJcbiAgIyAgICAgICAgICAgICBvciBcImRlc3Ryb3lcIi5cbiAgIyBvYmogICAgICAgLSBUaGUgZGF0YSB0byBiZSBzZW50LCBlaXRoZXIgYW5ub3RhdGlvbiBvYmplY3Qgb3IgcXVlcnkgc3RyaW5nLlxuICAjXG4gICMgUmV0dXJucyBPYmplY3QgbGl0ZXJhbCBvZiAkLmFqYXgoKSBvcHRpb25zLlxuICBfYXBpUmVxdWVzdE9wdGlvbnM6IChhY3Rpb24sIG9iaikgLT5cbiAgICBtZXRob2QgPSB0aGlzLl9tZXRob2RGb3IoYWN0aW9uKVxuXG4gICAgb3B0cyA9IHtcbiAgICAgIHR5cGU6ICAgICBtZXRob2QsXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBlcnJvcjogICAgdGhpcy5fb25FcnJvclxuICAgIH1cblxuICAgICMgSWYgZW11bGF0ZUhUVFAgaXMgZW5hYmxlZCwgd2Ugc2VuZCBhIFBPU1QgYW5kIHB1dCB0aGUgcmVhbCBtZXRob2QgaW4gYW5cbiAgICAjIEhUVFAgcmVxdWVzdCBoZWFkZXIuXG4gICAgaWYgQG9wdGlvbnMuZW11bGF0ZUhUVFAgYW5kIG1ldGhvZCBpbiBbJ1BVVCcsICdERUxFVEUnXVxuICAgICAgb3B0cy5oZWFkZXJzID0gJC5leHRlbmQob3B0cy5oZWFkZXJzLCB7J1gtSFRUUC1NZXRob2QtT3ZlcnJpZGUnOiBtZXRob2R9KVxuICAgICAgb3B0cy50eXBlID0gJ1BPU1QnXG5cbiAgICAjIERvbid0IEpTT05pZnkgb2JqIGlmIG1ha2luZyBzZWFyY2ggcmVxdWVzdC5cbiAgICBpZiBhY3Rpb24gaXMgXCJzZWFyY2hcIlxuICAgICAgb3B0cyA9ICQuZXh0ZW5kKG9wdHMsIGRhdGE6IG9iailcbiAgICAgIHJldHVybiBvcHRzXG5cbiAgICBkYXRhID0gb2JqICYmIEpTT04uc3RyaW5naWZ5KG9iailcblxuICAgICMgSWYgZW11bGF0ZUpTT04gaXMgZW5hYmxlZCwgd2Ugc2VuZCBhIGZvcm0gcmVxdWVzdCAodGhlIGNvcnJlY3RcbiAgICAjIGNvbnRlbnRUeXBlIHdpbGwgYmUgc2V0IGF1dG9tYXRpY2FsbHkgYnkgalF1ZXJ5KSwgYW5kIHB1dCB0aGVcbiAgICAjIEpTT04tZW5jb2RlZCBwYXlsb2FkIGluIHRoZSBcImpzb25cIiBrZXkuXG4gICAgaWYgQG9wdGlvbnMuZW11bGF0ZUpTT05cbiAgICAgIG9wdHMuZGF0YSA9IHtqc29uOiBkYXRhfVxuICAgICAgaWYgQG9wdGlvbnMuZW11bGF0ZUhUVFBcbiAgICAgICAgb3B0cy5kYXRhLl9tZXRob2QgPSBtZXRob2RcbiAgICAgIHJldHVybiBvcHRzXG5cbiAgICBvcHRzID0gJC5leHRlbmQob3B0cywge1xuICAgICAgZGF0YTogZGF0YVxuICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiXG4gICAgfSlcbiAgICByZXR1cm4gb3B0c1xuXG4gICMgQnVpbGRzIHRoZSBhcHByb3ByaWF0ZSBVUkwgZnJvbSB0aGUgb3B0aW9ucyBmb3IgdGhlIGFjdGlvbiBwcm92aWRlZC5cbiAgI1xuICAjIGFjdGlvbiAtIFRoZSBhY3Rpb24gU3RyaW5nLlxuICAjIGlkICAgICAtIFRoZSBhbm5vdGF0aW9uIGlkIGFzIGEgU3RyaW5nIG9yIE51bWJlci5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIHN0b3JlLl91cmxGb3IoJ3VwZGF0ZScsIDM0KVxuICAjICAgIyA9PiBSZXR1cm5zIFwiL3N0b3JlL2Fubm90YXRpb25zLzM0XCJcbiAgI1xuICAjICAgc3RvcmUuX3VybEZvcignc2VhcmNoJylcbiAgIyAgICMgPT4gUmV0dXJucyBcIi9zdG9yZS9zZWFyY2hcIlxuICAjXG4gICMgUmV0dXJucyBVUkwgU3RyaW5nLlxuICBfdXJsRm9yOiAoYWN0aW9uLCBpZCkgLT5cbiAgICB1cmwgPSBpZiBAb3B0aW9ucy5wcmVmaXg/IHRoZW4gQG9wdGlvbnMucHJlZml4IGVsc2UgJydcbiAgICB1cmwgKz0gQG9wdGlvbnMudXJsc1thY3Rpb25dXG4gICAgIyBJZiB0aGVyZSdzIGEgJy86aWQnIGluIHRoZSBVUkwsIGVpdGhlciBmaWxsIGluIHRoZSBJRCBvciByZW1vdmUgdGhlXG4gICAgIyBzbGFzaDpcbiAgICB1cmwgPSB1cmwucmVwbGFjZSgvXFwvOmlkLywgaWYgaWQ/IHRoZW4gJy8nICsgaWQgZWxzZSAnJylcbiAgICAjIElmIHRoZXJlJ3MgYSBiYXJlICc6aWQnIGluIHRoZSBVUkwsIHRoZW4gc3Vic3RpdHV0ZSBkaXJlY3RseTpcbiAgICB1cmwgPSB1cmwucmVwbGFjZSgvOmlkLywgaWYgaWQ/IHRoZW4gaWQgZWxzZSAnJylcblxuICAgIHVybFxuXG4gICMgTWFwcyBhbiBhY3Rpb24gdG8gYW4gSFRUUCBtZXRob2QuXG4gICNcbiAgIyBhY3Rpb24gLSBUaGUgYWN0aW9uIFN0cmluZy5cbiAgI1xuICAjIEV4YW1wbGVzXG4gICNcbiAgIyAgIHN0b3JlLl9tZXRob2RGb3IoJ3JlYWQnKSAgICAjID0+IFwiR0VUXCJcbiAgIyAgIHN0b3JlLl9tZXRob2RGb3IoJ3VwZGF0ZScpICAjID0+IFwiUFVUXCJcbiAgIyAgIHN0b3JlLl9tZXRob2RGb3IoJ2Rlc3Ryb3knKSAjID0+IFwiREVMRVRFXCJcbiAgI1xuICAjIFJldHVybnMgSFRUUCBtZXRob2QgU3RyaW5nLlxuICBfbWV0aG9kRm9yOiAoYWN0aW9uKSAtPlxuICAgIHRhYmxlID0ge1xuICAgICAgJ2NyZWF0ZSc6ICAnUE9TVCdcbiAgICAgICdyZWFkJzogICAgJ0dFVCdcbiAgICAgICd1cGRhdGUnOiAgJ1BVVCdcbiAgICAgICdkZXN0cm95JzogJ0RFTEVURSdcbiAgICAgICdzZWFyY2gnOiAgJ0dFVCdcbiAgICB9XG5cbiAgICB0YWJsZVthY3Rpb25dXG5cbiAgIyBqUXVlcnkuYWpheCgpIGNhbGxiYWNrLiBEaXNwbGF5cyBhbiBlcnJvciBub3RpZmljYXRpb24gdG8gdGhlIHVzZXIgaWZcbiAgIyB0aGUgcmVxdWVzdCBmYWlsZWQuXG4gICNcbiAgIyB4aHIgLSBUaGUgalhNTEh0dHBSZXF1ZXN0IG9iamVjdC5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgX29uRXJyb3I6ICh4aHIpID0+XG4gICAgYWN0aW9uICA9IHhoci5fYWN0aW9uXG4gICAgbWVzc2FnZSA9IEFubm90YXRvci5fdChcIlNvcnJ5IHdlIGNvdWxkIG5vdCBcIikgKyBhY3Rpb24gKyBBbm5vdGF0b3IuX3QoXCIgdGhpcyBhbm5vdGF0aW9uXCIpXG5cbiAgICBpZiB4aHIuX2FjdGlvbiA9PSAnc2VhcmNoJ1xuICAgICAgbWVzc2FnZSA9IEFubm90YXRvci5fdChcIlNvcnJ5IHdlIGNvdWxkIG5vdCBzZWFyY2ggdGhlIHN0b3JlIGZvciBhbm5vdGF0aW9uc1wiKVxuICAgIGVsc2UgaWYgeGhyLl9hY3Rpb24gPT0gJ3JlYWQnICYmICF4aHIuX2lkXG4gICAgICBtZXNzYWdlID0gQW5ub3RhdG9yLl90KFwiU29ycnkgd2UgY291bGQgbm90IFwiKSArIGFjdGlvbiArIEFubm90YXRvci5fdChcIiB0aGUgYW5ub3RhdGlvbnMgZnJvbSB0aGUgc3RvcmVcIilcblxuICAgIHN3aXRjaCB4aHIuc3RhdHVzXG4gICAgICB3aGVuIDQwMSB0aGVuIG1lc3NhZ2UgPSBBbm5vdGF0b3IuX3QoXCJTb3JyeSB5b3UgYXJlIG5vdCBhbGxvd2VkIHRvIFwiKSArIGFjdGlvbiArIEFubm90YXRvci5fdChcIiB0aGlzIGFubm90YXRpb25cIilcbiAgICAgIHdoZW4gNDA0IHRoZW4gbWVzc2FnZSA9IEFubm90YXRvci5fdChcIlNvcnJ5IHdlIGNvdWxkIG5vdCBjb25uZWN0IHRvIHRoZSBhbm5vdGF0aW9ucyBzdG9yZVwiKVxuICAgICAgd2hlbiA1MDAgdGhlbiBtZXNzYWdlID0gQW5ub3RhdG9yLl90KFwiU29ycnkgc29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCB0aGUgYW5ub3RhdGlvbiBzdG9yZVwiKVxuXG4gICAgQW5ub3RhdG9yLnNob3dOb3RpZmljYXRpb24gbWVzc2FnZSwgQW5ub3RhdG9yLk5vdGlmaWNhdGlvbi5FUlJPUlxuXG4gICAgY29uc29sZS5lcnJvciBBbm5vdGF0b3IuX3QoXCJBUEkgcmVxdWVzdCBmYWlsZWQ6XCIpICsgXCIgJyN7eGhyLnN0YXR1c30nXCJcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFubm90YXRvci5QbHVnaW4uU3RvcmVcbiJdfQ==
