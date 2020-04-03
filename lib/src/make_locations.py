import csv, json

# fips_table
# iso3_to_country
# us2_to_state_name

with open('src/usa_states.json') as f:
  us2_to_state_name = json.load(f)
  us2_from_state_name = { v: k for k, v in us2_to_state_name.items() }

def normalize_country(c):
  return {
    'Korea, South': 'S Korea',
    'Korea, North': 'N Korea',
    'Taiwan*': 'Taiwan',
    'Congo (Brazzaville)': 'Congo-Brazzaville',
    'Congo (Kinshasa)': 'Congo-Kinshasa',
    'United Kingdom': 'UK',
    'United States': 'US',
  }.get(c, c.strip(', '))

def add_countries(locations):
  if not len([loc for loc in locations if loc['iso3'] == 'GUF']):
    locations.append(dict(
      iso3='GUF',
      fips=None,
      county=None,
      state=None,
      fullstate=None,
      country='French Guyana',
      lat=3.9339,
      lon=-53.1258,
      loc='French Guyana',
    ))

def normalize_state(s, c):
  if c == 'US':
    return us2_from_state_name.get(s, s)
  return s

def full_state_name(s, c):
  if c == 'US':
    return us2_to_state_name.get(s, s)
  return None

def normalize_county(t, s, c):
  if c == 'US':
    if t == 'District of Columbia':
      return 'Washington'
  return t

def normalized_key(t, s, c):
  if c == 'US' and s:
    return ', '.join([loc for loc in [t, s] if loc])
  return ', '.join([loc for loc in [t, s, c] if loc])

def float_or_none(s):
   try:
     return float(s)
   except:
     return None

def promote_colony(iso3, county, state, country):
  if country == 'France' and iso3 != 'FRA':
     return [None, None, state]
  return county, state, country

# https://github.com/CSSEGISandData/COVID-19/blob/master/csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv

locations = []
with open('src/UID_ISO_FIPS_LookUp_Table.csv') as f:
  for rec in csv.DictReader(f):
    country = normalize_country(rec['Country_Region'] or None)
    state = normalize_state(rec['Province_State'] or None, country)
    county = normalize_county(rec['Admin2'] or None, state, country)
    county, state, country = promote_colony(
        rec['iso3'] or None, county, state, country)
    locations.append(dict(
      iso3=rec['iso3'] or None,
      fips=rec['FIPS'] or None,
      county=county,
      state=state,
      fullstate=full_state_name(state, country),
      country=country,
      lat=float_or_none(rec['Lat']),
      lon=float_or_none(rec['Long_']),
      loc=normalized_key(county, state, country),
      level='county' if county else 'state' if state else 'country',
    ))
  add_countries(locations)

with open('src/locations_code.js') as f:
  locations_code = f.read()

with open('locations.js', 'w') as f:
  f.write('var LOCATIONS = ')
  json.dump(locations, f, indent=1)
  f.write(';\n')
  f.write(locations_code);

