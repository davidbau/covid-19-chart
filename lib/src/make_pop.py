
# https://coronadatascraper.com/timeseries-byLocation.json

import json
import urllib

response = urllib.urlopen('https://coronadatascraper.com/timeseries-byLocation.json')
d = response.read()

data = json.loads(d)

pop = {}

present = 0
absent = 0

for k,v in data.items():
    if "population" in v.keys():
        pop[k] = v["population"]
        present += 1
    else:
        print("no population for ", k)
        absent += 1

print(pop)
with open('population.js', 'w') as fp:
    out = json.dumps(pop, indent=2)
    fp.write('var POPULATION = ')
    fp.write(out)

print("present: ", present)
print("absent:", absent)
