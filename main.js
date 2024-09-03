const config = require('./config');


window.onload = function () {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("end-date").value = today;
  updateDefaultCAGR();
  setInterval(updateDefaultCAGR, 60000); // 每分钟更新一次
};

async function fetchStockData(symbol) {
  let url = "";

  if (symbol === "BTC-USD") {
    url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=BTC&market=EUR&apikey=demo`;
  } else {
    url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&outputsize=full&apikey=demo`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

function findClosestDate(data, targetDate) {
  const dates = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));
  let closestDate = dates[0];
  dates.forEach((date) => {
    if (new Date(date) <= new Date(targetDate)) {
      closestDate = date;
    }
  });
  return closestDate;
}

async function calculateCAGR(symbol, startDate, endDate) {
  const data = await fetchStockData(symbol);

  if (!data) {
    console.error("Unable to fetch data.");
    return null;
  }

  let startValue, endValue, closestStartDate, closestEndDate, timeSeries;

  if (symbol === "BTC-USD") {
    timeSeries = data["Time Series (Digital Currency Daily)"];
    closestStartDate = findClosestDate(timeSeries, startDate);
    closestEndDate = findClosestDate(timeSeries, endDate);
    startValue = timeSeries[closestStartDate]["4a. close (USD)"];
    endValue = timeSeries[closestEndDate]["4a. close (USD)"];
  } else {
    timeSeries = data["Time Series (Daily)"];
    closestStartDate = findClosestDate(timeSeries, startDate);
    closestEndDate = findClosestDate(timeSeries, endDate);
    startValue = timeSeries[closestStartDate]["4. close"];
    endValue = timeSeries[closestEndDate]["4. close"];
  }

  if (!startValue || !endValue) {
    return null;
  }

  const years =
    (new Date(closestEndDate) - new Date(closestStartDate)) /
    (1000 * 60 * 60 * 24 * 365.25);
  const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;

  return {
    startDate: closestStartDate,
    endDate: closestEndDate,
    cagr: cagr.toFixed(2) + "%",
  };
}

async function updateDefaultCAGR() {
  const symbols = ["BTC-USD", "BRK-A", "NDXKX"];
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  for (const symbol of symbols) {
    const result = await calculateCAGR(symbol, startDate, endDate);
    if (result) {
      document.getElementById(`${symbol}-start-date`).innerText =
        result.startDate;
      document.getElementById(`${symbol}-end-date`).innerText = result.endDate;
      document.getElementById(`${symbol}-cagr`).innerText = result.cagr;
    }
  }
}

async function updateCAGR() {
  await updateDefaultCAGR(); // 更新默认的三项数据

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const tableBody = document
    .getElementById("cagr-table")
    .getElementsByTagName("tbody")[0];

  // 清空已存在的自定义数据行，仅保留表头和默认数据行
  while (tableBody.rows.length > 3) {
    tableBody.deleteRow(-1);
  }

  const customSymbol = document.getElementById("symbol").value;
  const customResult = await calculateCAGR(customSymbol, startDate, endDate);
  if (customResult) {
    addCustomRow(
      tableBody,
      customSymbol,
      customResult.startDate,
      customResult.endDate,
      customResult.cagr
    );
  }
}

function addCustomRow(tableBody, symbol, startDate, endDate, cagr) {
  const newRow = tableBody.insertRow();

  const symbolCell = newRow.insertCell(0);
  const startDateCell = newRow.insertCell(1);
  const endDateCell = newRow.insertCell(2);
  const cagrCell = newRow.insertCell(3);

  symbolCell.innerText = symbol;
  startDateCell.innerText = startDate;
  endDateCell.innerText = endDate;
  cagrCell.innerText = cagr;
}
