import csv
import json
import re
import urllib

with open('country-slim3.json') as f:
  countries = json.load(f)

USA_STATES = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming",
  "AS": "American Samoa",
  "DC": "District of Columbia",
  "FM": "Federated States of Micronesia",
  "GU": "Guam",
  "MH": "Marshall Islands",
  "MP": "Northern Mariana Islands",
  "PW": "Palau",
  "PR": "Puerto Rico",
  "VI": "Virgin Islands"
}
STATE_FROM_ABBREV = dict([[v,k] for k,v in USA_STATES.items()])

mappings = {
  'United Kingdom of Great Britain and Northern Ireland': 'UK',
  'United Kingdom': 'UK',
  'United States of America': 'US',
  'United States': 'US',
  'Korea, Republic of': 'S Korea',
  'Korea, South': 'S Korea',
  'Korea (Democratic People\'s Republic of)': 'N Korea',
  'Korea, North': 'N Korea',
  'Virgin Islands (U.S.)': 'US Virgin Islands',
  'Virgin Islands (British)': 'British Virgin Islands',
  'Lao People\'s Democratic Republic': 'Laos',
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

response = urllib.urlopen('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv')
cr = csv.reader(response)
pop = {}

present = 0
absent = 0

for row in cr:
    region = row[5]
    state = row[6]
    country = row[7]
    population = row[11]
    if country in country_map:
        country = country_map[country]
    if country in mappings:
        country = mappings[country]
    if state in STATE_FROM_ABBREV:
        state = STATE_FROM_ABBREV[state]
    if region == 'New York City':
        region = 'New York'
        
    if population and population != 'Population':
        key = ''
        if region:
            if country != 'US':
                key = region + ', ' + state + ', ' + country
            else:
                key = region + ', ' + state
        elif state:
            if country != 'US':
                key = state + ', ' + country
            else:
                key = state
        else:
            key = country

        pop[key] = int(population)

        present += 1

# All of NYC reports as one locality.
if True:
    # JHU nums seem to came from 2019-07-01 estimates, but JHU's manhatten
    # population of 5+million is a weird number of unknown origin.
    # Erase all the boroughs and put the total on manhattan.
    for c in ['Kings, NY', 'Queens, NY', 'Bronx, NY', 'Richmond, NY']:
        del pop[c]
    pop['New York, NY'] = 8336817 # 2019-07-01 estimate for all 5 boroughs

print(pop)
with open('../population.js', 'w') as fp:
    out = ['var POPULATION = ']
    out.append(json.dumps(pop, indent=2, sort_keys=True))
    out.append(';\n')
    fp.write((''.join(out)).encode('utf-8'))

print("present: ", present)
print("absent:", absent)
