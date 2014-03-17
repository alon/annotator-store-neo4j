/*
** Annotator v2.0.0-dev-dev-9dfff13
** https://github.com/okfn/annotator/
**
** Copyright 2014, the Annotator project contributors.
** Dual licensed under the MIT and GPLv3 licenses.
** https://github.com/okfn/annotator/blob/master/LICENSE
**
** Built at: 2014-03-06 10:35:30Z
*/
!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Annotator=e():"undefined"!=typeof global?global.Annotator=e():"undefined"!=typeof self&&(self.Annotator=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('annotator');
require('annotator-plugin-auth');

},{"annotator":"VH1sEA","annotator-plugin-auth":"Xt4ipa"}],"VH1sEA":[function(require,module,exports){
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
},{}],"Xt4ipa":[function(require,module,exports){
var Annotator, base64Decode, base64UrlDecode, createDateFromISO8601, parseToken,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Annotator = require('annotator');

createDateFromISO8601 = function(string) {
  var d, date, offset, regexp, time, _ref;
  regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" + "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\\.([0-9]+))?)?" + "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
  d = string.match(new RegExp(regexp));
  offset = 0;
  date = new Date(d[1], 0, 1);
  if (d[3]) {
    date.setMonth(d[3] - 1);
  }
  if (d[5]) {
    date.setDate(d[5]);
  }
  if (d[7]) {
    date.setHours(d[7]);
  }
  if (d[8]) {
    date.setMinutes(d[8]);
  }
  if (d[10]) {
    date.setSeconds(d[10]);
  }
  if (d[12]) {
    date.setMilliseconds(Number("0." + d[12]) * 1000);
  }
  if (d[14]) {
    offset = (Number(d[16]) * 60) + Number(d[17]);
    offset *= (_ref = d[15] === '-') != null ? _ref : {
      1: -1
    };
  }
  offset -= date.getTimezoneOffset();
  time = Number(date) + (offset * 60 * 1000);
  date.setTime(Number(time));
  return date;
};

base64Decode = function(data) {
  var ac, b64, bits, dec, h1, h2, h3, h4, i, o1, o2, o3, tmp_arr;
  if (typeof atob !== "undefined" && atob !== null) {
    return atob(data);
  } else {
    b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    i = 0;
    ac = 0;
    dec = "";
    tmp_arr = [];
    if (!data) {
      return data;
    }
    data += '';
    while (i < data.length) {
      h1 = b64.indexOf(data.charAt(i++));
      h2 = b64.indexOf(data.charAt(i++));
      h3 = b64.indexOf(data.charAt(i++));
      h4 = b64.indexOf(data.charAt(i++));
      bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
      o1 = bits >> 16 & 0xff;
      o2 = bits >> 8 & 0xff;
      o3 = bits & 0xff;
      if (h3 === 64) {
        tmp_arr[ac++] = String.fromCharCode(o1);
      } else if (h4 === 64) {
        tmp_arr[ac++] = String.fromCharCode(o1, o2);
      } else {
        tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
      }
    }
    return tmp_arr.join('');
  }
};

base64UrlDecode = function(data) {
  var i, m, _i, _ref;
  m = data.length % 4;
  if (m !== 0) {
    for (i = _i = 0, _ref = 4 - m; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      data += '=';
    }
  }
  data = data.replace(/-/g, '+');
  data = data.replace(/_/g, '/');
  return base64Decode(data);
};

parseToken = function(token) {
  var head, payload, sig, _ref;
  _ref = token.split('.'), head = _ref[0], payload = _ref[1], sig = _ref[2];
  return JSON.parse(base64UrlDecode(payload));
};

Annotator.Plugin.Auth = (function(_super) {
  __extends(Auth, _super);

  Auth.prototype.options = {
    token: null,
    tokenUrl: '/auth/token',
    autoFetch: true
  };

  function Auth(element, options) {
    Auth.__super__.constructor.apply(this, arguments);
    this.waitingForToken = [];
    if (this.options.token) {
      this.setToken(this.options.token);
    } else {
      this.requestToken();
    }
  }

  Auth.prototype.requestToken = function() {
    var _this = this;
    this.requestInProgress = true;
    return $.ajax({
      url: this.options.tokenUrl,
      dataType: 'text',
      xhrFields: {
        withCredentials: true
      }
    }).done(function(data, status, xhr) {
      return _this.setToken(data);
    }).fail(function(xhr, status, err) {
      var msg;
      msg = Annotator._t("Couldn't get auth token:");
      console.error("" + msg + " " + err, xhr);
      return Annotator.showNotification("" + msg + " " + xhr.responseText, Annotator.Notification.ERROR);
    }).always(function() {
      return _this.requestInProgress = false;
    });
  };

  Auth.prototype.setToken = function(token) {
    var _results,
      _this = this;
    this.token = token;
    this._unsafeToken = parseToken(token);
    if (this.haveValidToken()) {
      if (this.options.autoFetch) {
        this.refreshTimeout = setTimeout((function() {
          return _this.requestToken();
        }), (this.timeToExpiry() - 2) * 1000);
      }
      this.updateHeaders();
      _results = [];
      while (this.waitingForToken.length > 0) {
        _results.push(this.waitingForToken.pop()(this._unsafeToken));
      }
      return _results;
    } else {
      console.warn(Annotator._t("Didn't get a valid token."));
      if (this.options.autoFetch) {
        console.warn(Annotator._t("Getting a new token in 10s."));
        return setTimeout((function() {
          return _this.requestToken();
        }), 10 * 1000);
      }
    }
  };

  Auth.prototype.haveValidToken = function() {
    var allFields;
    allFields = this._unsafeToken && this._unsafeToken.issuedAt && this._unsafeToken.ttl && this._unsafeToken.consumerKey;
    if (allFields && this.timeToExpiry() > 0) {
      return true;
    } else {
      return false;
    }
  };

  Auth.prototype.timeToExpiry = function() {
    var expiry, issue, now, timeToExpiry;
    now = new Date().getTime() / 1000;
    issue = createDateFromISO8601(this._unsafeToken.issuedAt).getTime() / 1000;
    expiry = issue + this._unsafeToken.ttl;
    timeToExpiry = expiry - now;
    if (timeToExpiry > 0) {
      return timeToExpiry;
    } else {
      return 0;
    }
  };

  Auth.prototype.updateHeaders = function() {
    var current;
    current = this.element.data('annotator:headers');
    return this.element.data('annotator:headers', $.extend(current, {
      'x-annotator-auth-token': this.token
    }));
  };

  Auth.prototype.withToken = function(callback) {
    if (callback == null) {
      return;
    }
    if (this.haveValidToken()) {
      return callback(this._unsafeToken);
    } else {
      this.waitingForToken.push(callback);
      if (!this.requestInProgress) {
        return this.requestToken();
      }
    }
  };

  return Auth;

})(Annotator.Plugin);

module.exports = Annotator.Plugin.Auth;


},{"annotator":"VH1sEA"}],"annotator-plugin-auth":[function(require,module,exports){
module.exports=require('Xt4ipa');
},{}]},{},[1])

(1)
})
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGtnL2Fubm90YXRvci5hdXRoLmpzIiwic291cmNlcyI6WyIuLi9mYWtlXzc1Y2QwZmU5LmpzIiwibmFtZXNwYWNlLmNvZmZlZSIsInBsdWdpbi9hdXRoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTs7QUNHQTs7QUFBQSxJQUFlLHdDQUFmO0NBQUEsRUFBTyxDQUFQO0NBQUE7O0FBQ0EsSUFBa0IsNENBQWxCOztHQUFRLENBQVI7R0FBQTtDQURBOztBQUVBLElBQWtCLDRDQUFsQjs7R0FBUSxDQUFSO0dBQUE7Q0FGQTs7QUFHQSxDQUhBLEVBR1ksQ0FBSSxFQUhoQixHQUdBOzs7Q0FHOEIsQ0FBOUIsQ0FBdUMsQ0FBWCxFQUFmLENBQTBCO0NBTnZDOztBQVdBLENBWEEsRUFXaUIsR0FBWCxDQUFOLEVBWEE7Ozs7OztBQ0xBO0dBQUE7a1NBQUE7O0FBQUEsR0FBWSxNQUFaLEVBQVk7O0FBUVosQ0FSQSxFQVF3QixNQUFDLFlBQXpCO0NBQ0U7Q0FBQSxFQUNFLEdBREYsOEJBQ0UsTUFERixXQUNFO0NBREYsQ0FNQSxDQUFJLENBQWlCLENBQWpCLENBQU07Q0FOVixDQVFBLENBQVMsR0FBVDtDQVJBLENBU0EsQ0FBVyxDQUFYO0NBRUEsR0FBMkI7Q0FBM0IsRUFBcUIsQ0FBckI7R0FYQTtDQVlBLEdBQXNCO0NBQXRCO0dBWkE7Q0FhQSxHQUF1QjtDQUF2QjtHQWJBO0NBY0EsR0FBeUI7Q0FBekI7R0FkQTtDQWVBLEdBQTBCO0NBQTFCLENBQWtCLEVBQWxCO0dBZkE7Q0FnQkEsR0FBcUQ7Q0FBckQsQ0FBcUMsQ0FBRixDQUFuQyxFQUFxQixTQUFyQjtHQWhCQTtDQWtCQSxHQUFHO0NBQ0QsQ0FBbUIsQ0FBVixDQUFUO0NBQUEsRUFDNEIsQ0FBNUI7QUFBaUMsQ0FBTCxDQUFJLElBQUo7Q0FGOUIsS0FDRTtHQW5CRjtDQUFBLENBc0JBLEVBQVUsRUFBVixXQUFVO0NBdEJWLENBdUJBLENBQVEsQ0FBUixFQUFR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bm5vdGF0b3InKTtcbnJlcXVpcmUoJ2Fubm90YXRvci1wbHVnaW4tYXV0aCcpO1xuIiwiIyBJbiBvcmRlciB0byBidWlsZCBwb3J0YWJsZSBleHRlbnNpb24gYnVuZGxlcyB0aGF0IGNhbiBiZSB1c2VkIHdpdGggQU1EIGFuZFxuIyBzY3JpcHQgY29uY2F0ZW5hdGlvbiBwbHVnaW5zIGFyZSBidWlsdCB3aXRoIHRoaXMgbW9kdWxlIGFzICdhbm5vdGF0b3InLlxuXG4jIEFubm90YXRvciB3aWxsIGV4cG9ydCBpdHNlbGYgZ2xvYmFsbHkgd2hlbiB0aGUgYnVpbHQgVU1EIG1vZHVsZXMgYXJlIHVzZWQgaW5cbiMgYSBsZWdhY3kgZW52aXJvbm1lbnQgb2Ygc2ltcGxlIHNjcmlwdCBjb25jYXRlbmF0aW9uLlxuc2VsZiA9IHNlbGYgaWYgc2VsZj9cbnNlbGYgPz0gZ2xvYmFsIGlmIGdsb2JhbD9cbnNlbGYgPz0gd2luZG93IGlmIHdpbmRvdz9cbkFubm90YXRvciA9IHNlbGY/LkFubm90YXRvclxuXG4jIEluIGEgcHVyZSBBTUQgZW52aXJvbm1lbnQsIEFubm90YXRvciBtYXkgbm90IGJlIGV4cG9ydGVkIGdsb2JhbGx5LlxuQW5ub3RhdG9yID89IGlmIHNlbGY/LmRlZmluZT8uYW1kIHRoZW4gc2VsZj8ucmVxdWlyZSgnYW5ub3RhdG9yJylcblxuIyBOb3RlOiB3aGVuIHdvcmtpbmcgaW4gYSBDb21tb25KUyBlbnZpcm9ubWVudCBhbmQgYnVuZGxpbmcgcmVxdWlyZW1lbnRzIGludG9cbiMgYXBwbGljYXRpb25zIHRoZW4gcmVxdWlyZSBjYWxscyBzaG91bGQgcmVmZXIgdG8gbW9kdWxlcyBmcm9tIHRoZSBucG0gbGliXG4jIGRpcmVjdG9yeSBvZiBhbm5vdGF0b3IgcGFja2FnZSBhbmQgYXZvaWQgdGhpcyBhbHRvZ2V0aGVyLlxubW9kdWxlLmV4cG9ydHMgPSBBbm5vdGF0b3JcbiIsIkFubm90YXRvciA9IHJlcXVpcmUoJ2Fubm90YXRvcicpXG5cblxuIyBQdWJsaWM6IENyZWF0ZXMgYSBEYXRlIG9iamVjdCBmcm9tIGFuIElTTzg2MDEgZm9ybWF0dGVkIGRhdGUgU3RyaW5nLlxuI1xuIyBzdHJpbmcgLSBJU084NjAxIGZvcm1hdHRlZCBkYXRlIFN0cmluZy5cbiNcbiMgUmV0dXJucyBEYXRlIGluc3RhbmNlLlxuY3JlYXRlRGF0ZUZyb21JU084NjAxID0gKHN0cmluZykgLT5cbiAgcmVnZXhwID0gKFxuICAgIFwiKFswLTldezR9KSgtKFswLTldezJ9KSgtKFswLTldezJ9KVwiICtcbiAgICBcIihUKFswLTldezJ9KTooWzAtOV17Mn0pKDooWzAtOV17Mn0pKFxcXFwuKFswLTldKykpPyk/XCIgK1xuICAgIFwiKFp8KChbLStdKShbMC05XXsyfSk6KFswLTldezJ9KSkpPyk/KT8pP1wiXG4gIClcblxuICBkID0gc3RyaW5nLm1hdGNoKG5ldyBSZWdFeHAocmVnZXhwKSlcblxuICBvZmZzZXQgPSAwXG4gIGRhdGUgPSBuZXcgRGF0ZShkWzFdLCAwLCAxKVxuXG4gIGRhdGUuc2V0TW9udGgoZFszXSAtIDEpIGlmIGRbM11cbiAgZGF0ZS5zZXREYXRlKGRbNV0pIGlmIGRbNV1cbiAgZGF0ZS5zZXRIb3VycyhkWzddKSBpZiBkWzddXG4gIGRhdGUuc2V0TWludXRlcyhkWzhdKSBpZiBkWzhdXG4gIGRhdGUuc2V0U2Vjb25kcyhkWzEwXSkgaWYgZFsxMF1cbiAgZGF0ZS5zZXRNaWxsaXNlY29uZHMoTnVtYmVyKFwiMC5cIiArIGRbMTJdKSAqIDEwMDApIGlmIGRbMTJdXG5cbiAgaWYgZFsxNF1cbiAgICBvZmZzZXQgPSAoTnVtYmVyKGRbMTZdKSAqIDYwKSArIE51bWJlcihkWzE3XSlcbiAgICBvZmZzZXQgKj0gKChkWzE1XSA9PSAnLScpID8gMSA6IC0xKVxuXG4gIG9mZnNldCAtPSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KClcbiAgdGltZSA9IChOdW1iZXIoZGF0ZSkgKyAob2Zmc2V0ICogNjAgKiAxMDAwKSlcblxuICBkYXRlLnNldFRpbWUoTnVtYmVyKHRpbWUpKVxuICBkYXRlXG5cbmJhc2U2NERlY29kZSA9IChkYXRhKSAtPlxuICBpZiBhdG9iP1xuICAgICMgR2Vja28gYW5kIFdlYmtpdCBwcm92aWRlIG5hdGl2ZSBjb2RlIGZvciB0aGlzXG4gICAgYXRvYihkYXRhKVxuICBlbHNlXG4gICAgIyBBZGFwdGVkIGZyb20gTUlUL0JTRCBsaWNlbnNlZCBjb2RlIGF0IGh0dHA6Ly9waHBqcy5vcmcvZnVuY3Rpb25zL2Jhc2U2NF9kZWNvZGVcbiAgICAjIHZlcnNpb24gMTEwOS4yMDE1XG4gICAgYjY0ID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVwiXG4gICAgaSA9IDBcbiAgICBhYyA9IDBcbiAgICBkZWMgPSBcIlwiXG4gICAgdG1wX2FyciA9IFtdXG5cbiAgICBpZiBub3QgZGF0YVxuICAgICAgcmV0dXJuIGRhdGFcblxuICAgIGRhdGEgKz0gJydcblxuICAgIHdoaWxlIGkgPCBkYXRhLmxlbmd0aFxuICAgICAgIyB1bnBhY2sgZm91ciBoZXhldHMgaW50byB0aHJlZSBvY3RldHMgdXNpbmcgaW5kZXggcG9pbnRzIGluIGI2NFxuICAgICAgaDEgPSBiNjQuaW5kZXhPZihkYXRhLmNoYXJBdChpKyspKVxuICAgICAgaDIgPSBiNjQuaW5kZXhPZihkYXRhLmNoYXJBdChpKyspKVxuICAgICAgaDMgPSBiNjQuaW5kZXhPZihkYXRhLmNoYXJBdChpKyspKVxuICAgICAgaDQgPSBiNjQuaW5kZXhPZihkYXRhLmNoYXJBdChpKyspKVxuXG4gICAgICBiaXRzID0gaDEgPDwgMTggfCBoMiA8PCAxMiB8IGgzIDw8IDYgfCBoNFxuXG4gICAgICBvMSA9IGJpdHMgPj4gMTYgJiAweGZmXG4gICAgICBvMiA9IGJpdHMgPj4gOCAmIDB4ZmZcbiAgICAgIG8zID0gYml0cyAmIDB4ZmZcblxuICAgICAgaWYgaDMgPT0gNjRcbiAgICAgICAgdG1wX2FyclthYysrXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUobzEpXG4gICAgICBlbHNlIGlmIGg0ID09IDY0XG4gICAgICAgIHRtcF9hcnJbYWMrK10gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG8xLCBvMilcbiAgICAgIGVsc2VcbiAgICAgICAgdG1wX2FyclthYysrXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUobzEsIG8yLCBvMylcblxuICAgIHRtcF9hcnIuam9pbignJylcblxuYmFzZTY0VXJsRGVjb2RlID0gKGRhdGEpIC0+XG4gIG0gPSBkYXRhLmxlbmd0aCAlIDRcbiAgaWYgbSAhPSAwXG4gICAgZm9yIGkgaW4gWzAuLi40IC0gbV1cbiAgICAgIGRhdGEgKz0gJz0nXG4gIGRhdGEgPSBkYXRhLnJlcGxhY2UoLy0vZywgJysnKVxuICBkYXRhID0gZGF0YS5yZXBsYWNlKC9fL2csICcvJylcbiAgYmFzZTY0RGVjb2RlKGRhdGEpXG5cbnBhcnNlVG9rZW4gPSAodG9rZW4pIC0+XG4gIFtoZWFkLCBwYXlsb2FkLCBzaWddID0gdG9rZW4uc3BsaXQoJy4nKVxuICBKU09OLnBhcnNlKGJhc2U2NFVybERlY29kZShwYXlsb2FkKSlcblxuIyBQdWJsaWM6IFN1cHBvcnRzIHRoZSBTdG9yZSBwbHVnaW4gYnkgcHJvdmlkaW5nIEF1dGhlbnRpY2F0aW9uIGhlYWRlcnMuXG5jbGFzcyBBbm5vdGF0b3IuUGx1Z2luLkF1dGggZXh0ZW5kcyBBbm5vdGF0b3IuUGx1Z2luXG4gICMgVXNlciBvcHRpb25zIHRoYXQgY2FuIGJlIHByb3ZpZGVkLlxuICBvcHRpb25zOlxuXG4gICAgIyBBbiBhdXRoZW50aWNhdGlvbiB0b2tlbi4gVXNlZCB0byBza2lwIHRoZSByZXF1ZXN0IHRvIHRoZSBzZXJ2ZXIgZm9yIGFcbiAgICAjIGEgdG9rZW4uXG4gICAgdG9rZW46IG51bGxcblxuICAgICMgVGhlIFVSTCBvbiB0aGUgbG9jYWwgc2VydmVyIHRvIHJlcXVlc3QgYW4gYXV0aGVudGljYXRpb24gdG9rZW4uXG4gICAgdG9rZW5Vcmw6ICcvYXV0aC90b2tlbidcblxuICAgICMgSWYgdHJ1ZSB3aWxsIHRyeSBhbmQgZmV0Y2ggYSB0b2tlbiB3aGVuIHRoZSBwbHVnaW4gaXMgaW5pdGlhbGlzZWQuXG4gICAgYXV0b0ZldGNoOiB0cnVlXG5cbiAgIyBQdWJsaWM6IENyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgQXV0aCBwbHVnaW4uXG4gICNcbiAgIyBlbGVtZW50IC0gVGhlIGVsZW1lbnQgdG8gYmluZCBhbGwgZXZlbnRzIHRvLiBVc3VhbGx5IHRoZSBBbm5vdGF0b3IjZWxlbWVudC5cbiAgIyBvcHRpb25zIC0gQW4gT2JqZWN0IGxpdGVyYWwgY29udGFpbmluZyB1c2VyIG9wdGlvbnMuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBwbHVnaW4gPSBuZXcgQW5ub3RhdG9yLlBsdWdpbi5BdXRoKGFubm90YXRvci5lbGVtZW50LCB7XG4gICMgICAgIHRva2VuVXJsOiAnL215L2N1c3RvbS9wYXRoJ1xuICAjICAgfSlcbiAgI1xuICAjIFJldHVybnMgaW5zdGFuY2Ugb2YgQXV0aC5cbiAgY29uc3RydWN0b3I6IChlbGVtZW50LCBvcHRpb25zKSAtPlxuICAgIHN1cGVyXG5cbiAgICAjIExpc3Qgb2YgZnVuY3Rpb25zIHRvIGJlIGV4ZWN1dGVkIHdoZW4gd2UgaGF2ZSBhIHZhbGlkIHRva2VuLlxuICAgIEB3YWl0aW5nRm9yVG9rZW4gPSBbXVxuXG4gICAgaWYgQG9wdGlvbnMudG9rZW5cbiAgICAgIHRoaXMuc2V0VG9rZW4oQG9wdGlvbnMudG9rZW4pXG4gICAgZWxzZVxuICAgICAgdGhpcy5yZXF1ZXN0VG9rZW4oKVxuXG4gICMgUHVibGljOiBNYWtlcyBhIHJlcXVlc3QgdG8gdGhlIGxvY2FsIHNlcnZlciBmb3IgYW4gYXV0aGVudGljYXRpb24gdG9rZW4uXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBhdXRoLnJlcXVlc3RUb2tlbigpXG4gICNcbiAgIyBSZXR1cm5zIGpxWEhSIG9iamVjdC5cbiAgcmVxdWVzdFRva2VuOiAtPlxuICAgIEByZXF1ZXN0SW5Qcm9ncmVzcyA9IHRydWVcblxuICAgICQuYWpheFxuICAgICAgdXJsOiBAb3B0aW9ucy50b2tlblVybFxuICAgICAgZGF0YVR5cGU6ICd0ZXh0J1xuICAgICAgeGhyRmllbGRzOlxuICAgwqAgwqAgwqB3aXRoQ3JlZGVudGlhbHM6IHRydWUgIyBTZW5kIGFueSBhdXRoIGNvb2tpZXMgdG8gdGhlIGJhY2tlbmRcblxuICAgICMgb24gc3VjY2Vzcywgc2V0IHRoZSBhdXRoIHRva2VuXG4gICAgLmRvbmUgKGRhdGEsIHN0YXR1cywgeGhyKSA9PlxuICAgICAgdGhpcy5zZXRUb2tlbihkYXRhKVxuXG4gICAgIyBvbiBmYWlsdXJlLCByZWxheSBhbnkgbWVzc2FnZSBnaXZlbiBieSB0aGUgc2VydmVyIHRvIHRoZSB1c2VyIHdpdGggYSBub3RpZmljYXRpb25cbiAgICAuZmFpbCAoeGhyLCBzdGF0dXMsIGVycikgPT5cbiAgICAgIG1zZyA9IEFubm90YXRvci5fdChcIkNvdWxkbid0IGdldCBhdXRoIHRva2VuOlwiKVxuICAgICAgY29uc29sZS5lcnJvciBcIiN7bXNnfSAje2Vycn1cIiwgeGhyXG4gICAgICBBbm5vdGF0b3Iuc2hvd05vdGlmaWNhdGlvbihcIiN7bXNnfSAje3hoci5yZXNwb25zZVRleHR9XCIsIEFubm90YXRvci5Ob3RpZmljYXRpb24uRVJST1IpXG5cbiAgICAjIGFsd2F5cyByZXNldCB0aGUgcmVxdWVzdEluUHJvZ3Jlc3MgaW5kaWNhdG9yXG4gICAgLmFsd2F5cyA9PlxuICAgICAgQHJlcXVlc3RJblByb2dyZXNzID0gZmFsc2VcblxuICAjIFB1YmxpYzogU2V0cyB0aGUgQHRva2VuIGFuZCBjaGVja3MgaXQncyB2YWxpZGl0eS4gSWYgdGhlIHRva2VuIGlzIGludmFsaWRcbiAgI8KgcmVxdWVzdHMgYSBuZXcgb25lIGZyb20gdGhlIHNlcnZlci5cbiAgI1xuICAjIHRva2VuIC0gQSB0b2tlbiBzdHJpbmcuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBhdXRoLnNldFRva2VuKCdleUpoLi4uOWpRM0knKVxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBzZXRUb2tlbjogKHRva2VuKSAtPlxuICAgIEB0b2tlbiA9IHRva2VuXG4gICAgIyBQYXJzZSB0aGUgdG9rZW4gd2l0aG91dCB2ZXJpZnlpbmcgaXRzIGF1dGhlbnRpY2l0eTpcbiAgICBAX3Vuc2FmZVRva2VuID0gcGFyc2VUb2tlbih0b2tlbilcblxuICAgIGlmIHRoaXMuaGF2ZVZhbGlkVG9rZW4oKVxuICAgICAgaWYgQG9wdGlvbnMuYXV0b0ZldGNoXG4gICAgICAgICMgU2V0IHRpbWVvdXQgdG8gZmV0Y2ggbmV3IHRva2VuIDIgc2Vjb25kcyBiZWZvcmUgY3VycmVudCB0b2tlbiBleHBpcnlcbiAgICAgICAgQHJlZnJlc2hUaW1lb3V0ID0gc2V0VGltZW91dCAoKCkgPT4gdGhpcy5yZXF1ZXN0VG9rZW4oKSksICh0aGlzLnRpbWVUb0V4cGlyeSgpIC0gMikgKiAxMDAwXG5cbiAgICAgICMgU2V0IGhlYWRlcnMgZmllbGQgb24gdGhpcy5lbGVtZW50XG4gICAgICB0aGlzLnVwZGF0ZUhlYWRlcnMoKVxuXG4gICAgICAjIFJ1biBjYWxsYmFja3Mgd2FpdGluZyBmb3IgdG9rZW5cbiAgICAgIHdoaWxlIEB3YWl0aW5nRm9yVG9rZW4ubGVuZ3RoID4gMFxuICAgICAgICBAd2FpdGluZ0ZvclRva2VuLnBvcCgpKEBfdW5zYWZlVG9rZW4pXG5cbiAgICBlbHNlXG4gICAgICBjb25zb2xlLndhcm4gQW5ub3RhdG9yLl90KFwiRGlkbid0IGdldCBhIHZhbGlkIHRva2VuLlwiKVxuICAgICAgaWYgQG9wdGlvbnMuYXV0b0ZldGNoXG4gICAgICAgIGNvbnNvbGUud2FybiBBbm5vdGF0b3IuX3QoXCJHZXR0aW5nIGEgbmV3IHRva2VuIGluIDEwcy5cIilcbiAgICAgICAgc2V0VGltZW91dCAoKCkgPT4gdGhpcy5yZXF1ZXN0VG9rZW4oKSksIDEwICogMTAwMFxuXG4gICMgUHVibGljOiBDaGVja3MgdGhlIHZhbGlkaXR5IG9mIHRoZSBjdXJyZW50IHRva2VuLiBOb3RlIHRoYXQgdGhpcyAqZG9lc1xuICAjIG5vdCogY2hlY2sgdGhlIGF1dGhlbnRpY2l0eSBvZiB0aGUgdG9rZW4uXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBhdXRoLmhhdmVWYWxpZFRva2VuKCkgIyA9PiBSZXR1cm5zIHRydWUgaWYgdmFsaWQuXG4gICNcbiAgIyBSZXR1cm5zIHRydWUgaWYgdGhlIHRva2VuIGlzIHZhbGlkLlxuICBoYXZlVmFsaWRUb2tlbjogKCkgLT5cbiAgICBhbGxGaWVsZHMgPSAoXG4gICAgICBAX3Vuc2FmZVRva2VuIGFuZFxuICAgICAgQF91bnNhZmVUb2tlbi5pc3N1ZWRBdCBhbmRcbiAgICAgIEBfdW5zYWZlVG9rZW4udHRsIGFuZFxuICAgICAgQF91bnNhZmVUb2tlbi5jb25zdW1lcktleVxuICAgIClcblxuICAgIGlmIGFsbEZpZWxkcyAmJiB0aGlzLnRpbWVUb0V4cGlyeSgpID4gMFxuICAgICAgcmV0dXJuIHRydWVcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZmFsc2VcblxuICAjIFB1YmxpYzogQ2FsY3VsYXRlcyB0aGUgdGltZSBpbiBzZWNvbmRzIHVudGlsIHRoZSBjdXJyZW50IHRva2VuIGV4cGlyZXMuXG4gICNcbiAgIyBSZXR1cm5zIE51bWJlciBvZiBzZWNvbmRzIHVudGlsIHRva2VuIGV4cGlyZXMuXG4gIHRpbWVUb0V4cGlyeTogLT5cbiAgICBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDBcbiAgICBpc3N1ZSA9IGNyZWF0ZURhdGVGcm9tSVNPODYwMShAX3Vuc2FmZVRva2VuLmlzc3VlZEF0KS5nZXRUaW1lKCkgLyAxMDAwXG5cbiAgICBleHBpcnkgPSBpc3N1ZSArIEBfdW5zYWZlVG9rZW4udHRsXG4gICAgdGltZVRvRXhwaXJ5ID0gZXhwaXJ5IC0gbm93XG5cbiAgICBpZiAodGltZVRvRXhwaXJ5ID4gMCkgdGhlbiB0aW1lVG9FeHBpcnkgZWxzZSAwXG5cbiAgIyBQdWJsaWM6IFVwZGF0ZXMgdGhlIGhlYWRlcnMgdG8gYmUgc2VudCB3aXRoIHRoZSBTdG9yZSByZXF1ZXN0cy4gVGhpcyBpc1xuICAjIGFjaGlldmVkIGJ5IHVwZGF0aW5nIHRoZSAnYW5ub3RhdG9yOmhlYWRlcnMnIGtleSBpbiB0aGUgQGVsZW1lbnQuZGF0YSgpXG4gICMgc3RvcmUuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHVwZGF0ZUhlYWRlcnM6IC0+XG4gICAgY3VycmVudCA9IEBlbGVtZW50LmRhdGEoJ2Fubm90YXRvcjpoZWFkZXJzJylcbiAgICBAZWxlbWVudC5kYXRhKCdhbm5vdGF0b3I6aGVhZGVycycsICQuZXh0ZW5kKGN1cnJlbnQsIHtcbiAgICAgICd4LWFubm90YXRvci1hdXRoLXRva2VuJzogQHRva2VuLFxuICAgIH0pKVxuXG4gICMgUnVucyB0aGUgcHJvdmlkZWQgY2FsbGJhY2sgaWYgYSB2YWxpZCB0b2tlbiBpcyBhdmFpbGFibGUuIE90aGVyd2lzZSByZXF1ZXN0c1xuICAjIGEgdG9rZW4gdW50aWwgaXQgcmVjaWV2ZXMgYSB2YWxpZCBvbmUuXG4gICNcbiAgIyBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gY2FsbCBvbmNlIGEgdmFsaWQgdG9rZW4gaXMgb2J0YWluZWQuXG4gICNcbiAgIyBFeGFtcGxlc1xuICAjXG4gICMgICBhdXRoLndpdGhUb2tlbiAtPlxuICAjICAgICBzdG9yZS5sb2FkQW5ub3RhdGlvbnMoKVxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICB3aXRoVG9rZW46IChjYWxsYmFjaykgLT5cbiAgICBpZiBub3QgY2FsbGJhY2s/XG4gICAgICByZXR1cm5cblxuICAgIGlmIHRoaXMuaGF2ZVZhbGlkVG9rZW4oKVxuICAgICAgY2FsbGJhY2soQF91bnNhZmVUb2tlbilcbiAgICBlbHNlXG4gICAgICB0aGlzLndhaXRpbmdGb3JUb2tlbi5wdXNoKGNhbGxiYWNrKVxuICAgICAgaWYgbm90IEByZXF1ZXN0SW5Qcm9ncmVzc1xuICAgICAgICB0aGlzLnJlcXVlc3RUb2tlbigpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBBbm5vdGF0b3IuUGx1Z2luLkF1dGhcbiJdfQ==