import json
import re
import urllib

with open('country-slim3.json') as f:
  countries = json.load(f)

mappings = {
  'United Kingdom of Great Britain and Northern Ireland': 'UK',
  'United States of America': 'US',
  'United States': 'US',
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

country_map = {}

for record in countries:
  country_map[record['alpha-3']] = normalize(record['name'])

response = urllib.urlopen('https://coronadatascraper.com/timeseries-byLocation.json')
d = response.read()

data = json.loads(d)

pop = {}

present = 0
absent = 0

for k, v in data.items():
    if k in country_map:
        k = country_map[k]
    elif v['country'] in ['United States', 'USA']:
        if 'stateId' in v:
          state = v['stateId'].replace('iso2:US-', '')
          if v['level'] == 'county':
             c = v['county']
             c = c.replace(' County', '')
             c = c.replace(' Parish', '')
             c = c.replace(' City and Borough', '')
             c = c.replace(' Borough', '')
             c = c.replace(' District', '')
             c = c.replace(' Census Area', '')
             c = c.replace(' City', '')
             k = c + ', ' + state
          elif v['level'] == 'state':
             k = state
    if "population" in v.keys():
        pop[k] = v["population"]
        present += 1
    else:
        print("no population for ", k)
        absent += 1

# All of NYC reports as one locality.
for c in ['Kings, NY', 'Queens, NY', 'Bronx, NY', 'Richmond, NY']:
    pop['New York, NY'] += pop[c] - 1
    pop[c] = 1 # avoid division-by-zero

print(pop)
with open('../population.js', 'w') as fp:
    out = ['var POPULATION = ']
    out.append(json.dumps(pop, indent=2))
    out.append(';\n')
    fp.write((''.join(out)).encode('utf-8'))

print("present: ", present)
print("absent:", absent)
