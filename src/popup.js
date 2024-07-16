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

const searchInput = document.getElementById('searchInput');
const itemList = document.getElementById('itemList');
const selectBox = document.getElementById('selectBox');
const chevronIcon = document.getElementById('chevronIcon');
const selectedItemsContainer = document.getElementById('selectedItems');

function renderItems(filter = '') {
    itemList.innerHTML = '';
    const availableItems = items.filter(lang => !selectedItems.has(lang));
    const filteredItems = availableItems.filter(lang => 
        lang.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filteredItems.length === 0) {
        const div = document.createElement('div');
        div.textContent = 'No items found';
        div.className = 'item-item';
        itemList.appendChild(div);
    } else {
        filteredItems.forEach(lang => {
            const div = document.createElement('div');
            div.textContent = lang;
            div.className = 'item-item';
            div.dataset.item = lang;
            itemList.appendChild(div);
        });
    }
}

function renderSelectedItems() {
    selectedItemsContainer.innerHTML = '';
    selectedItems.forEach(lang => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = lang;
        const removeButton = document.createElement('button');
        removeButton.className = 'pill-remove';
        removeButton.textContent = '×';
        removeButton.dataset.item = lang;
        pill.appendChild(removeButton);
        selectedItemsContainer.appendChild(pill);
    });
}

function toggleItem(lang) {
    if (selectedItems.has(lang)) {
        selectedItems.delete(lang);
    } else {
        selectedItems.add(lang);
    }
    saveSelectedItems();
    renderSelectedItems();
    renderItems(searchInput.value);
}

function toggleDropdown(show) {
    if (show) {
        itemList.classList.remove('hidden');
        chevronIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
    } else {
        itemList.classList.add('hidden');
        chevronIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>';
    }
}

function saveSelectedItems() {
    chrome.storage.local.set({addedColumns: Array.from(selectedItems)}, function() {
        console.log('Selected items saved');
    });
}

function loadSelectedItems() {
    chrome.storage.local.get(['addedColumns'], function(result) {
        if (result.selectedItems) {
            selectedItems = new Set(result.selectedItems);
            renderSelectedItems();
            renderItems();
        }
    });
}

// Event Listeners
searchInput.addEventListener('input', (e) => renderItems(e.target.value));
searchInput.addEventListener('focus', () => {
    toggleDropdown(true);
    renderItems(searchInput.value);
});

document.addEventListener('click', (e) => {
    if (!selectBox.contains(e.target) && !itemList.contains(e.target)) {
        toggleDropdown(false);
    }
});

selectBox.addEventListener('click', () => {
    searchInput.focus();
    toggleDropdown(true);
    renderItems(searchInput.value);
});

// Event delegation for item list and selected items
itemList.addEventListener('click', (e) => {
    if (e.target.classList.contains('item-item')) {
        toggleItem(e.target.dataset.item);
    }
});

selectedItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill-remove')) {
        e.stopPropagation();
        toggleItem(e.target.dataset.item);
    }
});

// Initial load and render
loadSelectedItems();
toggleDropdown(false);