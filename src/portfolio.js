

(() => {

    let token = null;
    let extraColumns = [];
    const performanceData = {};
    window.symphonyTools = {
        performanceData
    }

    let portfolioWidgetRendered = false;
    let symphonyPerformanceSyncActive = false;
    const getTokenAndAccount = getTokenAndAccountUtil()


    chrome.storage.local.get(['tokenInfo', 'addedColumns'], function(result) {
        token = result.tokenInfo?.token;
        extraColumns = result?.addedColumns || [];
        console.log('Token loaded:', token);
        console.log('extraColumns loaded:', addedColumns);
    })

    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local' && changes.tokenInfo) {
            token = changes?.tokenInfo?.newValue?.token;
            console.log('Token updated:', token);
        }
        if (namespace === 'local' && changes.addedColumns) {
            console.log('extraColumns updated:', changes.addedColumns.newValue);
            extraColumns = changes.addedColumns.newValue;
            // Perform any necessary actions with the updated selected languages
            const mainTable = document.querySelectorAll('table.min-w-full')[0]
            updateColumns(mainTable, extraColumns);
            updateTableRows();
        }
    });



    const initPortfolio = async () => {
        const observer = new MutationObserver(async function (mutations, mutationInstance) {
            const mainEl = document.getElementsByTagName('main')[0]
            const mainTable = document.querySelectorAll('table.min-w-full')[0]
            const mainTableContent = document.querySelectorAll('table.min-w-full td')[0]
            if (mainEl) {
                await getTokenAndAccount(); // this is to cache the token and account
            }
            if (mainEl && !portfolioWidgetRendered) {
                portfolioWidgetRendered = true;
                renderPortfolioWidget(mainEl);
            }
            if (mainTableContent && !symphonyPerformanceSyncActive) {
                symphonyPerformanceSyncActive = true;
                startSymphonyPerformanceSync(mainTable);
            }
            if (portfolioWidgetRendered && symphonyPerformanceSyncActive) {
                mutationInstance.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true});
    }

    const startSymphonyPerformanceSync = async (mainTable) => {
        const mainTableBody = mainTable.querySelectorAll('tbody')[0]
        updateColumns(mainTable, extraColumns);
        getSymphonyPerformanceInfo().then((performanceData)=>{
            console.log('all symphony stats added', performanceData)
        })

        let timeout;
        const observer = new MutationObserver(async function (mutations, mutationInstance) {
            // run extendSymphonyStatsRow for each symphony but only at a max of once per second using a timeout to make sure it runs at least once per second
            clearTimeout(timeout);
            timeout = setTimeout(updateTableRows, 200);
            console.log('observer triggered')
        });
        observer.observe(mainTableBody, { childList: true, subtree: true});
    }

    function updateTableRows() {
        performanceData?.symphonyStats?.symphonies?.forEach?.((symphony) => {
            if (symphony.addedStats) {
                extendSymphonyStatsRow(symphony)
            }
        });
    }

    function extendSymphonyStatsRow(symphony) {
        const mainTableBody = document.querySelectorAll('table.min-w-full tbody')[0]
        const rows = mainTableBody.querySelectorAll('tr');


        for (row of rows) {
            const nameTd = row.querySelector('td:first-child');
            const nameText = nameTd?.textContent?.trim?.();
            if (
                nameText == symphony.name &&
                row.children.length < 10 && // make sure we only add the extra columns once
                symphony.addedStats
            ) {
                row.lastChild.remove()
                extraColumns.forEach((key) => {
                    let value = symphony.addedStats[key]
                    const newTd = document.createElement('td');
                    newTd.className = 'text-sm text-dark whitespace-nowrap py-4 px-6 truncate flex items-center extra-column';
                    newTd.style = 'min-width: 10rem; max-width: 10rem;';
                    newTd.textContent = value;
                    row.appendChild(newTd);
                });
                const newTd = document.createElement('td');
                newTd.className = 'w-full';
                row.appendChild(newTd)
                break;
            }
        }
    }

    function updateColumns (mainTable, extraColumns) {
        removeExtraColumns(mainTable);
        addExtraColumns(mainTable, extraColumns);
    }

    function removeExtraColumns(mainTable) {
        mainTable.querySelectorAll('.extra-column').forEach((node)=>node.remove())
    }

    function addExtraColumns(mainTable, extraColumns) {

        for (let i = 0; i < extraColumns.length; i++) {
            // Add the new headers
            const thead = mainTable.querySelector('thead tr');
            const newTh = document.createElement('th');
            newTh.scope = 'col';
            newTh.className = 'text-xs px-6 py-2 text-dark-soft text-left font-normal whitespace-nowrap align-bottom extra-column';
            newTh.style = 'min-width: 10rem; max-width: 10rem;';
            newTh.textContent = extraColumns[i];
            thead.appendChild(newTh);
        }
    }


    function renderPortfolioWidget(mainEl) {
        if (window.location.pathname !== '/portfolio') {
            return
        }

        const accountButton = getAccountButton()
        let accountType = getAccountType(accountButton.innerText)

        getAggregatedLiveHoldings(accountType).then(({account, holdings}) => {
            renderTable(mainEl, account, holdings)
        })

        const observer = new MutationObserver(function(mutations) {
            const newAccountType = getAccountType(accountButton.textContent)
            if (newAccountType !== accountType) {
                debug(`Detected new account type ${newAccountType}. Re-rendering widget`)
                accountType = newAccountType

                getAggregatedLiveHoldings(accountType).then(({account, holdings}) => {
                    renderTable(mainEl, account, holdings)
                })
            }
        });
        observer.observe(mainEl, { childList: true, subtree: true });
    }

    async function getSymphonyPerformanceInfo() {
        const TwoHours = 2 * 60 * 60 * 1000; // this should only update once per day ish base on a normal user's usage. It could happen multiple times if multiple windows are open. or if the user is refreshing every 12 hours.
        const accountDeploys = await getAccountDeploys()
        const symphonyStats = await getSymphonyStatsMeta()

        performanceData.accountDeploys = accountDeploys
        performanceData.symphonyStats = symphonyStats


        for (const symphony of symphonyStats.symphonies) {
            symphony.dailyChanges = await getSymphonyDailyChange(symphony.id, TwoHours, 200)
            addGeneratedSymphonyStatsToSymphony(symphony, accountDeploys)
            await addQuantstatsToSymphony(symphony, accountDeploys)
            extendSymphonyStatsRow(symphony)
            // to make stats show up faster we could do dom updates right here.
        }

        return {
            accountDeploys,
            symphonyStats
        }
    }

    async function getSymphonyDailyChange(symphonyId, cacheTimeout = 0, timeToWaitBeforeCall = 0) {

        const cacheKey = 'symphonyPerformance-'+symphonyId;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            const cacheTimeoutAgo = Date.now() - cacheTimeout;

            if (timestamp > cacheTimeoutAgo) {
                return data;
            }
        }

        await new Promise(resolve => setTimeout(resolve, timeToWaitBeforeCall)); // timeToWaitBeforeCall-ms delay this is 2 calls per second. we may need to decrease this for rate limiting

        const {
            token,
            account
        } = await getTokenAndAccount()

        const response = await fetch(
            `https://stagehand-api.composer.trade/api/v1/portfolio/accounts/${account.account_uuid}/symphonies/${symphonyId}`, // symphony value over time on each day
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (response.status !== 200) {
            log(`Cannot load extension. symphonies/${symphonyId} endpoint returned a ${response.status} error code.`)
            const holdings = []
            return {
                account,
                holdings,
                token
            }
        }

        const symphonyStats = await response.json()

        localStorage.setItem(cacheKey, JSON.stringify({
            data: symphonyStats,
            timestamp: Date.now()
        }));

        return symphonyStats
    }

    async function getAccountDeploys(status = 'SUCCEEDED') {
        const {
            token,
            account
        } = await getTokenAndAccount()

        const response = await fetch(
            `https://trading-api.composer.trade/api/v1/deploy/accounts/${account.account_uuid}/deploys?status=${status}`, // all user initiated symphony cash allocation changes
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (response.status !== 200) {
            log(`Cannot load extension. deploys endpoint returned a ${response.status} error code.`)
            const holdings = []
            return {
                account,
                holdings,
                token
            }
        }

        const symphonyStats = await response.json()
        return symphonyStats?.deploys
    }

    async function getSymphonyStatsMeta() {
        const {
            token,
            account
        } = await getTokenAndAccount()

        const response = await fetch(
            `https://stagehand-api.composer.trade/api/v1/portfolio/accounts/${account.account_uuid}/symphony-stats-meta`, // all current symphony info
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (response.status !== 200) {
            log(`Cannot load extension. symphony-stats endpoint returned a ${response.status} error code.`)
            const holdings = []
            return {
                account,
                holdings
            }
        }

        const symphonyStats = await response.json()
        return symphonyStats
    }

    const getAggregatedLiveHoldings = async (accountType) => {

        const {account} = await getTokenAndAccount()
        const symphonyStats = await getSymphonyStatsMeta()

        const aggregateHoldings = {}
        let totalValue = 0

        for (const symphony of symphonyStats.symphonies) {
            for (const holding of symphony.holdings) {
                if (aggregateHoldings[holding.ticker] === undefined) {
                    aggregateHoldings[holding.ticker] = {
                        ticker: holding.ticker,
                        amount: 0,
                        value: 0,
                        symphonies: []
                    }
                }

                aggregateHoldings[holding.ticker].amount += holding.amount
                aggregateHoldings[holding.ticker].value += holding.value
                aggregateHoldings[holding.ticker].symphonies.push({
                    symphony: symphony.name,
                    allocation: holding.allocation,
                    amount: holding.amount,
                    value: holding.value
                })

                totalValue += holding.value
            }
        }

        for (const ticker of Object.keys(aggregateHoldings)) {
            aggregateHoldings[ticker].totalAllocation = parseFloat((aggregateHoldings[ticker].value / totalValue).toFixed(4))
        }

        let holdings = Object.values(aggregateHoldings)
        holdings = holdings.sort((a, b) => {
            if (a.totalAllocation > b.totalAllocation) {
                return -1
            } else if (a.totalAllocation < b.totalAllocation) {
                return 1
            } else {
                return 0
            }
        })

        return {
            account,
            holdings
        }
    }

    const renderTable = (mainEl, account, holdings) => {
        const widgetId = 'ste-aggregate-holdings'
        const widget = document.getElementById(widgetId);

        if (widget) {
            widget.remove();
        }

        const table = document.createElement("table");
        table.classList.add('min-w-full')

        let idx = -1
        let USDollar = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });
        for (const holding of holdings) {
            idx++
            const currentRow = table.insertRow(idx)
            currentRow.classList.add('group', 'hover:bg-white', 'transition', 'duration-200', 'flex', 'items-stretch')
            currentRow.style = 'height: 60px'
            currentRow.id = `ste-ticker-${holding.ticker}`

            const cell0 = currentRow.insertCell(0)
            cell0.classList.add('min-w-[24rem]', 'w-[24rem]', 'text-sm', 'text-dark', 'py-4', 'px-6', 'bg-sheet', 'flex', 'items-center', 'group-hover:bg-white', 'transition', 'duration-200')

            const div0 = document.createElement("div");
            div0.classList.add('font-medium', 'cursor-pointer', 'truncate')
            div0.innerText = holding.ticker

            const btn0 = document.createElement("button");
            btn0.classList.add('st-btn', 'flex','items-center','mr-1.5','rounded','focus:outline-none','focus-visible:ring-2','focus-visible:ring-action-soft','text-dark-soft')
            btn0.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256" class="mt-px -rotate-90"><rect width="256" height="256" fill="none"></rect><polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"></polyline></svg>'

            cell0.appendChild(btn0)
            cell0.appendChild(div0)

            const cell1 = currentRow.insertCell(1)
            cell1.classList.add('text-sm', 'text-dark', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
            const div1 = document.createElement("div");
            div1.classList.add('cursor-pointer', 'truncate')
            div1.style = 'min-width: 10rem; max-width: 10rem;'
            div1.innerText = (holding.totalAllocation * 100).toFixed(2) + '%'
            cell1.appendChild(div1)

            // const cellPercentChange = currentRow.insertCell(2)
            // cellPercentChange.classList.add('text-sm', 'text-dark', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
            // const divPercentChange = document.createElement("div");
            // divPercentChange.id = `ste-ticker-${holding.ticker}-percent-change`
            // divPercentChange.classList.add('cursor-pointer', 'truncate')
            // divPercentChange.style = 'min-width: 10rem; max-width: 10rem;'
            // divPercentChange.innerText = '--'
            // cellPercentChange.appendChild(divPercentChange)

            const cell2 = currentRow.insertCell(2)
            cell2.classList.add('text-sm', 'text-dark', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
            const div2 = document.createElement("div");
            div2.classList.add('cursor-pointer', 'truncate')
            div2.style = 'min-width: 10rem; max-width: 10rem;'
            div2.innerText = holding.symphonies.length
            cell2.appendChild(div2)

            const cell3 = currentRow.insertCell(3)
            cell3.classList.add('text-sm', 'text-dark', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
            const div3 = document.createElement("div");
            div3.classList.add('cursor-pointer', 'truncate')
            div3.style = 'min-width: 10rem; max-width: 10rem;'
            div3.innerText = (holding.amount).toFixed(2)
            cell3.appendChild(div3)

            const cell4 = currentRow.insertCell(4)
            cell4.classList.add('text-sm', 'text-dark', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
            const div4 = document.createElement("div");
            div4.classList.add('cursor-pointer', 'truncate')
            div4.style = 'min-width: 10rem; max-width: 10rem;'
            div4.innerText = USDollar.format((holding.value).toFixed(2))
            cell4.appendChild(div4)

            const divExpanded = document.createElement("div");
            divExpanded.id = `st-btn-${idx}-expanded`
            divExpanded.classList.add('hidden','px-10','pt-4','mb-8','w-full')
            divExpanded.appendChild(getHoldingAllocationsPerSymphony(holding))
            currentRow.parentNode.appendChild(divExpanded)

            btn0.addEventListener('click', (event) => {
                if (btn0.firstChild.classList.contains('-rotate-90')) {
                    btn0.firstChild.classList.remove('-rotate-90')
                } else {
                    btn0.firstChild.classList.add('-rotate-90')
                }

                if (divExpanded.classList.contains('hidden')) {
                    divExpanded.classList.remove('hidden')
                } else {
                    divExpanded.classList.add('hidden')
                }
            });
        }

        const tableHeader = table.createTHead();
        tableHeader.classList.add('bg-data-table', 'border-y', 'border-data-table-border')

        const row = tableHeader.insertRow(0);
        row.classList.add('sticky', 'left-0', 'top-0', 'z-10', 'block', 'h-auto')

        const cell = row.insertCell(0);
        cell.classList.add('min-w-[24rem]', 'w-[24rem]', 'w-96', 'text-xs', 'px-6', 'py-2', 'text-dark-soft', 'text-left', 'font-normal', 'whitespace-nowrap', 'align-bottom')
        cell.innerHTML = "Ticker";

        const cell2 = row.insertCell(1);
        cell2.classList.add('text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        const div2 = document.createElement("div");
        div2.style = 'min-width: 10rem; max-width: 10rem;'
        div2.innerText = "Total Allocation";
        cell2.appendChild(div2)

        // const cellPercentChange = row.insertCell(2);
        // cellPercentChange.classList.add('text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        // const divPercentChange = document.createElement("div");
        // divPercentChange.style = 'min-width: 10rem; max-width: 10rem;'
        // divPercentChange.innerText = "Today's % Change";
        // cellPercentChange.appendChild(divPercentChange)

        const cell3 = row.insertCell(2);
        cell3.classList.add('text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        const div3 = document.createElement("div");
        div3.style = 'min-width: 10rem; max-width: 10rem;'
        div3.innerText = "Symphonies";
        cell3.appendChild(div3)

        const cell4 = row.insertCell(3);
        cell4.classList.add('text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        const div4 = document.createElement("div");
        div4.style = 'min-width: 10rem; max-width: 10rem;'
        div4.innerText = "Total Quantity";
        cell4.appendChild(div4)

        const cell5 = row.insertCell(4);
        cell5.classList.add('text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        const div5 = document.createElement("div");
        div5.style = 'min-width: 10rem; max-width: 10rem;'
        div5.innerText = "Total Value";
        cell5.appendChild(div5)

        let divInner = document.createElement("div");
        divInner.classList.add('hidden', 'md:block', 'shadow-sm', 'overflow-auto', 'overflow-x-scroll', 'border-b', 'border-b-modal-border', 'mb-16')
        divInner.appendChild(table)

        let header = document.createElement("div");
        header.className = 'flex justify-between'


        let divLogoWrapper = document.createElement("div");
        divLogoWrapper.className = 'flex flex-row'

        let divLogo = document.createElement("div");
        divLogo.classList.add('text-sm', 'text-dark', 'font-medium', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')

        const span1 = document.createElement("span");
        span1.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.40808 12.1538C2.93521 12.1538 3.15458 11.7335 3.60273 11.5343C4.03673 11.3415 4.50718 11.3574 4.99649 11.3574C5.47353 11.3574 5.97784 11.437 6.43007 11.437C6.58543 11.437 6.50484 11.3012 6.63802 11.2821C6.89508 11.2454 7.17687 11.2775 7.42561 11.3397C7.64543 11.3946 7.93944 11.5047 8.1424 11.5166C8.35706 11.5293 8.52378 11.7032 8.73972 11.7511C8.96557 11.8013 9.15653 11.7047 9.35474 11.7733C9.66431 11.8804 9.79166 11.9945 10.1335 11.9945C10.4122 11.9945 10.691 11.9945 10.9697 11.9945C11.4126 11.9945 11.7881 11.9149 12.244 11.9149C12.6714 11.9149 12.5186 11.8892 12.1865 12.0122C11.8657 12.131 11.6074 12.2334 11.2485 12.2334C10.7553 12.2334 10.1072 12.1743 9.65562 12.375C9.33143 12.5191 8.84548 12.471 8.50079 12.5476C8.33118 12.5853 8.01332 12.6317 7.86364 12.6317C7.41233 12.6317 6.96102 12.6317 6.50971 12.6317C6.03586 12.6317 5.65921 12.4724 5.19559 12.4724C4.68571 12.4724 5.43512 12.2555 5.59381 12.2379C5.98364 12.1945 6.37725 12.1538 6.77076 12.1538C7.45636 12.1538 8.10913 12.3131 8.77954 12.3131C9.14531 12.3131 9.51108 12.3131 9.87685 12.3131C10.0495 12.3131 10.1213 12.324 10.2308 12.1892C10.3554 12.0359 11.0874 12.1538 11.2839 12.1538C11.9327 12.1538 12.4908 12.4247 13.0006 11.9149" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/><path d="M6.50004 2.06959V5.87892C6.50004 6.07591 6.46125 6.27096 6.38587 6.45295C6.31049 6.63494 6.2 6.8003 6.06071 6.93959L3.33338 9.66692M6.50004 2.06959C6.33271 2.08492 6.16604 2.10292 6.00004 2.12426M6.50004 2.06959C7.49789 1.9768 8.5022 1.9768 9.50004 2.06959M3.33338 9.66692L3.84671 9.53826C5.24204 9.19346 6.71459 9.35726 8.00004 10.0003C9.2855 10.6433 10.758 10.8071 12.1534 10.4623L13.2 10.2003M3.33338 9.66692L1.86538 11.1356C1.04338 11.9563 1.43138 13.3469 2.57671 13.5423C4.33938 13.8436 6.15138 14.0003 8.00004 14.0003C9.81751 14.0009 11.6318 13.8477 13.4234 13.5423C14.568 13.3469 14.956 11.9563 14.1347 11.1349L13.2 10.2003M9.50004 2.06959V5.87892C9.50004 6.27692 9.65804 6.65892 9.93938 6.93959L13.2 10.2003M9.50004 2.06959C9.66738 2.08492 9.83404 2.10292 10 2.12426" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        const span2 = document.createElement("span");
        span2.style = 'margin-left: 0.5rem;'
        span2.innerText = 'Symphony Tools Extension'

        const donate = document.createElement('div')
        donate.className = 'text-sm text-dark font-medium whitespace-nowrap py-4 truncate flex items-center text-left'
        donate.innerHTML = '<a href="https://www.buymeacoffee.com/dpods" class="text-xs underline font-light" target="_blank">Support this extension</a>'

        divLogo.appendChild(span1)
        divLogo.appendChild(span2)

        divLogoWrapper.appendChild(divLogo)
        divLogoWrapper.appendChild(donate)

        let divBroker = document.createElement("div");
        divBroker.classList.add('text-xs', 'text-dark', 'font-medium', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
        divBroker.innerText = `Broker: ${account.broker}`

        header.appendChild(divLogoWrapper)
        header.appendChild(divBroker)

        const tbody = table.getElementsByTagName('tbody')[0]
        tbody.classList.add('block','bg-sheet','divide-y','divide-divider-light')

        let divOuter = document.createElement("div");
        divOuter.id = widgetId
        divOuter.classList.add('bg-sheet')
        divOuter.appendChild(header)
        divOuter.appendChild(divInner)

        mainEl.appendChild(divOuter)

        // updateTickerLastPercentChanges(account.account_uuid, token)
        // setInterval(() => {
        //     updateTickerLastPercentChanges(account.account_uuid, token)
        // }, 15 * 1000)
    }

    const getHoldingAllocationsPerSymphony = (holding) => {
        const table = document.createElement("table");
        table.classList.add('table-fixed','mt-2','w-full','overflow-x-auto')

        let idx = -1
        for (const symphony of holding.symphonies) {
            idx++
            const currentRow = table.insertRow(idx)
            currentRow.classList.add('hover:bg-white','transition','duration-200','w-96')

            const cell0 = currentRow.insertCell(0)
            cell0.classList.add('pl-1','pr-4','py-3','w-64','border-b','border-data-table-border')
            const div0 = document.createElement("div");
            div0.classList.add('font-medium')
            div0.innerText = symphony.symphony
            cell0.appendChild(div0)

            const cell1 = currentRow.insertCell(1)
            cell1.classList.add('pl-1','pr-4','py-3','w-64','border-b','border-data-table-border')
            const div1 = document.createElement("div");
            div1.classList.add('font-medium')
            div1.innerText = (symphony.allocation * 100).toFixed(2) + '%'
            cell1.appendChild(div1)
        }

        const tableHeader = table.createTHead();
        tableHeader.classList.add('bg-data-table','border-t','border-b','border-data-table-border','text-xs')

        const row = tableHeader.insertRow(0);

        const cell = row.insertCell(0);
        cell.classList.add('whitespace-nowrap','w-64','text-left','py-2','font-medium')
        cell.innerHTML = "Symphony";

        const cell2 = row.insertCell(1);
        cell2.classList.add('whitespace-nowrap','w-64','text-left','py-2','font-medium')
        const div2 = document.createElement("div");
        div2.innerText = "Allocation";
        cell2.appendChild(div2)

        return table
    }

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

    async function getAccount (token) {
        const resp = await fetch(
            'https://stagehand-api.composer.trade/api/v1/accounts/list',
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        const data = await resp.json()

        const isTaxable = getElementsByText('Taxable', 'button').length > 0
        const isRoth = getElementsByText('Roth', 'button').length > 0
        const isTraditional = getElementsByText('Traditional', 'button').length > 0

        let account
        if (isTaxable) {
            account = data.accounts.filter(acct => acct.account_type.toLowerCase().includes('individual'))[0]
        } else if (isRoth) {
            account = data.accounts.filter(acct => acct.account_type.toLowerCase().includes('roth'))[0]
        } else if (isTraditional) {
            account = data.accounts.filter(acct => acct.account_type.toLowerCase().includes('traditional'))[0]
        } else {
            throw new Error('[Symphony Tools Extension]: Unable to detect account type')
        }

        return account
    }

    async function updateTickerLastPercentChanges(accountId, token) {
        const resp = await fetch(
            `https://stagehand-api.composer.trade/api/v1/portfolio/accounts/${accountId}/symphony-stats`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        const data = await resp.json()
        const percentageChanges = {}
        for (const symphonyId of Object.keys(data.stats)) {
            const holdings = data.stats[symphonyId].holdings
            for (const holding of holdings) {
                if (percentageChanges[holding.ticker] === undefined) {
                    percentageChanges[holding.ticker] = holding.last_percent_change ?? '--'
                }
            }
        }

        for (const ticker of Object.keys(percentageChanges)) {
            const el = document.getElementById(`ste-ticker-${ticker}-percent-change`)
            const zero = (percentageChanges[ticker] * 100) === 0
            const positive = (percentageChanges[ticker] * 100) > 0
            let change = (percentageChanges[ticker] * 100).toFixed(2) + '%'
            if (zero) {
                el.innerText = `+${change}`
                el.style = 'min-width: 10rem; max-width: 10rem; color: rgb(0, 0, 0);'
            } else if (positive) {
                el.innerText = `+${change}`
                el.style = 'min-width: 10rem; max-width: 10rem; color: rgb(4, 159, 85);'
            } else {
                el.innerText = change
                el.style = 'min-width: 10rem; max-width: 10rem; color: rgb(255, 0, 0);'
            }
        }
    }

    function getElementsByText(str, tag = 'a') {
        return Array.prototype.slice.call(document.getElementsByTagName(tag)).filter(el => el.textContent.trim().includes(str.trim()));
    }

    function getAccountButton() {
        return Array.prototype.slice.call(document.getElementsByTagName('button')).filter(el => {
            return el.textContent.trim().toLowerCase().includes('individual')
                || el.textContent.trim().toLowerCase().includes('roth')
                || el.textContent.trim().toLowerCase().includes('traditional')
        })[0];
    }

    function getAccountType(text) {
        switch (text) {
            case 'Traditional IRA':
                return 'TRADITIONAL_IRA'
            case 'Roth IRA':
                return 'ROTH_IRA'
            case 'Individual (Taxable)':
                return 'INDIVIDUAL'
            default:
                throw new Error('[Symphony Tools Extension]: Unable to detect account type')
        }
    }

    if (window.location.pathname === '/portfolio') {
        initPortfolio()
    }

    window.navigation.addEventListener("navigate", (event) => {
        if (event.destination.url === 'https://app.composer.trade/portfolio') {
            initPortfolio()
        }
    })
})()