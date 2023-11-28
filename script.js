const state = {
  price: {
    min: 350000,
    max: 100000000,
    value: 3000000,
    step: 50000,
    error: false,
    textValue: formattedValue(3000000),
  },
  "initial-fee": {
    min: 0,
    max: 3000000,
    value: 500000,
    step: 10000,
    error: false,
    textValue: formattedValue(500000),
  },
  "credit-term": {
    min: 1,
    max: 30,
    value: 20,
    step: 1,
    error: false,
    textValue: formattedValue(20),
  },
  percent: {
    min: 0.1,
    max: 30,
    value: 7.3,
    step: 0.1,
    error: false,
    textValue: formattedValue(7.3),
  },
};

function formattedValue(num) {
  return Intl.NumberFormat("ru-RU").format(num.toFixed(2));
}

function unformattedValue(str) {
  return parseFloat(str.replaceAll(" ", "").replace(",", "."));
}

function setRangeBackground(input) {
  input.style.backgroundSize =
    ((input.value - input.min) * 100) / (input.max - input.min) + "% 100%";
}

function getPaymentInfo() {
  const credit = state["price"].value - state["initial-fee"].value;
  const P = state["percent"].value / 100 / 12;
  const monthsCount = state["credit-term"].value * 12;
  const monthlyPayment = credit * (P + P / ((1 + P) ** monthsCount - 1));
  const percentCredit = monthlyPayment * monthsCount;
  const percentSum = percentCredit - credit;
  const income = (monthlyPayment * 100) / 60;
  const tableData = [];
  const startDate = new Date();
  let percentPart = credit * P;
  let creditLeft = credit;
  for (let i = 0; i < monthsCount; i++) {
    const date = new Date();
    date.setDate(startDate.getDate() + i);
    const debtPart = monthlyPayment - percentPart;
    tableData.push({
      num: i + 1,
      date,
      creditLeft,
      percentPart,
      debtPart,
      payment: monthlyPayment,
    });
    creditLeft -= debtPart;
    percentPart = creditLeft * P;
  }
  return {
    credit,
    monthlyPayment,
    percentCredit,
    percentSum,
    income,
    tableData,
  };
}

function updateState() {
  for (const dataField in state) {
    const numberInput = document.querySelector(
      `input[data-field="${dataField}"][type="text"]`
    );
    const rangeInput = document.querySelector(
      `input[data-field="${dataField}"][type="range"]`
    );
    numberInput.value = state[dataField].textValue;
    if (state[dataField].error) {
      numberInput.parentElement.classList.add("error");
    } else {
      numberInput.parentElement.classList.remove("error");
    }
    rangeInput.min = state[dataField].min;
    rangeInput.max = state[dataField].max;
    rangeInput.step = state[dataField].step;
    rangeInput.value = state[dataField].value;
    setRangeBackground(rangeInput);
  }

  if (!Object.values(state).some((obj) => obj.error)) {
    const monthlyPaymentElement = document.querySelector(
      ".monthly-payment__sum .value"
    );
    const creditElement = document.querySelector(".payment__sum.credit .value");
    const percentElement = document.querySelector(
      ".payment__sum.percent .value"
    );
    const percentCreditElement = document.querySelector(
      ".payment__sum.percent_credit .value"
    );
    const incomeElement = document.querySelector(".payment__sum.income .value");

    const { credit, monthlyPayment, percentCredit, percentSum, income } =
      getPaymentInfo();

    monthlyPaymentElement.textContent = formattedValue(
      Math.round(monthlyPayment)
    );
    creditElement.textContent = formattedValue(Math.round(credit));
    percentElement.textContent = formattedValue(Math.round(percentSum));
    percentCreditElement.textContent = formattedValue(
      Math.round(percentCredit)
    );
    incomeElement.textContent = formattedValue(Math.round(income));
  }
}

function handleInputChange(e) {
  const dataField = e.target.dataset.field;
  let value = unformattedValue(e.target.value);
  const min = Number(state[dataField].min);
  const max = Number(state[dataField].max);

  document.querySelector(".payments").classList.add("hidden");

  if (e.target.nodeName === "BUTTON" && dataField === "initial-fee") {
    value = parseInt((value * state.price.value) / 100);
  }

  if (e.target.value === "") {
    state[dataField].error = true;
    state[dataField].value = min;
    state[dataField].textValue = "";
    updateState();
    return;
  } else if (value < min) {
    state[dataField].textValue = formattedValue(value);
    state[dataField].error = true;
    state[dataField].value = min;
    updateState();
    return;
  } else if (value > max) {
    value = max;
  } else if (isNaN(value)) {
    value = state[dataField].value;
  }
  state[dataField].error = false;
  state[dataField].textValue = formattedValue(value);
  state[dataField].value = value;

  if (dataField === "price") {
    const coeff = 0.1;
    const feeValue = Math.round(coeff * value);
    state["initial-fee"].max = value;
    state["initial-fee"].value = feeValue;
    state["initial-fee"].textValue = formattedValue(feeValue);
    state["initial-fee"].error = false;
  }

  updateState();
}

function showPaymentsTable() {
  const body = document.querySelector("tbody");
  const tfootRow = document.querySelector("tfoot tr");
  const { tableData, credit, percentCredit, percentSum } = getPaymentInfo();

  while (body.firstChild) {
    body.removeChild(body.lastChild);
  }

  for (const {
    num,
    date,
    creditLeft,
    percentPart,
    debtPart,
    payment,
  } of tableData) {
    const row = document.createElement("tr");
    for (const val of [
      num,
      date.toISOString().split("T")[0].split("-").reverse().join("."),
      formattedValue(creditLeft),
      formattedValue(percentPart),
      formattedValue(debtPart),
      formattedValue(payment),
    ]) {
      const td = document.createElement("td");
      td.textContent = val;
      row.appendChild(td);
    }
    body.append(row);
  }

  tfootRow.children[1].textContent = formattedValue(Math.round(credit));
  tfootRow.children[2].textContent = formattedValue(Math.round(percentSum));
  tfootRow.children[3].textContent = formattedValue(Math.round(percentCredit));

  document.querySelector(".payments").classList.remove("hidden");
}

function init() {
  const rangeInputs = document.querySelectorAll('input[type="range"]');
  const numberInputs = document.querySelectorAll('input[type="text"]');
  const buttonInputs = document.querySelectorAll("button.option");
  const submitButton = document.querySelector(".button-submit");

  updateState();

  buttonInputs.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      handleInputChange(e);
    });
  });

  submitButton.addEventListener("click", (e) => {
    e.preventDefault();
    showPaymentsTable();
  });

  [...rangeInputs, ...numberInputs].forEach((input) => {
    input.addEventListener("input", handleInputChange);
  });
}

init();
