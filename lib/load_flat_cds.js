//////////////////////////////////////////////////////////////////////
// Data loading from coronoadatascraper.com.
// Loads directly from the community CoronaDataScraper data feed.
//////////////////////////////////////////////////////////////////////

var cds_byloc_url = 'https://coronadatascraper.com/timeseries-byLocation.json';

/*
function locality_name(county, state, country) {
  country = COUNTRIES[country] || country;
  var commalist = [country];
  if (country == 'US') {
    if (!!state) {
      state = STATE_ABBREV[state] || state;
      commalist = [county, state];
    }
  } else {
    commalist = [county, state, country];
  }
  return commalist.filter(c => !!c).join(', ');
}

function normalize_country(country) {
  return COUNTRIES[country] || country;
}

function normalize_state(state, country) {
  if (country == 'US') { return STATE_ABBREV[state] || state };
  return state;
}

function normalize_county(county, state, country) {
  if (county.endsWith(' County')) {
    return county.replace(' County', '');
  }
  return county;
}

function normalize_locinfo(record) {
  var country = normalize_country(record.country),
    state = normalize_state(record.state, country),
    county = normalize_state(record.county, state, country),
    fips = normalize_fips(county, state, country),
  return { country: country, state: state, county: county,
           fips: fips, population: record.population };
}
*/

var IGNORE_LOCS = {
  'UK, UK': 1
}

function load_flat_cds_data() {
  return $.getJSON(cds_byloc_url).then(response => {
    var result = {};
    for (var k in response) {
      var rec = response[k],
          locinfo = normalized_locinfo(rec),
          loc = locinfo.loc,
          srt = _.flow(
              _.toPairs,
              x => x.map(d => _.defaults(
                  d[1],
                  { date: d[0], daynum: num_from_date(d[0]) },
                  locinfo)),
              x => _.sortBy(x, ['daynum']))(rec.dates),
          dmap = _.fromPairs(srt.map(d => [d.daynum, d]));
      if (!IGNORE_LOCS[loc]) {
        result[loc] = _.range(srt[0].daynum, srt[srt.length - 1].daynum)
          .map(daynum => dmap[daynum]);
      }
    }
    return result;
  });
}
