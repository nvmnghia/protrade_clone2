const rand = Math.random;
const round = Math.round;
const floor = Math.floor;

const hide = element => element.classList.add('hidden');
const show = element => element.classList.remove('hidden');

/**
 *  Base class to control table.
 */
 class Table {

    /**
     * Instantiate the table with a <table> element.
     * @param tableElement
     */
    constructor(tableElement) {
        this.table = tableElement;
        this.tableBody = tableElement.querySelector('tbody');
        this.rowTemplate = tableElement.querySelector('template');

        // The table is rendered once, at the first time it is shown.
        this.rendered = false;
        if (this.visible()) {
            this.render();
        }
    }

    /**
     * Check if the table is shown.
     */
    visible() {
        return this.table.style.display !== 'none';
    }

    /**
     * Toggle table.
     */
    toggle() {
        this.table.classList.toggle('hidden');
        this.render();
    }

    /**
     * Generate data for the whole table.
     */
    generateData() {
        return [];
    }

    /**
     * Render a single row using the embedded template.
     *
     * @param rowData Data of a single row.
     */
    renderRow(rowData) {}

    /**
     * Render the whole table body.
     * Guaranteed to be idempotent (run once).
     */
    render() {
        if (this.rendered) {
            return;
        }

        this.generateData().forEach(this.renderRow, this);

        this.rendered = true;
    }
}


/********************************************************************************
 * Header
 ********************************************************************************/

function setupClock() {
    const locale   = 'vi';
    const timeZone = 'Asia/Ho_Chi_Minh';

    const timeOptions = {
        timeZone,
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };
    const timeNode = document.getElementById('vn-time');
    const tick = () => timeNode.textContent = new Date().toLocaleTimeString(locale, timeOptions);
    tick();
    setInterval(tick, 1000);

    const dateOptions = {
        timeZone,
        year:  'numeric',
        month: '2-digit',
        day:   '2-digit'
    }
    const dateNode = document.getElementById('vn-date');
    const newDay = () => dateNode.textContent = new Date().toLocaleDateString(locale, dateOptions);
    newDay();
    setInterval(newDay, 1000 * 60 * 60 * 24);
}


/********************************************************************************
 * Market charts
 ********************************************************************************/

const marketCharts = {
    'market-intraday': {
        title: 'Intraday',
        src: 'https://mkw.vndirect.com.vn/leader_lagger?color=gray'
    },
    'market-vn30': {
        title: 'VN30',
        src: 'https://dchart.vndirect.com.vn/?theme=dark&symbol=VN30&disableSyncSymbol=true&timeframe=1'
    },
    'market-leader-lagger': {
        title: 'Leader - Lagger',
        src: 'https://mkw.vndirect.com.vn/leader_lagger?color=gray'
    },
    'market-pie': {
        title: 'Pie chart',
        src: 'https://mkw.vndirect.com.vn/market_cap?color=gray&height=280'
    }
};

function selectMarketChart(event) {
    const selected = event.target;
    console.log(selected);

    // Highlight selector
    document.querySelectorAll('#market-menu > li')
        .forEach(element => element.classList.remove('selected'));
    selected.classList.add('selected');

    // Change iframe
    const chartBox = document.getElementById('market-chart-box');
    const chartConfig = marketCharts[selected.id];
    chartBox.title = chartConfig.title;
    chartBox.src   = chartConfig.src;
}

function setupMarketCharts() {
    // Click handler must be fired on parent element (<li>) only, so useCapture is used.
    // But it currently doesn't work (reliably), so pointer-events (in market.css) has to be used instead.
    // TODO: Check why useCapture doesn't work.
    document.querySelectorAll('#market-menu > li').forEach(chartSelector =>
        chartSelector.addEventListener('click', selectMarketChart, true));    // There's <i> inside <li>
}


/********************************************************************************
 * History chart
 ********************************************************************************/

let priceStepTable = null;
let selectPriceStepTable = null;

let tradingHistoryTable = null;
let selectTradingHistoryTable = null;

/**
 * Concrete class for Price Step table.
 */
 class PriceStepTable extends Table {

    generateData() {
        const generateCell = () => [
            round(rand() * 100),
            rand() * 2000,
            rand() * 2000,
            round(rand() * 100),
        ]

        return Array.from({ length: rand() * 5 + 3 }, generateCell);
    }

    /**
     * Given data of a row, reformat it to render.
     *
     * @param rowData Data of a single row
     * @returns The formatted data
     */
    formatData(rowData) {
        rowData = [...rowData];

        // Quantity (Qty) fields
        rowData[0] = rowData[0].toString();
        rowData[3] = rowData[3].toString();

        // Price (Pr) fields
        rowData[1] = rowData[1].toFixed(1);
        rowData[2] = rowData[2].toFixed(1);

        return rowData;
    }

    renderRow(rowData) {
        const row = this.rowTemplate.content.cloneNode(true);
        rowData = this.formatData(rowData);

        for (let i = 0; i < rowData.length; i++) {
            const cell = row.querySelector(`td:nth-child(${i + 1})`);
            const cellData = rowData[i];

            cell.querySelector('span').textContent = cellData;

            if (i == 1 || i == 2) {
                const percentage = cellData / 20;    // cellData * 100 / 2000
                cell.querySelector('div').style.width = `${percentage}%`;
            }
        }

        this.tableBody.appendChild(row);
    }

}

class TradingHistoryTable extends Table {
    generateData() {
        const SECONDS_IN_DAY = 24 * 3600;

        let time = round(rand() * SECONDS_IN_DAY);
        const nextTime = () => {
            time += round(rand() * 3600);
            time %= SECONDS_IN_DAY;
            return time;
        }

        const generateCell = () => [
            nextTime(),
            rand() * 2000,
            rand() * 10,
            round(rand() * 100),
            round(rand() * 10000)
        ];

        return Array.from({ length: rand() * 5 }, generateCell);
    }

    formatData(rowData) {
        const secondToTime = timeInSecond => {
            const hour = floor(timeInSecond / 3600);
            timeInSecond -= hour * 3600;

            const minute = floor(timeInSecond / 60);
            timeInSecond -= minute * 60;

            const second = timeInSecond;

            return `${hour}:${minute}:${second}`;
        }

        rowData = [...rowData];

        rowData[0] = secondToTime(rowData[0]);
        rowData[1] = rowData[1].toFixed(1);
        rowData[2] = rowData[2].toFixed(2);
        rowData[3] = rowData[3].toString();
        rowData[4] = rowData[4].toString();

        return rowData;
    }

    renderRow(rowData) {
        const row = this.rowTemplate.content.cloneNode(true);
        rowData = this.formatData(rowData);

        for (let i = 0; i < rowData.length; i++) {
            row.querySelector(`td:nth-child(${i + 1})`).textContent = rowData[i];
        }

        this.tableBody.appendChild(row);
    }
}

function toggleHistoryPanelTables(event) {
    if (event.target.classList.contains('table-selected')) {
        return;
    }

    selectPriceStepTable.classList.toggle('table-selected');
    selectTradingHistoryTable.classList.toggle('table-selected');

    priceStepTable.toggle();
    tradingHistoryTable.toggle();
}

function setupHistoryPanel() {
    priceStepTable = new PriceStepTable(document.querySelector('#price-step-table'));
    selectPriceStepTable = document.querySelector('#price-step');
    selectPriceStepTable.onclick = toggleHistoryPanelTables;

    tradingHistoryTable = new TradingHistoryTable(document.querySelector('#trading-history-table'));
    selectTradingHistoryTable = document.querySelector('#trading-history');
    selectTradingHistoryTable.onclick = toggleHistoryPanelTables;
}


/********************************************************************************
 * Watchlist table
 ********************************************************************************/

function formatRelative(actual, reference) {
    const relative = actual * 100 / reference;
    return `${relative.toFixed(2)}%`;
}

class WatchListTable extends Table {
    constructor(tableElement) {
        super(tableElement);
        this.relativeDiff = false;
    }

    generateData() {
        const generateCell = () => [
            'VN30F2201', rand() * 2000, rand() * 10 - 5, rand() * 10 - 5, round(rand() * 1000)
        ]

        return Array.from({ length: rand() * 5 + 3 }, generateCell);
    }

    formatData(rowData) {
        rowData = [...rowData];

        rowData[1] = rowData[1].toFixed(1);
        rowData[2] = this.relativeDiff ?
            window.formatRelative(rowData[2], rowData[1]) : rowData[2].toFixed(1);
        rowData[3] = rowData[3].toFixed(1);

        return rowData;
    }

    renderRow(rowData) {
        const row = this.rowTemplate.content.cloneNode(true);
        const cell = cellNum => row.querySelector(`td:nth-child(${cellNum})`);    // 1-based cellNum

        const actualDiff = rowData[2];
        rowData = this.formatData(rowData);

        for (let i = 0; i < rowData.length; i++) {
            cell(i + 1).textContent = rowData[i];
        }

        // Update color to match value sign
        updateColorValue(cell(2));
        updateColorValue(cell(3));

        // Save actual diff to data-, so that subsequent changes in display style
        // can use this correct value, instead of the rounded display value.
        cell(3).dataset.actualDiff = actualDiff;

        this.tableBody.appendChild(row);

        function updateColorValue(element) {
            if (element.textContent.startsWith('-')) {
                element.classList.remove('positive');
                element.classList.add('negative');
            } else {
                element.classList.remove('negative');
                element.classList.add('positive');
            }
        }
    }

    toggleRelativeDiff() {
        this.relativeDiff = !this.relativeDiff;

        // Change the header
        const diffHead = this.table.querySelector('th:nth-child(3) > span');
        diffHead.textContent = this.relativeDiff ? '%' : '+/-';

        const rows = this.table.querySelectorAll('tbody > tr');
        rows.forEach(row => {
            let price = row.querySelector('td:nth-child(2)');
            price = parseFloat(price.textContent);
            const val = row.querySelector('td:nth-child(3)');

            if (this.relativeDiff) {
                val.textContent = window.formatRelative(parseFloat(val.textContent), price)
            } else {
                val.textContent = parseFloat(val.dataset.actualDiff).toFixed(1);
            }
        }, this);
    }
}

function setupWatchlistTable() {
    const watchListTable = new WatchListTable(document.getElementById('watchlist-table'));

    const toggleRelativeDiff = watchListTable.toggleRelativeDiff.bind(watchListTable);
    document.querySelector('i.fa-caret-left').onclick  = toggleRelativeDiff;
    document.querySelector('i.fa-caret-right').onclick = toggleRelativeDiff;
}


/********************************************************************************
 * Orderbook panel
 ********************************************************************************/

let selectIntraDayOrderTable = null;
let intradayOrderTable = null;

let selectConditionalOrderTable = null;
let conditionalOrderTable = null;

function toggleOrderbookPanelTables(event) {
    if (event.target.classList.contains('table-selected')) {
        return;
    }

    selectIntraDayOrderTable.classList.toggle('table-selected');
    selectConditionalOrderTable.classList.toggle('table-selected');

    intradayOrderTable.toggle();
    conditionalOrderTable.toggle();
}

function setupOrderbookPanel() {
    intradayOrderTable = new Table(document.getElementById('intraday-order-table'));
    selectIntraDayOrderTable = document.getElementById('day-order');
    selectIntraDayOrderTable.onclick = toggleOrderbookPanelTables;

    conditionalOrderTable = new Table(document.getElementById('conditional-order-table'));
    selectConditionalOrderTable = document.getElementById('conditional-order');
    selectConditionalOrderTable.onclick = toggleOrderbookPanelTables;
}


/********************************************************************************
 * Portfolio panel
 ********************************************************************************/

let selectOpenPositionsTable = null;
let openPositionsTable = null;

let selectClosingPositionsTable = null;
let closingPositionsTable = null;

function togglePortfolioPanelTables(event) {
    if (event.target.classList.contains('table-selected')) {
        return;
    }

    selectOpenPositionsTable.classList.toggle('table-selected');
    selectClosingPositionsTable.classList.toggle('table-selected');

    // TODO: change/remove toggle(), as it fails when there're more than 2 tables.
    openPositionsTable.toggle();
    closingPositionsTable.toggle();
}

function setupPortfolioPanel() {
    openPositionsTable = new Table(document.getElementById('open-positions-table'));
    selectOpenPositionsTable = document.getElementById('open-positions');
    selectOpenPositionsTable.onclick = togglePortfolioPanelTables;

    closingPositionsTable = new Table(document.getElementById('closing-positions-table'));
    selectClosingPositionsTable = document.getElementById('closing-positions');
    selectClosingPositionsTable.onclick = togglePortfolioPanelTables;
}


/********************************************************************************
 * Management panel
 ********************************************************************************/

const managementMenus = {
    'select-orderbook': {
        title: 'panel-title-orderbook',
        content: 'orderbook'
    },
    'select-portfolio': {
        title: 'panel-title-portfolio',
        content: 'portfolio'
    },
    'select-assets': {
        title: 'panel-title-assets',
        content: 'assets'
    }
}

function selectManagementPanels(event) {
    const selected = event.target;
    if (selected.classList.contains('selected')) {
        return;
    }

    document.querySelectorAll('footer > div')
        .forEach(menuItem => menuItem.classList.remove('selected'));
    selected.classList.add('selected');

    for (const [_, target] of Object.entries(managementMenus)) {
        hide(document.getElementById(target.title));
        hide(document.getElementById(target.content));
    }
    const titleID   = managementMenus[selected.id].title;
    show(document.getElementById(titleID));
    const contentID = managementMenus[selected.id].content;
    show(document.getElementById(contentID));
}

function hideCol3() {
    hide(document.getElementById('col3'));
    document.getElementById('market-menu').classList.add('col3-hidden');
    document.getElementById('watchlist').classList.add('col3-hidden');

    // Clear selected menu item
    document.querySelectorAll('footer > div')
        .forEach(menuItem => menuItem.classList.remove('selected'));
}

function showCol3() {
    show(document.getElementById('col3'));
    document.getElementById('market-menu').classList.remove('col3-hidden');
    document.getElementById('watchlist').classList.remove('col3-hidden');
}

function setupMinimizeCol3() {
    document.getElementById('panel-minimize').onclick = hideCol3;
    document.querySelectorAll('footer > div')
        .forEach(menuItem => menuItem.addEventListener('click', showCol3));
}

function setupManagementMenu() {    // The footer tabs
    document.querySelectorAll('footer > div')
        .forEach(menuItem => menuItem.onclick = selectManagementPanels);
}

function setupManagementPanel() {
    setupMinimizeCol3();
    setupOrderbookPanel();
    setupPortfolioPanel();
    setupManagementMenu();
}


/********************************************************************************
 * Place Order panel
 ********************************************************************************/

function preventReloadBuySell() {
    const prevent = event => event.preventDefault();
    document.querySelectorAll('#placeorder form')
        .forEach(form => form.addEventListener('submit', prevent));
}

/**
 * Given a change event of a radio for a form, toggle that form.
 *
 * @param {Event} radioEvent Change event of the radio
 */
function togglePlaceOrderForms(radioEvent) {
    const radio = radioEvent.target;
    const formID = `${radio.id}-form`;

    document.querySelectorAll(`form:not(#${formID})`).forEach(hide);
    show(document.getElementById(formID));
}

function setupPlaceOrderFormRadios() {
    document.getElementById('normal-order').onchange = togglePlaceOrderForms;
    document.getElementById('stop-order').onchange = togglePlaceOrderForms;
}

function setupPlaceOrderErrorBanner() {
    const banner = document.getElementById('error-banner');

    const hideErrorBanner = () => hide(banner);
    document.getElementById('normal-order').addEventListener('change', hideErrorBanner);
    document.getElementById('stop-order').addEventListener('change', hideErrorBanner);

    const showErrorBanner = () => show(banner);
    document.querySelector('label[for=trailing-order]').addEventListener('click', showErrorBanner);    // Radios are disabled anyway
    document.querySelector('label[for=oso-order]').addEventListener('click', showErrorBanner);         // So click handlers are on labels
    document.querySelectorAll('form').forEach(form => form.addEventListener('submit', showErrorBanner));
}

function setupPlaceOrderPanel() {
    preventReloadBuySell();
    setupPlaceOrderFormRadios();
    setupPlaceOrderErrorBanner();
}


/********************************************************************************
 * Main
 ********************************************************************************/

window.onload = () => {
    setupClock();
    setupMarketCharts();
    setupHistoryPanel();
    setupWatchlistTable();
    setupManagementPanel();
    setupPlaceOrderPanel();
}
