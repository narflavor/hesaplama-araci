(function () {
  "use strict";

  const app = window.CalculatorApp;
  const list = document.getElementById("calculator-list");
  const search = document.getElementById("calculator-search");
  const count = document.getElementById("calculator-count");

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[char]));
  }

  function render(query = "") {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    const filtered = app.calculators.filter((calculator) => {
      const haystack = `${calculator.title} ${calculator.shortTitle} ${calculator.description}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(normalized);
    });

    count.textContent = `${filtered.length} hesaplama gösteriliyor`;
    list.innerHTML = filtered.map((calculator) => `
      <a class="calculator-card" href="hesaplamalar/${escapeHTML(calculator.slug)}.html">
        <span class="card-number">${calculator.order}</span>
        <h2>${escapeHTML(calculator.title)}</h2>
        <p>${escapeHTML(calculator.description)}</p>
      </a>
    `).join("") || `<p class="empty-state">Bu aramayla eşleşen hesaplama bulunamadı.</p>`;
  }

  search.addEventListener("input", () => render(search.value));
  render();
})();
