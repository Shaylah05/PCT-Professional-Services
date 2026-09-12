/* Shared, feature-gated dependent mini-profiles.  This is presentation and
   factual data collection only; it makes no dependency or credit decision. */
(function attachPCTIntakeDependentsV2(window, document) {
  'use strict';
  // PCT's V2 online intake capacity. This is not a tax-law eligibility limit.
  const MAX_DEPENDENTS = 10;
  const COPYABLE_FACT_KEYS = Object.freeze([
    'relationship', 'monthsLived', 'temporaryAbsence', 'supportDetails',
    'competingClaimant', 'custodyDetails', 'student', 'disability', 'marriedJointReturn'
  ]);
  const COPYABLE_NARRATIVE_IDS = new Set([
    'dependent_relationship_context', 'dependent_residency', 'dependent_temporary_absence',
    'dependent_possible_claimant', 'dependent_custody_arrangement'
  ]);
  const enabled = () => window.PCT_INTAKE_V2_CONFIG?.enabled === true && !!window.PCT_INTAKE_INTERVIEW_V2;
  const text = value => String(value ?? '').trim();
  const esc = value => text(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeId = value => String(value).replace(/[^A-Za-z0-9_-]/g, '-');
  const subjectId = () => `dep-${window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,14)}`}`;
  const narrative = () => window.PCT_INTAKE_NARRATIVE_V2;
  const count = state => Math.min(MAX_DEPENDENTS, Math.max(0, Number(state.numDeps) || 0));
  function ensureSubject(dependent) { if (!text(dependent.v2SubjectId)) dependent.v2SubjectId = subjectId(); return dependent.v2SubjectId; }
  function styles() {
    if (document.getElementById('pctV2DependentStyles')) return;
    const node = document.createElement('style'); node.id = 'pctV2DependentStyles'; node.textContent = `
      .pct-v2-dependent-card{grid-column:1/-1;margin:18px 0;padding:26px;border:1px solid #dac99e;border-radius:14px;background:#fffdf8;box-shadow:0 5px 18px rgba(46,36,16,.07)}
      .pct-v2-dependent-card legend{padding:0 8px;font-weight:800;letter-spacing:.06em;font-size:15px;color:#3b2b13}.pct-v2-dependent-section{margin:20px 0 0}.pct-v2-dependent-section h4{margin:0 0 12px;font-size:13px;letter-spacing:.12em;color:#765a23}.pct-v2-dependent-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pct-v2-dependent-grid .field{margin:0}.pct-v2-dependent-wide{grid-column:1/-1}.pct-v2-dependent-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.pct-v2-dependent-add{grid-column:1/-1;margin:8px 0 2px}.pct-v2-dependent-card textarea{min-height:150px;resize:vertical}.pct-v2-dependent-card :focus-visible{outline:3px solid #b18a25;outline-offset:2px}@media(max-width:680px){.pct-v2-dependent-card{padding:22px 16px}.pct-v2-dependent-grid{grid-template-columns:1fr}.pct-v2-dependent-wide{grid-column:auto}.pct-v2-dependent-actions .btn{width:100%;min-height:44px}}
    `; document.head.appendChild(node);
  }
  function option(value, label, selected) { return `<option value="${value}"${selected === value ? ' selected' : ''}>${label}</option>`; }
  function yesNo(label, key, dependent, id) { return `<div class="field"><label for="${id}-${key}">${label}</label><select id="${id}-${key}" data-pct-v2-dependent-key="${key}">${option('','Select',dependent[key])}${option('YES','Yes',dependent[key])}${option('NO','No',dependent[key])}${option('UNSURE','Not sure',dependent[key])}</select></div>`; }
  function cardMarkup(dependent, index) {
    const id = `pct-v2-dep-${safeId(ensureSubject(dependent))}`, name = text(dependent.fullName) || 'NEW DEPENDENT';
    return `<fieldset class="pct-v2-dependent-card" data-pct-v2-dependent-subject="${esc(dependent.v2SubjectId)}" data-pct-v2-dependent-index="${index}"><legend>DEPENDENT — <span data-pct-v2-dependent-name>${esc(name)}</span></legend>
      <section class="pct-v2-dependent-section"><h4>BASIC INFORMATION</h4><div class="pct-v2-dependent-grid">
        <div class="field"><label for="${id}-fullName">Full legal name</label><input id="${id}-fullName" data-pct-v2-dependent-key="fullName" value="${esc(dependent.fullName)}" autocomplete="off"></div>
        <div class="field"><label for="${id}-relationship">Relationship to taxpayer</label><input id="${id}-relationship" data-pct-v2-dependent-key="relationship" value="${esc(dependent.relationship)}" placeholder="Child, parent, other"></div>
        <div class="field"><label for="${id}-idType">SSN / ITIN status</label><select id="${id}-idType" data-pct-v2-dependent-key="idType">${option('','Select',dependent.idType)}${option('ssn','SSN',dependent.idType)}${option('itin','ITIN',dependent.idType)}${option('none','No SSN / ITIN yet',dependent.idType)}</select></div>
        <div class="field"><label for="${id}-idNumber">Full number</label><input id="${id}-idNumber" type="password" inputmode="numeric" maxlength="11" data-pct-v2-dependent-key="idNumber" value="${esc(dependent.idNumber)}" autocomplete="off"></div>
        <div class="field"><label for="${id}-dob">Date of birth</label><input id="${id}-dob" type="date" data-pct-v2-dependent-key="dob" value="${esc(dependent.dob)}" autocomplete="bday"></div>
        <div data-pct-v2-narrative-slot="basic" class="pct-v2-dependent-wide"></div>
      </div></section>
      <section class="pct-v2-dependent-section"><h4>RESIDENCY</h4><div class="pct-v2-dependent-grid">
        <div class="field"><label for="${id}-monthsLived">Months lived with taxpayer</label><input id="${id}-monthsLived" type="number" min="0" max="12" data-pct-v2-dependent-key="monthsLived" value="${esc(dependent.monthsLived)}" placeholder="0–12"></div>
        ${yesNo('Temporary absence during the year?', 'temporaryAbsence', dependent, id)}<div data-pct-v2-narrative-slot="residency" class="pct-v2-dependent-wide"></div>
      </div></section>
      <section class="pct-v2-dependent-section"><h4>SUPPORT</h4><div class="pct-v2-dependent-grid"><div class="field pct-v2-dependent-wide"><label for="${id}-supportDetails">Who provided most support?</label><input id="${id}-supportDetails" data-pct-v2-dependent-key="supportDetails" value="${esc(dependent.supportDetails)}" placeholder="Taxpayer, spouse, other"></div></div></section>
      <section class="pct-v2-dependent-section"><h4>OTHER POSSIBLE CLAIMANT</h4><div class="pct-v2-dependent-grid">${yesNo('Could another person claim this dependent?', 'competingClaimant', dependent, id)}<div class="field pct-v2-dependent-wide"><label for="${id}-custodyDetails">Custody, shared living, or competing-claim facts</label><textarea id="${id}-custodyDetails" data-pct-v2-dependent-key="custodyDetails" placeholder="Facts only. Leave blank if none.">${esc(dependent.custodyDetails)}</textarea></div><div data-pct-v2-narrative-slot="claimant" class="pct-v2-dependent-wide"></div></div></section>
      <section class="pct-v2-dependent-section"><h4>ADDITIONAL DETAILS</h4><div class="pct-v2-dependent-grid">${yesNo('Full-time student, if applicable?', 'student', dependent, id)}${yesNo('Permanent disability, if applicable?', 'disability', dependent, id)}${yesNo('Married / filing a joint return?', 'marriedJointReturn', dependent, id)}<div data-pct-v2-narrative-slot="additional" class="pct-v2-dependent-wide"></div></div></section>
      <div class="pct-v2-dependent-actions">${index > 0 ? '<div class="pct-v2-dependent-wide"><p class="small">If the household details are the same, you can reuse the previous dependent\'s answers and change anything that is different.</p><button type="button" class="btn btn-soft" data-pct-v2-copy-previous="'+index+'">COPY PREVIOUS DEPENDENT DETAILS</button></div>' : ''}<button type="button" class="btn btn-ghost" data-pct-v2-remove-dependent="${index}">REMOVE DEPENDENT</button></div>
    </fieldset>`;
  }
  function prepareCountControls() {
    document.querySelectorAll('select[data-bind="numDeps"]').forEach(node => {
      const five = [...node.options].find(option => option.value === '5');
      if (five && five.textContent.trim() === '5+') five.textContent = '5';
      for (let value = 5; value <= MAX_DEPENDENTS; value += 1) {
        if ([...node.options].some(option => option.value === String(value))) continue;
        const option = document.createElement('option'); option.value = String(value); option.textContent = String(value); option.dataset.pctV2DependentCount = 'true'; node.appendChild(option);
      }
    });
  }
  function syncCountControls(state) { prepareCountControls(); document.querySelectorAll('[data-bind="numDeps"]').forEach(node => { if (node.value !== String(state.numDeps)) node.value = String(state.numDeps); }); }
  function purge(state, dependent) { narrative()?.purgeDependentSubject?.(state, dependent); }
  function render(state, options = {}) {
    if (!enabled()) return false;
    const host = document.getElementById('returnDependentDetails'); if (!host) return false;
    styles(); const n = count(state); state.numDeps = String(n); state.dependentDetails ||= [];
    while (state.dependentDetails.length < n) state.dependentDetails.push({});
    state.dependentDetails.slice(0, n).forEach(ensureSubject);
    host.innerHTML = n ? `${state.dependentDetails.slice(0,n).map(cardMarkup).join('')}<div class="pct-v2-dependent-add">${n >= MAX_DEPENDENTS ? '<div class="hint">You have reached the current online intake limit of 10 dependents. Contact your preparer if additional dependent information is needed.</div>' : '<button type="button" class="btn btn-soft" data-pct-v2-add-dependent>+ ADD ANOTHER DEPENDENT</button>'}</div>` : `<div class="pct-v2-dependent-add"><p class="small">Add each dependent you expect to claim. Your preparer reviews the facts before filing.</p><button type="button" class="btn btn-soft" data-pct-v2-add-dependent>+ ADD ANOTHER DEPENDENT</button></div>`;
    bind(host, state, options); syncCountControls(state);
    if (state.v2PendingNarrativeAnswers) { state.v2NarrativeAnswers=state.v2PendingNarrativeAnswers; delete state.v2PendingNarrativeAnswers; }
    narrative()?.renderDependents?.(state); return true;
  }
  function requestSave(state, options) { if (typeof options.onChange === 'function') options.onChange(state); }
  function copyPreviousDependent(state, index) {
    const prior = state.dependentDetails?.[index - 1], current = state.dependentDetails?.[index];
    if (!prior || !current) return false;
    const newSubjectId = ensureSubject(current);
    COPYABLE_FACT_KEYS.forEach(key => { if (prior[key] !== undefined) current[key] = prior[key]; });
    const answers = state.v2NarrativeAnswers || {}, active = new Set((narrative()?.getVisibleQuestions?.(state) || [])
      .filter(item => item.subject?.subjectId === newSubjectId)
      .map(item => item.question?.questionId));
    const priorSubjectId = text(prior.v2SubjectId);
    if (priorSubjectId) Object.entries(answers).forEach(([key, row]) => {
      const questionId = text(row?.questionId);
      if (!COPYABLE_NARRATIVE_IDS.has(questionId) || !active.has(questionId) || text(row?.subject?.subjectId) !== priorSubjectId) return;
      answers[`${questionId}:${newSubjectId}`] = {
        ...row,
        subject: {...row.subject, subjectId: newSubjectId, subjectType: 'DEPENDENT', subjectNameSnapshot: text(current.fullName)},
        createdAtClient: new Date().toISOString()
      };
    });
    return true;
  }
  function bind(host, state, options) {
    host.querySelectorAll('[data-pct-v2-dependent-index]').forEach(card => card.querySelectorAll('[data-pct-v2-dependent-key]').forEach(input => {
      const index = Number(card.dataset.pctV2DependentIndex), key = input.dataset.pctV2DependentKey;
      const update = () => { const dependent = state.dependentDetails[index] ||= {}; dependent[key] = input.value; if (key === 'fullName') card.querySelector('[data-pct-v2-dependent-name]').textContent = text(input.value) || 'NEW DEPENDENT'; narrative()?.renderDependents?.(state); };
      input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', update);
      input.addEventListener('change', () => requestSave(state, options));
    }));
    host.querySelector('[data-pct-v2-add-dependent]')?.addEventListener('click', () => { if (count(state) >= MAX_DEPENDENTS) return; state.dependentDetails ||= []; state.dependentDetails.push({v2SubjectId:subjectId()}); state.numDeps=String(count(state)+1); render(state,options); requestSave(state,options); });
    host.querySelectorAll('[data-pct-v2-copy-previous]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.pctV2CopyPrevious);
      if (!copyPreviousDependent(state, index)) return;
      render(state, options); requestSave(state, options);
    }));
    host.querySelectorAll('[data-pct-v2-remove-dependent]').forEach(button => button.addEventListener('click', () => { const index=Number(button.dataset.pctV2RemoveDependent), dependent=state.dependentDetails?.[index]; if (!dependent || !window.confirm('Removing this dependent will also remove the information you entered for them. Continue?')) return; purge(state,dependent); state.dependentDetails.splice(index,1); state.numDeps=String(Math.max(0,count(state)-1)); render(state,options); requestSave(state,options); }));
  }
  function setCount(state, requestedCount, options = {}) {
    if (!enabled()) return false;
    const previous=Math.min(MAX_DEPENDENTS,Math.max(0,Array.isArray(state.dependentDetails) ? state.dependentDetails.length : count(state))), next=Math.min(MAX_DEPENDENTS,Math.max(0,Number(requestedCount)||0));
    if (next < previous && !window.confirm('Removing dependent profiles will also remove the information entered for them. Continue?')) { state.numDeps=String(previous); state.v2DependentCountRejected=true; syncCountControls(state); return true; }
    state.dependentDetails ||= [];
    if (next < previous) state.dependentDetails.slice(next,previous).forEach(dependent => purge(state,dependent));
    state.dependentDetails=state.dependentDetails.slice(0,next); while(state.dependentDetails.length<next) state.dependentDetails.push({v2SubjectId:subjectId()}); state.numDeps=String(next); render(state,options); requestSave(state,options); return true;
  }
  function draftPayload(state) {
    if (!enabled()) return null;
    const dependents=(state.dependentDetails||[]).slice(0,count(state)).map(dependent => ({v2SubjectId:ensureSubject(dependent),relationship:text(dependent.relationship),monthsLived:text(dependent.monthsLived),temporaryAbsence:text(dependent.temporaryAbsence),competingClaimant:text(dependent.competingClaimant),custodyDetails:text(dependent.custodyDetails)}));
    const narratives=Object.values(state.v2NarrativeAnswers||{}).filter(row=>text(row?.answer)).map(row=>({questionId:text(row.questionId),questionVersion:text(row.questionVersion),category:text(row.category),answer:text(row.answer),subject:{subjectId:text(row.subject?.subjectId),subjectType:text(row.subject?.subjectType)},createdAtClient:row.createdAtClient||new Date().toISOString()}));
    return {intakeInterviewVersion:window.PCT_INTAKE_INTERVIEW_V2.version,dependents,v2NarrativeResponses:narratives};
  }
  function restoreDraft(state, draft) {
    if (!enabled() || !draft || draft.intakeInterviewVersion !== window.PCT_INTAKE_INTERVIEW_V2.version) return false;
    const rows=Array.isArray(draft.dependents)?draft.dependents.slice(0,MAX_DEPENDENTS):[];
    state.dependentDetails=rows.map(row=>({v2SubjectId:text(row.v2SubjectId),relationship:text(row.relationship),monthsLived:text(row.monthsLived),temporaryAbsence:text(row.temporaryAbsence),competingClaimant:text(row.competingClaimant),custodyDetails:text(row.custodyDetails)}));
    state.numDeps=String(rows.length); state.v2NarrativeAnswers={}; const restoredAnswers={};
    (Array.isArray(draft.v2NarrativeResponses)?draft.v2NarrativeResponses:[]).forEach(row=>{const subject=row?.subject||{}, key=`${text(row.questionId)}:${text(subject.subjectId)||'return'}`;if(text(row.questionId)&&text(row.answer))restoredAnswers[key]={questionId:text(row.questionId),questionVersion:text(row.questionVersion),category:text(row.category),answer:text(row.answer),subject:{subjectId:text(subject.subjectId),subjectType:text(subject.subjectType)||'RETURN'},createdAtClient:row.createdAtClient||new Date().toISOString()};}); state.v2PendingNarrativeAnswers=restoredAnswers;
    return true;
  }
  window.PCT_INTAKE_DEPENDENTS_V2=Object.freeze({enabled,render,setCount,draftPayload,restoreDraft,prepareCountControls,maxDependents:MAX_DEPENDENTS});
})(window, document);
