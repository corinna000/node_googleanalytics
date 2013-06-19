/* Google Analytics static GADate functions */

"use strict";


// adds leading 0 to dates
function _pad(num) {
  var places = 2,
      zero = places - num.toString().length + 1;
  return new Array(+(zero > 0 && zero)).join("0") + num;
}

// YYYY-MM-DD pattern
var GA_DATE_REGEX = /^(\d{4})-(\d{1,2})-(\d{1,2})$/; 

var GADate = (function() {
  return { 
    // convert Date obj to YYYY-MM-DD 
    'dateToGADate' : function (date) {
      if (!date instanceof Date) {
        throw new Error("Argument not of type Date()");
      }
      return [date.getFullYear(), _pad(date.getMonth() + 1), _pad(date.getDate())].join("-");
    },
    // convert YYYY-MM-DD  to Date obj 
    'GADateToDate' : function (gadate) {
      var dateArr = gadate.match(GA_DATE_REGEX);
      if (dateArr.length !== 4) {
        throw new Error ("Date supplied: " + gadate + " not in YYYY-MM-DD format");
      }
      var year = dateArr[1],
          month = parseInt(dateArr[2] - 1, 10),
          day = parseInt(dateArr[3], 10);
      return new Date(year, month, day);

    },
    'monthFirstDay' : function (gadate) {
      var dateArr = gadate.match(GA_DATE_REGEX);
      if (dateArr.length !== 4) {
        throw new Error ("Date supplied: " + gadate + " not in YYYY-MM-DD format");
      }
      return GADate.dateToGADate(new Date(dateArr[1], dateArr[2]-1, 1));
    },
    'monthLastDay' : function (gadate) {
      var dateArr = gadate.match(GA_DATE_REGEX);
      if (dateArr.length !== 4) {
        throw new Error ("Date supplied: " + gadate + " not in YYYY-MM-DD format");
      }
      return GADate.dateToGADate(new Date(dateArr[1], parseInt(dateArr[2], 10), 0));
    },
    'nextWeek' : function (gadate) {
      var dateArr = gadate.match(GA_DATE_REGEX),
          today = GADate.GADateToDate(gadate);
      if (dateArr.length !== 4) {
        throw new Error ("Date supplied: " + gadate + " not in YYYY-MM-DD format");
      }
      return GADate.dateToGADate(new Date(today.setDate(today.getDate() + 7)));
    }
  };
})();

module.exports.GA_DATE_REGEX = GA_DATE_REGEX;
module.exports.GADate = GADate;
