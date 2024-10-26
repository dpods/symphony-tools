let isLogarithmic = false;
let highchartsConfigured = false;
const buttonClassName = 'logarithmic-toggle';
let chartsCount = 0;

/**
 * Custom Axis extension to allow emulation of negative values on a logarithmic
 * Y axis. Note that the scale is not mathematically correct, as a true
 * logarithmic axis never reaches or crosses zero.
 */
function applyLogarithmicCustomAxisHandler(highcharts) {
  const {
    addEvent,
    Axis,
    wrap
  } = highcharts;

  /* eslint-disable no-underscore-dangle */
  addEvent(Axis, 'afterInit', function () {
    const logarithmic = this.logarithmic;
    if (logarithmic && this.options.custom.allowNegativeLog) {
      // Avoid errors on negative numbers on a log axis
      this.positiveValuesOnly = false;

      // Override the converter functions
      logarithmic.log2lin = num => {
        const isNegative = num < 0;
        let adjustedNum = Math.abs(num);
        if (adjustedNum < 10) {
          adjustedNum += (10 - adjustedNum) / 10;
        }
        const result = Math.log(adjustedNum) / Math.LN10;
        return isNegative ? -result : result;
      };

      logarithmic.lin2log = num => {
        const isNegative = num < 0;
        let result = Math.pow(10, Math.abs(num));
        if (result < 10) {
          result = (10 * (result - 1)) / (10 - 1);
        }
        return isNegative ? -result : result;
      };

      // Add support for negative axis values to the tick positioning
      // function.
      wrap(logarithmic, 'getLogTickPositions', function (
        proceed,
        interval,
        min,
        max,
        minor
      ) {
        if (
          !this.axis.options.custom.allowNegativeLog ||
          interval >= 0.5 ||
          interval < 0.08
        ) {
          return proceed.call(this, interval, min, max, minor);
        }

        const log = this,
          roundedMin = Math.floor(min),
          positions = [];
        let intermediate,
          i,
          j,
          len,
          pos,
          lastPos,
          break2;

        if (interval > 0.3) {
          intermediate = [1, 2, 4];
        } else if (interval > 0.15) {
          intermediate = [1, 2, 4, 6, 8];
        } else {
          intermediate = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        }

        for (i = roundedMin; i < max + 1 && !break2; i++) {
          len = intermediate.length;
          if (i <= 0) {
            for (j = len - 1; j >= 0 && !break2; j--) {
              pos = -log.log2lin(
                (log.lin2log(-i) || 1) * intermediate[j]
              );

              if (
                pos > min &&
                (!minor || lastPos <= max) &&
                typeof lastPos !== 'undefined'
              ) {
                positions.push(lastPos);
              }
              if (lastPos > max) {
                break2 = true;
              }
              lastPos = pos;
            }

            if (lastPos < min || lastPos > max) {
              lastPos = undefined;
            }
          }

          if (i === 0 && min <= 0 && max >= 0) {
            positions.push(0);
          }

          if (i >= 0) {
            for (j = 0; j < len && !break2; j++) {
              pos = log.log2lin(
                (log.lin2log(i) || 1) * intermediate[j]
              );

              if (
                pos > min &&
                (!minor || lastPos <= max) &&
                typeof lastPos !== 'undefined'
              ) {
                positions.push(lastPos);
              }
              if (lastPos > max) {
                break2 = true;
              }
              lastPos = pos;
            }
          }
        }

        return positions;
      });
    }
  });
}

function renderLogarithmicScale(shouldToggle = true) {
  isLogarithmic = shouldToggle ? !isLogarithmic : isLogarithmic;
  window.localStorage.setItem('isLogarithmic', isLogarithmic); // persist state

  for(chart of window.Highcharts.charts) {
    if (!chart) continue;

    const yAxisConfig = isLogarithmic ? {
      // note that negative logarithmic scales are not mathematically correct
      // and are dependent on the custom Axis handler
      type: 'logarithmic',
      custom: { allowNegativeLog: true }
    } : {
      type: 'linear'
    };

    // Loop through all yAxes and update them
    chart.yAxis.forEach(axis => {
      axis.update(yAxisConfig, false); // false to avoid immediate redraw
    });

    // Redraw the chart after updating all axes
    chart.redraw();
  }
}

function updateButtonActiveState() {
  window.Highcharts.charts.forEach(chart => {
    if (chart) {
      const container = chart.container;
      const toggle = container.querySelector(`.${buttonClassName}`);
      if (toggle) {
        if (isLogarithmic) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
      }
    }
  });
}

function addLogarithmicToggleToCharts() {
  window.Highcharts.charts.forEach(chart => {
    if (chart) {
      const container = chart.container;
      const existingToggle = container.querySelector(`.${buttonClassName}`);
      if (existingToggle) {
        return;
      }

      const toggle = document.createElement('button');
      toggle.className = buttonClassName;
      toggle.innerText = 'L';

      toggle.addEventListener('click', () => {
        if (highchartsConfigured) {
          renderLogarithmicScale(true);
          updateButtonActiveState();
        }
      });

      container.appendChild(toggle);
    }
  });
}

// handle keypress to toggle logarithmic scale
document.addEventListener('keydown', (event) => {
  if (
    highchartsConfigured &&
    event.altKey && event.code === 'KeyL'
  ) {
    renderLogarithmicScale(true);
    updateButtonActiveState();
  }
});

function watchForAndConfigureHighcharts() {
  // configure highcharts when it becomes available
  if (window.Highcharts) {
    if (!highchartsConfigured) {
      isLogarithmic = window.localStorage.getItem('isLogarithmic') === 'true'; // restore state
      applyLogarithmicCustomAxisHandler(window.Highcharts);
      chartsCount = window.Highcharts.charts.length;
      highchartsConfigured = true;
    }

    // handle new charts being added
    if (window.Highcharts.charts.length !== chartsCount) {
      addLogarithmicToggleToCharts();
      renderLogarithmicScale(false);
      updateButtonActiveState();
    }
  } else {
    // if highcharts becomes unavailable, reset the flag so it will be configured again later
    if (highchartsConfigured) {
      highchartsConfigured = false;
    }
  }
}

window.setInterval(() => {
  watchForAndConfigureHighcharts();
}, 1000);
