/* PCT Intake J1 — explicit, client-facing filing-intake navigation. */
(function attachPCTIntakeWizardJ1(window, document) {
  'use strict';

  const one = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const stages = Object.freeze([
    'YOUR TAX SITUATION', 'MORE TAX DETAILS', 'ANYTHING ELSE TO SHARE',
    'YOUR IDENTITY DETAILS', 'YOUR TAX DETAILS', 'YOUR AUTHORIZATION', 'YOUR CHECKLIST'
  ]);
  const stageNumber = () => Math.min(stages.length, Math.max(1, Number(state?.intakeWizardStep) || 1));

  function setHidden(node, hidden) {
    if (node) node.hidden = hidden;
  }

  function focusStage(stage) {
    const selectors = {
      1: '[data-organizer-step="1"] h3', 2: '[data-organizer-step="2"] h3', 3: '[data-organizer-step="3"] h3',
      4: '#returnIdentityDetails h3', 5: '#phase17Interview h3', 6: '#phase17ConsentSteps h3', 7: '#expectedChecklist h3'
    };
    const heading = one(selectors[stage]);
    if (!heading) return;
    heading.tabIndex = -1;
    window.scrollTo({top: 0, behavior: 'smooth'});
    heading.focus({preventScroll: true});
  }

  function renderProgress(stage) {
    const host = one('#pctJ1IntakeProgress');
    if (!host) return;
    host.replaceChildren();
    stages.forEach((label, index) => {
      const step = index + 1, item = document.createElement('span');
      item.textContent = `${step}. ${label}`;
      item.className = step < stage ? 'done' : step === stage ? 'active' : '';
      if (step === stage) item.setAttribute('aria-current', 'step');
      host.append(item);
    });
  }

  function renderRefundOptions() {
    const advance = String(state?.phase17RefundAdvanceInterest || ''), transfer = String(state?.phase17RefundTransferInterest || '');
    all('[data-pct-j1-refund-advance]').forEach(control => { if (control.value !== advance) control.value = advance; });
    all('[data-pct-j1-pay-by-refund]').forEach(transferHost => {
      if (advance === 'NO') {
        transferHost.innerHTML = '<div class="field"><label>Would you like our $0 upfront-to-file option?</label><p class="small">Your tax preparation fees can be deducted from your refund instead of being paid upfront.</p><select data-pct-j1-refund-transfer onchange="pctJ1SetRefundTransfer(this.value)"><option value="">Select one</option><option value="YES">Yes</option><option value="NO">No</option></select></div>';
        const transferControl = transferHost.querySelector('[data-pct-j1-refund-transfer]');
        if (transferControl) transferControl.value = transfer;
      } else {
        transferHost.replaceChildren();
      }
    });
    window.phase17RenderBankConsent?.();
  }

  function showStage(requested, options = {}) {
    const stage = Math.min(stages.length, Math.max(1, Number(requested) || 1)), screen = one('#screen-organizer');
    if (!screen || !state) return;
    state.intakeWizardStep = stage;
    all('#screen-organizer .organizer-question').forEach(node => setHidden(node, Number(node.dataset.organizerStep) !== stage));
    const business = one('#businessOrganizer');
    setHidden(business, !(stage === 3 && state.organizerFlags?.business));
    if (stage === 3 && state.organizerFlags?.business) {
      state.businessOrganizerOpened = true;
      business?.classList.add('show');
    }
    setHidden(one('#returnIdentityDetails'), stage !== 4);
    setHidden(one('#expectedChecklist'), stage !== 7);
    const interview = one('#phase17Interview'), consent = one('#phase17ConsentSteps');
    setHidden(interview, stage !== 5 && stage !== 6);
    if (interview) [...interview.children].forEach(child => {
      if (child === consent) return;
      setHidden(child, stage === 6);
    });
    setHidden(consent, stage !== 6);
    if (stage <= 3) window.organizerSetStep?.(stage);
    if (stage === 4) window.renderReturnDependentDetails?.();
    if (stage === 6) window.phase17RenderBankConsent?.();
    if (stage === 7) { state.expectedChecklistOpened = true; window.renderExpectedChecklist?.(); }
    const card = screen.querySelector('.organizer-card'), row = card?.querySelector(':scope > .btn-row'), back = row?.querySelector('.btn-ghost'), next = row?.querySelector('.btn-primary');
    if (back) back.textContent = stage === 1 ? '← Back to start' : '← Back';
    if (next) next.textContent = stage === 7 ? 'REVIEW YOUR INTAKE' : 'Continue';
    setHidden(screen.querySelector('.back-link'), true);
    renderProgress(stage);
    if (options.focus !== false) focusStage(stage);
  }

  function currentSectionReady(stage) {
    if (stage === 4) return window.validateIdentityDetails?.() !== false;
    if (stage === 5) {
      if (!state.phase17Proceed) { window.toast?.('Choose “Yes, I’m ready to continue” when you are ready for the next step.'); return false; }
      if (!state.phase17ClientAttestation) { window.toast?.('Please confirm that the information you shared is complete to the best of your knowledge.'); return false; }
    }
    if (stage === 6) return window.validatePhase17FilingIntake?.() !== false;
    if (stage === 7) {
      if (!one('#completenessConfirm')?.checked) { window.toast?.('Please review your checklist and confirm what you have today before continuing.'); return false; }
      state.completenessConfirmed = true;
      state.completenessConfirmedAt = state.completenessConfirmedAt || new Date().toISOString();
    }
    return true;
  }

  function next() {
    const stage = stageNumber();
    if (!currentSectionReady(stage)) return;
    if (stage < stages.length) { showStage(stage + 1); return; }
    window.renderReturnDependentDetails?.();
    if (window.PCT_INTAKE_REVIEW_V2?.enabled?.()) { window.pctV2OpenReview?.(); return; }
    window.goUpload?.(state.documentSource || 'organizer');
  }

  function back() {
    const stage = stageNumber();
    if (stage <= 1) { window.showScreen?.('screen-home'); return; }
    showStage(stage - 1);
  }

  function install() {
    const screen = one('#screen-organizer'), card = screen?.querySelector('.organizer-card');
    if (!screen || !card || window.__pctIntakeWizardJ1Installed) return;
    window.__pctIntakeWizardJ1Installed = true;
    const progress = document.createElement('nav');
    progress.id = 'pctJ1IntakeProgress';
    progress.className = 'pct-j1-intake-progress';
    progress.setAttribute('aria-label', 'Filing intake progress');
    card.querySelector('.section-head')?.insertAdjacentElement('afterend', progress);
    const style = document.createElement('style');
    style.textContent = '.pct-j1-intake-progress{display:flex;gap:7px;overflow-x:auto;margin:0 0 20px;padding:2px 0 10px;border-bottom:1px solid var(--line)}.pct-j1-intake-progress span{flex:0 0 auto;border:1px solid var(--line);border-radius:999px;background:#fff;padding:7px 10px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.04em}.pct-j1-intake-progress span.active{border-color:var(--gold);background:#fff3cf;color:#5f4510}.pct-j1-intake-progress span.done{border-color:#b8d4c1;background:var(--green-soft);color:var(--green)}#screen-organizer [hidden]{display:none!important}@media(max-width:620px){.pct-j1-intake-progress{margin-left:-4px;margin-right:-4px}.organizer-card>.btn-row{display:grid}.organizer-card>.btn-row .btn{width:100%;min-height:44px}}';
    document.head.append(style);
    const originalShowScreen = window.showScreen;
    window.showScreen = function patchedShowScreen(id) {
      const result = originalShowScreen.apply(this, arguments);
      if (id === 'screen-organizer') showStage(stageNumber(), {focus: false});
      return result;
    };
    const originalGoUpload = window.goUpload;
    window.goUpload = function patchedGoUpload(source) {
      if (!state.completenessConfirmed) state.intakeWizardStep = 1;
      const result = originalGoUpload.apply(this, arguments);
      if (!state.completenessConfirmed) showStage(1, {focus: false});
      return result;
    };
    const originalReviewEdit = window.pctV2ReviewEdit;
    window.pctV2ReviewEdit = function patchedReviewEdit(section) {
      const result = originalReviewEdit.apply(this, arguments);
      if (['dependents', 'business', 'other'].includes(section)) showStage(section === 'dependents' ? 4 : 3);
      return result;
    };
    window.organizerNext = next;
    window.intakeWizardBack = back;
    window.pctJ1SetRefundAdvance = value => {
      const previous = String(state.phase17RefundAdvanceInterest || '');
      state.phase17RefundAdvanceInterest = value;
      state.phase17RefundTransferInterest = value === 'YES' ? 'NO' : value === '' || previous === 'YES' ? '' : state.phase17RefundTransferInterest;
      renderRefundOptions();
    };
    window.pctJ1SetRefundTransfer = value => {
      state.phase17RefundTransferInterest = value;
      renderRefundOptions();
    };
    renderRefundOptions();
    showStage(stageNumber(), {focus: false});
  }

  document.addEventListener('DOMContentLoaded', install);
})(window, document);
