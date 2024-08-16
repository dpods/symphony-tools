

(()=>{
  let token

  function initTokenAndAccountUtil() {
    chrome.storage.local.get(['tokenInfo'], function(result) {
      token = result.tokenInfo?.token;
      console.log('Token loaded:', token);
    })
  
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local' && changes.tokenInfo) {
            token = changes?.tokenInfo?.newValue?.token;
            console.log('Token updated:', token);
        }
    });
  }
  initTokenAndAccountUtil();
  
  
  async function pollForToken() { // the token gets inject from a message that comes from the fetchAuth.js
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (token) {
                clearInterval(interval);
                resolve(token);
            }
        }, 100);
    });
  }
  
  async function getAccount (token) {

  
    try {
        const resp = await fetch(
            'https://stagehand-api.composer.trade/api/v1/accounts/list',
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        const data = await resp.json()
        let account = data.accounts.find((account)=>account.account_uuid === localStorage.getItem('selectedAccount'))

        if (account) {
            return account
        }

        const isStocks = getElementsByText('Stocks', 'button').length > 0
        const isRoth = getElementsByText('Roth', 'button').length > 0
        const isTraditional = getElementsByText('Traditional', 'button').length > 0

        if (isStocks) {
            account = data.accounts.filter(acct => acct.account_type.toLowerCase().includes('individual'))[0] // im guessing "individual" will change in the future
        } else if (isRoth) {
            account = data.accounts.filter(acct => acct.account_type.toLowerCase().includes('roth'))[0]
        } else if (isTraditional) {
            account = data.accounts.filter(acct => acct.account_type.toLowerCase().includes('traditional'))[0]
        } else {
            throw new Error('[Symphony Tools Extension]: Unable to detect account type')
        }
        return account

    } catch (error) {
        console.error('[Symphony Tools Extension]: Unable to detect account type with:', data)
    }
  
  }

  function getTokenAndAccountUtil() {
    let lastAuthRequest;
    let token;
    let account;
    return async function getTokenAndAccount() {
        // if last request was less than 20 minutes ago, return the cached token and account
        if (lastAuthRequest && Date.now() - lastAuthRequest < 20 * 60 * 1000) {
            return {
                token,
                account
            };
        } else {
  
            token = await pollForToken();
            account = await getAccount(token);
            lastAuthRequest = Date.now();
            return {
                token,
                account
            };
        }
    }
  }

  window.tokenAndAccountUtil = {getTokenAndAccount: getTokenAndAccountUtil()};
})()
