var COUNTRY_FROM_ISO3 = _.defaults(_.fromPairs(LOCATIONS
  .filter(x => !!x.iso3 && !!x.country && !x.state)
  .map(x => [x.iso3, x.country])), EXTRA_COUNTRIES)
var ABBR_FROM_US_STATE = _.defaults(_.fromPairs(LOCATIONS
  .filter(x => x.country == 'US' && !!x.fullstate)
  .map(x => [x.fullstate, x.state])), {
    "American Samoa": "AS",
    "District of Columbia": "DC",
    "Federated States of Micronesia": "FM",
    "Guam": "GU",
    "Marshall Islands": "MH",
    "Northern Mariana Islands": "MP",
    "Palau": "PW",
    "Puerto Rico": "PR",
    "Virgin Islands": "VI"
  })
var LOCATION_FROM_FIPS = _.fromPairs(LOCATIONS
  .filter(x => !!x.fips)
  .map(x => [x.fips, x]));
var LOCATION_FROM_COUNTRY = _.fromPairs(LOCATIONS
  .filter(x => !x.state && !x.county)
  .map(x => [x.country, x]));
var COLONIAL = {
  UK: 1,
  US: 1,
  France: 1,
  Denmark: 1,
  China: 1,
};
function match_location(city, county, state, country) {
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
function make_location(city, county, state, country, lat, lon) {
  var result = { city: city, county: county, state: state, country: country,
     lat: lat, lon: lon  };
  result.level = result.city ? 'city' :
                 result.county ? 'county' :
                 result.state ? 'state' : 'country';
  result.name = [city, county, state, country == 'US' ? null : country
               ].filter(c => !!c).join(', ');
  return result;
}

