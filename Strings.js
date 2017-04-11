/**
 * Created by kyle on 4/11/17.
 */

/**
 * Quickly adds text to a div
 * @param addToDiv The div to add text to
 * @param text The text to be added
 */
var addText = function(addToDiv, text) {
    var newcontent = document.createElement('div');
    newcontent.innerHTML = text;
    addToDiv.appendChild(newcontent.firstChild);
};

/**
 * Set the text of an HTML element
 * @param boxId The id of the element to set the text of
 * @param text The text to be set
 */
var setText = function(boxId, text) {
    var box = dojo.byId(boxId);
    box.value = text;
};

/**
 * Formats the value used for a date string
 * (Basically just adds a zero if the value is less than 10)
 * E.g. This will change a date from 1-10-5 (don't want) to 01-10-05 (adds the zero)
 * @param value The value to be formatted
 * @returns {string} The formatted date string
 */
var formatTimeNumber = function(value) {
    return value < 10 ? "0" + value : value;
};

/**
 * Gets a string representation of the current date
 * In the format (YYYY-MM-dd hh:mm:ss
 * @returns {string}
 */
var getCurrentDate = function() {
    var date = new Date();
    date.setTime(Date.now());
    var dateString = date.getFullYear() + "-"
        + formatTimeNumber(date.getMonth()+1) + "-"
        + formatTimeNumber(date.getDate()) + " "
        + formatTimeNumber(date.getHours()) + ":"
        + formatTimeNumber(date.getMinutes()) + ":"
        + formatTimeNumber(date.getSeconds()) + ".000";
    return dateString;
};