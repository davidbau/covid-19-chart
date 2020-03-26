#!/usr/bin/env python
import re

with open('src/wikifips.html') as f:
  lines = [line.strip() for line in f.readlines()]

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

js = ["USA_COUNTIES={\n"]
for line in lines:
  if re.match(r'^<td[^>]*>\d{5}$', line):
    js.append(" '%s': " % line[-5:])
  elif re.match(r'^<td><a href', line):
    m = re.match(r'^<td><a [^>]*title="([^"]*)">', line)
    js.append("'%s',\n" % m.group(1).replace('&#39;', "\\'"))
js.append("};\n")
with open('usa_counties.js', 'w') as f:
  f.write(''.join(js))

