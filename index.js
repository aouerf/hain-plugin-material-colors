const colors = require('./colors.js');
const packageName = require('./package.json').name;

const colorSeparator = '_';
const shadePattern = /^a?[1-9]{0,1}0{0,2}$/;
const emptyQuery = {
  preferences: {
    id: 'preferences',
    title: 'Open Preferences',
    desc: 'Change how the color values are formatted and displayed',
    icon: '#fa fa-cog',
  },
  website: {
    id: 'website',
    title: 'View the Material Color Guidelines',
    desc: 'https://material.io/guidelines/style/color.html',
    icon: '#fa fa-globe',
  },
};

const toTitleCase = str =>
  str.split(colorSeparator)
    .map(s => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase())
    .join(' ');

const hasAllStartingWith = (arr1, arr2) =>
  arr1.length >= arr2.length && arr2.every(w2 => arr1.some(w1 => w1.startsWith(w2)));

module.exports = (pluginContext) => {
  const { app, shell, preferences, toast, clipboard } = pluginContext;

  let colorType;
  let colorPrefix;

  const updatePrefs = (pref) => {
    colorType = pref.useRgb ? 'rgb' : 'hex';
    colorPrefix = pref.useRgb ? 'rgb' : pref.prefix;
  };

  const startup = () => {
    updatePrefs(preferences.get());
    preferences.on('update', updatePrefs);
  };

  const search = (query, res) => {
    const queries = query.trim().toLowerCase().split(' ');

    if (queries[0] === '') {
      return res.add([
        emptyQuery.preferences,
        emptyQuery.website,
      ]);
    }

    const hues = [];
    const results = [];
    const queryShade = queries.length > 1 && shadePattern.test(queries[queries.length - 1]) ?
                       queries.pop().toUpperCase() : '';

    Object.keys(colors).forEach((hue) => {
      if (hasAllStartingWith(hue.split(colorSeparator), queries)) {
        hues.push(hue);
      }
    });

    hues.forEach((hue) => {
      Object.keys(colors[hue]).forEach((shade) => {
        const colorValue = `${colorPrefix}${colors[hue][shade][colorType]}`;

        if (queryShade === '' || shade.includes(queryShade)) {
          results.push({
            id: `${hue}${shade}`,
            payload: colorValue,
            title: shade,
            desc: colorValue,
            icon: `http://www.beautycolorcode.com/${colors[hue][shade].hex}-48x48.png`,
            group: toTitleCase(hue),
          });
        }
      });
    });

    return res.add(results);
  };

  const execute = (id, payload) => {
    switch (id) {
      case emptyQuery.preferences.id:
        app.openPreferences(packageName);
        break;
      case emptyQuery.website.id:
        shell.openExternal(emptyQuery.website.desc);
        break;
      default:
        clipboard.writeText(payload);
        clipboard.readText().then(result => toast.enqueue(
            result === payload ? `${result} copied to clipboard` : 'Unable to copy to clipboard',
            1000));
        break;
    }
  };

  return { startup, search, execute };
};
