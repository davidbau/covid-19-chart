COVID-19 Time Series Chart
==========================

Data are pulled directly from
<a href="https://github.com/CSSEGISandData/COVID-19">Johns Hopkins CSSE</a>
into an interactive chart with both log and linear options,
breakouts by state, and graphs of changes from day to day of
reported deaths and confirmed cases.

<a href="https://davidbau.github.io/covid-19-chart">See the chart at
https://davidbau.github.io/covid-19-chart</a>.

My physician wife wanted to see some summaries of U.S. covid-19
stats that are not graphed in the press, so I wrote this short HTML
page to create those rollups.

This page just one small HTML+JS page, using chartist.js
(with legend, tooltip, and logaxis extensions), vue.js, lodash.js,
and papaparse.  Pull requests are welcome.

Code is at <a href="https://github.com/davidbau/covid-19-chart">
https://github.com/davidbau/covid-19-chart</a>.

Open source. (MIT license.)

URL Parameter API
-----------------

The URL can be linked to save a chart.  Although legend selection states
are not saved, a graph with particular countries or states can be
created by directly using the URL API.

* `domain`: US or Intl.
* `series`: confirmed or deaths.
* `stat`: totals or deltas.
* `scale`: linear or log10.
* `start`: a date or >= expression as in the menu.
* `top`: integer how how many top states or countries to include.
* `include`: semicolon-separated list of states or countries to include.
* `bare`: set to 1 to show just the chart (e.g., for embedding).

There is no user interface for the last few options, but the URL can
be edited directly to customize the chart.
