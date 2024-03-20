(() => {
    const initSymphonyWidget = () => {
        const observer = new MutationObserver(function (mutations, mutationInstance) {
            const sidebarEl = document.getElementById('sidebar')
            if (sidebarEl) {
                renderSymphonyWidget(sidebarEl);
                mutationInstance.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true});
    }

    function renderSymphonyWidget(sidebarEl) {
        const exists = document.getElementById('ste-widget')
        if (exists) {
            return
        }

        const div = document.createElement("div");
        div.id = 'ste-widget'
        div.classList.add('border','border-panel-border','rounded-md','shadow-sm','bg-panel-bg','pt-4','pb-5','px-4','space-y-3')
        sidebarEl.appendChild(div)

        div.appendChild(logo())
        div.appendChild(stripMetadataButton())
        div.appendChild(clickToCopy())
        div.appendChild(findAndReplaceForm())
        div.appendChild(donate())

        document.getElementById('find').addEventListener('input', function (evt) {
            this.value = this.value.toUpperCase()

            const findResults = document.getElementById('findResults')
            const replaceAssetsCheckbox = document.getElementById('ste-replace-assets')
            const replaceIfElseCheckbox = document.getElementById('ste-replace-ifelse')
            const findResultsAssets = document.getElementById('findResultsAssets')
            const findResultsIfElse = document.getElementById('findResultsIfElse')

            if (this.value === '') {
                replaceAssetsCheckbox.checked = false
                replaceIfElseCheckbox.checked = false
                findResults.classList.add('invisible')
            } else {
                const occurances = find(getSymphonyJson(), this.value)
                replaceAssetsCheckbox.checked = true
                replaceIfElseCheckbox.checked = true
                findResultsAssets.innerHTML = occurances.assets
                findResultsIfElse.innerHTML = occurances.conditionals
                findResults.classList.remove('invisible')
            }
        });

        document.getElementById('replace').addEventListener('input', function (evt) {
            this.value = this.value.toUpperCase()
        });

        document.getElementById('replace').addEventListener('input', function (evt) {
            this.value = this.value.toUpperCase()
        });

        document.getElementById('findAndReplaceBtn').addEventListener('click', (e) => {
            const findValue = document.getElementById('find').value
            const replaceValue = document.getElementById('replace').value
            const replaceAssets = document.getElementById('ste-replace-assets').checked
            const replaceIfElse = document.getElementById('ste-replace-ifelse').checked
            const findResultsAssets = document.getElementById('findResultsAssets')
            const findResultsIfElse = document.getElementById('findResultsIfElse')

            if (findValue === '' || replaceValue === '') {
                return
            }

            const modifiedSymphonyJson = findAndReplace(getSymphonyJson(), findValue, replaceValue, replaceAssets, replaceIfElse)
            setSymphonyJson(modifiedSymphonyJson)

            const occurances = find(modifiedSymphonyJson, findValue)
            findResultsAssets.innerHTML = occurances.assets
            findResultsIfElse.innerHTML = occurances.conditionals
        })
    }

    const logo = () => {
        const span1 = document.createElement("div");
        span1.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.40808 12.1538C2.93521 12.1538 3.15458 11.7335 3.60273 11.5343C4.03673 11.3415 4.50718 11.3574 4.99649 11.3574C5.47353 11.3574 5.97784 11.437 6.43007 11.437C6.58543 11.437 6.50484 11.3012 6.63802 11.2821C6.89508 11.2454 7.17687 11.2775 7.42561 11.3397C7.64543 11.3946 7.93944 11.5047 8.1424 11.5166C8.35706 11.5293 8.52378 11.7032 8.73972 11.7511C8.96557 11.8013 9.15653 11.7047 9.35474 11.7733C9.66431 11.8804 9.79166 11.9945 10.1335 11.9945C10.4122 11.9945 10.691 11.9945 10.9697 11.9945C11.4126 11.9945 11.7881 11.9149 12.244 11.9149C12.6714 11.9149 12.5186 11.8892 12.1865 12.0122C11.8657 12.131 11.6074 12.2334 11.2485 12.2334C10.7553 12.2334 10.1072 12.1743 9.65562 12.375C9.33143 12.5191 8.84548 12.471 8.50079 12.5476C8.33118 12.5853 8.01332 12.6317 7.86364 12.6317C7.41233 12.6317 6.96102 12.6317 6.50971 12.6317C6.03586 12.6317 5.65921 12.4724 5.19559 12.4724C4.68571 12.4724 5.43512 12.2555 5.59381 12.2379C5.98364 12.1945 6.37725 12.1538 6.77076 12.1538C7.45636 12.1538 8.10913 12.3131 8.77954 12.3131C9.14531 12.3131 9.51108 12.3131 9.87685 12.3131C10.0495 12.3131 10.1213 12.324 10.2308 12.1892C10.3554 12.0359 11.0874 12.1538 11.2839 12.1538C11.9327 12.1538 12.4908 12.4247 13.0006 11.9149" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/><path d="M6.50004 2.06959V5.87892C6.50004 6.07591 6.46125 6.27096 6.38587 6.45295C6.31049 6.63494 6.2 6.8003 6.06071 6.93959L3.33338 9.66692M6.50004 2.06959C6.33271 2.08492 6.16604 2.10292 6.00004 2.12426M6.50004 2.06959C7.49789 1.9768 8.5022 1.9768 9.50004 2.06959M3.33338 9.66692L3.84671 9.53826C5.24204 9.19346 6.71459 9.35726 8.00004 10.0003C9.2855 10.6433 10.758 10.8071 12.1534 10.4623L13.2 10.2003M3.33338 9.66692L1.86538 11.1356C1.04338 11.9563 1.43138 13.3469 2.57671 13.5423C4.33938 13.8436 6.15138 14.0003 8.00004 14.0003C9.81751 14.0009 11.6318 13.8477 13.4234 13.5423C14.568 13.3469 14.956 11.9563 14.1347 11.1349L13.2 10.2003M9.50004 2.06959V5.87892C9.50004 6.27692 9.65804 6.65892 9.93938 6.93959L13.2 10.2003M9.50004 2.06959C9.66738 2.08492 9.83404 2.10292 10 2.12426" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

        const span2 = document.createElement("span");
        span2.style = 'margin-left: 0.5rem;'
        span2.innerText = 'Symphony Tools Extension'

        let divLogo = document.createElement("div");
        divLogo.classList.add('text-sm', 'text-dark', 'font-medium', 'whitespace-nowrap', 'truncate', 'flex', 'items-center', 'text-left')
        divLogo.appendChild(span1)
        divLogo.appendChild(span2)
        return divLogo
    }

    const stripMetadataButton = () => {
        let wrapper = document.createElement('div')
        wrapper.classList.add('rounded','flex','border','border-asset-border','shadow-sm','bg-panel-bg','divide-x','divide-solid','divide-asset-border')

        let button = document.createElement('button')
        button.classList.add('w-full','text-sm','font-light','flex','items-center','justify-center','py-2','shadow-inner','transition','focus:outline-none','leading-none','select-none','rounded','text-dark-soft','bg-background')

        let span = document.createElement('span')
        span.classList.add('flex','items-cente','space-x-2')
        span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" /></svg>'

        let text = document.createElement('span')
        text.innerText = 'Strip Metadata'

        button.addEventListener('click', (e) => {
            const symphonyJson = getSymphonyJson()
            const modifiedSymphonyJson = removeMetadata(symphonyJson)
            setSymphonyJson(modifiedSymphonyJson)
        })

        span.appendChild(text)
        button.appendChild(span)
        wrapper.appendChild(button)
        return wrapper
    }

    const findAndReplaceForm = () => {
        const findInput = () => {
            let wrapper = document.createElement('div')
            wrapper.className = 'w-full transition'

            const span = document.createElement('span')
            span.classList.value = 'block block w-full text-dark-soft label'
            span.innerText = 'Find'
            span.setAttribute('for', 'find')

            const inputWrapper = document.createElement('div')
            inputWrapper.className = 'w-auto inline-block flex items-center group'

            const input = document.createElement("input");
            input.type = "text";
            input.id = 'find'
            input.className = 'cursor-default w-full focus:outline-none text-sm bg-white rounded transition border border-input-border border p-1'

            inputWrapper.appendChild(input)

            wrapper.appendChild(span)
            wrapper.appendChild(inputWrapper)
            return wrapper
        }

        const replaceInput = () => {
            let wrapper = document.createElement('div')
            wrapper.className = 'w-full transition'

            const span = document.createElement('span')
            span.classList.value = 'block w-full text-dark-soft label'
            span.innerText = 'Replace'
            span.setAttribute('for', 'replace')

            const inputWrapper = document.createElement('div')
            inputWrapper.className = 'w-auto inline-block flex items-center group'

            const input = document.createElement("input");
            input.type = "text";
            input.id = 'replace'
            input.className = 'cursor-default w-full focus:outline-none text-sm bg-white rounded transition border border-input-border border p-1'

            inputWrapper.appendChild(input)

            wrapper.appendChild(span)
            wrapper.appendChild(inputWrapper)
            return wrapper
        }

        const results = () => {
            let wrapper = document.createElement('div')
            wrapper.id = 'findResults'
            wrapper.className = 'block invisible text-xs'

            let assets = document.createElement('div')
            assets.className = 'flex flex-row items-center'

            var replaceAssetsCheckbox = document.createElement('input');
            replaceAssetsCheckbox.id = 'ste-replace-assets'
            replaceAssetsCheckbox.className = 'mr-1'
            replaceAssetsCheckbox.type = "checkbox";
            replaceAssetsCheckbox.checked = true;
            replaceAssetsCheckbox.click()

            let span1 = document.createElement('span')
            span1.id = 'findResultsAssets'
            span1.className = 'mr-1'
            let span2 = document.createElement('span')
            span2.innerText = ' assets'
            assets.appendChild(replaceAssetsCheckbox)
            assets.appendChild(span1)
            assets.appendChild(span2)
            wrapper.appendChild(assets)

            let ifElse = document.createElement('div')
            ifElse.className = 'flex flex-row items-center'

            var replaceIfElseCheckbox = document.createElement('input');
            replaceIfElseCheckbox.id = 'ste-replace-ifelse'
            replaceIfElseCheckbox.className = 'mr-1'
            replaceIfElseCheckbox.type = "checkbox";
            replaceIfElseCheckbox.checked = true;
            replaceIfElseCheckbox.click()

            let span3 = document.createElement('span')
            span3.id = 'findResultsIfElse'
            span3.className = 'mr-1'
            let span4 = document.createElement('span')
            span4.innerText = ' if/else'
            ifElse.appendChild(replaceIfElseCheckbox)
            ifElse.appendChild(span3)
            ifElse.appendChild(span4)
            wrapper.appendChild(ifElse)

            return wrapper
        }

        const replaceButton = () => {
            let wrapper = document.createElement('div')
            wrapper.classList.add('w-1/2', 'rounded','flex','border','border-asset-border','shadow-sm','bg-panel-bg','divide-x','divide-solid','divide-asset-border')

            let button = document.createElement('button')
            button.id = 'findAndReplaceBtn'
            button.classList.add('w-full','text-sm','font-light','flex','items-center','justify-center','py-2','shadow-inner','transition','focus:outline-none','leading-none','select-none','rounded','text-dark-soft','bg-background')

            let span = document.createElement('span')
            span.classList.add('flex','items-center','space-x-2')

            let text = document.createElement('span')
            text.innerText = 'Replace All'

            span.appendChild(text)
            button.appendChild(span)
            wrapper.appendChild(button)
            return wrapper
        }

        const wrapper = document.createElement('div')

        const row1 = document.createElement('div')
        row1.className = 'flex gap-2'
        row1.appendChild(findInput())
        row1.appendChild(replaceInput())

        const row2 = document.createElement('div')
        row2.className = 'flex gap-2 justify-start pt-2'
        row2.appendChild(replaceButton())
        row2.appendChild(results())

        wrapper.appendChild(row1)
        wrapper.appendChild(row2)

        return wrapper
    }

    const clickToCopy = () => {
        const copyJson = () => {
            navigator.clipboard.writeText(JSON.stringify(cli.getSymphonyJson()));
        }

        const copyEdn = () => {
            navigator.clipboard.writeText(cli.getSymphonyEdn());
        }

        const button = (buttonText, func, css) => {
            let button = document.createElement('button')
            button.className = `w-full text-sm font-light flex items-center justify-center py-2 shadow-inner transition focus:outline-none leading-none select-none ${css} text-dark-soft bg-background`

            let span = document.createElement('span')
            span.className = 'flex items-center space-x-2'

            let text = document.createElement('span')
            text.innerText = buttonText

            button.addEventListener('click', (e) => {
                func()
                text.innerText = 'Copied'
                setTimeout(() => {
                    text.innerText = buttonText
                }, 1000)
            })

            span.appendChild(text)
            button.appendChild(span)
            return button
        }

        const wrapper = document.createElement('div')
        wrapper.className = 'rounded flex border border-asset-border shadow-sm bg-panel-bg divide-x divide-solid divide-asset-border'

        wrapper.appendChild(button('Copy JSON', copyJson, 'rounded-tl rounded-bl'))
        wrapper.appendChild(button('Copy EDN', copyEdn, 'rounded-tr rounded-br'))
        return wrapper
    }

    const donate = () => {
        const wrapper = document.createElement('div')
        wrapper.innerHTML = '<a href="https://www.buymeacoffee.com/dpods" class="text-xs underline font-light" target="_blank">Support this extension</a>'
        return wrapper
    }

    const getSymphonyJson = () => {
        return window.cli.getSymphonyJson()
    }

    const setSymphonyJson = (json) => {
        window.cli.createSymphonyFromJson(json)
    }

    function removeMetadata(json) {
        function isAssetNode(json) {
            return json.hasOwnProperty('step') && json['step'] === 'asset'
        }

        function removeMetadataFromAsset(json) {
            if (isAssetNode(json)) {
                delete json['name']
                delete json['exchange']
            }

            if (json['children'] !== undefined) {
                const children = []
                for (const child of json['children']) {
                    children.push(removeMetadataFromAsset(child))
                }
                json['children'] = children
            }

            return json
        }

        return removeMetadataFromAsset(json)
    }

    function find(json, find) {
        function isAssetNode(json) {
            return json.hasOwnProperty('step') && json['step'] === 'asset'
        }

        function isIfNode(json) {
            return json.hasOwnProperty('step') && json['step'] === 'if-child'
        }

        function isMatch(json, find) {
            return json.hasOwnProperty('ticker') && json['ticker'].toUpperCase() === find.toUpperCase()
        }

        function isLhsMatch(json, find) {
            return json.hasOwnProperty('lhs-val') && json['lhs-val'].toUpperCase() === find.toUpperCase()
        }

        function isRhsMatch(json, find) {
            return json.hasOwnProperty('rhs-val') && json['rhs-val'].toUpperCase() === find.toUpperCase()
        }

        function findTicker(json, find, occurrances) {
            if (isAssetNode(json) && isMatch(json, find)) {
                occurrances.assets++
            }

            if (isIfNode(json)) {
                if (isLhsMatch(json, find)) {
                    occurrances.conditionals++
                }
                if (isRhsMatch(json, find)) {
                    occurrances.conditionals++
                }
            }

            if (json['children'] !== undefined) {
                for (const child of json['children']) {
                    occurrances = findTicker(child, find, occurrances)
                }
            }

            return occurrances
        }

        return findTicker(json, find, {assets: 0, conditionals: 0})
    }

    function findAndReplace(json, find, replace, replaceAssets, replaceIfElse) {
        function isAssetNode(json) {
            return json.hasOwnProperty('step') && json['step'] === 'asset'
        }

        function isIfNode(json) {
            return json.hasOwnProperty('step') && json['step'] === 'if-child'
        }

        function isMatch(json, find) {
            return json.hasOwnProperty('ticker') && json['ticker'].toUpperCase() === find.toUpperCase()
        }

        function isLhsMatch(json, find) {
            return json.hasOwnProperty('lhs-val') && json['lhs-val'].toUpperCase() === find.toUpperCase()
        }

        function isRhsMatch(json, find) {
            return json.hasOwnProperty('rhs-val') && json['rhs-val'].toUpperCase() === find.toUpperCase()
        }

        function findAndReplaceTicker(json, find, replace) {
            if (replaceAssets && isAssetNode(json) && isMatch(json, find)) {
                delete json['name']
                delete json['exchange']
                json['ticker'] = replace.toUpperCase()
            }

            if (replaceIfElse && isIfNode(json)) {
                if (isLhsMatch(json, find)) {
                    json['lhs-val'] = replace.toUpperCase()
                }
                if (isRhsMatch(json, find)) {
                    json['rhs-val'] = replace.toUpperCase()
                }
            }

            if (json['children'] !== undefined) {
                const children = []
                for (const child of json['children']) {
                    children.push(findAndReplaceTicker(child, find, replace))
                }
                json['children'] = children
            }

            return json
        }

        return findAndReplaceTicker(json, find, replace)
    }

    const initPortfolioWidget = () => {
        const observer = new MutationObserver(function (mutations, mutationInstance) {
            const mainEl = document.getElementsByTagName('main')[0]
            if (mainEl) {
                renderPortfolioWidget(mainEl);
                mutationInstance.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true});
    }

    function renderPortfolioWidget(mainEl) {
        const accountButton = getAccountButton()
        let accountType = getAccountType(accountButton.innerText)

        getAggregatedLiveHoldings(accountType).then((holdings) => {
            renderTable(mainEl, holdings)
        })

        const observer = new MutationObserver(function(mutations) {
            const newAccountType = getAccountType(accountButton.textContent)
            if (newAccountType !== accountType) {
                accountType = newAccountType
                getAggregatedLiveHoldings(accountType).then((holdings) => {
                    renderTable(mainEl, holdings)
                })
            }
        });
        observer.observe(mainEl, { childList: true });
    }

    const getAggregatedLiveHoldings = async (accountType) => {
        const token = await cli.getTemporaryToken()
        const accountId = await getAccountId(token)
        const response = await fetch(
            `https://stagehand-api.composer.trade/api/v1/portfolio/accounts/${accountId}/symphony-stats-meta`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        const symphonyStats = await response.json()

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

    const renderTable = (mainEl, holdings) => {
        const widgetId = 'ste-aggregate-holdings'

        if (holdings.length === 0) {
            const widget = document.getElementById(widgetId);
            if (widget) {
                widget.remove();
            }
            return
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
            div1.classList.add('font-medium', 'cursor-pointer', 'truncate')
            div1.style = 'min-width: 10rem; max-width: 10rem;'
            div1.innerText = (holding.totalAllocation * 100).toFixed(2) + '%'
            cell1.appendChild(div1)

            const cell2 = currentRow.insertCell(2)
            cell2.classList.add('text-sm', 'text-dark', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
            const div2 = document.createElement("div");
            div2.classList.add('font-medium', 'cursor-pointer', 'truncate')
            div2.style = 'min-width: 10rem; max-width: 10rem;'
            div2.innerText = holding.symphonies.length
            cell2.appendChild(div2)

            const cell3 = currentRow.insertCell(3)
            cell3.classList.add('text-sm', 'text-dark', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
            const div3 = document.createElement("div");
            div3.classList.add('font-medium', 'cursor-pointer', 'truncate')
            div3.style = 'min-width: 10rem; max-width: 10rem;'
            div3.innerText = (holding.amount).toFixed(2)
            cell3.appendChild(div3)

            const cell4 = currentRow.insertCell(4)
            cell4.classList.add('text-sm', 'text-dark', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')
            const div4 = document.createElement("div");
            div4.classList.add('font-medium', 'cursor-pointer', 'truncate')
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

        let divLogo = document.createElement("div");
        divLogo.classList.add('text-sm', 'text-dark', 'font-medium', 'whitespace-nowrap', 'py-4', 'px-6', 'truncate', 'flex', 'items-center', 'text-left')

        const span1 = document.createElement("span");
        span1.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.40808 12.1538C2.93521 12.1538 3.15458 11.7335 3.60273 11.5343C4.03673 11.3415 4.50718 11.3574 4.99649 11.3574C5.47353 11.3574 5.97784 11.437 6.43007 11.437C6.58543 11.437 6.50484 11.3012 6.63802 11.2821C6.89508 11.2454 7.17687 11.2775 7.42561 11.3397C7.64543 11.3946 7.93944 11.5047 8.1424 11.5166C8.35706 11.5293 8.52378 11.7032 8.73972 11.7511C8.96557 11.8013 9.15653 11.7047 9.35474 11.7733C9.66431 11.8804 9.79166 11.9945 10.1335 11.9945C10.4122 11.9945 10.691 11.9945 10.9697 11.9945C11.4126 11.9945 11.7881 11.9149 12.244 11.9149C12.6714 11.9149 12.5186 11.8892 12.1865 12.0122C11.8657 12.131 11.6074 12.2334 11.2485 12.2334C10.7553 12.2334 10.1072 12.1743 9.65562 12.375C9.33143 12.5191 8.84548 12.471 8.50079 12.5476C8.33118 12.5853 8.01332 12.6317 7.86364 12.6317C7.41233 12.6317 6.96102 12.6317 6.50971 12.6317C6.03586 12.6317 5.65921 12.4724 5.19559 12.4724C4.68571 12.4724 5.43512 12.2555 5.59381 12.2379C5.98364 12.1945 6.37725 12.1538 6.77076 12.1538C7.45636 12.1538 8.10913 12.3131 8.77954 12.3131C9.14531 12.3131 9.51108 12.3131 9.87685 12.3131C10.0495 12.3131 10.1213 12.324 10.2308 12.1892C10.3554 12.0359 11.0874 12.1538 11.2839 12.1538C11.9327 12.1538 12.4908 12.4247 13.0006 11.9149" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/><path d="M6.50004 2.06959V5.87892C6.50004 6.07591 6.46125 6.27096 6.38587 6.45295C6.31049 6.63494 6.2 6.8003 6.06071 6.93959L3.33338 9.66692M6.50004 2.06959C6.33271 2.08492 6.16604 2.10292 6.00004 2.12426M6.50004 2.06959C7.49789 1.9768 8.5022 1.9768 9.50004 2.06959M3.33338 9.66692L3.84671 9.53826C5.24204 9.19346 6.71459 9.35726 8.00004 10.0003C9.2855 10.6433 10.758 10.8071 12.1534 10.4623L13.2 10.2003M3.33338 9.66692L1.86538 11.1356C1.04338 11.9563 1.43138 13.3469 2.57671 13.5423C4.33938 13.8436 6.15138 14.0003 8.00004 14.0003C9.81751 14.0009 11.6318 13.8477 13.4234 13.5423C14.568 13.3469 14.956 11.9563 14.1347 11.1349L13.2 10.2003M9.50004 2.06959V5.87892C9.50004 6.27692 9.65804 6.65892 9.93938 6.93959L13.2 10.2003M9.50004 2.06959C9.66738 2.08492 9.83404 2.10292 10 2.12426" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        const span2 = document.createElement("span");
        span2.style = 'margin-left: 0.5rem;'
        span2.innerText = 'Symphony Tools Extension'

        const donate = document.createElement('div')
        donate.className = 'text-sm text-dark font-medium whitespace-nowrap py-4 px-6 truncate flex items-center text-left'
        donate.innerHTML = '<a href="https://www.buymeacoffee.com/dpods" class="text-xs underline font-light" target="_blank">Support this extension</a>'

        divLogo.appendChild(span1)
        divLogo.appendChild(span2)
        header.appendChild(divLogo)
        header.appendChild(donate)

        const tbody = table.getElementsByTagName('tbody')[0]
        tbody.classList.add('block','bg-sheet','divide-y','divide-divider-light')

        let divOuter = document.createElement("div");
        divOuter.id = widgetId
        divOuter.classList.add('bg-sheet')
        divOuter.appendChild(header)
        divOuter.appendChild(divInner)

        mainEl.appendChild(divOuter)
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

    const getAccountId = async (token) => {
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

        return account.account_uuid
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

    if (window.location.pathname.startsWith('/symphony/') && !window.location.pathname.endsWith('/detail')) {
        initSymphonyWidget()
    }

    if (window.location.pathname === '/portfolio') {
        initPortfolioWidget()
    }

    window.navigation.addEventListener("navigate", (event) => {
        if (event.destination.url.startsWith('https://app.composer.trade/symphony/')
            && !event.destination.url.endsWith('/detail')) {
            initSymphonyWidget()
        }
    })

    window.navigation.addEventListener("navigate", (event) => {
        if (event.destination.url === 'https://app.composer.trade/portfolio') {
            initPortfolioWidget()
        }
    })
})()