#!/usr/bin/env python
import re, json

with open('src/wikifips.html') as f:
  lines = [line.strip() for line in f.readlines()]
with open('usa_state_list.js') as f:
  slt = re.sub(r'(?ms).*(\{.*\}).*', r'\1', f.read())
  states = json.loads(slt)
state_abbrev = {v.decode(): k.decode() for k, v in states.items()}

def normalize_state(state):
  if 'Virgin Islands' in state:
    state = 'Virgin Islands'
  return state_abbrev[state]

def normalize_name(name):
   name = name.replace('&#39;', "\\'")
   name = name.replace('\u2013', '-')
   return name

# Chop out the table of interest.
lines = lines[lines.index('</th></tr>'):]
lines = lines[:lines.index('</td></tr></tbody></table>')]

  
# An example row:
# 
# <tr>
# <td style="text-align:center;">15001
# </td>
# <td><a href="/wiki/Hawaii_County,_Hawaii" title="Hawaii County, Hawaii">Hawaii County</a>
# </td>
# <td rowspan="5">...
# </td></tr>

js = ["FIPS_COUNTIES={\n"]
for line in lines:
  if re.match(r'^<td[^>]*>\d{5}$', line):
    js.append(" '%s': " % line[-5:])
  elif re.match(r'^<td><a href', line):
    m = re.match(r'^<td><a [^>]*title="([^"]*)">', line)
    if ', ' not in m.group(1):
      js.append("'%s',\n" % normalize_name(m.group(1)))
    else:
      name, state = m.group(1).split(', ')
      state = normalize_state(state)
      js.append("'%s, %s',\n" % (normalize_name(name).decode('utf-8'), state))
js.append("};\nCOUNTY_FIPS = _.invert(FIPS_COUNTIES);\n")
with open('fips_counties.js', 'w') as f:
  f.write(''.join(js).encode('utf-8'))
