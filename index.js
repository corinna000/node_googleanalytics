/** 
*/
var GAAuth = require("./lib/auth.js"),
https = require("https"),
dashdash = require("dashdash"),
EventEmitter = require("events").EventEmitter,
ids = require("./lib/profiles.json"),
fs = require("fs"),
ee = new EventEmitter(),
gaTokenPath = "./.gatoken",
gaauth = new GAAuth(); 

// Command line options
var options = [
  { 
    names: ['begin', 'b'],
    type: 'string',
    help: 'Start date in format yyyy-mm-dd',
    helpArg: "yyyy-mm-dd"
  }, 
  { 
    names: ['end', 'e'],
    type: 'string',
    help: 'End date in format yyyy-mm-dd',
    helpArg: "yyyy-mm-dd"
  }, 
  { 
    names: ['site','s'],
    type: 'string',
    default: 'science',
    help: 'Google analytics sites: science, stm, stke, news',
  }, 
  { 
    names: ['metrics', 'm'],
    type: 'arrayOfString',
    help: 'metrics like visits, pageviews',
    helpArg: "{metric}"
  }, 
  { 
    names: ['dimensions', 'dim', 'd'],
    type: 'arrayOfString',
    help: 'dimensions like like country',
    helpArg: "{dimension}"
  }, 
  { 
    names: ['filters', 'f'],
    type: 'arrayOfString',
    help: 'filter',
    helpArg: "{filter} (optional)"
  }, 
  { 
    names: ['help', 'h', '?'],
    type: 'bool',
    help: 'prints help then exits',
  } 
];

var parser = new dashdash.Parser({options: options});
try {
    var opts = parser.parse(process.argv);
} catch (e) {
    console.error('error: %s', e.message);
    process.exit(1);
}

// console.log("# opts:", opts);
// console.log("# args:", opts._args);

// Use `parser.help()` for formatted options help.
if (opts.help) {
    console.log('usage: node index.js [OPTIONS]\n'
                + 'options:\n'
                + parser.help().trimRight());
    process.exit(0);
}

function getFreshToken() {  
  gaauth.start();
  gaauth.on("getToken", function() { 
    fs.writeFileSync(gaTokenPath, gaauth.token);
    ee.emit("tokenReady");
  }); 
}

/**
 * gaQueryString
 *
 * Converts command line options into a RESTful query string for Google Analytics
 *
 * @param options $options
 * @access public
 * @return void
 */
function gaQueryString(options) {
  var query = "/analytics/v3/data/ga?ids=ga:49204044";
  var ids = "49204044";

  /**
   * parse the option to build a working query string
   */
  gaPrefix = function(val) {
    val = val.toString();
    var q = null;
    if (!val.indexOf(",") > 0) {
      return "ga:" + val; 
    } 
    else {
      var vals = val.split(",");
      q = "ga:" + vals[0];
      for (var i = 1; i < vals.length; i++) {
        q = q + ",ga:" + vals[i]; 
      }
      return q;
    }
  }
  /**
   * append a new value to the query string
   */
  gaAppend = function(key,val) {
    query = query + "&" + key + "=" + val; 
  }
  if (typeof options.begin !== "undefined") {
    gaAppend("start-date", options.begin); 
  }
  if (typeof options.end !== "undefined") {
    gaAppend("end-date", options.end); 
  }
  for (var key in options) { 
    if (options[key] instanceof Array && typeof options[key][0] === "string" ) {
      gaAppend(key, gaPrefix(options[key]));
    }
  }

  return query;
}

fs.exists(gaTokenPath, function(exists) {
  if (!exists) { getFreshToken(); } 
  else { 
    fs.stat(gaTokenPath, function(err, stats) {
      if (err) { return console.log("could not read file " + gaTokenPath); }
      var now = new Date();
      var mtime = new Date(new Date(stats.mtime).getTime() + 1000 * 60 * 60);
      if (mtime > now) {
        gaauth.setToken(fs.readFileSync(gaTokenPath));
        ee.emit("tokenReady");
      }
      else {
        getFreshToken();
      }
    });
  }
});

ee.on("tokenReady", function() {  
  var options = {
    hostname: "www.googleapis.com",
    path: gaQueryString(opts),
    method: "GET",
    headers: {
      "Authorization" : "Bearer " + gaauth.token
    }
  };
  var req = https.request(options, function(res) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);

    res.on('data', function(d) {
      process.stdout.write(d);
    });
  });
  req.end();

  req.on('error', function(e) {
    console.error(e);
  });
});


