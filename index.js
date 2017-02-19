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

const splitQuery = query =>
  query.trim().toLowerCase().split(/\s+/);

const hasAllStartingWith = (arr1, arr2) =>
  arr1.length >= arr2.length && arr2.every(w2 => arr1.some(w1 => w1.startsWith(w2)));

const getColorImage = hex =>
  `http://www.beautycolorcode.com/${hex}-48x48.png`;

module.exports = (pluginContext) => {
  const { app, shell, preferences, toast, clipboard } = pluginContext;

  // Handle preferences

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
    const queries = splitQuery(query);

    // Handle empty query
    if (queries[0] === '') {
      return res.add([
        emptyQuery.preferences,
        emptyQuery.website,
      ]);
    }

    const hues = [];
    const results = [];
    // Pop the last item in the query if it is a shade
    const queryShade = queries.length > 1 && shadePattern.test(queries[queries.length - 1]) ?
      queries.pop().toUpperCase() : '';

    // Cycle through all the colors and push the colors matching the given query to the results
    Object.keys(colors).forEach((hue) => {
      if (hasAllStartingWith(hue.split(colorSeparator), queries)) {
        hues.push(hue);
      }
    });

    // Cycle through all the selected colors and push the shades matching the query to the results
    hues.forEach((hue) => {
      Object.keys(colors[hue]).forEach((shade) => {
        const colorValue = `${colorPrefix}${colors[hue][shade][colorType]}`;

        // If the shade from the query is empty or matches current shade, push the shade to results
        if (queryShade === '' || shade.includes(queryShade)) {
          results.push({
            id: `${hue}${shade}`,
            payload: colorValue,
            title: shade,
            desc: colorValue,
            icon: getColorImage(colors[hue][shade].hex),
            group: toTitleCase(hue),
          });
        }
      });
    });

    return res.add(results);
  };

  const execute = (id, payload) => {
    switch (id) {
      // Go to preferences page for this package
      case emptyQuery.preferences.id:
        app.openPreferences(packageName);
        break;
      // Navigate to material design color guidelines website
      case emptyQuery.website.id:
        shell.openExternal(emptyQuery.website.desc);
        break;
      // Copy color value to clipboard
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
