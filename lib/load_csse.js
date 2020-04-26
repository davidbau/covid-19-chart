//////////////////////////////////////////////////////////////////////
// Data loading.
// Loads directly from the Johns Hopkins CSSE COVID-19 data feed on
// github. They publish three time series: "Confirmed", "Deaths", and
// "Recovered".  The data in the last category seems inconsistent
// so is not included in the current graph.
//
// Starting on 3/23/20, CSSE changed formats and has (hopefully
// temporarily) stopped publishing US state-level time series,
// although global by-country time series are still being produced.
// The code below merges three data sources to make up for this.
//   (1) the global file for by-country time series.
//   (2) the old time-series files for by-state before 3/23
//   (3) individual by-day files for by-state on 3/23 and after.
// Every source row becomes its own row, with appropriate columns
// translated, and we depend on rollup_ts to sum and produce
// aggregated by-state statistics by adding all the relevant rows.
//////////////////////////////////////////////////////////////////////

var orig_ts_base_url = "https://raw.githubusercontent.com/CSSEGISandData" +
  "/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/";
var cached_ts_base_url = "https://cdn.jsdelivr.net/gh/CSSEGISandData" +
  "/COVID-19@master/csse_covid_19_data/csse_covid_19_time_series/";

function orig_ts_url(seriesname, domain) {
  return orig_ts_base_url + "time_series_covid19_" + seriesname
       + "_" + domain + ".csv";
}
function cached_ts_url(seriesname, domain) {
  return cached_ts_base_url + "time_series_covid19_" + seriesname
       + "_" + domain + ".csv";
}
function daily_url(date) {
  return daily_base_url + date + '.csv';
}
function load_csse_data() {
  return new Promise((resolve, reject) => {
    var needed = {
      confirmed_global: orig_ts_url('confirmed', 'global'),
      deaths_global: orig_ts_url('deaths', 'global'),
      confirmed_US: orig_ts_url('confirmed', 'US'),
      deaths_US: orig_ts_url('deaths', 'US'),
      cached_confirmed_global: cached_ts_url('confirmed', 'global'),
      cached_deaths_global: cached_ts_url('deaths', 'global'),
      cached_confirmed_US: cached_ts_url('confirmed', 'US'),
      cached_deaths_US: cached_ts_url('deaths', 'US'),
    };
    var results = {}, pending = 0;
    function start_download(k) {
      pending += 1;
      url = needed[k];
      Papa.parse(url, {
        download: true,
        complete: r => {
          r.data[0] = _.map(r.data[0], normalize_date);
          results[k] = r.data;
          pending -= 1;
          if (!pending) resolve(merge_sources(results));
        },
        error: () => {
          pending -= 1;
          if (!pending) resolve(merge_sources(results));
        }
      });
    }
    _.forOwn(needed, (url, k) => { start_download(k); });
  });
}
function normalize_date(d) {
  var p = parse_date(d);
  if (!p) { return d; }
  return p[1] + '/' + p[2] + '/' + p[3];
}
function add_columns(data, added_names) {
  var current_columns = data[0];
  added_names = added_names.filter(n => current_columns.indexOf(n) < 0);
  if (!added_names.length) { return data; }
  var empty = _.fill(Array(added_names.length), null);
  _.forEach(data, s => s.unshift(...empty));
  _.forEach(added_names, (n, i) => {data[0][i] = n});
  return data;
}
function merge_sources(splits) {
  var results = {};
  for (var s of ['confirmed', 'deaths']) {
    var data = splits[s + '_global'] || splits['cached_' + s + '_global'];
    var country_i = fieldnum(data[0], 'country');
    data = data.filter((r, i) => i == 0 || r[country_i] != 'US'); // remove US
    // Make room to merge county-level data.
    add_columns(data, ['FIPS', 'Admin2']);
    // Now merge in US county-level data.
    var usa = splits[s + '_US'] || splits['cached_' + s + '_US'];
    country_i = fieldnum(usa[0], 'country');
    usa = usa.filter((r, i) => i == 0 || r[country_i] == 'US'); // US only
    add_rows(data, usa);
    // NYC was missing on 4/25.  Fill empty cells using previous day.
    fill_empty_cells(data);
    results[s] = data;
  }
  return results;
}
function add_rows(data, added) {
  function normalize_field(n) {
    return n.replace(/[\W]/g, '_').toLowerCase();
  }
  var indexmap = _.fromPairs(data[0].map((n, i) => [normalize_field(n), i]));
  var supplied = added[0].map(normalize_field);
  for (var row of added.slice(1)) {
    var translated = new Array(data[0].length);
    for (var i in row) {
      if (indexmap.hasOwnProperty(supplied[i])) {
        translated[indexmap[supplied[i]]] = row[i];
      }
    }
    data.push(translated);
  }
}
function fill_empty_cells(data) {
  var ts_n = fieldnum(data[0], 'admin');
  var ts_i = first_date_field(data[0]);
  for (var row of data.slice(1)) {
    if (row[ts_n] == 'Unassigned') { continue; }
    var prev = 0;
    for (var i = ts_i; i < data[0].length; ++i) {
      if (row[i]) {
        prev = +row[i];
      } else if (prev && !row[i]) {
        row[i] = prev;
      }
    }
  }
}
