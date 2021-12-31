const rand = Math.random;
const round = Math.round;
const floor = Math.floor;

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
        if (this.visible()) {
            this.table.style.display = 'none';
        } else {
            this.table.style.display = 'table';
        }

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

        return Array.from({ length: rand() * 20 + 3 }, generateCell);
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

        return Array.from({ length: rand() * 20 }, generateCell);
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

function toggleTable(event) {
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
    selectPriceStepTable.onclick = toggleTable;

    tradingHistoryTable = new TradingHistoryTable(document.querySelector('#trading-history-table'));
    selectTradingHistoryTable = document.querySelector('#trading-history');
    selectTradingHistoryTable.onclick = toggleTable;
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
        cell(2).dataset.actualDiff = actualDiff;

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
 * Main
 ********************************************************************************/

window.onload = () => {
    setupHistoryPanel();
    setupWatchlistTable();
}
