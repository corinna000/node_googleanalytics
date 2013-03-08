/** 
*/
var GAAuth = require("./lib/auth.js"),
    https = require("https"),
    dashdash = require("dashdash"),
    EventEmitter = require("events").EventEmitter,
    profiles = require("./lib/profiles.json"),
    fs = require("fs"),
    async = require("async"),
    ee = new EventEmitter(),
    gaTokenPath = "./.gatoken",
    gaauth = new GAAuth(),
    GA_DATE_REGEX = /(\d{4})-(\d{1,2})-(\d{1,2})/; 

// console.log(JSON.stringify(ids));


/**
 * gaDateFormat
 *
 * @param d 
 *  string of date ex. "2012-01-30"
 * @param end 
 *  true if we need the end of the month
 * @access public
 * @return void
 */
function gaDateFormat(d, end) {
  var dateArray = d.match(GA_DATE_REGEX);
  if (dateArray.length !== 4) { 
    throw new Error("Date supplied cannot be converted to Date object");
  }
  if (typeof end !== "undefined" || end) {  
    newDate = new Date(dateArray[1], dateArray[2], 0); // end of month
  }
  else { // beginning of month
    var month = parseInt(dateArray[2], 10) - 1;
    newDate = new Date(dateArray[1], month, 1);
  }
  var day = zeroPad(newDate.getDate(), 2);
  var month = zeroPad(newDate.getMonth() + 1, 2);
  return newDate.getFullYear() + "-" + month + "-" + day;
}

/**
 * gaMonthsBetween
 *  months between two gaDateFormatted months ex. 2012-11-10
 * @param first 
 * @param second 
 * @access public
 * @return void
 */
function gaMonthsBetween(first, second) {
  var firstArr = first.match(GA_DATE_REGEX), 
  secondArr = second.match(GA_DATE_REGEX), 
  months = (secondArr[1] - firstArr[1]) * 12;
  months = months - parseInt(firstArr[2], 10);
  months = months + parseInt(secondArr[2], 10) + 1;
  return months;
}


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
    names: ['results', 'r'],
    type: 'string',
    help: 'max results',
    helpArg: "max number of results (default 10)"
  }, 
  { 
    names: ['help', 'h', '?'],
    type: 'bool',
    help: 'prints help then exits',
  } 
];;

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

function gaSite(site) {
  var dateKeys = profiles[site],
      beginArr = opts.begin.match(GA_DATE_REGEX),
      beginDate = new Date(beginArr[1], beginArr[2]);
  if (typeof dateKeys === "undefined") { throw new Error("Site " + site + " not defined in profiles.json "); }
  for (var date in dateKeys) {
    if (beginDate > new Date(date)) { // look up date from newest to oldest
      return dateKeys[date];
    }
  }
}

/**
 * zeroPad
 *
 * @param num $num
 * @param places $places
 * @access public
 * @return void
 * source: http://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
 */
function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
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
  // sort based on the first defined metric
  var ids = gaSite(options.site);
  var query = "/analytics/v3/data/ga?ids=ga:" + ids + "&sort=-ga:" + options.metrics[0];

  /**
   * parse the option to build a working query string. 
   * The query string needs to be in the form of something like /
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
  gaAppendOption = function(key,val) {
    query = query + "&" + key + "=" + val; 
  }
  if (typeof options.results !== "undefined") {
    gaAppendOption("max-results", options.results);
  }
  else {
    gaAppendOption("max-results", 10);
  }
  if (typeof options.begin !== "undefined") {
    gaAppendOption("start-date", options.begin); 
  }
  if (typeof options.end !== "undefined") {
    gaAppendOption("end-date", options.end); 
  }
  for (var key in options) { 
    if (options[key] instanceof Array && typeof options[key][0] === "string" ) {
      gaAppendOption(key, gaPrefix(options[key]));
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

function gaRequest(options, data) {
  var req = https.request(options, function(res) {
    var body = "";
    // console.log("statusCode: ", res.statusCode);
    // console.log("headers: ", res.headers);
    res.on('data', function(d) {
      body += d;
      // process.stdout.write(d);
    });
    res.on("end", function() {
      try {
        var parsedData = JSON.parse(body),
            headers = ["Start Date"],
            rows = "",
            startDate = parsedData["query"]["start-date"];
        
        for (var i = 0, len = parsedData["columnHeaders"].length; i < len; i++) {
          headers.push(parsedData["columnHeaders"][i].name);
        }
        for (var i = 0, len = parsedData["rows"].length; i < len; i++) {
          rows = rows + startDate + ", " + parsedData["rows"][i] + "\n";
        }
        console.log(headers.toString());
        //console.log(rows);
        data.headers = headers.toString();
        data.data = data.data + rows;
        data.limit = data.limit - 1;
        //console.log(data);
        if (data.limit <= 0) {
          ee.emit("finished");
        }
        else {
          console.error(data.limit);
        }
        // console.log(parsedData);
      } catch(e) {
        if (typeof parsedData["error"]["errors"] !== "undefined") {
           console.log(JSON.stringify(parsedData["error"]["errors"][0]["reason"]));
        }
        console.log("error: " + e + ", status code: " + res.statusCode);
        console.log("query string: " + options.path);
      }
    });
  });
  req.end();
  req.on('error', function(e) {
    console.error(e);
  });
}

ee.on("tokenReady", function() {  

  // make one request for each month in range

  var beginArr = opts.begin.match(GA_DATE_REGEX),
      beginYear = beginArr[1], beginMonth = beginArr[2],
      months = gaMonthsBetween(opts.begin, opts.end),
      queue = async.queue(function (task, callback) {
        setTimeout(function() { callback(task.count)}, 125);
      }, 2);
  
  var gaData = {
    limit: months
  };
  gaData.headers = "";
  gaData.data = "";

  ee.on("finished", function() {
    console.log(gaData.headers);
    console.log(gaData.data);
    process.exit(0);
  });
  
  for (var i = 0; i < months; i++) {

    var month = parseInt(beginMonth, 10);
    queue.push({ count: i}, function(increment) { 
      var thisMonth = month + increment;
      // reset the beginning and ending months to segment request
      opts.begin = gaDateFormat(beginYear + "-" + thisMonth + "-1");
      opts.end   = gaDateFormat(beginYear + "-" + thisMonth + "-1", true),
      path = gaQueryString(opts);
      var options = {
        hostname: "www.googleapis.com",
        path: path,
        method: "GET",
        headers: {
          "Authorization" : "Bearer " + gaauth.token
        }
      };
      gaRequest(options, gaData);
    });
  }
});


