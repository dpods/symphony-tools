(() => {
    // ==========================================
    // EDN Parser - converts Composer's EDN string to JS objects
    // ==========================================

    function parseEdn(str) {
        let pos = 0

        function skipWhitespace() {
            while (pos < str.length && /[\s,]/.test(str[pos])) pos++
        }

        function parseValue() {
            skipWhitespace()
            if (pos >= str.length) return undefined
            const ch = str[pos]
            if (ch === '{') return parseMap()
            if (ch === '[') return parseArray()
            if (ch === '"') return parseString()
            if (ch === ':') return parseKeyword()
            if (ch === '-' || (ch >= '0' && ch <= '9')) return parseNumber()
            if (str.startsWith('true', pos) && !/[a-zA-Z0-9_\-?!]/.test(str[pos + 4] || '')) { pos += 4; return true }
            if (str.startsWith('false', pos) && !/[a-zA-Z0-9_\-?!]/.test(str[pos + 5] || '')) { pos += 5; return false }
            if (str.startsWith('nil', pos) && !/[a-zA-Z0-9_\-?!]/.test(str[pos + 3] || '')) { pos += 3; return null }
            throw new Error(`EDN parse error at position ${pos}: '${ch}'`)
        }

        function parseMap() {
            pos++
            const map = {}
            skipWhitespace()
            while (pos < str.length && str[pos] !== '}') {
                const key = parseValue()
                const value = parseValue()
                map[key] = value
                skipWhitespace()
            }
            if (pos < str.length) pos++
            return map
        }

        function parseArray() {
            pos++
            const arr = []
            skipWhitespace()
            while (pos < str.length && str[pos] !== ']') {
                arr.push(parseValue())
                skipWhitespace()
            }
            if (pos < str.length) pos++
            return arr
        }

        function parseString() {
            pos++
            let result = ''
            while (pos < str.length && str[pos] !== '"') {
                if (str[pos] === '\\') {
                    pos++
                    switch (str[pos]) {
                        case 'n': result += '\n'; break
                        case 't': result += '\t'; break
                        case '"': result += '"'; break
                        case '\\': result += '\\'; break
                        default: result += str[pos]
                    }
                } else {
                    result += str[pos]
                }
                pos++
            }
            if (pos < str.length) pos++
            return result
        }

        function parseKeyword() {
            pos++
            let kw = ''
            while (pos < str.length && /[a-zA-Z0-9_\-?!./]/.test(str[pos])) {
                kw += str[pos]
                pos++
            }
            return kw
        }

        function parseNumber() {
            let num = ''
            if (str[pos] === '-') { num += '-'; pos++ }
            while (pos < str.length && /[0-9.]/.test(str[pos])) {
                num += str[pos]
                pos++
            }
            return Number(num)
        }

        return parseValue()
    }

    // ==========================================
    // EDN Serializer - converts JS objects back to EDN for Composer
    // ==========================================

    // Fields whose values are EDN keywords (not quoted strings)
    const KEYWORD_FIELDS = new Set([
        'step', 'rebalance', 'comparator', 'lhs-fn', 'select-fn', 'sort-by-fn'
    ])

    function toEdn(value, fieldName) {
        if (value === null || value === undefined) return 'nil'
        if (typeof value === 'boolean') return value.toString()
        if (typeof value === 'number') return value.toString()
        if (typeof value === 'string') {
            if (fieldName && KEYWORD_FIELDS.has(fieldName)) return ':' + value
            return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'
        }
        if (Array.isArray(value)) {
            return '[' + value.map(v => toEdn(v)).join(' ') + ']'
        }
        if (typeof value === 'object') {
            const pairs = Object.entries(value).map(([k, v]) => `:${k} ${toEdn(v, k)}`)
            return '{' + pairs.join(', ') + '}'
        }
        return String(value)
    }

    // ==========================================
    // Data Access - uses EDN since getSymphonyJson() is broken
    // ==========================================

    const getSymphonyData = () => {
        const edn = window.cli.getSymphonyEdn()
        if (!edn) return null
        return parseEdn(edn)
    }

    const setSymphonyData = (data) => {
        window.cli.createSymphonyFromEdn(toEdn(data))
    }

    // ==========================================
    // Widget Initialization
    // ==========================================

    const initSymphonyWidget = () => {
        const observer = new MutationObserver(function (mutations, mutationInstance) {
            const sidebarEl = document.getElementById('sidebar')
            if (sidebarEl) {
                renderSymphonyWidget(sidebarEl);
                mutationInstance.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }

    function renderSymphonyWidget(sidebarEl) {
        const exists = document.getElementById('ste-widget')
        if (exists) {
            return
        }

        const div = document.createElement("div");
        div.id = 'ste-widget'
        div.classList.add('border', 'border-panel-border', 'rounded-md', 'shadow-sm', 'bg-panel-bg', 'pt-4', 'pb-5', 'px-4', 'space-y-3')
        sidebarEl.appendChild(div)

        div.appendChild(logo())
        div.appendChild(stripMetadataButton())
        div.appendChild(clickToCopy())
        div.appendChild(downloadJsonButton())
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
                const occurances = find(getSymphonyData(), this.value)
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

            const modifiedData = findAndReplace(getSymphonyData(), findValue, replaceValue, replaceAssets, replaceIfElse)
            setSymphonyData(modifiedData)

            const occurances = find(modifiedData, findValue)
            findResultsAssets.innerHTML = occurances.assets
            findResultsIfElse.innerHTML = occurances.conditionals
        })
    }

    // ==========================================
    // UI Components
    // ==========================================

    const logo = () => {
        const icon = document.createElement("div");
        icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.40808 12.1538C2.93521 12.1538 3.15458 11.7335 3.60273 11.5343C4.03673 11.3415 4.50718 11.3574 4.99649 11.3574C5.47353 11.3574 5.97784 11.437 6.43007 11.437C6.58543 11.437 6.50484 11.3012 6.63802 11.2821C6.89508 11.2454 7.17687 11.2775 7.42561 11.3397C7.64543 11.3946 7.93944 11.5047 8.1424 11.5166C8.35706 11.5293 8.52378 11.7032 8.73972 11.7511C8.96557 11.8013 9.15653 11.7047 9.35474 11.7733C9.66431 11.8804 9.79166 11.9945 10.1335 11.9945C10.4122 11.9945 10.691 11.9945 10.9697 11.9945C11.4126 11.9945 11.7881 11.9149 12.244 11.9149C12.6714 11.9149 12.5186 11.8892 12.1865 12.0122C11.8657 12.131 11.6074 12.2334 11.2485 12.2334C10.7553 12.2334 10.1072 12.1743 9.65562 12.375C9.33143 12.5191 8.84548 12.471 8.50079 12.5476C8.33118 12.5853 8.01332 12.6317 7.86364 12.6317C7.41233 12.6317 6.96102 12.6317 6.50971 12.6317C6.03586 12.6317 5.65921 12.4724 5.19559 12.4724C4.68571 12.4724 5.43512 12.2555 5.59381 12.2379C5.98364 12.1945 6.37725 12.1538 6.77076 12.1538C7.45636 12.1538 8.10913 12.3131 8.77954 12.3131C9.14531 12.3131 9.51108 12.3131 9.87685 12.3131C10.0495 12.3131 10.1213 12.324 10.2308 12.1892C10.3554 12.0359 11.0874 12.1538 11.2839 12.1538C11.9327 12.1538 12.4908 12.4247 13.0006 11.9149" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/><path d="M6.50004 2.06959V5.87892C6.50004 6.07591 6.46125 6.27096 6.38587 6.45295C6.31049 6.63494 6.2 6.8003 6.06071 6.93959L3.33338 9.66692M6.50004 2.06959C6.33271 2.08492 6.16604 2.10292 6.00004 2.12426M6.50004 2.06959C7.49789 1.9768 8.5022 1.9768 9.50004 2.06959M3.33338 9.66692L3.84671 9.53826C5.24204 9.19346 6.71459 9.35726 8.00004 10.0003C9.2855 10.6433 10.758 10.8071 12.1534 10.4623L13.2 10.2003M3.33338 9.66692L1.86538 11.1356C1.04338 11.9563 1.43138 13.3469 2.57671 13.5423C4.33938 13.8436 6.15138 14.0003 8.00004 14.0003C9.81751 14.0009 11.6318 13.8477 13.4234 13.5423C14.568 13.3469 14.956 11.9563 14.1347 11.1349L13.2 10.2003M9.50004 2.06959V5.87892C9.50004 6.27692 9.65804 6.65892 9.93938 6.93959L13.2 10.2003M9.50004 2.06959C9.66738 2.08492 9.83404 2.10292 10 2.12426" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' // static hardcoded SVG icon

        const label = document.createElement("span");
        label.style = 'margin-left: 0.5rem;'
        label.innerText = 'Symphony Tools Extension'

        let divLogo = document.createElement("div");
        divLogo.classList.add('text-sm', 'text-dark', 'font-medium', 'whitespace-nowrap', 'truncate', 'flex', 'items-center', 'text-left')
        divLogo.appendChild(icon)
        divLogo.appendChild(label)
        return divLogo
    }

    const stripMetadataButton = () => {
        let wrapper = document.createElement('div')
        wrapper.classList.add('rounded', 'flex', 'border', 'border-asset-border', 'shadow-sm', 'bg-panel-bg', 'divide-x', 'divide-solid', 'divide-asset-border')

        let button = document.createElement('button')
        button.classList.add('w-full', 'text-sm', 'font-light', 'flex', 'items-center', 'justify-center', 'py-2', 'shadow-inner', 'transition', 'focus:outline-none', 'leading-none', 'select-none', 'rounded', 'text-dark-soft', 'bg-background')

        let span = document.createElement('span')
        span.classList.add('flex', 'items-cente', 'space-x-2')
        span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" height="16" width="16"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" /></svg>' // static hardcoded SVG icon

        let text = document.createElement('span')
        text.innerText = 'Strip Metadata'

        button.addEventListener('click', (e) => {
            const data = getSymphonyData()
            const modifiedData = removeMetadata(data)
            setSymphonyData(modifiedData)
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
            wrapper.classList.add('w-1/2', 'rounded', 'flex', 'border', 'border-asset-border', 'shadow-sm', 'bg-panel-bg', 'divide-x', 'divide-solid', 'divide-asset-border')

            let button = document.createElement('button')
            button.id = 'findAndReplaceBtn'
            button.classList.add('w-full', 'text-sm', 'font-light', 'flex', 'items-center', 'justify-center', 'py-2', 'shadow-inner', 'transition', 'focus:outline-none', 'leading-none', 'select-none', 'rounded', 'text-dark-soft', 'bg-background')

            let span = document.createElement('span')
            span.classList.add('flex', 'items-center', 'space-x-2')

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
            const data = getSymphonyData()
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        }

        const copyEdn = () => {
            navigator.clipboard.writeText(window.cli.getSymphonyEdn());
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

    const downloadJsonButton = () => {
        const downloadJson = () => {
            const data = getSymphonyData()
            const jsonString = JSON.stringify(data, null, 2)

            const pathParts = window.location.pathname.split('/')
            const symphonyId = pathParts[pathParts.length - 1] || 'symphony'

            const blob = new Blob([jsonString], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${symphonyId}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }

        let wrapper = document.createElement('div')
        wrapper.classList.add('rounded', 'flex', 'border', 'border-asset-border', 'shadow-sm', 'bg-panel-bg', 'divide-x', 'divide-solid', 'divide-asset-border')

        let button = document.createElement('button')
        button.classList.add('w-full', 'text-sm', 'font-light', 'flex', 'items-center', 'justify-center', 'py-2', 'shadow-inner', 'transition', 'focus:outline-none', 'leading-none', 'select-none', 'rounded', 'text-dark-soft', 'bg-background')

        let span = document.createElement('span')
        span.classList.add('flex', 'items-center', 'space-x-2')
        span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" height="16" width="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>' // static hardcoded SVG icon

        let text = document.createElement('span')
        text.innerText = 'Download JSON'

        button.addEventListener('click', (e) => {
            downloadJson()
            text.innerText = 'Downloaded'
            setTimeout(() => {
                text.innerText = 'Download JSON'
            }, 1000)
        })

        span.appendChild(text)
        button.appendChild(span)
        wrapper.appendChild(button)
        return wrapper
    }

    const donate = () => {
        const wrapper = document.createElement('div')
        const link = document.createElement('a')
        link.href = 'https://www.buymeacoffee.com/dpods'
        link.className = 'text-xs underline font-light'
        link.target = '_blank'
        link.textContent = 'Support this extension'
        wrapper.appendChild(link)
        return wrapper
    }

    // ==========================================
    // Symphony Data Operations
    // ==========================================

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

        return findTicker(json, find, { assets: 0, conditionals: 0 })
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

    // ==========================================
    // Navigation & Initialization
    // ==========================================

    if (window.location.pathname.startsWith('/editor/') && !window.location.pathname.endsWith('/detail')) {
        initSymphonyWidget()
    }

    window.navigation.addEventListener("navigate", (event) => {
        if (event.destination.url.startsWith('https://app.composer.trade/editor/')
            && !event.destination.url.endsWith('/detail')) {
            initSymphonyWidget()
        }
    })
})()