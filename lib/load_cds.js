//////////////////////////////////////////////////////////////////////
// Data loading from coronoadatascraper.com.
// Loads directly from the community CoronaDataScraper data feed.
//////////////////////////////////////////////////////////////////////

var cds_byloc_url = 'https://coronadatascraper.com/timeseries-byLocation.json';

function normalize_state(state, country) {
  if (country == 'US' && state && state.length > 2) {
    state = STATE_ABBREV[state];
  }
  return state || null;
}
function normalize_county(county, state, country) {
  if (country != 'US' || !state) { return [county || null, null]; }
  var fips = null;
  if (state && county) {
     fq_county = county + ', ' + state;
     fips = FIPS_COUNTIES[fq_county] || null;
  }
  return [county, fips]
}

function load_cds_data() {
  return new Promise((resolve, reject) => {
    $.getJSON(cds_byloc_url, (response, status, xhr) => {
      var d_nums = _.map(_.keys(response.KOR.dates), d => num_from_date(d));
      var ds = _.min(d_nums), df = _.max(d_nums) + 1;
      var names = _.concat('Country State County City Aggregate FIPS Population Key'
         .split(' '), _.range(ds, df).map(i => date_from_num(i)));
      var cds = {};
      for (var field of 'confirmed deaths recovered active tested'.split(' ')) {
        var table = [names]
        _.forEach(response, (record, k) => {
          var country = COUNTRIES[record.country] || record.country;
          var state = normalize_state(record.state, country);
          var county, fips;
          [county, fips] = normalize_county(record.county, state, country);
          var dayrow = Array(df - ds);
          _.forEach(record.dates, (r, d) => {
            var dat = field == 'confirmed' ? r.cases : r[field];
            dayrow[num_from_date(d) - ds] = dat;
          });
          table.push(_.concat(
              [country, state, county, record.city, record.aggregate,
               fips, record.population, k], dayrow));
        })
        cds[field] = table;
      }
      resolve(cds);
    });
  });
}
