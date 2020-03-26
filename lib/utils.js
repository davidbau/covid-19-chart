function parse_date(name) {
  return /^(\d{1,2})\/(\d{1,2})\/(?:20)?(\d{2})$/.exec(name);
}
function fieldnum(names, pat) {
  return names.findIndex(n => RegExp(pat, 'i').exec(n))
}
function first_date_field(names) {
  return names.findIndex(n => !!parse_date(n));
}
