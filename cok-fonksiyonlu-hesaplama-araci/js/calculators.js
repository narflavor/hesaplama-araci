(function (global) {
  "use strict";

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function toNumber(value, label = "Değer") {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error(`${label} geçerli bir sayı olmalıdır.`);
      return value;
    }
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new Error(`${label} alanını doldurun.`);
    }
    const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");
    const number = Number(normalized);
    if (!Number.isFinite(number)) throw new Error(`${label} geçerli bir sayı olmalıdır.`);
    return number;
  }

  function ensurePositive(value, label) {
    const number = toNumber(value, label);
    if (number <= 0) throw new Error(`${label} 0'dan büyük olmalıdır.`);
    return number;
  }

  function ensureNonNegative(value, label) {
    const number = toNumber(value, label);
    if (number < 0) throw new Error(`${label} negatif olamaz.`);
    return number;
  }

  function ensurePercentRange(value, label, min = 0, max = 100) {
    const number = toNumber(value, label);
    if (number < min || number > max) throw new Error(`${label} ${min} ile ${max} arasında olmalıdır.`);
    return number;
  }

  function formatNumber(value, maxDigits = 2) {
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: maxDigits }).format(value);
  }

  function formatFixed(value, digits = 2) {
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  }

  function money(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function parseDateLocal(value, label = "Tarih") {
    if (!value) throw new Error(`${label} alanını seçin.`);
    const parts = String(value).split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
      throw new Error(`${label} geçerli bir tarih olmalıdır.`);
    }
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new Error(`${label} geçerli bir tarih olmalıdır.`);
    }
    return date;
  }

  function dateToUTC(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function daysBetween(start, end) {
    return Math.round((dateToUTC(end) - dateToUTC(start)) / MS_PER_DAY);
  }

  function ageBetween(birthDate, targetDate) {
    if (targetDate < birthDate) throw new Error("Hedef tarih doğum tarihinden önce olamaz.");
    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const previousMonthLastDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).getDate();
      days += previousMonthLastDay;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return { years, months, days, totalDays: daysBetween(birthDate, targetDate) };
  }

  function row(label, value) {
    return { label, value: String(value) };
  }

  function okResult(summary, rows, note = "") {
    return { title: "Sonuç", summary, rows, note };
  }

  function approx(actual, expected, tolerance = 0.01) {
    return Math.abs(actual - expected) <= tolerance;
  }

  function isSame(actual, expected) {
    return actual === expected;
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return "Zayıf";
    if (bmi < 25) return "Normal kilo";
    if (bmi < 30) return "Fazla kilolu";
    return "Obezite aralığı";
  }

  function parseGradeLines(text) {
    if (!text || !String(text).trim()) throw new Error("En az bir not ve kredi satırı girin.");
    const lines = String(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const items = lines.map((line, index) => {
      const parts = line.split(/[;,\s]+/).filter(Boolean);
      if (parts.length < 2) throw new Error(`${index + 1}. satır için not ve kredi girin. Örnek: 85,3`);
      const grade = toNumber(parts[0], `${index + 1}. satır notu`);
      const credit = toNumber(parts[1], `${index + 1}. satır kredisi`);
      if (grade < 0 || grade > 100) throw new Error(`${index + 1}. satır notu 0 ile 100 arasında olmalıdır.`);
      if (credit <= 0) throw new Error(`${index + 1}. satır kredisi 0'dan büyük olmalıdır.`);
      return { grade, credit };
    });
    return items;
  }

  function gradeLetter(average) {
    if (average >= 90) return "AA";
    if (average >= 85) return "BA";
    if (average >= 80) return "BB";
    if (average >= 75) return "CB";
    if (average >= 70) return "CC";
    if (average >= 60) return "DC";
    if (average >= 50) return "DD";
    return "FF";
  }

  const lengthFactorsToMeter = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    mi: 1609.344
  };

  const lengthLabels = {
    mm: "Milimetre",
    cm: "Santimetre",
    m: "Metre",
    km: "Kilometre",
    in: "İnç",
    ft: "Feet",
    mi: "Mil"
  };

  const weightFactorsToKg = {
    mg: 0.000001,
    g: 0.001,
    kg: 1,
    ton: 1000,
    lb: 0.45359237,
    oz: 0.028349523125
  };

  const weightLabels = {
    mg: "Miligram",
    g: "Gram",
    kg: "Kilogram",
    ton: "Ton",
    lb: "Pound",
    oz: "Ons"
  };

  const calculatorDefinitions = [
    {
      slug: "vucut-kitle-indeksi",
      title: "Vücut Kitle İndeksi Hesaplama",
      shortTitle: "VKİ",
      description: "Boy ve kiloya göre vücut kitle indeksini hesaplar.",
      fields: [
        { name: "weight", label: "Kilo (kg)", type: "number", min: "1", step: "0.1", placeholder: "70" },
        { name: "heightCm", label: "Boy (cm)", type: "number", min: "1", step: "0.1", placeholder: "175" }
      ],
      calculate(input) {
        const weight = ensurePositive(input.weight, "Kilo");
        const heightM = ensurePositive(input.heightCm, "Boy") / 100;
        const bmi = weight / (heightM * heightM);
        return {
          ...okResult(
            `Vücut kitle indeksiniz ${formatFixed(bmi, 2)} olarak hesaplandı.`,
            [row("VKİ", formatFixed(bmi, 2)), row("Değerlendirme", bmiCategory(bmi))],
            "Bu sonuç bilgilendirme amaçlıdır; tıbbi değerlendirme yerine geçmez."
          ),
          numeric: { bmi }
        };
      },
      tests: [
        { name: "70 kg ve 175 cm için VKİ 22,86", input: { weight: 70, heightCm: 175 }, assert: (result, h) => h.approx(result.numeric.bmi, 22.8571, 0.001) }
      ]
    },
    {
      slug: "yas-hesaplama",
      title: "Yaş Hesaplama",
      shortTitle: "Yaş",
      description: "Doğum tarihinden seçilen tarihe kadar geçen yaşı hesaplar.",
      fields: [
        { name: "birthDate", label: "Doğum tarihi", type: "date" },
        { name: "targetDate", label: "Hesaplanacak tarih", type: "date", default: "today" }
      ],
      calculate(input) {
        const birthDate = parseDateLocal(input.birthDate, "Doğum tarihi");
        const targetDate = parseDateLocal(input.targetDate, "Hedef tarih");
        const age = ageBetween(birthDate, targetDate);
        return {
          ...okResult(
            `Yaşınız ${age.years} yıl, ${age.months} ay, ${age.days} gün.`,
            [row("Yıl", age.years), row("Ay", age.months), row("Gün", age.days), row("Toplam gün", formatNumber(age.totalDays, 0))]
          ),
          numeric: age
        };
      },
      tests: [
        { name: "2000-01-15 ile 2024-03-20 arası 24 yıl 2 ay 5 gün", input: { birthDate: "2000-01-15", targetDate: "2024-03-20" }, assert: (result, h) => h.same(result.numeric.years, 24) && h.same(result.numeric.months, 2) && h.same(result.numeric.days, 5) }
      ]
    },
    {
      slug: "kdv-hesaplama",
      title: "KDV Hesaplama",
      shortTitle: "KDV",
      description: "KDV hariç tutar ve oran girerek KDV dahil toplamı bulur.",
      fields: [
        { name: "amount", label: "KDV hariç tutar (TL)", type: "number", min: "0", step: "0.01", placeholder: "1000" },
        { name: "rate", label: "KDV oranı (%)", type: "number", min: "0", step: "0.01", placeholder: "20" }
      ],
      calculate(input) {
        const amount = ensureNonNegative(input.amount, "Tutar");
        const rate = ensureNonNegative(input.rate, "KDV oranı");
        const vat = amount * rate / 100;
        const total = amount + vat;
        return {
          ...okResult(
            `KDV dahil toplam ${money(total)}.`,
            [row("KDV tutarı", money(vat)), row("KDV dahil toplam", money(total))]
          ),
          numeric: { vat, total }
        };
      },
      tests: [
        { name: "1000 TL ve %20 KDV = 1200 TL", input: { amount: 1000, rate: 20 }, assert: (result, h) => h.approx(result.numeric.total, 1200, 0.001) }
      ]
    },
    {
      slug: "indirim-hesaplama",
      title: "İndirim Hesaplama",
      shortTitle: "İndirim",
      description: "Etiket fiyatı ve indirim oranına göre son fiyatı hesaplar.",
      fields: [
        { name: "price", label: "Etiket fiyatı (TL)", type: "number", min: "0", step: "0.01", placeholder: "750" },
        { name: "discountRate", label: "İndirim oranı (%)", type: "number", min: "0", max: "100", step: "0.01", placeholder: "15" }
      ],
      calculate(input) {
        const price = ensureNonNegative(input.price, "Etiket fiyatı");
        const discountRate = ensurePercentRange(input.discountRate, "İndirim oranı");
        const discount = price * discountRate / 100;
        const finalPrice = price - discount;
        return {
          ...okResult(
            `İndirimli fiyat ${money(finalPrice)}.`,
            [row("İndirim tutarı", money(discount)), row("İndirimli fiyat", money(finalPrice))]
          ),
          numeric: { discount, finalPrice }
        };
      },
      tests: [
        { name: "200 TL ve %25 indirim = 150 TL", input: { price: 200, discountRate: 25 }, assert: (result, h) => h.approx(result.numeric.finalPrice, 150, 0.001) }
      ]
    },
    {
      slug: "yuzde-hesaplama",
      title: "Yüzde Hesaplama",
      shortTitle: "Yüzde",
      description: "Bir sayının belirli yüzdesini hesaplar.",
      fields: [
        { name: "number", label: "Sayı", type: "number", step: "0.01", placeholder: "350" },
        { name: "percent", label: "Yüzde (%)", type: "number", step: "0.01", placeholder: "18" }
      ],
      calculate(input) {
        const number = toNumber(input.number, "Sayı");
        const percent = toNumber(input.percent, "Yüzde");
        const result = number * percent / 100;
        return {
          ...okResult(
            `${formatNumber(number)} sayısının %${formatNumber(percent)} değeri ${formatFixed(result, 2)}.`,
            [row("Sonuç", formatFixed(result, 2))]
          ),
          numeric: { result }
        };
      },
      tests: [
        { name: "350'nin %18'i = 63", input: { number: 350, percent: 18 }, assert: (result, h) => h.approx(result.numeric.result, 63, 0.001) }
      ]
    },
    {
      slug: "basit-faiz-hesaplama",
      title: "Basit Faiz Hesaplama",
      shortTitle: "Basit Faiz",
      description: "Anapara, yıllık faiz oranı ve süreye göre basit faiz tutarını hesaplar.",
      fields: [
        { name: "principal", label: "Anapara (TL)", type: "number", min: "0", step: "0.01", placeholder: "10000" },
        { name: "annualRate", label: "Yıllık faiz oranı (%)", type: "number", min: "0", step: "0.01", placeholder: "30" },
        { name: "years", label: "Süre (yıl)", type: "number", min: "0", step: "0.01", placeholder: "1" }
      ],
      calculate(input) {
        const principal = ensureNonNegative(input.principal, "Anapara");
        const annualRate = ensureNonNegative(input.annualRate, "Faiz oranı");
        const years = ensureNonNegative(input.years, "Süre");
        const interest = principal * annualRate / 100 * years;
        const total = principal + interest;
        return {
          ...okResult(
            `Basit faiz getirisi ${money(interest)}.`,
            [row("Faiz getirisi", money(interest)), row("Vade sonu toplam", money(total))]
          ),
          numeric: { interest, total }
        };
      },
      tests: [
        { name: "10000 TL, %10, 2 yıl = 12000 TL", input: { principal: 10000, annualRate: 10, years: 2 }, assert: (result, h) => h.approx(result.numeric.total, 12000, 0.001) }
      ]
    },
    {
      slug: "bilesik-faiz-hesaplama",
      title: "Bileşik Faiz Hesaplama",
      shortTitle: "Bileşik Faiz",
      description: "Faizin tekrar anaparaya eklenmesiyle oluşan vade sonu tutarı hesaplar.",
      fields: [
        { name: "principal", label: "Anapara (TL)", type: "number", min: "0", step: "0.01", placeholder: "10000" },
        { name: "annualRate", label: "Yıllık faiz oranı (%)", type: "number", min: "0", step: "0.01", placeholder: "24" },
        { name: "years", label: "Süre (yıl)", type: "number", min: "0", step: "0.01", placeholder: "2" },
        { name: "frequency", label: "Faiz eklenme sıklığı", type: "select", value: "12", options: [
          { value: "1", label: "Yılda 1" },
          { value: "4", label: "Yılda 4" },
          { value: "12", label: "Ayda 1" },
          { value: "365", label: "Günde 1" }
        ] }
      ],
      calculate(input) {
        const principal = ensureNonNegative(input.principal, "Anapara");
        const annualRate = ensureNonNegative(input.annualRate, "Faiz oranı") / 100;
        const years = ensureNonNegative(input.years, "Süre");
        const frequency = ensurePositive(input.frequency, "Faiz eklenme sıklığı");
        const total = principal * Math.pow(1 + annualRate / frequency, frequency * years);
        const interest = total - principal;
        return {
          ...okResult(
            `Bileşik faizle vade sonu toplam ${money(total)}.`,
            [row("Faiz getirisi", money(interest)), row("Vade sonu toplam", money(total))]
          ),
          numeric: { interest, total }
        };
      },
      tests: [
        { name: "1000 TL, %10, 1 yıl, yıllık bileşik = 1100 TL", input: { principal: 1000, annualRate: 10, years: 1, frequency: 1 }, assert: (result, h) => h.approx(result.numeric.total, 1100, 0.001) }
      ]
    },
    {
      slug: "kredi-taksit-hesaplama",
      title: "Kredi Taksit Hesaplama",
      shortTitle: "Kredi Taksit",
      description: "Kredi tutarı, yıllık faiz oranı ve vade ile yaklaşık aylık taksiti hesaplar.",
      fields: [
        { name: "amount", label: "Kredi tutarı (TL)", type: "number", min: "1", step: "0.01", placeholder: "100000" },
        { name: "annualRate", label: "Yıllık faiz oranı (%)", type: "number", min: "0", step: "0.01", placeholder: "36" },
        { name: "months", label: "Vade (ay)", type: "number", min: "1", step: "1", placeholder: "24" }
      ],
      calculate(input) {
        const amount = ensurePositive(input.amount, "Kredi tutarı");
        const annualRate = ensureNonNegative(input.annualRate, "Faiz oranı");
        const months = Math.round(ensurePositive(input.months, "Vade"));
        const monthlyRate = annualRate / 100 / 12;
        const payment = monthlyRate === 0
          ? amount / months
          : amount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
        const totalPayment = payment * months;
        const totalInterest = totalPayment - amount;
        return {
          ...okResult(
            `Yaklaşık aylık taksit ${money(payment)}.`,
            [row("Aylık taksit", money(payment)), row("Toplam geri ödeme", money(totalPayment)), row("Toplam faiz", money(totalInterest))],
            "Sigorta, vergi, masraf ve banka kampanyaları dahil değildir."
          ),
          numeric: { payment, totalPayment, totalInterest }
        };
      },
      tests: [
        { name: "12000 TL, %0 faiz, 12 ay = 1000 TL taksit", input: { amount: 12000, annualRate: 0, months: 12 }, assert: (result, h) => h.approx(result.numeric.payment, 1000, 0.001) }
      ]
    },
    {
      slug: "not-ortalamasi-hesaplama",
      title: "Not Ortalaması Hesaplama",
      shortTitle: "Not Ortalaması",
      description: "Not ve kredi bilgilerine göre ağırlıklı ortalama hesaplar.",
      fields: [
        { name: "items", label: "Notlar ve krediler", type: "textarea", placeholder: "90,3\n80,2\n70,4", help: "Her satıra not,kredi yazın. Örnek: 85,3" }
      ],
      calculate(input) {
        const items = parseGradeLines(input.items);
        const totalCredits = items.reduce((sum, item) => sum + item.credit, 0);
        const weightedSum = items.reduce((sum, item) => sum + item.grade * item.credit, 0);
        const average = weightedSum / totalCredits;
        return {
          ...okResult(
            `Ağırlıklı not ortalamanız ${formatFixed(average, 2)}.`,
            [row("Toplam kredi", formatNumber(totalCredits)), row("Ortalama", formatFixed(average, 2)), row("Harf tahmini", gradeLetter(average))]
          ),
          numeric: { average, totalCredits }
        };
      },
      tests: [
        { name: "90x3 ve 60x1 ortalama = 82,5", input: { items: "90,3\n60,1" }, assert: (result, h) => h.approx(result.numeric.average, 82.5, 0.001) }
      ]
    },
    {
      slug: "maas-zam-hesaplama",
      title: "Maaş Zam Hesaplama",
      shortTitle: "Maaş Zam",
      description: "Mevcut maaş ve zam oranına göre yeni maaşı hesaplar.",
      fields: [
        { name: "salary", label: "Mevcut maaş (TL)", type: "number", min: "0", step: "0.01", placeholder: "30000" },
        { name: "raiseRate", label: "Zam oranı (%)", type: "number", step: "0.01", placeholder: "25" }
      ],
      calculate(input) {
        const salary = ensureNonNegative(input.salary, "Maaş");
        const raiseRate = toNumber(input.raiseRate, "Zam oranı");
        const raiseAmount = salary * raiseRate / 100;
        const newSalary = salary + raiseAmount;
        return {
          ...okResult(
            `Yeni maaş ${money(newSalary)}.`,
            [row("Zam tutarı", money(raiseAmount)), row("Yeni maaş", money(newSalary))]
          ),
          numeric: { raiseAmount, newSalary }
        };
      },
      tests: [
        { name: "20000 TL ve %10 zam = 22000 TL", input: { salary: 20000, raiseRate: 10 }, assert: (result, h) => h.approx(result.numeric.newSalary, 22000, 0.001) }
      ]
    },
    {
      slug: "yakit-tuketimi-hesaplama",
      title: "Yakıt Tüketimi Hesaplama",
      shortTitle: "Yakıt",
      description: "Gidilen mesafe ve harcanan yakıta göre tüketim ve maliyet hesaplar.",
      fields: [
        { name: "distanceKm", label: "Mesafe (km)", type: "number", min: "1", step: "0.1", placeholder: "500" },
        { name: "fuelLiters", label: "Harcanan yakıt (litre)", type: "number", min: "0", step: "0.01", placeholder: "35" },
        { name: "fuelPrice", label: "Litre fiyatı (TL)", type: "number", min: "0", step: "0.01", placeholder: "45" }
      ],
      calculate(input) {
        const distanceKm = ensurePositive(input.distanceKm, "Mesafe");
        const fuelLiters = ensureNonNegative(input.fuelLiters, "Yakıt");
        const fuelPrice = ensureNonNegative(input.fuelPrice, "Litre fiyatı");
        const consumption = fuelLiters / distanceKm * 100;
        const totalCost = fuelLiters * fuelPrice;
        const costPerKm = totalCost / distanceKm;
        return {
          ...okResult(
            `Ortalama tüketim ${formatFixed(consumption, 2)} L/100 km.`,
            [row("Tüketim", `${formatFixed(consumption, 2)} L/100 km`), row("Toplam maliyet", money(totalCost)), row("Km başı maliyet", money(costPerKm))]
          ),
          numeric: { consumption, totalCost, costPerKm }
        };
      },
      tests: [
        { name: "500 km ve 35 L = 7 L/100 km", input: { distanceKm: 500, fuelLiters: 35, fuelPrice: 40 }, assert: (result, h) => h.approx(result.numeric.consumption, 7, 0.001) }
      ]
    },
    {
      slug: "hiz-mesafe-sure-hesaplama",
      title: "Hız-Mesafe-Süre Hesaplama",
      shortTitle: "Hız",
      description: "Mesafe ve süre girerek ortalama hızı hesaplar.",
      fields: [
        { name: "distanceKm", label: "Mesafe (km)", type: "number", min: "0", step: "0.01", placeholder: "180" },
        { name: "timeHours", label: "Süre (saat)", type: "number", min: "0.01", step: "0.01", placeholder: "2.5" }
      ],
      calculate(input) {
        const distanceKm = ensureNonNegative(input.distanceKm, "Mesafe");
        const timeHours = ensurePositive(input.timeHours, "Süre");
        const speed = distanceKm / timeHours;
        const paceMinutesPerKm = distanceKm === 0 ? 0 : (timeHours * 60) / distanceKm;
        return {
          ...okResult(
            `Ortalama hız ${formatFixed(speed, 2)} km/sa.`,
            [row("Ortalama hız", `${formatFixed(speed, 2)} km/sa`), row("Tempo", distanceKm === 0 ? "Hesaplanamaz" : `${formatFixed(paceMinutesPerKm, 2)} dk/km`)]
          ),
          numeric: { speed, paceMinutesPerKm }
        };
      },
      tests: [
        { name: "180 km / 2 saat = 90 km/sa", input: { distanceKm: 180, timeHours: 2 }, assert: (result, h) => h.approx(result.numeric.speed, 90, 0.001) }
      ]
    },
    {
      slug: "alan-hesaplama",
      title: "Alan Hesaplama",
      shortTitle: "Alan",
      description: "Dikdörtgen, üçgen ve daire için alan hesaplar.",
      fields: [
        { name: "shape", label: "Şekil", type: "select", value: "rectangle", options: [
          { value: "rectangle", label: "Dikdörtgen" },
          { value: "triangle", label: "Üçgen" },
          { value: "circle", label: "Daire" }
        ] },
        { name: "a", label: "Değer 1", type: "number", min: "0", step: "0.01", placeholder: "10", help: "Dikdörtgen: uzun kenar, üçgen: taban, daire: yarıçap" },
        { name: "b", label: "Değer 2", type: "number", min: "0", step: "0.01", placeholder: "5", required: false, help: "Dikdörtgen: kısa kenar, üçgen: yükseklik, dairede boş bırakılabilir" }
      ],
      calculate(input) {
        const shape = input.shape;
        const a = ensurePositive(input.a, "Değer 1");
        let area;
        let label;
        if (shape === "circle") {
          area = Math.PI * a * a;
          label = "Daire alanı";
        } else {
          const b = ensurePositive(input.b, "Değer 2");
          if (shape === "rectangle") {
            area = a * b;
            label = "Dikdörtgen alanı";
          } else if (shape === "triangle") {
            area = a * b / 2;
            label = "Üçgen alanı";
          } else {
            throw new Error("Geçerli bir şekil seçin.");
          }
        }
        return {
          ...okResult(`${label} ${formatFixed(area, 2)} birim².`, [row(label, `${formatFixed(area, 2)} birim²`)]),
          numeric: { area }
        };
      },
      tests: [
        { name: "Dikdörtgen 10x5 = 50", input: { shape: "rectangle", a: 10, b: 5 }, assert: (result, h) => h.approx(result.numeric.area, 50, 0.001) }
      ]
    },
    {
      slug: "cevre-hesaplama",
      title: "Çevre Hesaplama",
      shortTitle: "Çevre",
      description: "Kare, dikdörtgen, üçgen ve daire için çevre hesaplar.",
      fields: [
        { name: "shape", label: "Şekil", type: "select", value: "rectangle", options: [
          { value: "square", label: "Kare" },
          { value: "rectangle", label: "Dikdörtgen" },
          { value: "triangle", label: "Üçgen" },
          { value: "circle", label: "Daire" }
        ] },
        { name: "a", label: "Değer 1", type: "number", min: "0", step: "0.01", placeholder: "10", help: "Kare: kenar, dikdörtgen: uzun kenar, üçgen: 1. kenar, daire: yarıçap" },
        { name: "b", label: "Değer 2", type: "number", min: "0", step: "0.01", placeholder: "5", required: false, help: "Dikdörtgen: kısa kenar, üçgen: 2. kenar" },
        { name: "c", label: "Değer 3", type: "number", min: "0", step: "0.01", placeholder: "7", required: false, help: "Sadece üçgen için 3. kenar" }
      ],
      calculate(input) {
        const shape = input.shape;
        const a = ensurePositive(input.a, "Değer 1");
        let perimeter;
        let label;
        if (shape === "square") {
          perimeter = 4 * a;
          label = "Kare çevresi";
        } else if (shape === "circle") {
          perimeter = 2 * Math.PI * a;
          label = "Daire çevresi";
        } else if (shape === "rectangle") {
          const b = ensurePositive(input.b, "Değer 2");
          perimeter = 2 * (a + b);
          label = "Dikdörtgen çevresi";
        } else if (shape === "triangle") {
          const b = ensurePositive(input.b, "Değer 2");
          const c = ensurePositive(input.c, "Değer 3");
          if (a + b <= c || a + c <= b || b + c <= a) throw new Error("Üçgen kenarları üçgen eşitsizliğini sağlamalıdır.");
          perimeter = a + b + c;
          label = "Üçgen çevresi";
        } else {
          throw new Error("Geçerli bir şekil seçin.");
        }
        return {
          ...okResult(`${label} ${formatFixed(perimeter, 2)} birim.`, [row(label, `${formatFixed(perimeter, 2)} birim`)]),
          numeric: { perimeter }
        };
      },
      tests: [
        { name: "Dikdörtgen 10 ve 5 çevre = 30", input: { shape: "rectangle", a: 10, b: 5 }, assert: (result, h) => h.approx(result.numeric.perimeter, 30, 0.001) }
      ]
    },
    {
      slug: "hacim-hesaplama",
      title: "Hacim Hesaplama",
      shortTitle: "Hacim",
      description: "Küp, dikdörtgen prizma ve silindir için hacim hesaplar.",
      fields: [
        { name: "solid", label: "Cisim", type: "select", value: "prism", options: [
          { value: "cube", label: "Küp" },
          { value: "prism", label: "Dikdörtgen prizma" },
          { value: "cylinder", label: "Silindir" }
        ] },
        { name: "a", label: "Değer 1", type: "number", min: "0", step: "0.01", placeholder: "10", help: "Küp: kenar, prizma: uzunluk, silindir: yarıçap" },
        { name: "b", label: "Değer 2", type: "number", min: "0", step: "0.01", placeholder: "5", required: false, help: "Prizma: genişlik, silindir: yükseklik" },
        { name: "c", label: "Değer 3", type: "number", min: "0", step: "0.01", placeholder: "3", required: false, help: "Sadece dikdörtgen prizma için yükseklik" }
      ],
      calculate(input) {
        const solid = input.solid;
        const a = ensurePositive(input.a, "Değer 1");
        let volume;
        let label;
        if (solid === "cube") {
          volume = Math.pow(a, 3);
          label = "Küp hacmi";
        } else if (solid === "prism") {
          const b = ensurePositive(input.b, "Değer 2");
          const c = ensurePositive(input.c, "Değer 3");
          volume = a * b * c;
          label = "Dikdörtgen prizma hacmi";
        } else if (solid === "cylinder") {
          const b = ensurePositive(input.b, "Değer 2");
          volume = Math.PI * a * a * b;
          label = "Silindir hacmi";
        } else {
          throw new Error("Geçerli bir cisim seçin.");
        }
        return {
          ...okResult(`${label} ${formatFixed(volume, 2)} birim³.`, [row(label, `${formatFixed(volume, 2)} birim³`)]),
          numeric: { volume }
        };
      },
      tests: [
        { name: "Prizma 2x3x4 = 24", input: { solid: "prism", a: 2, b: 3, c: 4 }, assert: (result, h) => h.approx(result.numeric.volume, 24, 0.001) }
      ]
    },
    {
      slug: "doviz-cevirici",
      title: "Döviz Çevirici",
      shortTitle: "Döviz",
      description: "Girilen manuel kur ile iki para birimi arasında çeviri yapar.",
      fields: [
        { name: "amount", label: "Tutar", type: "number", min: "0", step: "0.01", placeholder: "100" },
        { name: "rate", label: "Kur", type: "number", min: "0.000001", step: "0.0001", placeholder: "32.50", help: "Örnek: 1 USD = 32,50 TL ise kur alanına 32,50 yazın." },
        { name: "direction", label: "İşlem", type: "select", value: "multiply", options: [
          { value: "multiply", label: "Tutar × Kur" },
          { value: "divide", label: "Tutar ÷ Kur" }
        ] }
      ],
      calculate(input) {
        const amount = ensureNonNegative(input.amount, "Tutar");
        const rate = ensurePositive(input.rate, "Kur");
        const converted = input.direction === "divide" ? amount / rate : amount * rate;
        return {
          ...okResult(
            `Çevrilen tutar ${formatFixed(converted, 2)}.`,
            [row("Sonuç", formatFixed(converted, 2))],
            "Güncel kur otomatik çekilmez; kur değerini kullanıcı girer."
          ),
          numeric: { converted }
        };
      },
      tests: [
        { name: "100 × 32,5 = 3250", input: { amount: 100, rate: 32.5, direction: "multiply" }, assert: (result, h) => h.approx(result.numeric.converted, 3250, 0.001) }
      ]
    },
    {
      slug: "sicaklik-cevirici",
      title: "Sıcaklık Çevirici",
      shortTitle: "Sıcaklık",
      description: "Celsius, Fahrenheit ve Kelvin arasında dönüşüm yapar.",
      fields: [
        { name: "value", label: "Sıcaklık", type: "number", step: "0.01", placeholder: "25" },
        { name: "fromUnit", label: "Kaynak birim", type: "select", value: "C", options: [
          { value: "C", label: "Celsius" },
          { value: "F", label: "Fahrenheit" },
          { value: "K", label: "Kelvin" }
        ] },
        { name: "toUnit", label: "Hedef birim", type: "select", value: "F", options: [
          { value: "C", label: "Celsius" },
          { value: "F", label: "Fahrenheit" },
          { value: "K", label: "Kelvin" }
        ] }
      ],
      calculate(input) {
        const value = toNumber(input.value, "Sıcaklık");
        const fromUnit = input.fromUnit;
        const toUnit = input.toUnit;
        let celsius;
        if (fromUnit === "C") celsius = value;
        else if (fromUnit === "F") celsius = (value - 32) * 5 / 9;
        else if (fromUnit === "K") celsius = value - 273.15;
        else throw new Error("Kaynak birim geçerli değil.");

        let converted;
        if (toUnit === "C") converted = celsius;
        else if (toUnit === "F") converted = celsius * 9 / 5 + 32;
        else if (toUnit === "K") converted = celsius + 273.15;
        else throw new Error("Hedef birim geçerli değil.");

        return {
          ...okResult(
            `${formatFixed(value, 2)} °${fromUnit}, ${formatFixed(converted, 2)} °${toUnit} eder.`,
            [row("Sonuç", `${formatFixed(converted, 2)} °${toUnit}`)]
          ),
          numeric: { converted }
        };
      },
      tests: [
        { name: "0 °C = 32 °F", input: { value: 0, fromUnit: "C", toUnit: "F" }, assert: (result, h) => h.approx(result.numeric.converted, 32, 0.001) }
      ]
    },
    {
      slug: "uzunluk-cevirici",
      title: "Uzunluk Birimi Çevirici",
      shortTitle: "Uzunluk",
      description: "Milimetre, santimetre, metre, kilometre, inç, feet ve mil arasında dönüşüm yapar.",
      fields: [
        { name: "value", label: "Değer", type: "number", min: "0", step: "0.0001", placeholder: "1000" },
        { name: "fromUnit", label: "Kaynak birim", type: "select", value: "m", options: Object.keys(lengthLabels).map((unit) => ({ value: unit, label: lengthLabels[unit] })) },
        { name: "toUnit", label: "Hedef birim", type: "select", value: "km", options: Object.keys(lengthLabels).map((unit) => ({ value: unit, label: lengthLabels[unit] })) }
      ],
      calculate(input) {
        const value = ensureNonNegative(input.value, "Değer");
        const fromUnit = input.fromUnit;
        const toUnit = input.toUnit;
        if (!(fromUnit in lengthFactorsToMeter) || !(toUnit in lengthFactorsToMeter)) throw new Error("Geçerli uzunluk birimi seçin.");
        const meters = value * lengthFactorsToMeter[fromUnit];
        const converted = meters / lengthFactorsToMeter[toUnit];
        return {
          ...okResult(
            `${formatNumber(value, 4)} ${fromUnit}, ${formatNumber(converted, 4)} ${toUnit} eder.`,
            [row("Sonuç", `${formatNumber(converted, 4)} ${toUnit}`), row("Metre karşılığı", `${formatNumber(meters, 4)} m`)]
          ),
          numeric: { converted, meters }
        };
      },
      tests: [
        { name: "1000 m = 1 km", input: { value: 1000, fromUnit: "m", toUnit: "km" }, assert: (result, h) => h.approx(result.numeric.converted, 1, 0.001) }
      ]
    },
    {
      slug: "agirlik-cevirici",
      title: "Ağırlık Birimi Çevirici",
      shortTitle: "Ağırlık",
      description: "Miligram, gram, kilogram, ton, pound ve ons arasında dönüşüm yapar.",
      fields: [
        { name: "value", label: "Değer", type: "number", min: "0", step: "0.0001", placeholder: "2" },
        { name: "fromUnit", label: "Kaynak birim", type: "select", value: "kg", options: Object.keys(weightLabels).map((unit) => ({ value: unit, label: weightLabels[unit] })) },
        { name: "toUnit", label: "Hedef birim", type: "select", value: "g", options: Object.keys(weightLabels).map((unit) => ({ value: unit, label: weightLabels[unit] })) }
      ],
      calculate(input) {
        const value = ensureNonNegative(input.value, "Değer");
        const fromUnit = input.fromUnit;
        const toUnit = input.toUnit;
        if (!(fromUnit in weightFactorsToKg) || !(toUnit in weightFactorsToKg)) throw new Error("Geçerli ağırlık birimi seçin.");
        const kilograms = value * weightFactorsToKg[fromUnit];
        const converted = kilograms / weightFactorsToKg[toUnit];
        return {
          ...okResult(
            `${formatNumber(value, 4)} ${fromUnit}, ${formatNumber(converted, 4)} ${toUnit} eder.`,
            [row("Sonuç", `${formatNumber(converted, 4)} ${toUnit}`), row("Kilogram karşılığı", `${formatNumber(kilograms, 4)} kg`)]
          ),
          numeric: { converted, kilograms }
        };
      },
      tests: [
        { name: "2 kg = 2000 g", input: { value: 2, fromUnit: "kg", toUnit: "g" }, assert: (result, h) => h.approx(result.numeric.converted, 2000, 0.001) }
      ]
    },
    {
      slug: "tarih-farki-hesaplama",
      title: "Tarih Farkı Hesaplama",
      shortTitle: "Tarih Farkı",
      description: "İki tarih arasındaki gün, hafta ve yaklaşık ay farkını hesaplar.",
      fields: [
        { name: "startDate", label: "Başlangıç tarihi", type: "date" },
        { name: "endDate", label: "Bitiş tarihi", type: "date" }
      ],
      calculate(input) {
        const startDate = parseDateLocal(input.startDate, "Başlangıç tarihi");
        const endDate = parseDateLocal(input.endDate, "Bitiş tarihi");
        const dayDiff = Math.abs(daysBetween(startDate, endDate));
        const weeks = dayDiff / 7;
        const monthsApprox = dayDiff / 30.4375;
        return {
          ...okResult(
            `İki tarih arasında ${formatNumber(dayDiff, 0)} gün var.`,
            [row("Gün", formatNumber(dayDiff, 0)), row("Hafta", formatFixed(weeks, 2)), row("Yaklaşık ay", formatFixed(monthsApprox, 2))]
          ),
          numeric: { dayDiff, weeks, monthsApprox }
        };
      },
      tests: [
        { name: "2024-01-01 ile 2024-01-31 arası 30 gün", input: { startDate: "2024-01-01", endDate: "2024-01-31" }, assert: (result, h) => h.same(result.numeric.dayDiff, 30) }
      ]
    }
  ];

  const calculators = calculatorDefinitions.map((calculator, index) => ({ ...calculator, order: index + 1 }));
  const bySlug = Object.fromEntries(calculators.map((calculator) => [calculator.slug, calculator]));

  global.CalculatorApp = {
    calculators,
    bySlug,
    helpers: {
      toNumber,
      ensurePositive,
      ensureNonNegative,
      formatNumber,
      formatFixed,
      money,
      parseDateLocal,
      daysBetween,
      ageBetween,
      approx,
      same: isSame
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
