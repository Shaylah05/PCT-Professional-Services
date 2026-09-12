/* PCT Schedule C Side-Income Wizard
   Additive module. Does not replace or alter the existing flat Business
   Organizer fields (#businessOrganizer) — it is a guided, plain-language
   front door for clients reporting work outside a W-2 job. It organizes
   client-reported facts without deciding their final tax treatment.

   Design contract:
   - Writes ONLY into the existing data-bind inputs that already live inside
     #businessOrganizer (businessGrossReceipts, businessCashIncome,
     business1099Income, businessOtherIncome, businessExpense_*,
     businessVehicleMiles, businessTotalVehicleMiles,
     businessHomeOfficeDetails, businessAssetsDetails,
     businessContractorDetails, businessOwner, businessName,
     businessDescription) by setting .value and dispatching a real
     'input'/'change' event, so the page's own existing data-bind listeners
     (set up in init()) update `state` exactly the way they already do for
     every other field. No direct access to the page's `state` object is
     required or attempted.
   - Reuses the existing toggleOrganizerFlag() button clicks for
     inventory/vehicle/homeOffice so that logic is never duplicated.
   - Never touches Section 179 / depreciation / QBI-specified-service /
     Form 7205 / listed-property questions — those stay preparer-only.
*/
(function () {
  'use strict';

  const INCOME_SOURCES = [
    { id: 'cash', label: 'Cash people handed you', hint: 'Paper money, in person' },
    { id: 'zelle', label: 'Zelle', hint: '' },
    { id: 'cashapp', label: 'Cash App', hint: '' },
    { id: 'venmo', label: 'Venmo', hint: '' },
    { id: 'paypal', label: 'PayPal', hint: '' },
    { id: 'checks', label: 'Checks', hint: '' },
    { id: 'card', label: 'Card payments through a processor', hint: 'Enter the payment once here, even if it also appears on a 1099-K' }
  ];

  const EXPENSE_CATEGORIES = [
    { field: 'businessExpense_advertising', label: 'Advertising or promoting your work', hint: 'Flyers, boosted posts, business cards' },
    { field: 'businessExpense_supplies', label: 'Supplies or materials', hint: 'Things you buy up and use for the work' },
    { field: 'businessExpense_contractLabor', label: 'Paid someone to help you', hint: 'Not on payroll — just paid them for help' },
    { field: 'businessExpense_commissionsFees', label: 'Platform fees or commissions', hint: 'App fees, processing fees, referral cuts' },
    { field: 'businessExpense_insurance', label: 'Business insurance', hint: 'Not health insurance — insurance for the work itself' },
    { field: 'businessExpense_legalProfessional', label: 'Paid a lawyer, accountant, or consultant', hint: '' },
    { field: 'businessExpense_office', label: 'Office or work supplies', hint: 'Small tools, printer paper, packaging' },
    { field: 'businessExpense_rentLease', label: 'Rented space or equipment', hint: 'A booth, studio, storage unit, machine rental' },
    { field: 'businessExpense_repairs', label: 'Repairs or upkeep', hint: 'Fixing tools or equipment you use' },
    { field: 'businessExpense_taxesLicenses', label: 'Licenses, permits, or fees to operate', hint: '' },
    { field: 'businessExpense_travel', label: 'Travel for the work', hint: 'Hotel, flight, not your regular commute' },
    { field: 'businessExpense_meals', label: 'Business meals', hint: 'Meeting a client or vendor over food' },
    { field: 'businessExpense_utilities', label: 'Phone or internet used for the work', hint: 'Just the business-use share' },
    { field: 'businessExpense_software', label: 'Apps, software, or subscriptions', hint: 'Anything you pay monthly/yearly for the work' },
    { field: 'businessExpense_other', label: 'Anything else you spent money on for this', hint: 'Catch-all — we\u2019ll ask what it was' }
  ];

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function money(n) { const v = Number(n) || 0; return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(v) { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }

  function setField(fieldName, value) {
    const el = document.querySelector('[data-bind="' + fieldName + '"]');
    if (!el) return;
    el.value = value;
    const evt = new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true });
    el.dispatchEvent(evt);
  }
  function getField(fieldName) {
    const el = document.querySelector('[data-bind="' + fieldName + '"]');
    return el ? el.value : '';
  }
  function clickOrganizerFlagIfNeeded(flagKey, shouldBeOn) {
    const btn = document.querySelector('.organizer-option[data-org-flag="' + flagKey + '"]');
    if (!btn) return;
    const isOn = btn.classList.contains('selected');
    if (isOn !== !!shouldBeOn) btn.click();
  }

  function PCTScheduleCWizard(container) {
    this.container = container;
    this.step = 0;
    this.data = {
      businessDescription: '',
      income: {}, // sourceId -> amount
      form1099KAmount: '', // documentation amount; never added to receipts
      otherIncomeNote: '',
      otherIncomeAmount: 0,
      expenses: {}, // field -> amount
      usedVehicle: null,
      vehicleBusinessMiles: '',
      vehicleTotalMiles: '',
      usedHomeOffice: null,
      homeOfficeSqFt: '',
      homeTotalSqFt: '',
      boughtEquipment: null,
      equipmentNote: '',
      paidHelpers: null,
      helpersNote: ''
    };
    this.render();
  }

  PCTScheduleCWizard.prototype.totalIncome = function () {
    let t = 0;
    INCOME_SOURCES.forEach(s => { t += num(this.data.income[s.id]); });
    t += num(this.data.otherIncomeAmount);
    return t;
  };
  PCTScheduleCWizard.prototype.reported1099K = function () {
    return num(this.data.form1099KAmount);
  };
  PCTScheduleCWizard.prototype.totalCashIncome = function () {
    return num(this.data.income.cash);
  };
  PCTScheduleCWizard.prototype.totalExpenses = function () {
    let t = 0;
    EXPENSE_CATEGORIES.forEach(c => { t += num(this.data.expenses[c.field]); });
    return t;
  };
  PCTScheduleCWizard.prototype.netProfit = function () {
    return this.totalIncome() - this.totalExpenses();
  };

  PCTScheduleCWizard.prototype.next = function () { this.step++; this.render(); };
  PCTScheduleCWizard.prototype.back = function () { if (this.step > 0) { this.step--; this.render(); } };

  PCTScheduleCWizard.prototype.commitToForm = function () {
    setField('businessOwner', 'taxpayer');
    setField('businessDescription', this.data.businessDescription);
    setField('businessGrossReceipts', this.totalIncome().toFixed(2));
    setField('businessCashIncome', this.totalCashIncome().toFixed(2));
    setField('business1099Income', this.reported1099K().toFixed(2));
    setField('businessOtherIncome', num(this.data.otherIncomeAmount).toFixed(2));
    EXPENSE_CATEGORIES.forEach(c => setField(c.field, num(this.data.expenses[c.field]).toFixed(2)));
    clickOrganizerFlagIfNeeded('vehicle', this.data.usedVehicle === true);
    if (this.data.usedVehicle) {
      setField('businessVehicleMiles', this.data.vehicleBusinessMiles);
      setField('businessTotalVehicleMiles', this.data.vehicleTotalMiles);
    }
    clickOrganizerFlagIfNeeded('homeOffice', this.data.usedHomeOffice === true);
    if (this.data.usedHomeOffice) {
      setField('businessHomeOfficeDetails', 'Simplified method estimate — ' + esc(this.data.homeOfficeSqFt) + ' sq ft of ' + esc(this.data.homeTotalSqFt) + ' sq ft total home (client self-reported via wizard; confirm regular/exclusive use).');
    }
    if (this.data.boughtEquipment && this.data.equipmentNote) {
      setField('businessAssetsDetails', this.data.equipmentNote);
    }
    if (this.data.paidHelpers && this.data.helpersNote) {
      setField('businessContractorDetails', this.data.helpersNote);
    }
  };

  PCTScheduleCWizard.prototype.screenIntro = function () {
    return '<div class="pct-scw-screen">' +
      '<div class="kicker">GUIDED INCOME ORGANIZER</div>' +
      '<h3>Let\u2019s get this organized \u2014 together.</h3>' +
      '<p>If you earned money outside a W-2 job \u2014 side work, gig work, cash jobs, freelance work, or your own small business \u2014 answer a few plain questions and we\u2019ll help organize the income and expenses you reported. Your tax professional will confirm how it belongs on your return. At the end you can download a clean summary for your records.</p>' +
      '<div class="field"><label>In one sentence, what did you do to earn this money?</label><input type="text" id="pctScwDescription" placeholder="Example: I braid hair on weekends" value="' + esc(this.data.businessDescription) + '"></div>' +
      '<div class="pct-scw-actions"><button type="button" class="btn btn-primary" id="pctScwStart">Let\u2019s Start \u2192</button></div>' +
      '</div>';
  };

  PCTScheduleCWizard.prototype.screenIncome = function () {
    const rows = INCOME_SOURCES.map(s =>
      '<div class="field"><label>' + esc(s.label) + (s.hint ? ' <span class="small">' + esc(s.hint) + '</span>' : '') + '</label>' +
      '<input type="number" min="0" step="0.01" data-scw-income="' + s.id + '" placeholder="$0" value="' + (this.data.income[s.id] != null ? this.data.income[s.id] : '') + '"></div>'
    ).join('');
    return '<div class="pct-scw-screen">' +
      '<div class="kicker">STEP 1 OF 4 \u00b7 MONEY THAT CAME IN</div>' +
      '<h3>How did people pay you?</h3>' +
      '<p>Enter each payment once, under the way you received it. If the same payment appears on a 1099-K, do not add it again. Answer whichever ones apply and leave the rest blank.</p>' +
      '<div class="business-grid">' + rows + '</div>' +
      '<div class="field" style="margin-top:10px"><label>Any other money for this work that you did not enter above? <span class="small">Optional</span></label><input type="number" min="0" step="0.01" id="pctScwOtherIncome" placeholder="$0" value="' + (this.data.otherIncomeAmount || '') + '"></div>' +
      '<div class="field" style="margin-top:10px"><label>Amount shown on Form 1099-K <span class="small">Reference only</span></label><input type="number" min="0" step="0.01" id="pctScw1099K" placeholder="$0" value="' + (this.data.form1099KAmount || '') + '"><div class="small">A 1099-K may report payments already entered above. This amount is saved for your preparer to reconcile and is not added again to total income.</div></div>' +
      this.navRow() +
      '</div>';
  };

  PCTScheduleCWizard.prototype.screenExpenses = function () {
    const rows = EXPENSE_CATEGORIES.map(c =>
      '<div class="field"><label>Did you spend money on: ' + esc(c.label) + '?' + (c.hint ? ' <span class="small">' + esc(c.hint) + '</span>' : '') + '</label>' +
      '<input type="number" min="0" step="0.01" data-scw-expense="' + c.field + '" placeholder="$0" value="' + (this.data.expenses[c.field] != null ? this.data.expenses[c.field] : '') + '"></div>'
    ).join('');
    return '<div class="pct-scw-screen">' +
      '<div class="kicker">STEP 2 OF 4 \u00b7 MONEY THAT WENT OUT</div>' +
      '<h3>Did you spend money on any of these?</h3>' +
      '<p>Go down the list and skip anything that doesn\u2019t apply. Enter expenses connected to the work. Your tax professional will review which expenses qualify and how they should be treated on your return.</p>' +
      '<div class="business-grid">' + rows + '</div>' +
      this.navRow() +
      '</div>';
  };

  PCTScheduleCWizard.prototype.screenVehicleHome = function () {
    return '<div class="pct-scw-screen">' +
      '<div class="kicker">STEP 3 OF 4 \u00b7 VEHICLE &amp; HOME</div>' +
      '<h3>A couple more quick ones.</h3>' +
      '<div class="field"><label>Did you use your personal vehicle for this work?</label>' +
      '<div class="pct-scw-yn"><button type="button" class="btn btn-ghost' + (this.data.usedVehicle === true ? ' selected' : '') + '" data-scw-yn="usedVehicle" data-val="true">Yes</button><button type="button" class="btn btn-ghost' + (this.data.usedVehicle === false ? ' selected' : '') + '" data-scw-yn="usedVehicle" data-val="false">No</button></div></div>' +
      (this.data.usedVehicle ? '<div class="business-grid"><div class="field"><label>About how many miles were for this work?</label><input type="number" min="0" id="pctScwVehicleBiz" value="' + esc(this.data.vehicleBusinessMiles) + '"></div><div class="field"><label>About how many miles did you drive total this year?</label><input type="number" min="0" id="pctScwVehicleTotal" value="' + esc(this.data.vehicleTotalMiles) + '"></div></div>' : '') +
      '<div class="field" style="margin-top:14px"><label>Do you regularly use part of your home just for this work?</label>' +
      '<div class="pct-scw-yn"><button type="button" class="btn btn-ghost' + (this.data.usedHomeOffice === true ? ' selected' : '') + '" data-scw-yn="usedHomeOffice" data-val="true">Yes</button><button type="button" class="btn btn-ghost' + (this.data.usedHomeOffice === false ? ' selected' : '') + '" data-scw-yn="usedHomeOffice" data-val="false">No</button></div></div>' +
      (this.data.usedHomeOffice ? '<div class="business-grid"><div class="field"><label>About how many square feet is that space?</label><input type="number" min="0" id="pctScwHomeSqft" value="' + esc(this.data.homeOfficeSqFt) + '"></div><div class="field"><label>About how many square feet is your whole home?</label><input type="number" min="0" id="pctScwHomeTotalSqft" value="' + esc(this.data.homeTotalSqFt) + '"></div></div>' : '') +
      '<div class="field" style="margin-top:14px"><label>Buy any equipment or tools over $200 for this work?</label>' +
      '<div class="pct-scw-yn"><button type="button" class="btn btn-ghost' + (this.data.boughtEquipment === true ? ' selected' : '') + '" data-scw-yn="boughtEquipment" data-val="true">Yes</button><button type="button" class="btn btn-ghost' + (this.data.boughtEquipment === false ? ' selected' : '') + '" data-scw-yn="boughtEquipment" data-val="false">No</button></div></div>' +
      (this.data.boughtEquipment ? '<div class="field"><input type="text" id="pctScwEquipmentNote" placeholder="What, about when, about how much" value="' + esc(this.data.equipmentNote) + '"></div>' : '') +
      '<div class="field" style="margin-top:14px"><label>Pay anyone to help you with this work?</label>' +
      '<div class="pct-scw-yn"><button type="button" class="btn btn-ghost' + (this.data.paidHelpers === true ? ' selected' : '') + '" data-scw-yn="paidHelpers" data-val="true">Yes</button><button type="button" class="btn btn-ghost' + (this.data.paidHelpers === false ? ' selected' : '') + '" data-scw-yn="paidHelpers" data-val="false">No</button></div></div>' +
      (this.data.paidHelpers ? '<div class="field"><input type="text" id="pctScwHelpersNote" placeholder="Who, about how much, any 1099 sent" value="' + esc(this.data.helpersNote) + '"></div>' : '') +
      this.navRow() +
      '</div>';
  };

  PCTScheduleCWizard.prototype.screenReveal = function () {
    const income = this.totalIncome(), expenses = this.totalExpenses(), net = this.netProfit(), reported1099K = this.reported1099K();
    return '<div class="pct-scw-screen">' +
      '<div class="kicker">STEP 4 OF 4 \u00b7 YOUR NUMBERS</div>' +
      '<h3>Look at what you just put together.</h3>' +
      '<div class="pct-scw-summary">' +
      '<div class="pct-scw-line"><span>Total money in</span><strong>' + money(income) + '</strong></div>' +
      (reported1099K ? '<div class="pct-scw-line"><span>1099-K reported amount <span class="small">(reference only; not added again)</span></span><strong>' + money(reported1099K) + '</strong></div>' : '') +
      '<div class="pct-scw-line"><span>Total money out</span><strong>' + money(expenses) + '</strong></div>' +
      '<div class="pct-scw-line pct-scw-net"><span>Estimated profit</span><strong>' + money(net) + '</strong></div>' +
      '</div>' +
      '<p class="small">This is your organized starting point \u2014 not your final tax number. Your preparer reviews everything before anything is filed.</p>' +
      '<div class="pct-scw-actions"><button type="button" class="btn btn-primary" id="pctScwFinish">Save My Numbers to My Return \u2713</button> <button type="button" class="btn btn-ghost" id="pctScwDownload">Download My Free Copy \u2193</button></div>' +
      this.navRow(true) +
      '</div>';
  };

  PCTScheduleCWizard.prototype.navRow = function (hideNext) {
    return '<div class="pct-scw-actions" style="margin-top:16px">' +
      (this.step > 0 ? '<button type="button" class="btn btn-ghost" id="pctScwBack">\u2190 Back</button>' : '') +
      (hideNext ? '' : '<button type="button" class="btn btn-primary" id="pctScwNext">Continue \u2192</button>') +
      '</div>';
  };

  PCTScheduleCWizard.prototype.collectScreen = function () {
    if (this.step === 1) {
      document.querySelectorAll('[data-scw-income]').forEach(el => { this.data.income[el.getAttribute('data-scw-income')] = el.value; });
      const other = document.getElementById('pctScwOtherIncome'); if (other) this.data.otherIncomeAmount = other.value;
      const form1099K = document.getElementById('pctScw1099K'); if (form1099K) this.data.form1099KAmount = form1099K.value;
    } else if (this.step === 2) {
      document.querySelectorAll('[data-scw-expense]').forEach(el => { this.data.expenses[el.getAttribute('data-scw-expense')] = el.value; });
    } else if (this.step === 3) {
      const vb = document.getElementById('pctScwVehicleBiz'); if (vb) this.data.vehicleBusinessMiles = vb.value;
      const vt = document.getElementById('pctScwVehicleTotal'); if (vt) this.data.vehicleTotalMiles = vt.value;
      const hs = document.getElementById('pctScwHomeSqft'); if (hs) this.data.homeOfficeSqFt = hs.value;
      const ht = document.getElementById('pctScwHomeTotalSqft'); if (ht) this.data.homeTotalSqFt = ht.value;
      const eq = document.getElementById('pctScwEquipmentNote'); if (eq) this.data.equipmentNote = eq.value;
      const hp = document.getElementById('pctScwHelpersNote'); if (hp) this.data.helpersNote = hp.value;
    }
  };

  PCTScheduleCWizard.prototype.render = function () {
    let html;
    if (this.step === 0) html = this.screenIntro();
    else if (this.step === 1) html = this.screenIncome();
    else if (this.step === 2) html = this.screenExpenses();
    else if (this.step === 3) html = this.screenVehicleHome();
    else html = this.screenReveal();
    this.container.innerHTML = html;
    this.wire();
  };

  PCTScheduleCWizard.prototype.wire = function () {
    const self = this;
    const start = document.getElementById('pctScwStart');
    if (start) start.addEventListener('click', () => {
      const d = document.getElementById('pctScwDescription');
      self.data.businessDescription = d ? d.value.trim() : '';
      self.next();
    });
    const nextBtn = document.getElementById('pctScwNext');
    if (nextBtn) nextBtn.addEventListener('click', () => { self.collectScreen(); self.next(); });
    const backBtn = document.getElementById('pctScwBack');
    if (backBtn) backBtn.addEventListener('click', () => { self.collectScreen(); self.back(); });
    this.container.querySelectorAll('[data-scw-yn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-scw-yn'), val = btn.getAttribute('data-val') === 'true';
        if (self.step === 3) self.collectScreen();
        self.data[key] = val;
        self.render();
      });
    });
    const finish = document.getElementById('pctScwFinish');
    if (finish) finish.addEventListener('click', () => {
      self.commitToForm();
      finish.textContent = 'Saved to your return \u2713';
      finish.disabled = true;
      if (typeof window.toast === 'function') window.toast('Your organized numbers have been added to your Schedule C section.');
    });
    const download = document.getElementById('pctScwDownload');
    if (download) download.addEventListener('click', () => self.downloadPacket());
  };

  PCTScheduleCWizard.prototype.downloadPacket = function () {
    const income = this.totalIncome(), expenses = this.totalExpenses(), net = this.netProfit(), reported1099K = this.reported1099K();
    const incomeRows = INCOME_SOURCES.filter(s => num(this.data.income[s.id]) > 0).map(s =>
      '<tr><td>' + esc(s.label) + '</td><td class="amt">' + money(num(this.data.income[s.id])) + '</td></tr>').join('');
    const otherRow = num(this.data.otherIncomeAmount) > 0 ? '<tr><td>Other income</td><td class="amt">' + money(num(this.data.otherIncomeAmount)) + '</td></tr>' : '';
    const expenseRows = EXPENSE_CATEGORIES.filter(c => num(this.data.expenses[c.field]) > 0).map(c =>
      '<tr><td>' + esc(c.label) + '</td><td class="amt">' + money(num(this.data.expenses[c.field])) + '</td></tr>').join('');
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const doc = '<!doctype html><html><head><meta charset="utf-8"><title>Your Organized Income &amp; Expense Summary</title>' +
      '<style>' +
      'body{font-family:Georgia,\'Times New Roman\',serif;background:#faf6ee;color:#1c1a17;margin:0;padding:40px}' +
      '.sheet{max-width:720px;margin:0 auto;background:#fff;border:1px solid #d9c48f;border-radius:10px;padding:40px;box-shadow:0 6px 24px rgba(0,0,0,.08)}' +
      '.eyebrow{letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:#9a7b2e;font-weight:700;font-family:Arial,sans-serif}' +
      'h1{font-size:26px;margin:6px 0 2px}' +
      '.sub{color:#6b6357;font-size:13px;margin-bottom:24px;font-family:Arial,sans-serif}' +
      'h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#3a3226;border-bottom:2px solid #d9c48f;padding-bottom:6px;margin-top:28px;font-family:Arial,sans-serif}' +
      'table{width:100%;border-collapse:collapse;font-size:14px;font-family:Arial,sans-serif}' +
      'td{padding:7px 0;border-bottom:1px solid #eee2c9}' +
      'td.amt{text-align:right;font-weight:700}' +
      '.totals{margin-top:18px;background:#fff8e8;border:1px solid #d9c48f;border-radius:8px;padding:16px}' +
      '.totals .row{display:flex;justify-content:space-between;font-family:Arial,sans-serif;font-size:14px;padding:4px 0}' +
      '.totals .net{font-size:18px;font-weight:800;border-top:2px solid #d9c48f;margin-top:8px;padding-top:10px}' +
      '.foot{margin-top:28px;font-size:11px;color:#8a8171;font-family:Arial,sans-serif;line-height:1.5}' +
      '@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border:none}}' +
      '</style></head><body><div class="sheet">' +
      '<div class="eyebrow">PCT Pro Services &middot; Pro In Your Pocket&trade;</div>' +
      '<h1>Your Organized Income &amp; Expense Summary</h1>' +
      '<div class="sub">Prepared ' + esc(today) + (this.data.businessDescription ? ' &middot; ' + esc(this.data.businessDescription) : '') + '</div>' +
      '<h2>Money In</h2><table>' + incomeRows + otherRow + '</table>' +
      (reported1099K ? '<div class="sub" style="margin-top:12px;margin-bottom:0">Form 1099-K reported amount: <strong>' + money(reported1099K) + '</strong> (reference only; not added again to total income)</div>' : '') +
      '<h2>Money Out</h2><table>' + (expenseRows || '<tr><td colspan="2">No expenses entered</td></tr>') + '</table>' +
      '<div class="totals"><div class="row"><span>Total income</span><strong>' + money(income) + '</strong></div><div class="row"><span>Total expenses</span><strong>' + money(expenses) + '</strong></div><div class="row net"><span>Estimated profit</span><strong>' + money(net) + '</strong></div></div>' +
      '<div class="foot">This summary is organized from information you provided for your own recordkeeping and to help your tax preparation and Schedule C review. It is not a filed tax return and is not a final tax determination. Your PCT tax professional reviews all figures before anything is prepared or filed.</div>' +
      '</div></body></html>';
    const win = window.open('', '_blank');
    if (win) { win.document.write(doc); win.document.close(); return; }
    const blob = new Blob([doc], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'PCT-Income-Expense-Summary.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  window.PCTScheduleCWizard = {
    mount(container) {
      if (!container) return null;
      return new PCTScheduleCWizard(container);
    }
  };
}());
