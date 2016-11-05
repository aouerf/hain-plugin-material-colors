'use strict';

function toTitleCase(str) {
  return str.split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase())
    .join(' ');
}

function hasWords(arr1, arr2) {
  if (arr1.length < arr2.length) {
    return false;
  }
  for (let w = 0; w < arr2.length; w++) {
    if (!arr1.some((element) => element.startsWith(arr2[w]))) {
      return false;
    }
  }
  return true;
}

module.exports = (pluginContext) => {

  const COLORS = require('./colors.js');
  const regexShade = /(^[1-9]0{0,2}$)|(^a([1|2|4|7]0{0,2})?$)/

  const app = pluginContext.app;
  const clipboard = pluginContext.clipboard;
  const shell = pluginContext.shell;
  const toast = pluginContext.toast;

  const prefs = pluginContext.preferences.get();
  const colorType = 'hex';
  const prefix = prefs.prefix;
  if (prefs.useRGB) {
    colorType = prefix = 'rgb';
  }

  function search(query, res) {
    let queries = query.trim().toLowerCase();
    if (!queries.length) {
      let results = [{
          id: 'preferences',
          title: 'Open Preferences',
          desc: 'Choose between using Hexadecimal or RGB values and set the Hexadecimal prefix',
          icon: '#fa fa-cog'
      }, {
          id: 'website',
          title: 'View the Material Color Guidelines',
          desc: 'https://www.google.com/design/spec/style/color.html',
          icon: '#fa fa-globe'
      }];
      return res.add(results);
    }
    queries = queries.split(' ');

    let queryShade = queries.length > 1 && regexShade.test(queries[queries.length - 1]) ? queries.pop() : undefined;
    let hues = [];
    let results = [];

    for (let hue in COLORS) {
      if (hasWords(hue.split('-'), queries)) {
        hues.push(hue);
      }
    }

    for (let h = 0; h < hues.length; h++) {
      let hue = hues[h];
      for (let shade in COLORS[hue]) {
        let colorVal = prefix + COLORS[hue][shade][colorType];

      if (!queryShade || shade.startsWith(queryShade)) {
          results.push({
            id: hue + shade,
            payload: colorVal,
            title: shade.toUpperCase(),
            desc: colorVal,
            icon: `http://www.beautycolorcode.com/${COLORS[hue][shade].hex}-48x48.png`,
            group: toTitleCase(hue)
          });
        }
      }
    }
    return res.add(results);
  }

  function execute(id, payload) {
    if (id === 'preferences') {
      app.openPreferences('hain-plugin-material-colors');
    } else if (id === 'website') {
      shell.openExternal('https://www.google.com/design/spec/style/color.html');
    } else {
      clipboard.writeText(payload);
      clipboard.readText().then((result) => {
        toast.enqueue(result === payload ? `${result} copied to clipboard` : 'Unable to copy to your clipboard', 1000);
      });
    }
  }

  return { search, execute };
};
