function merge_day(d1, d2) {
  var result = _.defaults({}, d1, d2);
  for (var field of ['confirmed', 'deaths', 'recovered', 'active', 'tested']) {
    if (d1[field] && d2[field]) {
      result[field] = Math.max(d1[field], d2[field]);
    }
  }
  return result;
}

function merge_locality(a1, a2) {
  a1 = a1.filter(d => !!d && d.daynum);
  a2 = a2.filter(d => !!d && d.daynum);
  var result = [], i1 = 0, i2 = 0;
  while (i1 < a1.length || i2 < a2.length) {
    if (i1 < a1.length && (i2 >= a2.length || a1[i1].daynum < a2[i2].daynum)) {
      result.push(a1[i1]);
      i1 += 1;
    } else if (i1 >= a1.length || a2[i2].daynum < a1[i1].daynum) {
      result.push(a2[i2]);
      i2 += 1;
    } else {
      result.push(merge_day(a1[i1], a2[i2]));
      i1 += 1;
      i2 += 1;
    }
  }
  return result;
}

function merge_feeds(s1, s2) {
  var result = _.defaults({}, s1, s2);
  result = _.mapValues(result, (v, k) => {
    if (s1[k] && s2[k]) {
      return merge_locality(s1[k], s2[k]);
    }
    return v;
  });
  return result;
}
