// From https://github.com/gionkunz/chartist-js/issues/118#issuecomment-77740910

// update and resize chart when printing
function chartScale(chart) {
  var ua = navigator.userAgent.toLowerCase();

  // Firefox printing bug workaround
  if (ua.indexOf('firefox') > -1) {
    var chart = document.getElementsByClassName('ct-chart-line')[0], // change class name to your svg
      width = chart.getBBox().width,
      factor = 565 / width; // width of printable area(75dpi) / width of chart

    chart.setAttribute("transform", "scale("+factor+")");
    setTimeout(function () {
      chart.setAttribute("transform", "scale(1)");
    }, 10);
  } else {
    // this works in Chrome & latest Opera
    chart.update();
  }
};

// fix printing for different browsers
function preparePrintChart(chart) {
  if (window.matchMedia) {
    window.matchMedia('print').addListener(function() {
      chartScale(chart);
    });
  }

  window.onbeforeprint = function () {
    chartScale(chart);
  };
};
