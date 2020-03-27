function parse_date(name) {
  return /^(\d{1,2})\/(\d{1,2})\/(?:20)?(\d{2})$/.exec(name);
}
function fieldnum(names, pat) {
  return names.findIndex(n => RegExp(pat, 'i').exec(n))
}
function first_date_field(names) {
  return names.findIndex(n => !!parse_date(n));
}
function num_from_date(d) {
  return Date.parse(d + 'Z') / 8.64e+7;
}
function date_from_num(n) {
  var d = new Date((n+0.5) * 8.64e+7);
  return (d.getMonth()+1)+'/'+(d.getDate())+'/'+
         (d.getFullYear()+'').substr(2,4);
}
