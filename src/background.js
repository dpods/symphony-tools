let pyodideReadyPromise

async function loadPyodideAndPackages() {
  importScripts(chrome.runtime.getURL('/lib/pyodide/pyodide.js'));
  self.pyodide = await loadPyodide({
    indexURL: chrome.runtime.getURL('/lib/pyodide/'),
  });
  await pyodide.loadPackage("pandas");
  await pyodide.loadPackage('micropip');
  await pyodide.loadPackage('ipython');
  await pyodide.loadPackage('openblas');
  await pyodide.loadPackage( "/lib/pyodide/QuantStats-0.0.62-py2.py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/tabulate-0.9.0-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/yfinance-0.2.40-py2.py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/seaborn-0.13.2-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/platformdirs-4.2.2-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/frozendict-2.4.4-py312-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/multitasking-0.0.11-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/matplotlib-3.5.2-cp312-cp312-pyodide_2024_0_wasm32.whl");
  await pyodide.loadPackage( "/lib/pyodide/cycler-0.12.1-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/fonttools-4.51.0-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/kiwisolver-1.4.5-cp312-cp312-pyodide_2024_0_wasm32.whl");
  await pyodide.loadPackage( "/lib/pyodide/pillow-10.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl");
  await pyodide.loadPackage( "/lib/pyodide/pyparsing-3.1.2-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/matplotlib_pyodide-0.2.2-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl");
  await pyodide.loadPackage( "/lib/pyodide/requests-2.31.0-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/charset_normalizer-3.3.2-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/idna-3.7-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/urllib3-2.2.1-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/certifi-2024.2.2-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/beautifulsoup4-4.12.3-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/soupsieve-2.5-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/peewee-3.17.3-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/cffi-1.16.0-cp312-cp312-pyodide_2024_0_wasm32.whl");
  await pyodide.loadPackage( "/lib/pyodide/pycparser-2.22-py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/lxml-5.2.1-cp312-cp312-pyodide_2024_0_wasm32.whl");
  await pyodide.loadPackage( "/lib/pyodide/html5lib-1.1-py2.py3-none-any.whl");
  await pyodide.loadPackage( "/lib/pyodide/webencodings-0.5.1-py2.py3-none-any.whl");
  return pyodide;
}

pyodideReadyPromise = loadPyodideAndPackages()


async function getQuantStats(symphony, series_data) {
  // series_data is an object with the following structure
  // {
  //   "epoch_ms":[1711584000000],
  //   "series":[198.9],
  //   "deposit_adjusted_series":[200]
  // }
  if(symphony.dailyChanges.epoch_ms.length <= 1) {
    return {error: `Symphony_name:${symphony.name} Symphony_id:${symphony.id} Not enough data to calculate QuantStats`};
  }
  let previousValue = series_data.deposit_adjusted_series[0]
  series_data.returns = series_data.deposit_adjusted_series.map((point)=>{
    const thisValue = (point - previousValue) / previousValue
    previousValue = point
    return thisValue
  })
  
  pyodideReadyPromise = pyodideReadyPromise || loadPyodideAndPackages();
  let pyodide = await pyodideReadyPromise;
  try {
      let output = await pyodide.runPythonAsync(`

        import quantstats as qs
        import pandas as pd
        import json

        symphony_id = '${symphony.id.replace(/'/g, "\\'")}'
        symphony_name = '${symphony.name.replace(/'/g, "\\'")}'

        # Enable extend_pandas functionality from QuantStats
        qs.extend_pandas()

        # Parse the JSON data
        data = json.loads('''${JSON.stringify(series_data)}''')


        # Create pandas Series for each field
        datetime_series = pd.to_datetime(data['epoch_ms'], unit='ms')
        # series_series = pd.Series(data['series'], index=datetime_series, name='series') # we are not using the series for now since it will include deposits and withdrawals skewing the results
        # deposit_adjusted_series = pd.Series(data['deposit_adjusted_series'], index=datetime_series, name='deposit_adjusted_series')
        returns_series = pd.Series(data['returns'], index=datetime_series, name='returns')

        quantstats_metrics = qs.reports.metrics(returns_series, title=symphony_name, mode='full', display = False, sep=True, prepare_returns=False, internal="True").to_dict()['Strategy']
        quantstats_months = qs.stats.monthly_returns(returns_series).to_dict()
        quantstats_drawdown_series = qs.stats.to_drawdown_series(returns_series)
        quantstats_drawdown_details = qs.stats.drawdown_details(quantstats_drawdown_series).sort_values(by='max drawdown', ascending=True)[:30].to_dict('records')
        # qs.reports.html(returns_series, title=symphony_id, output=f"/{symphony_id}.html") would love to get this working and maybe serve it as a blob

        json.dumps({'quantstats_metrics':quantstats_metrics, 'quantstats_months':quantstats_months, 'quantstats_drawdown_details': quantstats_drawdown_details})

      `);
      
      return output.replace(/NaN/g, "\"NaN\"");
  } catch (err) {
      console.error(err);
      return {error:"An error occurred: " + err.message};
  }
}



chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === "onToken") {
    const expiry = Date.now() + 20 * 60 * 1000;
    // save the token in localstorage and refresh it every 20 minutes
    chrome.storage.local.set({tokenInfo: {token:request.token, expiry}});
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const symphony = request?.symphony;
  console.log("Received message", request);

  if (request.action === "getQuantStats") {
    console.log("Getting QuantStats");
    console.log('sym', symphony);
    console.log('dc',symphony?.dailyChanges);

    // cache the result in chrome.storage.local for 3 hours. check if the cache is still valid
    const cacheKey = `quantstats_${symphony.id}`;
    const cacheExpiry = Date.now() + 3 * 60 * 60 * 1000;
    chrome.storage.local.get(cacheKey, (cache) => {
      if (cache[cacheKey] && cache[cacheKey].expiry > Date.now()) {
        console.log("Returning cached result");
        sendResponse(cache[cacheKey].value);
      } else {
        getQuantStats(
          symphony,
          symphony?.dailyChanges
        ).then((quantStats)=>{
          chrome.storage.local.set({[cacheKey]: {value: quantStats, expiry: cacheExpiry}});
          sendResponse(quantStats);
        });
      }
    });

    return true; // Indicates we will send a response asynchronously
  }
});