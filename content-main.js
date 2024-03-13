const config = {
    debug: false
}

const debug = (message, ...context) => {
    if (config.debug) {
        console.log(`>>> content-main ${message}`, ...context)
    }
}

window.addEventListener('get_symphony_json', (event) => {
    debug('received event', event)
    const e = new CustomEvent('symphony_json_result', {
        detail: {
            ...event.detail,
            symphony: window.cli.getSymphonyJson()
        }
    })
    debug('dispatching event', e)
    window.dispatchEvent(e)
})

window.addEventListener('set_symphony_json', (event) => {
    debug('received event', event)
    window.cli.createSymphonyFromJson(event.detail)
})

if (window.location.pathname === '/portfolio') {
    const observer = new MutationObserver(function (mutations, mutationInstance) {
        const mainEl = document.getElementsByTagName('main')[0]
        if (mainEl) {
            renderAggregatedLiveHoldings(mainEl);
            mutationInstance.disconnect();
        }
    });
    observer.observe(document, { childList: true, subtree: true});
}

function renderAggregatedLiveHoldings(mainEl) {
    console.log(">>>> main element was rendered");
    getAggregatedLiveHoldings().then((holdings) => {
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
            currentRow.classList.add('group','hover:bg-white','transition','duration-200','flex','items-stretch')
            currentRow.style = 'height: 60px'

            const cell0 = currentRow.insertCell(0)
            cell0.classList.add('min-w-[24rem]','w-[24rem]','text-sm','text-dark','py-4','px-6','bg-sheet','flex','items-center','group-hover:bg-white','transition','duration-200')
            const div0 = document.createElement("div");
            div0.classList.add('font-medium','cursor-pointer','truncate')
            div0.innerText = holding.ticker
            cell0.appendChild(div0)

            const cell1 = currentRow.insertCell(1)
            cell1.classList.add('text-sm','text-dark','whitespace-nowrap','py-4','px-6','truncate','flex','items-center','text-left')
            const div1 = document.createElement("div");
            div1.classList.add('font-medium','cursor-pointer','truncate')
            div1.style = 'min-width: 10rem; max-width: 10rem;'
            div1.innerText = (holding.totalAllocation * 100).toFixed(2) + '%'
            cell1.appendChild(div1)

            const cell2 = currentRow.insertCell(2)
            cell2.classList.add('text-sm','text-dark','whitespace-nowrap','py-4','px-6','truncate','flex','items-center','text-left')
            const div2 = document.createElement("div");
            div2.classList.add('font-medium','cursor-pointer','truncate')
            div2.style = 'min-width: 10rem; max-width: 10rem;'
            div2.innerText = (holding.amount).toFixed(2)
            cell2.appendChild(div2)

            const cell3 = currentRow.insertCell(3)
            cell3.classList.add('text-sm','text-dark','whitespace-nowrap','py-4','px-6','truncate','flex','items-center','text-left')
            const div3 = document.createElement("div");
            div3.classList.add('font-medium','cursor-pointer','truncate')
            div3.style = 'min-width: 10rem; max-width: 10rem;'
            div3.innerText = USDollar.format((holding.value).toFixed(2))
            cell3.appendChild(div3)
        }

        const tableHeader = table.createTHead();
        tableHeader.classList.add('bg-data-table', 'border-y', 'border-data-table-border')

        const row = tableHeader.insertRow(0);
        row.classList.add('sticky', 'left-0', 'top-0', 'z-10', 'block', 'h-auto')

        const cell = row.insertCell(0);
        cell.classList.add('min-w-[24rem]', 'w-[24rem]','w-96','text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        cell.innerHTML = "Ticker";

        const cell2 = row.insertCell(1);
        cell2.classList.add('text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        const div2 = document.createElement("div");
        div2.style = 'min-width: 10rem; max-width: 10rem;'
        div2.innerText = "Total Allocation";
        cell2.appendChild(div2)

        const cell3 = row.insertCell(2);
        cell3.classList.add('text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        const div3 = document.createElement("div");
        div3.style = 'min-width: 10rem; max-width: 10rem;'
        div3.innerText = "Total Quantity";
        cell3.appendChild(div3)

        const cell4 = row.insertCell(3);
        cell4.classList.add('text-xs','px-6','py-2','text-dark-soft','text-left','font-normal','whitespace-nowrap','align-bottom')
        const div4 = document.createElement("div");
        div4.style = 'min-width: 10rem; max-width: 10rem;'
        div4.innerText = "Total Value";
        cell4.appendChild(div4)

        let divInner = document.createElement("div");
        divInner.classList.add('hidden', 'md:block', 'shadow-sm', 'overflow-auto', 'overflow-x-scroll', 'border-b', 'border-b-modal-border', 'mb-16')
        divInner.appendChild(table)

        const tbody = table.getElementsByTagName('tbody')[0]
        tbody.classList.add('block','bg-sheet','divide-y','divide-divider-light')

        let divOuter = document.createElement("div");
        divOuter.classList.add('bg-sheet')
        divOuter.appendChild(divInner)

        mainEl.appendChild(divOuter)
    })
}

const getAggregatedLiveHoldings = async () => {
    const token = await cli.getTemporaryToken()

    const resp = await fetch(
        'https://stagehand-api.composer.trade/api/v1/accounts/list',
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    )

    const accounts = await resp.json()
    console.log('>>>> ACCOUNTS', accounts)

    const accountId = accounts.accounts[0].account_uuid
    const response = await fetch(
        `https://stagehand-api.composer.trade/api/v1/portfolio/accounts/${accountId}/symphony-stats-meta`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    )
    const symphonyStats = await response.json()
    console.log('>>>> symphonyStats', symphonyStats)

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
    return holdings
}
