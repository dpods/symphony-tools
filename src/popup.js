const items = [
  'MTD',
  '3M',
  '6M',
  'YTD',
  '1Y',
  'Win Days',
  'Best Day',
  'Worst Day',
  'Best Month',
  'Start Period',
  'End Period',
  'Risk-Free Rate',
  'Time in Market',
  'Cumulative Return',
  'CAGR﹪',
  'Sharpe',
  'Prob. Sharpe Ratio',
  'Smart Sharpe',
  'Sortino',
  'Smart Sortino',
  'Sortino/√2',
  'Smart Sortino/√2',
  'Omega',
  'Max Drawdown',
  'Longest DD Days',
  'Volatility (ann.)',
  'Calmar',
  'Skew',
  'Kurtosis',
  'Expected Daily',
  'Expected Monthly',
  'Expected Yearly',
  'Kelly Criterion',
  'Risk of Ruin',
  'Daily Value-at-Risk',
  'Expected Shortfall (cVaR)',
  'Max Consecutive Wins',
  'Max Consecutive Losses',
  'Gain/Pain Ratio',
  'Gain/Pain (1M)',
  'Payoff Ratio',
  'Profit Factor',
  'Common Sense Ratio',
  'CPC Index',
  'Tail Ratio',
  'Outlier Win Ratio',
  'Outlier Loss Ratio',
  '3Y (ann.)',
  '5Y (ann.)',
  '10Y (ann.)',
  'All-time (ann.)',
  'Worst Month',
  'Best Year',
  'Worst Year',
  'Avg. Drawdown',
  'Avg. Drawdown Days',
  'Recovery Factor',
  'Ulcer Index',
  'Serenity Index',
  'Avg. Up Month',
  'Avg. Down Month',
  'Win Month',
  'Win Quarter',
  'Win Year',
  'Running Days',
  'Avg. Daily Return',
  'Median Daily Return'
];

let selectedItems = new Set([
  'Running Days',
  'Avg. Daily Return',
  'MTD',
  '3M',
  '6M',
  'YTD',
  '1Y',
  'Win Days',
  'Best Day',
  'Worst Day',
]);

function toggleItem(lang) {
    if (selectedItems.has(lang)) {
        selectedItems.delete(lang);
    } else {
        selectedItems.add(lang);
    }
    saveSelectedItems();
}


function saveSelectedItems() {
    chrome.storage.local.set({addedColumns: Array.from(selectedItems)}, function() {
        console.log('Selected items saved');
    });
}

async function loadSelectedItems() {
    const result = await chrome.storage.local.get(['addedColumns'])

    if (result.addedColumns) {
        selectedItems = new Set(result.addedColumns);
    }
    return selectedItems
}

async function initHeadersChoices() {
  await loadSelectedItems();
  const headersChoicesElement = document.querySelector('.headers-select-box');
  const headersChoices = new Choices(headersChoicesElement,{
    choices: items.map((item)=>{return {value: item, label: item, selected: selectedItems.has(item)}}),
    removeItemButton: true,
    removeItems: true,
    maxItemCount: -1,
    renderChoiceLimit: -1,
  });

  headersChoicesElement.addEventListener(
    'change',
    function(event) {
      toggleItem(event.detail.value);
    },
    false,
  );
}
initHeadersChoices();