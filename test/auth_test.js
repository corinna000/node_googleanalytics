/*
 * auth-test.js 
 * nodeunit tests
 */

var GAAuth = require("../lib/auth.js"),
gaauth = new GAAuth();

exports["auth-test"] = function(test) {
  "use strict";
  test.expect(1);

  function asyncTests() { 
    test.ok(true, " ***** Received token"); 
    test.done();
  }
  
  gaauth.start();
  gaauth.on("getToken", asyncTests);

};
