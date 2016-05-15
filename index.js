'use strict';

module.exports = (pluginContext) => {

  const toast = pluginContext.toast;
  const prefObj = pluginContext.preferences;

  const ncp = require('copy-paste');
  const COLORS = require('./colors.js');
  const pref = prefObj.get();

  var colorType = "hex",
      prefix = pref.prefix;
  if (pref.useRGB) {
    colorType = prefix = "rgb";
  }

  function toTitleCase(str) {
    return str.split('-')
        .map(s => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase())
        .join(' ');
  }

  function hasWords(arr1, arr2) {
    if (arr1.length < arr2.length) return false;
    for (var w = 0; w < arr2.length; w++) {
      var insideArr = arr1.some( (element) => element.startsWith(arr2[w]) );
      if (!insideArr) return false;
    }
    return true;
  }

  function search(query, res) {

    var queries = query.trim().toLowerCase();
    if (!queries.length) {
      return;
    }
    queries = queries.split(" ");
 
    var queryShade;
    var regexShade = /(^[1-9]0{0,2}$)|(^a([1|2|4|7]0{0,2})?$)/
    if (queries.length > 1 && regexShade.test(queries[queries.length - 1])) {
      var queryShade = queries.pop();
    }

    var hues = [],
        results = [];

    for (let hue in COLORS) {
      if (hasWords(hue.split("-"), queries)) hues.push(hue);
    }

    for (var h = 0; h < hues.length; h++) {

      let hue = hues[h];

      for (let s in COLORS[hue]) {
        let colorVal = prefix + COLORS[hue][s][colorType];

        if (!queryShade || (queryShade !== null && s.startsWith(queryShade))) {

          results.push({
            id: results.length,
            payload: colorVal,
            title: `${s.toUpperCase()}`,
            desc: colorVal,
            icon: `http://www.beautycolorcode.com/${COLORS[hue][s].hex}-48x48.png`,
            group: `${toTitleCase(hue)}`
          });

        }
      }
    }

    return res.add(results);

  }

  function execute(id, payload) {
    ncp.copy(payload, () => {
      toast.enqueue(`${payload} copied to clipboard`, 1000);
    });
  }

  return { search, execute };

};