/* Google Analytics date range functions */

"use strict";

var GADate = require("./GADate.js"),
    GA_DATE_REGEX = GADate.GA_DATE_REGEX;

function GADateRange(begin, end, unit) {
  this.begin = begin;
  this.end = end;
  this.unitType = unit;
  if (this.unitType !== "month" && this.unitType !== "week") {
    throw new Error("Error: Unit type not specified " + this.unitType);
  }
  this.beginArray = begin.match(GA_DATE_REGEX);
  if (!this.beginArray || this.beginArray.length !== 4) { 
    throw new Error("Error: Beginning date not valid format yyyy-mm-dd");
  }
  this.endArray = end.match(GA_DATE_REGEX);
  if (!this.endArray || this.endArray.length !== 4) { 
    throw new Error("Error: End date not valid format yyyy-mm-dd");
  }
}

GADateRange.prototype.beginDate = function() {
  return new Date(this.beginArray[1], this.beginArray[2], this.beginArray[3]);
};

GADateRange.prototype.endDate = function() {
  return new Date(this.endArray[1], this.endArray[2], this.endArray[3]);
};

/**
* between 
*  months between two gaDateFormatted months ex. 2012-11-10
* @param first 
* @param second 
* @access public
* @return void
*/
GADateRange.prototype.between = function(unit) {
  if (unit !== "undefined" && unit === "month" || unit === "week") {
    throw new Error("Error: Unit type not specified " + unit);
  }
  var months = (this.endArray[1] - this.beginArray[1]) * 12;
  months = months - parseInt(this.beginArray[2], 10);
  months = months + parseInt(this.endArray[2], 10) + 1;
  if (unit === "week" || this.unitType === "week") { // else monthly
    var weeks = 0,
    start = new Date(this.beginArray[1], this.beginArray[2], this.beginArray[3]),
    next  = start,
    end   = new Date(this.endArray[1], this.endArray[2], this.endArray[3]);
    while (end > next) {
      weeks++;
      next.setDate(next.getDate()+7);
    }
    return weeks;
  }
  return months;
};

module.exports = GADateRange;
