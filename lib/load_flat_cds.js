//////////////////////////////////////////////////////////////////////
// Data loading from coronoadatascraper.com.
// Loads directly from the community CoronaDataScraper data feed.
//////////////////////////////////////////////////////////////////////

var cds_byloc_url = 'https://coronadatascraper.com/timeseries-byLocation.json';

var NORM_COUNTRY = {
  'United States': 'US',
  'United Kingdom': 'UK',
  'GBR': 'UK',
};
function normalized_cds_locinfo(info) {
  var data = { population: info.population };
  if (info.countyId && info.countyId.startsWith('fips:')) {
    var fips = info.countyId.slice(5);
    if (fips && LOCATION_FROM_FIPS.hasOwnProperty(fips)) {
      return _.defaults(data, LOCATION_FROM_FIPS[fips]);
    }
  }
  var country = info.country;
  country = NORM_COUNTRY[country] || COUNTRY_FROM_ISO3[country] || country;
  if (country && country == 'iso1:US') { country = 'US'; }
  var state = info.state;
  if (state && state.startsWith('iso2:US-')) { state = state.slice(8); }
  if (country == 'US') {
    state = ABBR_FROM_US_STATE[info.state] || state;
    if (state && state.indexOf('D.C.') >=0) { state = 'DC'; }
    if (state == 'United States Virgin Islands') { state = 'VI'; }
  }
  if (country == 'Germany' && state && state.startsWith('DE-')) {
    state = state.slice(3);
  }
  var county = info.county;
  if (county && county.endsWith(', County of')) {
    county = 'County of ' + county.slice(0, -11);
  } else if (county) {
    county = county.replace(
        / (?:County|Parish|Borough|Census Area)\b/g, '').replace(
        /, /g, ' and ')
  }
  if (county && county.startsWith('fips:')) {
    county_location = LOCATION_FROM_FIPS[county.slice(5)];
    county = county_location ? county_location.county : null;
  }
  if (county == '(unassigned)') { county = 'Unassigned'; }
  if (state == 'ID' && county == 'Adam') {
    county = 'Adams'; // Fix error.
  }
  if (state == 'MN' && county == 'Filmore') {
    county = 'Fillmore'; // Fix error.
  }
  if (state == 'MN' && county == 'LeSeur') {
    county = 'Le Sueur'; // Fix error.
  }
  if (state == 'MN' && county == 'Lac Qui Parle') {
    county = 'Lac qui Parle'; // Fix error.
  }
  if (state == 'TN' && county == 'Dekalb') {
    county = 'DeKalb'; // Fix error.
  }
  var city = info.city || null;
  city = city && city.replace(/ city$/, '');
  // Laad location from CSSE canonical list.
  var location = match_location(city, county, state, country);
  // Doesn't exist in CSSE.  So make our own record.
  if (!location) {
    var lat = info.coordinates && info.coordinates[0] || null;
    var lon = info.coordinates && info.coordinates[1] || null;
    location = make_location(city, county, state, country, lat, lon);
    if (info.countyId && info.countyId.startsWith('fips:')) {
      var fipslist = info.countyId.split('+').map(s => s.replace('fips:', ''));
      if (fipslist.length == 1) {
        location.fips = fipslist[0];
      } else {
        location.fipslist = fipslist;
      }
    }
    // Monitor locations that don't match the canonical CSSE list.
    // console.log(location.level, location.name, location);
  }
  return _.defaults(data, location);
}

var IGNORE_LOCS = {
  'UK, UK': 1
}

function translate_day(d) {
  if (d.confirmed == null && d.cases) {
    d.confirmed = d.cases;
  }
  delete d.cases;
  delete d.growthFactor;
  return d;
}

function find_or_fill_day(dmap, daynum) {
  if (dmap[daynum]) {
    return dmap[daynum];
  }
  // Do not fill more than a week.
  for (var sub = 1; sub < 7; ++sub) {
    if (dmap[daynum - sub]) {
      return _.defaults({ date: date_from_num(daynum), daynum: daynum  },
           dmap[daynum - sub]);
    }
  }
  return null;
}

function load_flat_cds_data() {
  return $.getJSON(cds_byloc_url).then(response => {
    var result = {};
    for (var k in response) {
      var rec = response[k],
          locinfo = normalized_cds_locinfo(rec),
          name = locinfo.name,
          srt = _.flow(
              _.toPairs,
              x => x.map(d => _.defaults(
                  translate_day(d[1]),
                  { date: norm_date(d[0]), daynum: num_from_date(d[0]) },
                  locinfo)),
              x => x.filter(d => d.confirmed || d.active || d.deaths),
              x => _.sortBy(x, ['daynum'])
            )(rec.dates),
          dmap = _.fromPairs(srt.map(d => [d.daynum, d]));
      if (srt.length && !IGNORE_LOCS[name]) {
        result[name] = _.range(srt[0].daynum, srt[srt.length - 1].daynum + 1)
          .map(daynum => find_or_fill_day(dmap, daynum));
      }
    }
    return result;
  });
}
