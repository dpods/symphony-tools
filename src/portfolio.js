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
    // run extendSymphonyStatsRow for each symphony but only at a max of once per second using a timeout to make sure it runs at least once per second
    clearTimeout(rowObserverTimeout);
    rowObserverTimeout = setTimeout(updateTableRows, 200);
    log("rowObserver triggered");
  });
  rowObserver.observe(mainTableBody, { childList: true, subtree: true });
};

function updateTableRows() {
  performanceData?.symphonyStats?.symphonies?.forEach?.((symphony) => {
    if (symphony.addedStats) {
      extendSymphonyStatsRow(symphony);
    }
  });
}

function extendSymphonyStatsRow(symphony) {
  const mainTableBody = document.querySelectorAll("table.min-w-full tbody")[0];
  const rows = mainTableBody.querySelectorAll("tr");

  for (let row of rows) {
    const nameTd = row.querySelector("td:first-child");
    const nameText = nameTd?.textContent?.trim?.();
    if (
      nameText == symphony.name &&
      row.children.length < 10 && // make sure we only add the extra columns once
      symphony.addedStats
    ) {
      row.lastChild.remove();
      extraColumns.forEach((key) => {
        let value = symphony.addedStats[key];
        const newTd = document.createElement("td");
        newTd.className =
          "text-sm text-dark whitespace-nowrap py-4 px-6 truncate flex items-center extra-column";
        newTd.style = "min-width: 10rem; max-width: 10rem;";
        newTd.textContent = value;
        row.appendChild(newTd);
      });
      const newTd = document.createElement("td");
      newTd.className = "w-full";
      row.appendChild(newTd);
      break;
    }
  }
}

function updateColumns(mainTable, extraColumns) {
  removeExtraColumns(mainTable);
  addExtraColumns(mainTable, extraColumns);
}

function removeExtraColumns(mainTable) {
  mainTable.querySelectorAll(".extra-column").forEach((node) => node.remove());
}

function addExtraColumns(mainTable, extraColumns) {
  for (let i = 0; i < extraColumns.length; i++) {
    // Add the new headers
    const thead = mainTable.querySelector("thead tr");
    const newTh = document.createElement("th");
    newTh.scope = "col";
    newTh.className =
      "text-xs px-6 py-2 text-dark-soft text-left font-normal whitespace-nowrap align-bottom extra-column";
    newTh.style = "min-width: 10rem; max-width: 10rem;";
    newTh.setAttribute("data-sortable-type", "numeric");
    newTh.textContent = extraColumns[i];
    thead.appendChild(newTh);
  }
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
