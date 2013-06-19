/* GADateRange tests */
'use strict';
var GADateRange = require("../lib/GADateRange.js"),
    GADate = require("../lib/GADate.js").GADate,
    begin  = "2012-01-01",
    end =  "2012-02-29",
    unit = "week",
    gadr; //  = new GADateRange(options);


exports['test Google date functions'] = {
  'setUp': function (done) {
    gadr = new GADateRange(begin, end, unit);
    done();
  },

  'default options are expected values': function(test) {
    test.expect(2);
    test.equals(gadr.begin, begin, "Starting date passes");
    test.equals(gadr.end, end, "Ending date passes");
    // test.ok(typeof gad.beginArray === "array","beginArray is an array: " + typeof gad.beginArray);
    test.done();
  },

  'calculate weeks between start and end dates': function(test) {
    test.expect(1);
    test.equals(gadr.between(),9,"Nine weeks between beginning and end dates");
    test.done();
  },

  'calculate months between start and end dates': function(test) {
    gadr.unitType = 'month';
    test.expect(1);
    test.equals(gadr.between(),2,"Two months between beginning and end dates");
    test.done();
  },

  'convert a Date object to google-formatted string YYYY-MM-DD': function(test) {
    test.expect(7);
    var testDate = new Date(2012, 1, 4); // feb 4, 2012
    var gaDateString = "2012-02-04";
    test.ok(GADate.dateToGADate(testDate),"Convert Date() to GA string");
    test.equals(GADate.dateToGADate(testDate),"2012-02-04", "Date object converted to correct string");
    test.ok(GADate.GADateToDate(gaDateString),"Convert GA string to Date");
    test.ok(GADate.GADateToDate(gaDateString) instanceof Date,"Converted GA string is a Date");
    test.equals(GADate.monthFirstDay(gaDateString), "2012-02-01", "Converted to first of month");
    test.equals(GADate.monthLastDay(gaDateString), "2012-02-29", "Converted to last day of month");
    test.ok(GADate.nextWeek(gaDateString), "2012-02-11", "7 days from now: 203-02-11");
    test.done();
  }

};
