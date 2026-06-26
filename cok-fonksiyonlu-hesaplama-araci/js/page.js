(function () {
  "use strict";

  const app = window.CalculatorApp;
  const slug = document.body.dataset.calculator;
  const calculator = app.bySlug[slug];
  const container = document.getElementById("calculator-app");

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[char]));
  }

  function todayValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function fieldValue(field) {
    if (field.default === "today") return todayValue();
    if (field.value !== undefined) return field.value;
    return "";
  }

  function baseAttributes(field) {
    const attrs = [];
    if (field.required !== false) attrs.push("required");
    if (field.min !== undefined) attrs.push(`min="${escapeHTML(field.min)}"`);
    if (field.max !== undefined) attrs.push(`max="${escapeHTML(field.max)}"`);
    if (field.step !== undefined) attrs.push(`step="${escapeHTML(field.step)}"`);
    if (field.placeholder !== undefined) attrs.push(`placeholder="${escapeHTML(field.placeholder)}"`);
    return attrs.join(" ");
  }

  function renderField(field) {
    const id = `field-${field.name}`;
    const value = fieldValue(field);
    let control = "";

    if (field.type === "select") {
      const options = field.options.map((option) => {
        const selected = String(option.value) === String(value) ? "selected" : "";
        return `<option value="${escapeHTML(option.value)}" ${selected}>${escapeHTML(option.label)}</option>`;
      }).join("");
      control = `<select id="${id}" name="${escapeHTML(field.name)}" ${baseAttributes(field)}>${options}</select>`;
    } else if (field.type === "textarea") {
      control = `<textarea id="${id}" name="${escapeHTML(field.name)}" rows="6" ${baseAttributes(field)}>${escapeHTML(value)}</textarea>`;
    } else {
      const inputMode = field.type === "number" ? "inputmode=\"decimal\"" : "";
      control = `<input id="${id}" name="${escapeHTML(field.name)}" type="${escapeHTML(field.type)}" value="${escapeHTML(value)}" ${inputMode} ${baseAttributes(field)} />`;
    }

    return `
      <label class="form-field" for="${id}">
        <span>${escapeHTML(field.label)}</span>
        ${control}
        ${field.help ? `<small>${escapeHTML(field.help)}</small>` : ""}
      </label>
    `;
  }

  function readFormValues(form, fields) {
    const values = {};
    fields.forEach((field) => {
      const element = form.elements[field.name];
      if (!element) return;
      const raw = element.value;
      if (field.type === "number") {
        if (String(raw).trim() === "" && field.required === false) {
          values[field.name] = undefined;
        } else {
          values[field.name] = app.helpers.toNumber(raw, field.label);
        }
      } else {
        values[field.name] = raw;
      }
    });
    return values;
  }

  function renderResult(result) {
    const rows = result.rows.map((item) => `
      <div class="result-row">
        <span>${escapeHTML(item.label)}</span>
        <strong>${escapeHTML(item.value)}</strong>
      </div>
    `).join("");

    return `
      <section class="result-card success" aria-live="polite">
        <p class="eyebrow">${escapeHTML(result.title || "Sonuç")}</p>
        <h2>${escapeHTML(result.summary)}</h2>
        <div class="result-grid">${rows}</div>
        ${result.note ? `<p class="result-note">${escapeHTML(result.note)}</p>` : ""}
      </section>
    `;
  }

  function renderError(error) {
    return `
      <section class="result-card error" role="alert">
        <p class="eyebrow">Uyarı</p>
        <h2>${escapeHTML(error.message || "Bir hata oluştu.")}</h2>
      </section>
    `;
  }

  function renderOtherCalculators() {
    const links = app.calculators
      .filter((item) => item.slug !== calculator.slug)
      .slice(0, 6)
      .map((item) => `<a class="pill-link" href="${escapeHTML(item.slug)}.html">${escapeHTML(item.shortTitle)}</a>`)
      .join("");
    return links ? `<div class="related"><h2>Diğer hesaplamalar</h2><div class="pill-list">${links}</div></div>` : "";
  }

  if (!calculator) {
    container.innerHTML = `<section class="page-card"><h1>Hesaplama bulunamadı</h1><p>Aradığınız hesaplama sayfası mevcut değil.</p><a class="button" href="../index.html">Ana sayfaya dön</a></section>`;
    return;
  }

  document.title = `${calculator.title} | Çok Fonksiyonlu Hesaplama Aracı`;

  container.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">${calculator.order}. hesaplama</p>
      <h1>${escapeHTML(calculator.title)}</h1>
      <p>${escapeHTML(calculator.description)}</p>
    </section>

    <section class="calculator-layout">
      <form id="calc-form" class="calculator-form">
        ${calculator.fields.map(renderField).join("")}
        <div class="form-actions">
          <button class="button primary" type="submit">Hesapla</button>
          <button class="button ghost" type="reset">Temizle</button>
        </div>
      </form>
      <div id="result-area" class="result-area">
        <section class="result-card muted">
          <p class="eyebrow">Hazır</p>
          <h2>Bilgileri girip Hesapla butonuna basın.</h2>
          <p>Sonuçlar burada gösterilecek.</p>
        </section>
      </div>
    </section>

    ${renderOtherCalculators()}
  `;

  const form = document.getElementById("calc-form");
  const resultArea = document.getElementById("result-area");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const values = readFormValues(form, calculator.fields);
      const result = calculator.calculate(values);
      resultArea.innerHTML = renderResult(result);
    } catch (error) {
      resultArea.innerHTML = renderError(error);
    }
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      resultArea.innerHTML = `
        <section class="result-card muted">
          <p class="eyebrow">Hazır</p>
          <h2>Bilgileri girip Hesapla butonuna basın.</h2>
          <p>Sonuçlar burada gösterilecek.</p>
        </section>
      `;
    }, 0);
  });
})();
