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

var csse; // global.

var ts_base_url = "https://raw.githubusercontent.com/CSSEGISandData" +
  "/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/";
var old_ts_base_url = "https://raw.githubusercontent.com/CSSEGISandData" +
  "/COVID-19/master/archived_data/archived_time_series/";
var daily_base_url = "https://raw.githubusercontent.com/CSSEGISandData" +
  "/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/";

function ts_url(seriesname, domain) {
  return ts_base_url + "time_series_covid19_" + seriesname
       + "_" + domain + ".csv";
}
function old_ts_url(seriesname) {
  return old_ts_base_url + "time_series_19-covid-" + seriesname
        + '_archived_0325.csv';
}
function daily_url(date) {
  return daily_base_url + date + '.csv';
}
function load_csse_data(loaded) {
  var needed = {
    confirmed_global: ts_url('confirmed', 'global'),
    deaths_global: ts_url('deaths', 'global'),
    confirmed_old: old_ts_url('Confirmed'),
    deaths_old: old_ts_url('Deaths'),
  // Daily files are now autmoatically discovered.
  // We will load them individually until the US time series API appears.
  //  'daily_03-23-2020': daily_url('03-23-2020'),
  //  'daily_03-24-2020': daily_url('03-24-2020')
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
        if (k == 'confirmed_global') {
          for (var bad_date of get_bad_date_list(r.data)) {
            var bd_filename = format_date_filename(bad_date);
            if (!needed.hasOwnProperty(bd_filename)) {
              var new_k = 'daily_' + bd_filename;
              needed[new_k] = daily_url(bd_filename);
              start_download(new_k);
            }
          }
        }
        pending -= 1;
        if (!pending) loaded(merge_sources(results));
      }
    });
  }
  _.forOwn(needed, (url, k) => { start_download(k); });
}
function get_bad_date_list(series) {
  var first_bad_date_i = fieldnum(series[0], '3/23/20');
  return series[0].slice(first_bad_date_i);
}
function format_date_filename(d) {
  var p = parse_date(d);
  return ('0' + p[1]).slice(-2) + '-' + ('0' + p[2]).slice(-2) + '-20' + p[3];
}
function normalize_date(d) {
  var p = parse_date(d);
  if (!p) { return d; }
  return p[1] + '/' + p[2] + '/' + p[3];
}
function merge_sources(splits) {
  var results = {};
  for (var s of ['confirmed', 'deaths']) {
    var data = splits[s + '_global'];
    var country_i = fieldnum(data[0], 'country');
    data = data.filter((r, i) => i == 0 || r[country_i] != 'US'); // remove US
    // Hopefully the patchwork here can be removed after CSSE fixes its
    // data feed.  For now we patch together the misformatted data.
    var old = splits[s + '_old'];
    country_i = fieldnum(old[0], 'country');
    old = old.filter((r, i) => i == 0 || r[country_i] == 'US'); // US only
    for (var bad_date of get_bad_date_list(data)) {
      var bad_date_i = fieldnum(old[0], bad_date);
      if (bad_date_i >= 0) {
        _.forEach(old, (r) => r[bad_date_i] = null); // Erase bad data day
        add_rows(data, old);
      }
      var day = splits['daily_' + format_date_filename(bad_date)];
      country_i = fieldnum(day[0], 'country');
      day = day.filter((r, i) => i == 0 || r[country_i] == 'US'); // US only
      add_day(data, day, bad_date, s);
    }
    results[s] = data;
  }
  return results;
}
function add_rows(data, added) {
  var indexmap = _.fromPairs(data[0].map((n, i) => [n, i]));
  var supplied = added[0];
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
function add_day(data, singleday, date, columnname) {
  var state_ti = fieldnum(data[0], 'state'),
    country_ti = fieldnum(data[0], 'country'),
    data_ti = fieldnum(data[0], date),
    state_i = fieldnum(singleday[0], 'state'),
    country_i = fieldnum(singleday[0], 'country'),
    data_i = fieldnum(singleday[0], columnname);
  for (var row of singleday.slice(1)) {
    var newrow = new Array(data[0].length);
    newrow[country_ti] = row[country_i];
    newrow[state_ti] = row[state_i];
    newrow[data_ti] = row[data_i];
    data.push(newrow);
  }
}

