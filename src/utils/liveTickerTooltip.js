// This utility script is used to show a tooltip with the full name of 
// an equity when hovering over its ticker symbol.

(()=>{
  const API_URL = 'https://stagehand-api.composer.trade/api/v1/public/quotes';
  const tickerParentSelectors = [
    '.table-fixed tr td:first-child', // table cells (porfilio page)
    'table tr td:first-child', // table cells (Symphony Tools extension's table)
    '.table-auto tr td:first-child', // table cells
    '.table-auto tr th', // backtest historical allocations table
    '.blk--asset' // symphony details and edit page rule block assets
  ];

  //----------------------------------------------

  let tickerCache = {};
  try {
    tickerCache = JSON.parse(localStorage.getItem('tickerCache')) || {};
  } catch (e) {
    log('Error parsing ticker cache', e);
  }

  function createOrGetTooltip(event) {
    let tooltip = document.querySelector('.liveTickerTooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'liveTickerTooltip';
      document.body.appendChild(tooltip);
      function positionTooltip(event) {
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
      }
      document.addEventListener('mousemove', positionTooltip);
      positionTooltip(event); // initial position
    }

    return tooltip;
  }

  function setToolTipVisible(isVisible = true) {
    const tooltip = document.querySelector('.liveTickerTooltip');
    if (tooltip) {
      if (isVisible) {
        tooltip.classList.remove('hidden');
      } else {
        tooltip.classList.add('hidden');
      }
    }
  }

  function getTickersFromElement(tickerElement) {
    let matches;

    const TICKER_REGEX = /\b[A-Z]{1,6}\b/g; // do we need to include numbers?
    const ignoredTextContents = [
      'Cash Remainder',
      'US Dollar',
    ];

    const parentElement = tickerElement?.closest(tickerParentSelectors.join(', '));
    if (parentElement) {
      const isIgnored = ignoredTextContents.some(
        text => tickerElement?.textContent?.match(text, 'gi')
      );
      if (!isIgnored) {
        matches = tickerElement?.textContent?.match(TICKER_REGEX);
      }
    }
    return matches ? matches?.map(match => match.trim().toUpperCase()) : [];
  }

  const debouncedShowTooltip = _.debounce(function showTooltip(ticker, event) {
    if (!ticker) {
      setToolTipVisible(false);
      return;
    }

    // Create and position the new tooltip
    const tooltip = createOrGetTooltip(event);
    setToolTipVisible(true);
    tooltip.innerHTML = '<div class="spinner"></div>'; // Spinner while loading

    // Prepare the data to send in the request body
    const requestData = {
      tickers: [
        `EQUITIES::${ticker}//USD`
      ]
    };

    let dataPromise;
    if (tickerCache[ticker]) {
      dataPromise = Promise.resolve(tickerCache[ticker]);
    } else {
      dataPromise = fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      }).then(
        response => response.json()
      );
    }

    dataPromise.then(data => {
      const filteredData = Object.entries(data).filter(
        ([key, value]) => key !== `$USD`
      ).map(([key, value]) => {
        return {...value, key}
      });
      let name = filteredData[0]?.name;

      // Cache the data
      tickerCache[ticker] = filteredData;
      localStorage.setItem('tickerCache', JSON.stringify(tickerCache));

      // if the first item is USD, then the requested ticker was not found
      if (!name) {
        setToolTipVisible(false);
      } else {
        tooltip.innerHTML = `<div class="tooltip-content"><strong>${ticker}:</strong> ${name}</div>`;
      }
    }).catch(error => {
      tooltip.innerHTML = `<div class="tooltip-content"><strong>${ticker}:</strong> Error loading info</div>`;
    });
  }, 500); // should be long enough for content to load so that cache can be used

  const debouncedCheckTicker = _.debounce(function(event) {
    const elementFromPoint = document.elementFromPoint(event.clientX, event.clientY);
    const tickers = getTickersFromElement(elementFromPoint);
    if (tickers?.length) {
      debouncedShowTooltip(tickers[0], event);
    } else {
      setToolTipVisible(false);
    }
  }, 10);

  // Initialize the script
  function initLiveTickerTooltip() {
    // Handle mousemove events to check for ticker text and show tooltips
    document.addEventListener('mousemove', debouncedCheckTicker);
  }

  initLiveTickerTooltip();
})()
