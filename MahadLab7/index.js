const display = document.querySelector("#display");
const pageTitle = document.querySelector("#page-title");
const menuToggle = document.querySelector("#menu-toggle");
const menuOptions = document.querySelector("#menu-options");
const views = {
  calculator: document.querySelector("#calculator-view"),
  unit: document.querySelector("#unit-view"),
  currency: document.querySelector("#currency-view"),
};

let currentInput = "0";
let storedValue = null;
let pendingOperator = null;
let replaceInput = false;

function updateDisplay() {
  display.textContent = currentInput;
}

function enterDigit(digit) {
  if (replaceInput || currentInput === "Error") {
    currentInput = digit;
    replaceInput = false;
  } else if (currentInput === "0") {
    currentInput = digit;
  } else if (currentInput.length < 16) {
    currentInput += digit;
  }
  updateDisplay();
}

function enterDecimal() {
  if (replaceInput || currentInput === "Error") {
    currentInput = "0";
    replaceInput = false;
  }
  if (!currentInput.includes(".")) currentInput += ".";
  updateDisplay();
}

function calculate(left, right, operator) {
  switch (operator) {
    case "+": return left + right;
    case "−": return left - right;
    case "×": return left * right;
    case "÷": return right === 0 ? null : left / right;
    default: return right;
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  return String(Number(value.toPrecision(12)));
}

function chooseOperator(operator) {
  const value = Number(currentInput);
  if (pendingOperator && !replaceInput) {
    const result = calculate(storedValue, value, pendingOperator);
    if (result === null) {
      currentInput = "Error";
      storedValue = null;
      pendingOperator = null;
      replaceInput = true;
      updateDisplay();
      return;
    }
    currentInput = formatNumber(result);
  }
  storedValue = Number(currentInput);
  pendingOperator = operator;
  replaceInput = true;
  updateDisplay();
}

function showResult() {
  if (!pendingOperator || storedValue === null) return;
  const result = calculate(storedValue, Number(currentInput), pendingOperator);
  currentInput = result === null ? "Error" : formatNumber(result);
  storedValue = null;
  pendingOperator = null;
  replaceInput = true;
  updateDisplay();
}

function clearCalculator() {
  currentInput = "0";
  storedValue = null;
  pendingOperator = null;
  replaceInput = false;
  updateDisplay();
}

document.querySelector(".keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.digit !== undefined) enterDigit(button.dataset.digit);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action === "decimal") enterDecimal();
  if (button.dataset.action === "equals") showResult();
  if (button.dataset.action === "clear") clearCalculator();
  if (button.dataset.action === "delete") {
    if (replaceInput || currentInput === "Error") {
      currentInput = "0";
      replaceInput = false;
    } else {
      currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
    }
    updateDisplay();
  }
});

document.addEventListener("keydown", (event) => {
  if (!views.calculator.hidden) {
    if (/^\d$/.test(event.key)) enterDigit(event.key);
    else if (event.key === ".") enterDecimal();
    else if (event.key === "Enter" || event.key === "=") showResult();
    else if (event.key === "Escape") clearCalculator();
    else if (event.key === "Backspace") {
      currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
      updateDisplay();
    } else if (event.key === "+" || event.key === "-") chooseOperator(event.key === "-" ? "−" : "+");
    else if (event.key === "*") chooseOperator("×");
    else if (event.key === "/") {
      event.preventDefault();
      chooseOperator("÷");
    }
  }
});

function closeMenu() {
  menuOptions.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
  menuOptions.hidden = !menuOptions.hidden;
  menuToggle.setAttribute("aria-expanded", String(!menuOptions.hidden));
});

menuOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  const selectedView = button.dataset.view;
  Object.entries(views).forEach(([name, section]) => {
    section.hidden = name !== selectedView;
  });
  pageTitle.textContent = {
    calculator: "Calculator",
    unit: "Unit Conversion",
    currency: "Currency Conversion",
  }[selectedView];
  closeMenu();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".menu")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

const unitDefinitions = {
  length: {
    meter: { label: "Meters", factor: 1 },
    kilometer: { label: "Kilometers", factor: 1000 },
    centimeter: { label: "Centimeters", factor: 0.01 },
    mile: { label: "Miles", factor: 1609.344 },
    foot: { label: "Feet", factor: 0.3048 },
  },
  weight: {
    kilogram: { label: "Kilograms", factor: 1 },
    gram: { label: "Grams", factor: 0.001 },
    pound: { label: "Pounds", factor: 0.45359237 },
    ounce: { label: "Ounces", factor: 0.028349523125 },
  },
  temperature: {
    celsius: { label: "Celsius" },
    fahrenheit: { label: "Fahrenheit" },
    kelvin: { label: "Kelvin" },
  },
};

const unitCategory = document.querySelector("#unit-category");
const unitFrom = document.querySelector("#unit-from");
const unitTo = document.querySelector("#unit-to");
const unitValue = document.querySelector("#unit-value");
const unitResult = document.querySelector("#unit-result");

function populateUnits() {
  const units = unitDefinitions[unitCategory.value];
  [unitFrom, unitTo].forEach((select) => {
    select.replaceChildren(...Object.entries(units).map(([value, unit]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = unit.label;
      return option;
    }));
  });
  unitTo.selectedIndex = Math.min(1, unitTo.options.length - 1);
  convertUnits();
}

function convertTemperature(value, from, to) {
  const asCelsius = from === "fahrenheit" ? (value - 32) * 5 / 9
    : from === "kelvin" ? value - 273.15 : value;
  return to === "fahrenheit" ? asCelsius * 9 / 5 + 32
    : to === "kelvin" ? asCelsius + 273.15 : asCelsius;
}

function convertUnits() {
  const value = Number(unitValue.value);
  if (unitValue.value.trim() === "" || !Number.isFinite(value)) {
    unitResult.value = "";
    return;
  }
  const from = unitFrom.value;
  const to = unitTo.value;
  const converted = unitCategory.value === "temperature"
    ? convertTemperature(value, from, to)
    : value * unitDefinitions[unitCategory.value][from].factor
      / unitDefinitions[unitCategory.value][to].factor;
  unitResult.value = formatNumber(converted);
  document.querySelector("#unit-note").textContent =
    `${formatNumber(value)} ${unitDefinitions[unitCategory.value][from].label} = ${formatNumber(converted)} ${unitDefinitions[unitCategory.value][to].label}`;
}

unitCategory.addEventListener("change", populateUnits);
[unitFrom, unitTo, unitValue].forEach((element) => element.addEventListener("input", convertUnits));
[unitFrom, unitTo].forEach((element) => element.addEventListener("change", convertUnits));
populateUnits();

const currencyRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  PKR: 278.5,
  INR: 83.1,
  JPY: 150.2,
};
const currencyFrom = document.querySelector("#currency-from");
const currencyTo = document.querySelector("#currency-to");
const currencyValue = document.querySelector("#currency-value");
const currencyResult = document.querySelector("#currency-result");

Object.keys(currencyRates).forEach((currency) => {
  [currencyFrom, currencyTo].forEach((select) => {
    const option = document.createElement("option");
    option.value = currency;
    option.textContent = currency;
    select.append(option);
  });
});
currencyTo.value = "EUR";

function convertCurrency() {
  const value = Number(currencyValue.value);
  if (currencyValue.value.trim() === "" || !Number.isFinite(value)) {
    currencyResult.value = "";
    return;
  }
  const converted = value / currencyRates[currencyFrom.value] * currencyRates[currencyTo.value];
  currencyResult.value = formatNumber(converted);
}

[currencyFrom, currencyTo, currencyValue].forEach((element) => {
  element.addEventListener("input", convertCurrency);
  element.addEventListener("change", convertCurrency);
});
convertCurrency();