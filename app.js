//Global variables
const axis = ['X', 'Y', null];
const averageTableColumns = 2;
let initXValue = 1;
const app = document.getElementById('app');
const graphContainerId = 'graphs';
const graphSize = 400;
let data = {
    first: [],
    second: [],
    average: [],
}

//Events
document.addEventListener('DOMContentLoaded', initApp);

//Init app
function initApp() {
    if (!data.first.length) {
        setInitCoordinates();
    }

    calculateAverageTableData();

    for (let tableId in data) {
        createTable(data[tableId], tableId);
    }

    //Add fill table button
    const button = document.createElement('button');
    button.innerText = 'Fill tables with new random data and render graphs';
    button.addEventListener('click', handleFillTablesValues);
    app.prepend(button);
}

//Features
function handleFillTablesValues() {
    setInitCoordinates();
    calculateAverageTableData();
    for (let tableId in data) {
        renderTable(tableId);
    }
    drawGraphs();
}

//Calculations
function calculateAverageTableData() {
    const firstTableData = data.first;
    const secondTableData = data.second;
    const averageTableLength = Math.min(firstTableData.length, secondTableData.length);
    data.average = [];
    for (let i = 0; i < averageTableLength; i++) {
        data.average = [...data.average,
            {
                x: (firstTableData[i].x + secondTableData[i].x) / 2,
                y: (firstTableData[i].y + secondTableData[i].y) / 2
            }
        ]
    }
}

//Table creation
function createRows(data, tableId) {
    // Закомментирован второй вариант как мы могли бы получать index и ось координаты
    // через добавление data-attribute
    const tBody = tableId.tBodies[0];
    data.forEach((coords, i) => {
        const row = document.createElement('tr');
        // row.dataset.index = i;
        for (let key in coords) {
            const cell = document.createElement('td');
            // cell.dataset.axis = key;
            const input = document.createElement('input');
            input.value = coords[key];
            if (tableId.id !== 'average') {
                input.addEventListener('blur', handleInputChange);
            } else {
                input.readOnly = true;
            }
            cell.appendChild(input);
            row.appendChild(cell);
        }
        // У третьей таблицы нет кнопки delete в строке, создаем кнопку только для первых двух таблиц
        if (tableId.id !== 'average') {
            const delButton = document.createElement('button');
            delButton.innerText = 'Delete';
            delButton.addEventListener('click', handleDelete);
            row.appendChild(delButton);
        }
        tBody.appendChild(row);
    });
}

function renderTable(tableId) {
    const table = document.getElementById(tableId);
    table.tBodies[0].innerHTML = '';
    createRows(data[tableId], table);
}

function createTable(data, tableId) {
    const table = document.createElement('table');
    table.id = tableId;
    table.createTHead();
    table.createTBody();
    table.createTFoot();
    const {tHead, tFoot} = table;

    insertNCells(tHead.insertRow(), tableId === 'average' ? averageTableColumns : Object.keys(data[0]).length + 1);
    fillTHeadWithAxisData(tHead.firstElementChild.children, axis);

    createRows(data, table);

    tFoot.insertRow().insertCell().colSpan = 3;
    const button = document.createElement('button');
    button.innerText = tableId === 'average' ? 'Calculate' : 'Add'
    button.addEventListener('click', tableId === 'average' ? handleCalculate : handleAddCoordinate);
    tFoot.firstElementChild.firstElementChild.appendChild(button);
    app.appendChild(table);
}

//Graphs
function drawGraphs() {
    // Если на странице уже отрендерены графики, то удаляем их и рендерим заново
    if (document.getElementById('graphs')) {
        document.getElementById('graphs').remove()
    }
    const graphContainer = document.createElement('div');
    graphContainer.id = graphContainerId;

    for (let id in data) {
        createCanvas(graphContainer, id, graphSize);
    }
    app.appendChild(graphContainer);
    for (let id in data) {
        renderGraph(id);
    }

}

function createCanvas(parentNode, id, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.id = id;
    parentNode.appendChild(canvas);
}

function renderGraph(id) {

    const canvas = document.querySelector(`canvas#${id}`);
    const c = canvas.getContext('2d');
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    const graphPadding = 20;
    const xPadding = graphPadding;
    const yPadding = graphPadding;
    const shrinkMultiplier = 0.9;
    const grayColor = '#bbb';
    const blackColor = '#000';
    const graphColor = 'red';
    const markWidth = canvasWidth - xPadding;
    const markHeight = 1;
    const xAxisTextOffsetY = 20;
    c.clearRect(0, 0, canvasWidth, canvasHeight);
    c.textAlign = "center";

    // Код не оптимален, писал максимально просто
    function getMaxValueOnAxis(values, axis) {
        let max = -10 ^ 9;
        for (const value of values) {
            if (value[axis] > max) {
                max = value[axis];
            }
        }
        max += 10 - max % 10;
        return max
    }

    function getMinValueOnAxis(values, axis) {
        let min = 10 ^ 9;
        for (const value of values) {
            if (value[axis] < min) {
                min = value[axis];
            }
        }
        min -= 10 + min % 10;
        return min;
    }

    c.fillStyle = grayColor;

    //Text and marks along axis
    //X AXIS
    // Не до конца реализованная адаптивность оси для больших значений
    const axisStepX = getMaxValueOnAxis(data[id], 'x') > 200 ? 100 : 10;

    // Функция вычисления координаты Х canvas в Декартову.
    // shrinkMultiplier нужен, чтобы график не "упирался" в край
    function calcX(value) {
        const offset = Math.floor(getMaxValueOnAxis(data[id], 'x') / axisStepX);
        const finalCoords = ((canvasWidth - xPadding) / offset * value / axisStepX + xPadding) * shrinkMultiplier;
        return finalCoords;
    }

    for (let i = 0; i <= getMaxValueOnAxis(data[id], 'x'); i += axisStepX) {
        c.fillStyle = blackColor;
        //Рисуем черную главную ось и черные надписи
        if (i === 0) {
            c.fillRect(xPadding, 0, 2, canvasHeight - yPadding);
        }
        c.fillText(String(i), calcX(i), canvasHeight - yPadding + xAxisTextOffsetY);
        // Рисуем серым цветом промежуточные оси
        c.fillStyle = grayColor;
        if (i > 0) {
            c.fillRect(calcX(i), canvasHeight - yPadding - markWidth, markHeight, markWidth);
        }
    }

    // Y AXIS
    // По аналогии с осью Х делаем для оси Y.
    c.textAlign = "right"
    c.textBaseline = "middle";

    const axisStepY = getMaxValueOnAxis(data[id], 'y') > 200 ? 100 : 10;

    function calcY(value) {
        const marksQty = (Math.abs(getMaxValueOnAxis(data[id], 'y')) + Math.abs(getMinValueOnAxis(data[id], 'y'))) / axisStepY;
        const offset = (canvasHeight - yPadding) / marksQty / axisStepY * shrinkMultiplier;
        const finalCoords = canvasHeight - yPadding - value * offset + getMinValueOnAxis(data[id], 'y') * offset;
        return finalCoords;
    }

    for (let i = getMinValueOnAxis(data[id], 'y'); i <= getMaxValueOnAxis(data[id], 'y'); i += axisStepY) {
        c.fillStyle = blackColor;
        if (i === 0) {
            c.fillRect(xPadding - 2, calcY(i), markWidth, 2);
        }
        c.fillText(String(i), xPadding - 2, calcY(i) + 2);
        c.fillStyle = grayColor;
        c.fillRect(xPadding - 2, calcY(i), markWidth, markHeight);
    }

    // Draw graph

    c.lineWidth = 2;
    c.strokeStyle = graphColor;
    // Перемещаем "курсор" в координаты первой точки
    c.moveTo(
        calcX(data[id][0].x),
        calcY(data[id][0].y)
    );

    c.fillStyle = blackColor;
    // В цикле проходим далее по координатам
    for (let i = 1; i < data[id].length; i++) {
        c.lineTo(
            calcX(data[id][i].x),
            calcY(data[id][i].y)
        );

    }
    // Отображаем линию
    c.stroke();

    c.textAlign = "center"
    c.textBaseline = "bottom";
    // Добавляем около точек точные координаты. Отдельным циклом, чтобы надпись была "над" линией и читалась.
    for (let i = 0; i < data[id].length; i++) {
        c.fillText(`(${data[id][i].x}, ${data[id][i].y})`, calcX(data[id][i].x), calcY(data[id][i].y) - 10);
    }
}
// Graph helpers
function setRandomYValue() {
    return Math.ceil(Math.random() * (100 + 50)) - 50;
}

function setRandomXValue() {
    return Math.ceil(Math.random() * 10);
}

function fillCoordinates(id) {
    data[id] = [];
    for (let i = 0; i < Math.ceil(Math.random() * (10 - 2)) + 2; i++) {
        data[id] = [...data[id], {
            x: initXValue + setRandomXValue(),
            y: setRandomYValue(),
        }];

        initXValue = data[id][i].x;
    }
    initXValue = 1;

}

function setInitCoordinates() {
    for (let id in data) {
        if (id !== 'average') {
            fillCoordinates(id);
        }
    }
}

//Handlers
function handleDelete(e) {
    const button = e.target;
    const tableId = button.closest('table').id;
    const index = [...button.closest('tbody').children].indexOf(button.closest('tr'));
    button.removeEventListener('click', handleDelete)
    removeCoordsFromDataTable(data, tableId, index);
    renderTable(tableId);
}

function handleAddCoordinate(e) {
    const tableId = e.target.closest('table').id;
    data[tableId] = [...data[tableId], {x: 0, y: 0}];
    renderTable(tableId);
}

function handleInputChange(e) {
    // Закомментирован второй вариант к значениям индекса и оси координаты.
    const tableId = e.target.closest('table').id;
    // const index = e.target.closest('tr').dataset.index;
    const index = [...e.target.closest('tbody').children].indexOf(e.target.closest('tr'));
    // const axis = e.target.parentElement.dataset.axis;
    const axis = e.target.closest('td').cellIndex;
    const newValue = Number(e.target.value);
    if (validateInputValue(newValue)) {
        updateDataInTable(data, tableId, index, axis, newValue);
    } else {
        alert('Only numbers')
    }
    renderTable(tableId);
}

function handleCalculate(e) {
    const tableId = e.target.closest('table').id;
    calculateAverageTableData();
    renderTable(tableId);
    drawGraphs();
}

//Helpers
function validateInputValue(value) {
    return !isNaN(value);
}

function insertNCells(node, n) {
    for (let i = 0; i < n; i++) {
        if (node) {
            node.insertCell();
        }
    }
}

function fillTHeadWithAxisData(node, data) {
    if (node) {
        [...node].forEach((el, i) => {
            el.innerText = data[i];
        })
    }
}

function removeCoordsFromDataTable(data, tableId, index) {
    data[tableId] = data[tableId].filter((_, i) => i !== index);
}

function updateDataInTable(
    data = {},
    tableId = '',
    index = 0,
    axis = 0,
    newValue = 0
) {
    data[tableId][index][axis === 0 ? 'x' : 'y'] = newValue;
}