import json, re

with open('src/country-slim3.json') as f:
  countries = json.load(f)

mappings = {
  'United Kingdom of Great Britain and Northern Ireland': 'UK',
  'United States of America': 'US',
  'Korea, Republic of': 'S Korea',
  'Korea (Democratic People\'s Republic of)': 'N Korea',
  'Virgin Islands (U.S.)': 'US Virgin Islands',
  'Virgin Islands (British)': 'British Virgin Islands',
  'Lao People\'s Democratic Republic': 'Laos',
  'Bosnia and Herzegovina': 'Bosnia',
  'Saint Vincent and the Grenadines': 'Saint Vincent',
}

def normalize(name):
  if name in mappings:
    return mappings[name]
  # Remove parentheses
  name = re.sub(' *\([^)]*\)', '', name)
  # Remove comma qualifier
  name = re.sub(', .*$', '', name)
  return name

out = ['var COUNTRIES = {\n']
for record in countries:
  out.append('%s: "%s",\n' % (record['alpha-3'], normalize(record['name'])))
out.append('};\nvar COUNTRY_ABBREV = _.invert(COUNTRIES);\n')

with open('countries.js', 'w') as f:
  f.write((''.join(out)).encode('utf-8'))
  
