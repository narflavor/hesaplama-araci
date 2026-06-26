(function () {
  "use strict";

  const app = window.CalculatorApp;
  const output = document.getElementById("test-output");
  const summary = document.getElementById("test-summary");
  const runButton = document.getElementById("run-tests");

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[char]));
  }

  function runTests() {
    const startedAt = performance.now();
    const rows = [];

    app.calculators.forEach((calculator) => {
      (calculator.tests || []).forEach((test) => {
        const testStart = performance.now();
        try {
          const result = calculator.calculate(test.input);
          const passed = Boolean(test.assert(result, app.helpers));
          rows.push({
            calculator: calculator.title,
            test: test.name,
            status: passed ? "Geçti" : "Kaldı",
            duration: performance.now() - testStart,
            message: passed ? "" : "Beklenen değer elde edilemedi."
          });
        } catch (error) {
          rows.push({
            calculator: calculator.title,
            test: test.name,
            status: "Kaldı",
            duration: performance.now() - testStart,
            message: error.message
          });
        }
      });
    });

    const duration = performance.now() - startedAt;
    const passedCount = rows.filter((row) => row.status === "Geçti").length;
    const failedCount = rows.length - passedCount;

    summary.innerHTML = `
      <div class="test-summary ${failedCount === 0 ? "success" : "error"}">
        <strong>${passedCount}/${rows.length} test geçti.</strong>
        <span>Toplam süre: ${duration.toFixed(2)} ms</span>
      </div>
    `;

    output.innerHTML = `
      <table class="test-table">
        <thead>
          <tr>
            <th>Hesaplama</th>
            <th>Test</th>
            <th>Durum</th>
            <th>Süre</th>
            <th>Mesaj</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr class="${row.status === "Geçti" ? "passed" : "failed"}">
              <td>${escapeHTML(row.calculator)}</td>
              <td>${escapeHTML(row.test)}</td>
              <td>${escapeHTML(row.status)}</td>
              <td>${row.duration.toFixed(3)} ms</td>
              <td>${escapeHTML(row.message)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  runButton.addEventListener("click", runTests);
  runTests();
})();
