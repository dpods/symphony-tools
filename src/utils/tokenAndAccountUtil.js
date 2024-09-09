import { log } from "./logger.js";

let token;

export function initTokenAndAccountUtil() {
  chrome.storage.local.get(["tokenInfo"], function (result) {
    token = result.tokenInfo?.token;
    log("Token loaded:", token);
  });

  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.tokenInfo) {
      token = changes?.tokenInfo?.newValue?.token;
      log("Token updated:", token);
    }
  });
}

async function pollForToken() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (token) {
        clearInterval(interval);
        resolve(token);
      }
    }, 100);
  });
}

let accountPromise;

// getAccount will poll for selectedAccount every 200ms until it is found (So it could run indefinitely if the account is never found)
function getAccount(token) {
  if (!accountPromise) {
    accountPromise = new Promise(async (resolve) => {
      try {
        const resp = await fetch(
          "https://stagehand-api.composer.trade/api/v1/accounts/list",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await resp.json();

        let account;

        while (!account) {
          account = data.accounts.find(
            (account) =>
              account.account_uuid === localStorage.getItem("selectedAccount"),
          );
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        if (account) {
          resolve(account);
        } else {
          // Fallback to detecting account type we should remove this at somepoint
          // there is always a chance the localStorage variable will not be used
          const isStocks = getElementsByText("Stocks", "button").length > 0;
          const isRoth = getElementsByText("Roth", "button").length > 0;
          const isTraditional = getElementsByText("Traditional", "button").length > 0;

          if (isStocks) {
            account = data.accounts.filter((acct) =>
              acct.account_type.toLowerCase().includes("individual"),
            )[0];
          } else if (isRoth) {
            account = data.accounts.filter((acct) =>
              acct.account_type.toLowerCase().includes("roth"),
            )[0];
          } else if (isTraditional) {
            account = data.accounts.filter((acct) =>
              acct.account_type.toLowerCase().includes("traditional"),
            )[0];
          } else {
            throw new Error(
              "[composer-quant-tools]: Unable to detect account type",
            );
          }
          resolve(account);
        }
      } catch (error) {
        console.error(
          "[composer-quant-tools]: Unable to detect account type with:",
          data
        );
      }
    });
  }
  return accountPromise;
}

function getTokenAndAccountUtil() {
  let lastAuthRequest;
  let token;
  let account;
  return async function getTokenAndAccount() {
    if (lastAuthRequest && Date.now() - lastAuthRequest < 20 * 60 * 1000) {
      return {
        token,
        account,
      };
    } else {
      token = await pollForToken();
      account = await getAccount(token);
      lastAuthRequest = Date.now();
      return {
        token,
        account,
      };
    }
  };
}

export const getTokenAndAccount = getTokenAndAccountUtil();
