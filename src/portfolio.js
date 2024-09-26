import { getTokenAndAccount } from "./utils/tokenAndAccountUtil.js";
import {
  addGeneratedSymphonyStatsToSymphony,
  addQuantstatsToSymphony,
} from "./utils/liveSymphonyPerformance.js";
import {log} from "./utils/logger.js";

let extraColumns = [
  "Running Days",
  "Avg. Daily Return",
  "MTD",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "Win Days",
  "Best Day",
  "Worst Day",  
];
export const performanceData = {};
window.symphonyTools = {
  performanceData,
};

let symphonyPerformanceSyncActive = false;

chrome.storage.local.get(["addedColumns"], function (result) {
  if (result?.addedColumns?.length) {
    extraColumns = result?.addedColumns || [];
    log("extraColumns loaded:", extraColumns);
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "local" && changes.addedColumns) {
    log("extraColumns updated:", changes.addedColumns.newValue);
    extraColumns = changes.addedColumns.newValue;
    // Perform any necessary actions with the updated selected languages
    const mainTable = document.querySelectorAll("table.min-w-full")[0];
    updateColumns(mainTable, extraColumns);
    updateTableRows();
    Sortable.initTable(mainTable);
  }
});

export const startObserver = async () => {
  const observer = new MutationObserver(async function (
    mutations,
    mutationInstance,
  ) {
    const mainEl = document.getElementsByTagName("main")?.[0];
    const mainTable = document.querySelectorAll("table.min-w-full")?.[0];
    const mainTableContent = document.querySelectorAll("table.min-w-full td")?.[0];
    const portfolioChart = document.querySelector('[data-highcharts-chart], .border-graph-axislines');

    if (mainEl) {
      await getTokenAndAccount(); // this is to cache the token and account
    }
    if (mainTable && portfolioChart && mainTableContent && !symphonyPerformanceSyncActive) {
      symphonyPerformanceSyncActive = true;
      startSymphonyPerformanceSync(mainTable);
    }
    if (symphonyPerformanceSyncActive) {
      symphonyPerformanceSyncActive = false;
      mutationInstance.disconnect();
    }
  });
  observer.observe(document, { childList: true, subtree: true });
};

const startSymphonyPerformanceSync = async (mainTable) => {
  const mainTableBody = mainTable.querySelectorAll("tbody")[0];
  const mainTableHead = mainTable.querySelectorAll("thead")[0];
  updateColumns(mainTable, extraColumns);
  getSymphonyPerformanceInfo({
    onSymphonyCallback: extendSymphonyStatsRow,
    skipCache: true,
  }).then((performanceData) => {
    log("all symphony stats added", performanceData);
    Sortable.initTable(mainTable);
  });


  // this does not seem to work
  // let headTimeout;
  // const headObserver = new MutationObserver(async function (
  //   mutations,
  //   mutationInstance,
  // ) {
  //   // run extendSymphonyStatsRow for each symphony but only at a max of once per second using a timeout to make sure it runs at least once per second
  //   clearTimeout(headTimeout);
  //   headTimeout = setTimeout(()=> updateColumns(mainTable, extraColumns), 200);
  //   log("headObserver triggered");
  // });
  // headObserver.observe(mainTableHead, { childList: true, subtree: true });


  // rows
  let rowObserverTimeout;
  const rowObserver = new MutationObserver(async function (
    mutations,
    mutationInstance,
  ) {
    // run extendSymphonyStatsRow for each symphony but only at a max of once per second using a timeout to make sure it runs at least once per 200ms
    clearTimeout(rowObserverTimeout);
    rowObserverTimeout = setTimeout(updateTableRows, 200);
    log("rowObserver triggered");
  });
  rowObserver.observe(mainTableBody, { childList: true, subtree: true });
};

function updateTableRows() {
  const mainTableBody = document.querySelectorAll("table.min-w-full tbody")[0];
  const rows = mainTableBody.querySelectorAll("tr");

  performanceData?.symphonyStats?.symphonies?.forEach?.((symphony) => {
    if (symphony.addedStats) {
      for (let row of rows) {
        const nameTd = row.querySelector("td:first-child");
        const nameText = nameTd?.textContent?.trim?.();
        if (nameText == symphony.name) {
          updateRowStats(row, symphony.addedStats);
          break;
        }
      }
    }
  });
}

function extendSymphonyStatsRow(symphony) {
  const mainTableBody = document.querySelectorAll("table.min-w-full tbody")[0];
  const rows = mainTableBody.querySelectorAll("tr");

  for (let row of rows) {
    const nameTd = row.querySelector("td:first-child");
    const nameText = nameTd?.textContent?.trim?.();
    if (nameText == symphony.name && symphony.addedStats) {
      updateRowStats(row, symphony.addedStats);
      break;
    }
  }
}

function updateRowStats(row, addedStats) {
  extraColumns.forEach((key, index) => {
    let value = addedStats[key];
    let cell = row.querySelector(`.extra-column[data-key="${key}"]`);
    
    if (!cell) {
      cell = document.createElement("td");
      cell.className = "text-sm text-dark whitespace-nowrap py-4 px-6 truncate flex items-center extra-column";
      cell.style = "min-width: 10rem; max-width: 10rem;";
      cell.dataset.key = key;
      row.insertBefore(cell, row.lastElementChild);
    }
    
    cell.textContent = value;
  });

  // Ensure the last column is the empty one
  let lastCell = row.lastElementChild;
  if (!lastCell.classList.contains('w-full')) {
    lastCell = document.createElement("td");
    lastCell.className = "w-full";
    row.appendChild(lastCell);
  }
}

function updateColumns(mainTable, extraColumns) {
  const thead = mainTable.querySelector("thead tr");
  
  // Remove extra columns that are no longer needed
  mainTable.querySelectorAll('.extra-column').forEach(element => {
    element.remove();
  });

  // Add or update columns
  extraColumns.forEach((columnName, index) => {
    let th = thead.querySelector(`.extra-column[data-key="${columnName}"]`);
    if (!th) {
      th = document.createElement("th");
      th.scope = "col";
      th.className = "text-xs px-6 py-2 text-dark-soft text-left font-normal whitespace-nowrap align-bottom extra-column";
      th.style = "min-width: 10rem; max-width: 10rem;";
      th.setAttribute("data-sortable-type", "numeric");
      th.dataset.key = columnName;
      thead.appendChild(th);
    }
    th.textContent = columnName;
  });
}

const TwoHours = 2 * 60 * 60 * 1000; // this should only update once per day ish base on a normal user's usage. It could happen multiple times if multiple windows are open. or if the user is refreshing every 12 hours.
let performanceDataFetchedAt = Date.now() - TwoHours;
export async function getSymphonyPerformanceInfo(options = {}) {
  const onSymphonyCallback = options.onSymphonyCallback;
  // if the last call options are the same as the current call options and was less than 2 hours ago, return the cached data
  if (performanceDataFetchedAt >= Date.now() - TwoHours && !options.skipCache) {
    for (const symphony of symphonyStats.symphonies) {
      onSymphonyCallback?.(symphony);
    }
    return performanceData;
  }

  const accountDeploys = await getAccountDeploys();
  const symphonyStats = await getSymphonyStatsMeta();

  performanceData.accountDeploys = accountDeploys;
  performanceData.symphonyStats = symphonyStats;

  await Promise.all(symphonyStats.symphonies.map(async (symphony) => {
    try {
      symphony.dailyChanges = await getSymphonyDailyChange(
        symphony.id,
        TwoHours,
        200,
      );
      addGeneratedSymphonyStatsToSymphony(symphony, accountDeploys);
      await addQuantstatsToSymphony(symphony, accountDeploys);
      // find the symphony in the array and update it by id
      const symphonyIndex = performanceData.symphonyStats.symphonies.findIndex(s => s.id === symphony.id);
      if (symphonyIndex !== -1) {
        performanceData.symphonyStats.symphonies[symphonyIndex] = symphony;
      }
      onSymphonyCallback?.(symphony);
    } catch (error) {
      log(
        "Error adding stats to symphony",
        symphony?.id,
        symphony?.name,
        error,
      );
    }
  }));

  return performanceData;
}

export async function getSymphonyDailyChange(
  symphonyId,
  cacheTimeout = 0,
  timeToWaitBeforeCall = 0,
) {
  const cacheKey = "symphonyPerformance-" + symphonyId;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    const cacheTimeoutAgo = Date.now() - cacheTimeout;

    if (timestamp > cacheTimeoutAgo) {
      return data;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, timeToWaitBeforeCall)); // timeToWaitBeforeCall-ms delay this is 2 calls per second. we may need to decrease this for rate limiting

  const { token, account } = await getTokenAndAccount();

  const response = await fetch(
    `https://stagehand-api.composer.trade/api/v1/portfolio/accounts/${account.account_uuid}/symphonies/${symphonyId}`, // symphony value over time on each day
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status !== 200) {
    log(
      `Cannot load extension. symphonies/${symphonyId} endpoint returned a ${response.status} error code.`,
    );
    const holdings = [];
    return {
      account,
      holdings,
      token,
    };
  }

  const symphonyStats = await response.json();

  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data: symphonyStats,
      timestamp: Date.now(),
    }),
  );

  return symphonyStats;
}

async function getAccountDeploys(status = "SUCCEEDED") {
  const { token, account } = await getTokenAndAccount();

  const response = await fetch(
    `https://trading-api.composer.trade/api/v1/deploy/accounts/${account.account_uuid}/deploys?status=${status}`, // all user initiated symphony cash allocation changes
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status !== 200) {
    log(
      `Cannot load extension. deploys endpoint returned a ${response.status} error code.`,
    );
    const holdings = [];
    return {
      account,
      holdings,
      token,
    };
  }

  const symphonyStats = await response.json();
  return symphonyStats?.deploys;
}

export async function getSymphonyStatsMeta() {
  const { token, account } = await getTokenAndAccount();

  const response = await fetch(
    `https://stagehand-api.composer.trade/api/v1/portfolio/accounts/${account.account_uuid}/symphony-stats-meta`, // all current symphony info
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status !== 200) {
    log(
      `Cannot load extension. symphony-stats endpoint returned a ${response.status} error code.`,
    );
    const holdings = [];
    return {
      account,
      holdings,
    };
  }

  const symphonyStats = await response.json();
  return symphonyStats;
}

function getElementsByText(str, tag = "a") {
  return Array.prototype.slice
    .call(document.getElementsByTagName(tag))
    .filter((el) => el.textContent.trim().includes(str.trim()));
}

export function initPortfolio() {
  if (window.location.pathname === "/portfolio") {
    startObserver();
  }

  window.navigation.addEventListener("navigate", (event) => {
    if (event.destination.url === "https://app.composer.trade/portfolio") {
      startObserver();
    }
  });

}
