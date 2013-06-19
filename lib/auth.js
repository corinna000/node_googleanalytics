/* 
*
* auth.js authenticate to Google Analytics API 3.0
*
* 
*/
"use strict";

var events = require("events"),
util = require("util"),
GAPI = require("gapitoken");

function GAAuth() {
  events.EventEmitter.call(this);
  
  // google api token
  this.token = null;
  this.gapi = null;
  this.interval = null; 
  this.expires = null;
}

// http://stackoverflow.com/questions/6892428/node-js-best-method-for-emitting-events-from-modules
util.inherits(GAAuth, events.EventEmitter);

GAAuth.prototype.start = function() {
  var self = this;
  this.stop();

  // read the authentication token if it exist
  
  this.interval = setInterval(function() {
    if (self.token === null) { 
      self.getToken();
    }
  },1000);
};

GAAuth.prototype.stop = function() {
  if (this.interval !== null) {
    clearInterval(this.interval);
  }
};

GAAuth.prototype.setToken = function(token) {
  this.token = token;
};

GAAuth.prototype.getToken = function() {
  var self = this;
  if (this.token  !== null) { 
    this.stop(); 
  }
  
  var gapi = new GAPI({
    iss: "458595400788@developer.gserviceaccount.com",
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    keyFile: './463340b2bf87153dd59f389d548489ba3391cfc8-privatekey.pem'
  }, function(err) {
    if (err) { return console.log(err); }
    gapi.getToken(function(err, token) {
      if (err) { return console.log(err); }
      self.token = token;
      self.gapi = gapi;
      self.emit("getToken");
    });     
  });
};

module.exports = GAAuth;
