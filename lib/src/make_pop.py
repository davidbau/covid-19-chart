import json
import re
import urllib

with open('country-slim3.json') as f:
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

country_map = {}

for record in countries:
  country_map[record['alpha-3']] = normalize(record['name'])

response = urllib.urlopen('https://coronadatascraper.com/timeseries-byLocation.json')
d = response.read()

data = json.loads(d)

pop = {}

present = 0
absent = 0

for k,v in data.items():
    if k in country_map:
        k = country_map[k]
    k = k.replace(', USA', '')
    k = k.replace(' County, ', ', ')
    k = k.replace(' Parish, ', ', ')
    k = k.replace(' Parish, ', ', ')
    k = k.replace(' City And Borough, ', ', ')
    k = k.replace(' Borough, ', ', ')
    if "population" in v.keys():
        pop[k] = v["population"]
        # No idea why NYC populaton is wrong in the data.
        if k == 'New York, NY':
            pop[k] = 8400000
        present += 1
    else:
        print("no population for ", k)
        absent += 1

print(pop)
with open('../population.js', 'w') as fp:
    out = ['var POPULATION = ']
    out.append(json.dumps(pop, indent=2))
    out.append(';\n')
    fp.write((''.join(out)).encode('utf-8'))

print("present: ", present)
print("absent:", absent)
