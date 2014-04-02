// ==UserScript==
// @name        annotator-everywhere
// @namespace   http://telavivmakers.org/AnnotatorGreasemonkey
// @description run annotator bookmarklet everywhere (TODO: except those with ingrained annotator)
// @version 1
// @require https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/lib/vendor/jquery.js
// @require https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/pkg/annotator.js
// @require https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/pkg/annotator.store.js
// @require https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/pkg/annotator.auth.js
// @require https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/pkg/annotator.permissions.js
// @require https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/pkg/annotator.tags.js
// @require https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/lib/vendor/showdown.js
// @require https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/pkg/annotator.markdown.js
// @resource annotatorcss https://raw.githubusercontent.com/alon/annotator-store-neo4j/development/static/pkg/annotator.min.css
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_xmlhttpRequest
// ==/UserScript==

var aCSS = GM_getResourceText('annotatorcss');
GM_addStyle(aCSS);

// From: http://www.monperrus.net/martin/greasemonkey+jquery+and+xmlhttprequest+together

// allows using all Jquery AJAX methods in Greasemonkey
// inspired from http://ryangreenberg.com/archives/2010/03/greasemonkey_jquery.php
// works with JQuery 1.5
// (c) 2011 Martin Monperrus
// (c) 2010 Ryan Greenberg
//
// Usage:
//   $.ajax({
//     url: '/p/',
//     xhr: function(){return new GM_XHR();},
//     type: 'POST',
//     success: function(val){
//        ....
//     }
//   });
function GM_XHR() {
    this.type = null;
    this.url = null;
    this.async = null;
    this.username = null;
    this.password = null;
    this.status = null;
    this.headers = {};
    this.readyState = null;
    
    this.abort = function() {
        this.readyState = 0;
    };
    
    this.getAllResponseHeaders = function(name) {
	if (this.readyState!=4) return "";
	return this.responseHeaders;
    };
    
    this.getResponseHeader = function(name) {
	var regexp = new RegExp('^'+name+': (.*)$','im');
	var match = regexp.exec(this.responseHeaders);
	if (match) { return match[1]; }
	return '';
    };
    
    this.open = function(type, url, async, username, password) {
        this.type = type ? type : null;
        this.url = url ? url : null;
        this.async = async ? async : null;
        this.username = username ? username : null;
        this.password = password ? password : null;
        this.readyState = 1;
    };
    
    this.setRequestHeader = function(name, value) {
        this.headers[name] = value;
    };
    
    this.send = function(data) {
        this.data = data;
        var that = this;
        // http://wiki.greasespot.net/GM_xmlhttpRequest
        GM_xmlhttpRequest({
            method: this.type,
            url: this.url,
            headers: this.headers,
            data: this.data,
            onload: function(rsp) {
                // Populate wrapper object with returned data
                // including the Greasemonkey specific "responseHeaders"
                for (var k in rsp) {
                    that[k] = rsp[k];
                }
                // now we call onreadystatechange
                that.onreadystatechange();
            },
            onerror: function(rsp) {
                for (var k in rsp) {
                    that[k] = rsp[k];
                }
            }
        });
    };
};

// override default xhr implementation to use GM_XHR wrapper
jQuery.ajaxSettings.xhr = function(){return new GM_XHR();};

jQuery(function($) {
    devStore = {
        type: Annotator.Plugin.Store,
        prefix: 'http://188.226.195.83:5001',
        loadFromSearch: {
            uri: window.location
        },
        annotationData: {
            uri: window.location
        }
    };
    // plugins
    var elem = $('body');
    annotator = new Annotator(elem, {
        store: (elem, devStore),
    }).addPlugin('Permissions').addPlugin('Markdown').addPlugin('Tags');
});
