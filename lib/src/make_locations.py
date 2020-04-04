import csv, json, re

# fips_table
# iso3_to_country
# us2_to_state_name
# slim3_countries

with open('src/usa_states.json') as f:
  us2_to_state_name = json.load(f)
  us2_from_state_name = { v: k for k, v in us2_to_state_name.items() }

with open('src/country-slim3.json') as f:
  slim3_countries = json.load(f)

def normalize_country(c):
  c = {
    'Korea, South': 'S Korea',
    'Korea, North': 'N Korea',
    'Taiwan*': 'Taiwan',
    'Congo (Brazzaville)': 'Congo-Brazzaville',
    'Congo (Kinshasa)': 'Congo-Kinshasa',
    'United Kingdom': 'UK',
    'United States': 'US',
    'United Kingdom of Great Britain and Northern Ireland': 'UK',
    'United States of America': 'US',
    'Korea, Republic of': 'S Korea',
    'Korea (Democratic People\'s Republic of)': 'N Korea',
    'Virgin Islands (U.S.)': 'US Virgin Islands',
    'Virgin Islands (British)': 'British Virgin Islands',
    'Lao People\'s Democratic Republic': 'Laos',
    'Bosnia and Herzegovina': 'Bosnia',
    'Saint Vincent and the Grenadines': 'Saint Vincent',
  }.get(c, c.strip(', '))
  # Remove parentheses
  c = re.sub(r' *\([^)]*\)', '', c)
  # Remove comma qualifier
  c = re.sub(', .*$', '', c)
  return c

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
  if (country == 'France' and iso3 != 'FRA' or
      country == 'Denmark' and iso3 != 'DNK' or
      country == 'US' and iso3 != 'USA' or
      country == 'UK' and iso3 != 'GBR' or
      country == 'China' and iso3 != 'CHN'):
     return [None, None, state]
  return county, state, country

# https://github.com/CSSEGISandData/COVID-19/blob/master/csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv

locations = []
seen_iso3 = {}
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
      name=normalized_key(county, state, country),
      level='county' if county else 'state' if state else 'country',
    ))
    seen_iso3[rec['iso3']] = 1

with open('src/locations_code.js') as f:
  locations_code = f.read()

with open('locations.js', 'w') as f:
  f.write('var LOCATIONS = ')
  json.dump(locations, f, indent=1)
  f.write(';\n')
  f.write('var EXTRA_COUNTRIES = ')
  unseen = {rec['alpha-3']: rec['name'] for rec in slim3_countries
     if rec['alpha-3'] not in seen_iso3}
  unseen['XKX'] = 'Kosovo'
  json.dump(unseen, f, indent=1)
  f.write(';\n')
  f.write(locations_code);

