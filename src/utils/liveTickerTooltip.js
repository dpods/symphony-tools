// This utility script is used to show a tooltip with the full name of 
// an equity when hovering over its ticker symbol.

(()=>{
  const API_URL = 'https://stagehand-api.composer.trade/api/v1/public/quotes';
  const tickerParentSelectors = [
    '.table-fixed tr td:first-child', // table cells (porfilio page)
    'table tr td:first-child', // table cells (Symphony Tools extension's table)
    '.table-auto tr td:first-child', // table cells
    '.table-auto tr th', // backtest historical allocations table
    '.blk--subsym', // symphony details and edit page group title
    '.blk--function', // symphony details and edit page rule block if/else functions
    '.blk--asset', // symphony details and edit page rule block assets
  ];

  // invalid tickers that may be picked up by the regex
  const ignoredTickers = [
    'IF',
    'ELSE',
    'THEN',
    'WEIGHT',
    'U.S',
    'ETF',
  ];

  //----------------------------------------------

  let tickerCache = {};
  try {
    tickerCache = JSON.parse(localStorage.getItem('tickerCache')) || {};
  } catch (e) {
    log('Error parsing ticker cache', e);
  }

  function eq(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
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

  let lastTickersFromElement = null;
  function getTickersFromElement(tickerElement) {
    let matches;

    const TICKER_REGEX = /\b[A-Z][A-Z0-9\.\/]{1,6}\b/g; // do we need to include numbers?
    const ignoredTextContents = [
      'Cash Remainder',
      'US Dollar',
    ];

    const parentElement = tickerElement?.closest(tickerParentSelectors.join(', '));
    if (parentElement) {
      const isIgnored = ignoredTextContents.some(
        text => tickerElement?.innerText?.match(text, 'gi')
      );
      if (!isIgnored) {
        matches = tickerElement?.innerText?.match(TICKER_REGEX);
      }
    }
    const tickers = matches ? matches?.map(match => match.trim().toUpperCase()) : [];
    const filteredTickers = tickers.filter(ticker => !ignoredTickers.includes(ticker));
    const uniqueTickers = Array.from(new Set(filteredTickers));
    return uniqueTickers;
  }

  function showTooltip(tickers, event) {
    if (!tickers?.length) {
      setToolTipVisible(false);
      return;
    }

    // Create and position the new tooltip
    const tooltip = createOrGetTooltip(event);
    setToolTipVisible(true);
    tooltip.innerHTML = '<div class="spinner"></div>'; // Spinner while loading

    let dataPromises = [];
    tickers.forEach(ticker => {
      const isCached = (
        tickerCache[ticker] && 
        Date.now() < tickerCache[ticker].expires
      );
      if (isCached) {
        const resolvedData = tickerCache[ticker];
        dataPromises.push(Promise.resolve(resolvedData));
      } else {
        tickerCache[ticker] = [{name: 'Loading...'}]; // prevent multiple requests
        dataPromises.push(fetch(API_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            tickers: [`EQUITIES::${ticker}//USD`]
          })
        }).then(
          response => response.json()
        ).then(result=>{
          // normalize the data
          const filteredData = Object.entries(result).filter(([key, value]) => {
            return (ticker === 'USD' && key === '$USD') || key !== `$USD` // for some reason USD is included in every response
          }).reduce((data, [key, value]) => {
            return {...data, ...value, key}; // flatten the object
          }, {});

          const expires = Date.now() + 1000 * 60 * 60 * 24; // cache for 24 hours
          return {data: filteredData, ticker, expires};
        }));
      }
    });

    Promise.all(dataPromises).then(results => {
      // Update the cache
      results.forEach((item, index) => {
        const {ticker} = item;
        tickerCache[ticker] = item;
      });
      localStorage.setItem('tickerCache', JSON.stringify(tickerCache));

      if (!lastTickersFromElement?.length) { // are we still hovering an item?
        setToolTipVisible(false);
      } else if(eq(tickers, lastTickersFromElement)) {
        let html = '';
        tickers.forEach(ticker => {
          const {data} = tickerCache[ticker];
          if (data) {
            html += `<div class="tooltip-content"><strong>${ticker}:</strong> ${data?.name || 'No data'}</div>`;
          }
        });

        tooltip.innerHTML = html;
      }
    }).catch(error => {
      tooltip.innerHTML = `<div class="tooltip-content"><strong>${tickers}:</strong> Error loading info</div>`;
    });
  }
  const debouncedShowTooltip = _.debounce(showTooltip, 500); // should be long enough for content to load so that cache can be used

  function checkTicker(event) {
    const elementFromPoint = document.elementFromPoint(event.clientX, event.clientY);
    const tickers = getTickersFromElement(elementFromPoint);
    if (tickers?.length) {
      if (event.type === 'click') {
        // if the user clicks while holding the command key, open the details page
        if (event.metaKey) {
          event.preventDefault();
          event.stopPropagation();
          tickers.forEach((ticker, index) => {
            setTimeout(()=>{
              window.open(`https://finance.yahoo.com/quote/${ticker}/profile/`, '_blank');
            }, index * 1000);
          });
        }
      } else if (eq(tickers, lastTickersFromElement)) {
        debouncedShowTooltip(tickers, event);
      } else {
        showTooltip(tickers, event);
      }
      lastTickersFromElement = tickers;
    } else {
      setToolTipVisible(false);
      lastTickersFromElement = null;
    }
  }
  const debouncedCheckTicker = _.debounce(checkTicker, 10);

  // Initialize the script
  function initLiveTickerTooltip() {
    // Handle mousemove events to check for ticker text and show tooltips
    document.addEventListener('mousemove', debouncedCheckTicker);
    // Handle mouse click events to open the details page
    document.addEventListener('click', debouncedCheckTicker);
  }

  initLiveTickerTooltip();
})()
