(function () {
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); }); }
  function money(value) { return '$' + Number(value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
  function callable(name) { return typeof fb !== 'undefined' && fb.functions ? fb.functions.httpsCallable(name) : null; }
  function mount() {
    var host = document.getElementById('detailCard');
    if (!host || document.getElementById('adminEarningsControl')) return;
    var section = document.createElement('section');
    section.id = 'adminEarningsControl';
    section.className = 'securebox';
    section.innerHTML = '<div class="section-title"><h3>AGENT EARNINGS CONTROL</h3><span class="tag gold">MASTER ADMIN</span></div>' +
      '<p class="small">Review settled compensation and apply a documented positive or negative correction. Original calculations remain preserved.</p>' +
      '<div class="field-grid"><label>Agent UID filter (optional)<input id="adminAgentFilter" placeholder="Review one agent"></label><label>Ledger ID<input id="adminLedgerId" placeholder="Compensation ledger ID"></label><label>Adjustment amount<input id="adminEarningsAdjustment" type="number" step="0.01" placeholder="Example: -25.00"></label></div>' +
      '<label>Reason for adjustment<textarea id="adminEarningsReason" rows="2" maxlength="500" placeholder="Required audit reason"></textarea></label>' +
      '<button type="button" class="btn btn-gold btn-sm" id="adminApplyEarningsAdjustment">APPLY EARNINGS ADJUSTMENT</button> <button type="button" class="btn btn-soft btn-sm" id="adminLoadEarningsLedger">LOAD RECENT LEDGER</button><div id="adminEarningsResult" class="small" style="margin-top:8px"></div><div id="adminEarningsLedgerRows" class="small" style="margin-top:12px"></div>';
    host.appendChild(section);
    var result = section.querySelector('#adminEarningsResult');
    section.querySelector('#adminApplyEarningsAdjustment').onclick = function () {
      var call = callable('adjustAgentEarnings'), ledgerId = section.querySelector('#adminLedgerId').value.trim(), amount = Number(section.querySelector('#adminEarningsAdjustment').value), reason = section.querySelector('#adminEarningsReason').value.trim();
      if (!call) { result.textContent = 'Secure Functions are unavailable.'; return; }
      if (!ledgerId || !reason || !Number.isFinite(amount) || amount === 0) { result.textContent = 'Ledger ID, non-zero amount, and reason are required.'; return; }
      call({ledgerId: ledgerId, amount: amount, reason: reason}).then(function (response) { result.textContent = 'Adjustment saved. Adjusted agent earnings: ' + money(response.data.adjustedAgentEarnings); }).catch(function (error) { result.textContent = error.message || 'Adjustment failed.'; });
    };
    section.querySelector('#adminLoadEarningsLedger').onclick = function () {
      var call = callable('getAdminEarningsLedger'), rows = section.querySelector('#adminEarningsLedgerRows');
      if (!call) { rows.textContent = 'Secure Functions are unavailable.'; return; }
      rows.textContent = 'Loading ledger…';
      call({pageSize: 50, assignedPreparerId: section.querySelector('#adminAgentFilter').value.trim()}).then(function (response) { var records = response.data.records || []; rows.innerHTML = records.map(function (x) { return '<button type="button" class="btn btn-soft btn-sm" data-ledger="' + esc(x.ledgerId) + '" style="display:block;width:100%;text-align:left;margin:5px 0"><strong>' + esc(x.caseId || x.returnId || x.ledgerId) + '</strong> · ' + esc(x.assignedPreparerId || 'Unassigned') + ' · Original ' + money(x.agentEarnings) + ' · Adjusted ' + money(x.adjustedAgentEarnings) + ' · ' + esc(x.paymentStatus || 'unknown') + '</button>'; }).join('') || 'No compensation records found.'; rows.querySelectorAll('[data-ledger]').forEach(function (button) { button.onclick = function () { section.querySelector('#adminLedgerId').value = button.dataset.ledger; }; }); }).catch(function (error) { rows.textContent = error.message || 'Ledger unavailable.'; });
    };
  }
  window.addEventListener('DOMContentLoaded', function () { setTimeout(mount, 0); });
}());
