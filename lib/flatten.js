// Code to flatten csse-style time series spreadsheets
// into a D3-style set of records.

// Example use:
// flatten(load_csse_data())).then(d => {
//    console.log(d.FL) // an array of date records about florida
// });
//
// lastday(flatten(load_csse_data())).then(d => {
//    console.log(d.FL) // the very last date record about florida
// });

function rollup_locinfo_ts(series, key_function) {
  var names = series[0],
    admin_i = fieldnum(names, 'admin'),
    state_i = fieldnum(names, 'state'),
    country_i = fieldnum(names, 'country'),
    ts_i = first_date_field(names),
    ts_names = names.slice(ts_i),
    locinfo_names = names.slice(0, ts_i),
    all_totals = {},
    all_locinfo = {};
  for (var row of series.slice(1)) {
    var keys = key_function(row[country_i], row[state_i], row[admin_i]);
    _.forEach(keys, (key, j) => {
      if (!all_totals.hasOwnProperty(key)) {
        all_totals[key] = _.fill(Array(ts_names.length), 0);
        all_locinfo[key] = {};
      }
      var sumrow = all_totals[key];
      for (var i = ts_i; i < names.length; ++i) {
        sumrow[i - ts_i] += (isNaN(row[i]) || !row[i] ? 0 : parseInt(row[i]));
      }
      if (j == keys.length - 1) {
        var locinfo = all_locinfo[key];
        locinfo_names.forEach((n, i) => {
          if (!locinfo.hasOwnProperty(n)) { locinfo[n] = row[i]; }
        });
      }
    });
  }
  return [ts_names, all_totals, all_locinfo];
}
function norm_ctry(s) {
  if (s == 'Korea, South') return 'S Korea';
  if (s == 'United Kingdom') return 'UK';
  return s;
}
function keys_for_locality(country, state, admin) {
  var keys = [];
  country = norm_ctry(country);
  if (!!country) { keys.push(country); }
  if (country == 'US' && USA_ABBREV.hasOwnProperty(state)) {
    // Special case US - don't say ', US' at the end of everything.
    state = USA_ABBREV[state];
    keys.push(state);
    if (!!admin && admin != 'Unassigned') {
      keys.push(admin + ', ' + state);
    }
  } else {
    if (!!state && state != 'Unassigned') {
      keys.push([admin, state, country].filter(c => !!c).join(', '));
    }
    if (!!admin && admin != 'Unassigned') {
      keys.push([admin, state, country].filter(c => !!c).join(', '));
    }
  }
  return keys;
}
function flatten_all(feed) {
  var records = {};        // locname -> date -> { confirmed: n, deaths: n }
  var merged_locinfo = {}; // locname -> { fips: n, lat: n, etc }
  // Plan: records[locality][date] = { locinfo: locinfo, date: date, deaths: deaths, etc }
  for (var seriesname in feed) {
    var ts_names, all_totals, all_locinfo;
    [ts_names, all_totals, all_locinfo] = rollup_locinfo_ts(feed[seriesname], keys_for_locality);
    _.merge(merged_locinfo, all_locinfo);
    for (var loc in all_totals) {
      all_totals[loc].forEach((v, i) => {
        if (!!v) {
          var date = ts_names[i];
          if (!records.hasOwnProperty(loc)) {
            records[loc] = { };
          }
          if (!records[loc].hasOwnProperty(date)) {
            records[loc][date] = { name: loc, date: date };
            if (!records[loc].hasOwnProperty('first_date') ||
                num_from_date(date) < num_from_date(records[loc].first_date)) {
              records[loc].first_date = date;
            }
          }
          records[loc][date][seriesname] = v;
        }
      });
    }
  }
  merged_locinfo = _.mapValues(merged_locinfo, v => _.mapKeys(v, (vv, k) =>
    k == 'Admin2' ? 'county' : k.toLowerCase()));
  return _.mapValues(records, (v, loc) => {
    var series = [],
        props = merged_locinfo[loc];
    for (var i = num_from_date(v.first_date); ; ++i) {
      var d = date_from_num(i);
      if (!v.hasOwnProperty(d)) { break; }
      // Flatten all location properties into every record.
      series.push(_.defaults(v[d], props));
    }
    return series;
  });
}

function flatten_promise(loader, allflat) {
  return new Promise((resolve, reject) => {
    loader.then(d => {
      var flat = flatten_all(d);
      if (allflat) {
        flat = _.values(flat).concat();
      }
      resolve(flat);
    }).catch(reject);
  });
}

function last_day(flat) {
  return _.values(_.mapValues(flat, d => d[d.length - 1]));
}

