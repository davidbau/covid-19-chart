var COUNTRY_FROM_ISO3 = _.defaults(_.fromPairs(LOCATIONS
  .filter(x => !!x.iso3 && !!x.country && !x.state)
  .map(x => [x.iso3, x.country])), {
  XKX: 'Kosovo',
  GRL: 'Greenland',
  GUM: 'Guam',
  GGY: 'Guernsey',
  JEY: 'Jersey',
  PRI: 'Puerto Rico',
  BWA: 'Botswana',
  MWI: 'Malawi',
  BDI: 'Burundi',
});
var ABBR_FROM_US_STATE = _.fromPairs(LOCATIONS
  .filter(x => x.country == 'US' && !!x.fullstate)
  .map(x => [x.fullstate, x.state]))
var LOCATION_FROM_FIPS = _.fromPairs(LOCATIONS
  .filter(x => !!x.fips)
  .map(x => [x.fips, x]));
var LOCATION_FROM_COUNTRY = _.fromPairs(LOCATIONS
  .filter(x => !x.state && !x.county)
  .map(x => [x.country, x]));

var NORM_COUNTRY = {
  'United States': 'US',
  'United Kingdom': 'UK',
  'GBR': 'UK',
};

var COLONIAL = {
  UK: 1,
  US: 1,
  France: 1,
  Denmark: 1,
};

function match_location(county, state, country) {
  if (!state && !county && LOCATION_FROM_COUNTRY.hasOwnProperty(country)) {
    return LOCATION_FROM_COUNTRY[country];
  }
  var loc;
  for (loc of LOCATIONS) {
    if (country == loc.country &&
        (state || null) == loc.state &&
        (county || null) == loc.county) {
      return loc;
    }
  }
  if (COLONIAL[country]) {
    for (loc of LOCATIONS) {
      if (state == loc.country && !loc.state && !loc.count) {
        return loc;
      }
    }
  }
}

function make_location(county, state, country, info) {
  var result = { county: county, state: state, country: country };
  if (info.city) {
    result.city = info.city.replace(/ city$/, '');
  }
  result.level = result.city ? 'city' :
                 result.county ? 'county' :
                 result.state ? 'state' : 'country';
  if (info.coordinates) {
    result.lat = info.coordinates[0];
    result.lon = info.coordinates[1];
  }
  result.loc = [result.city, result.county, result.state, result.country
     == 'US' ? null : result.country].filter(c => !!c).join(', ');
  console.log('Making record for', result.level, result.loc);
  return result;
}

function normalized_locinfo(info) {
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
  if (country == 'US') {
    state = ABBR_FROM_US_STATE[info.state] || state;
    if (state && state.indexOf('D.C.') >=0) { state = 'DC'; }
  }
  if (state && state.startsWith('iso2:US-')) { state = state.slice(8); }
  if (country == 'Germany' && state && state.startsWith('DE-')) {
    state = state.slice(3);
  }
  var county = info.county;
  county = county && county.replace(
      / (?:County|Parish|Borough|Census Area)$/, '');
  if (county && county.startsWith('fips:')) {
    county_location = LOCATION_FROM_FIPS[county.slice(5)];
    county = county_location ? county_location.county : null;
  }
  if (county && county.endsWith(', County of')) {
    county = 'County of ' + county.slice(0, -11);
  }
  if (county == '(unassigned)') { county = 'Unassigned'; }
  if (state == 'ID' && county == 'Adam') {
    county = 'Adams'; // Fix error.
  }
  var location = match_location(county, state, country);
  if (!location) {
    location = make_location(county, state, country, info);
  }
  return _.defaults(data, location);
}
