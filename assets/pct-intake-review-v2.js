/* Shared, feature-gated V2 intake review. It is a read-only view of current browser state. */
(function attachPCTIntakeReviewV2(window, document) {
  'use strict';
  const enabled = () => window.PCT_INTAKE_V2_CONFIG?.enabled === true;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const text = value => String(value ?? '').trim();
  const dependentLimit = () => Number(window.PCT_INTAKE_DEPENDENTS_V2?.maxDependents || 10);
  const filingLabel = value => ({single:'Single',mfj:'Married Filing Jointly',mfs:'Married Filing Separately',hoh:'Head of Household',qss:'Qualifying Surviving Spouse'})[text(value).toLowerCase()] || 'Not provided';
  const categorySection = category => {
    if (/^DEPENDENT/.test(category)) return 'dependents';
    if (/^HOUSEHOLD|^FILING_STATUS/.test(category)) return 'filing';
    if (/^BUSINESS/.test(category)) return 'business';
    if (/^EDUCATION/.test(category)) return 'education';
    if (/^INCOME/.test(category)) return 'income';
    return 'other';
  };
  function installStyle() {
    if (document.getElementById('pctV2ReviewStyle')) return;
    const style = document.createElement('style'); style.id = 'pctV2ReviewStyle';
    style.textContent = '.pct-v2-review{max-width:930px;margin:0 auto;padding:28px 18px 56px}.pct-v2-review-head{margin-bottom:22px}.pct-v2-review-head h1{margin:0 0 8px}.pct-v2-review-card{margin:14px 0;padding:18px;border:1px solid #e0d8c7;border-radius:14px;background:#fff}.pct-v2-review-card-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between}.pct-v2-review-card h2{font-size:1.1rem;margin:0}.pct-v2-review-status{display:inline-block;margin-top:7px;padding:4px 8px;border-radius:999px;background:#eaf6ef;color:#205c38;font-size:.74rem;font-weight:800;letter-spacing:.04em}.pct-v2-review-status.attention{background:#fff4df;color:#75520a}.pct-v2-review-edit{flex:0 0 auto;min-height:40px}.pct-v2-review-summary{margin:14px 0 0;line-height:1.55}.pct-v2-review-list{margin:12px 0 0;padding-left:20px;line-height:1.55}.pct-v2-review-dependent,.pct-v2-review-answer{margin-top:14px;padding:14px;border-radius:10px;background:#faf8f3}.pct-v2-review-dependent h3{margin:0 0 8px;font-size:1rem}.pct-v2-review-answer-label{font-size:.76rem;font-weight:800;letter-spacing:.05em;color:#604516}.pct-v2-review-answer-question{margin:6px 0;font-weight:700}.pct-v2-review-answer pre{margin:8px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.5}.pct-v2-review-submit{margin-top:24px;padding:22px;border-radius:14px;background:#f8f3e6}.pct-v2-review-submit h2{margin-top:0}.pct-v2-review-message{margin:12px 0 0;color:#8b251c;font-weight:700}.pct-v2-review-empty{color:#665f52}.pct-v2-review-screen{background:var(--cream,#f7f4ed)}@media(max-width:640px){.pct-v2-review{padding:20px 14px 40px}.pct-v2-review-card-head{align-items:stretch;flex-direction:column}.pct-v2-review-edit{width:100%}}';
    document.head.appendChild(style);
  }
  function questionsBySection(state) {
    const narrative = window.PCT_INTAKE_NARRATIVE_V2;
    const answers = state.v2NarrativeAnswers || {};
    const groups = {filing:[],dependents:[],income:[],business:[],education:[],other:[]};
    (narrative?.getVisibleQuestions?.(state) || []).forEach(item => {
      const answer = text(answers[item.key]?.answer);
      groups[categorySection(item.question.category)].push({...item, answer});
    });
    return groups;
  }
  function requiredIssue(state) {
    const narrative = window.PCT_INTAKE_NARRATIVE_V2;
    const prepared = narrative?.prepareSubmission?.(state) || {ok:true};
    if (prepared.ok) return null;
    const item = (narrative?.getVisibleQuestions?.(state) || []).find(candidate => candidate.key === prepared.focusKey);
    return {section:item ? categorySection(item.question.category) : 'other', focusKey:prepared.focusKey || '', message:prepared.message || 'Please complete the requested details before submitting.'};
  }
  function status(label, attention) { return `<span class="pct-v2-review-status${attention ? ' attention' : ''}">${attention ? 'NEEDS YOUR ATTENTION' : label}</span>`; }
  function card({title, section, summary, body, attention, edit}) {
    return `<section class="pct-v2-review-card"><div class="pct-v2-review-card-head"><div><h2>${esc(title)}</h2>${status(attention ? '': 'COMPLETE', attention)}</div><button class="btn btn-ghost pct-v2-review-edit" type="button" data-pct-v2-review-edit="${esc(section)}">EDIT</button></div><div class="pct-v2-review-summary">${summary}</div>${body || ''}</section>`;
  }
  function narrativeMarkup(items) {
    if (!items.length) return '';
    return items.map(item => `<div class="pct-v2-review-answer"><div class="pct-v2-review-answer-label">YOUR ANSWER</div><div class="pct-v2-review-answer-question">${esc(item.question.questionText)}</div>${item.answer ? `<pre>${esc(item.answer)}</pre>` : '<div class="pct-v2-review-empty">This detail still needs your attention.</div>'}</div>`).join('');
  }
  function dependentMarkup(state, items) {
    const dependents = (state.dependentDetails || []).slice(0, Math.min(dependentLimit(), Number(state.numDeps) || 0));
    if (!dependents.length) return '<div class="pct-v2-review-empty">No dependents were added.</div>';
    return dependents.map((dependent, index) => {
      const subjectItems = items.filter(item => item.subject.subjectId === dependent.v2SubjectId);
      const facts = [
        dependent.relationship && `Relationship: ${esc(dependent.relationship)}`,
        text(dependent.monthsLived) !== '' && `Months lived: ${esc(dependent.monthsLived)}`,
        dependent.temporaryAbsence && `Temporary absence: ${esc(dependent.temporaryAbsence)}`,
        dependent.competingClaimant && `Possible other claimant: ${esc(dependent.competingClaimant)}`
      ].filter(Boolean);
      return `<div class="pct-v2-review-dependent"><h3>DEPENDENT ${index + 1}${dependent.fullName ? ` — ${esc(dependent.fullName)}` : ''}</h3>${facts.length ? `<ul class="pct-v2-review-list">${facts.map(fact => `<li>${fact}</li>`).join('')}</ul>` : '<div class="pct-v2-review-empty">Basic dependent information is incomplete.</div>'}${narrativeMarkup(subjectItems)}</div>`;
    }).join('');
  }
  function otherFlags(state) {
    const labels = {marketplace:'Marketplace coverage',rental:'Rental activity',k1:'K-1 income',gambling:'Gambling income',stockCrypto:'Stock or digital asset activity',foreignAccounts:'Foreign accounts or income',multiState:'Multiple state activity',amended:'Amended return review',extension:'Extension request'};
    return Object.entries(state.organizerFlags || state.flags || {}).filter(([,value]) => value === true).map(([key]) => labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase()));
  }
  function ensureScreen() {
    let screen = document.getElementById('screen-v2-review');
    if (screen) return screen;
    screen = document.createElement('section'); screen.id = 'screen-v2-review'; screen.className = 'screen pct-v2-review-screen';
    document.body.appendChild(screen); return screen;
  }
  function render(state, hooks) {
    const screen = ensureScreen(), groups = questionsBySection(state), issue = requiredIssue(state);
    const personalComplete = ['firstName','lastName','email','phone'].every(key => text(state[key]));
    const address = [state.taxpayerStreet,state.taxpayerCity,state.state,state.taxpayerZip].filter(text).map(esc).join(', ');
    const filingComplete = !!text(state.filingStatus);
    const docs = state.documents || [], expected = typeof window.expectedInformation === 'function' ? window.expectedInformation() : [];
    const provided = Object.values(state.checklistResponses || {}).filter(row => row?.status === 'provided').length;
    const missing = Math.max(0, expected.length - provided);
    const businessSelected = state.flags?.selfEmployment === true || state.organizerFlags?.business === true;
    const flagNames = otherFlags(state);
    const sections = [
      card({title:'Personal Information',section:'personal',attention:!personalComplete,summary:`<strong>${esc([state.firstName,state.lastName].filter(text).join(' ') || 'Name not provided')}</strong><br>${esc(state.email || 'Email not provided')}<br>${esc(state.phone || 'Phone not provided')}${address ? `<br>${address}` : ''}`}),
      card({title:'Filing Status + Household',section:'filing',attention:!filingComplete || issue?.section === 'filing',summary:`Filing status: <strong>${esc(filingLabel(state.filingStatus))}</strong>`,body:narrativeMarkup(groups.filing)}),
      card({title:'Dependents',section:'dependents',attention:issue?.section === 'dependents',summary:`${Math.min(dependentLimit(), Number(state.numDeps) || 0)} dependent${Number(state.numDeps) === 1 ? '' : 's'} included for review.`,body:dependentMarkup(state, groups.dependents)}),
      card({title:'Income',section:'income',attention:issue?.section === 'income',summary:`Income information: ${text(state.incomeSource) ? esc(state.incomeSource) : 'Review the income documents and details you provided.'}`,body:narrativeMarkup(groups.income)}),
      card({title:'Self-Employment / Business',section:'business',attention:issue?.section === 'business',summary:businessSelected ? 'Business or self-employment information was selected for preparer review.' : 'Not applicable based on the current intake selections.',body:businessSelected ? narrativeMarkup(groups.business) : ''}),
      card({title:'Education / Credits',section:'education',attention:issue?.section === 'education',summary:groups.education.length ? 'Education information needing additional context is included below.' : 'No V2 education narrative is currently requested.',body:narrativeMarkup(groups.education)}),
      card({title:'Other Tax Situations',section:'other',attention:issue?.section === 'other',summary:flagNames.length ? `Selected items: ${esc(flagNames.join(', '))}` : 'No additional organizer items are selected for this review.',body:narrativeMarkup(groups.other)}),
      card({title:'Documents',section:'documents',attention:docs.length === 0 || missing > 0,summary:docs.length ? `${docs.length} document${docs.length === 1 ? '' : 's'} added for secure upload.` : 'No documents have been added yet.',body:`${docs.length ? `<ul class="pct-v2-review-list">${docs.map(doc => `<li>${esc(doc.originalFileName || 'Document')} ${doc.documentType ? `— ${esc(doc.documentType)}` : ''}</li>`).join('')}</ul>` : ''}${missing > 0 ? `<div class="pct-v2-review-empty">${missing} checklist item${missing === 1 ? '' : 's'} may still need attention.</div>` : ''}`})
    ];
    screen.innerHTML = `<div class="pct-v2-review"><header class="pct-v2-review-head"><div class="kicker">PCT PRO SERVICES</div><h1>REVIEW YOUR INTAKE</h1><p>Please review your information before submitting it to your preparer. You can go back and make changes to any section.</p><p>Your tax preparer may contact you if additional information or documentation is needed.</p></header>${sections.join('')}<section class="pct-v2-review-submit"><h2>READY TO SEND TO YOUR PREPARER?</h2><p>By submitting your intake, you’re sending the information and documents you provided to your tax preparer for review. Your preparer may contact you if additional information is needed before your return can be completed.</p><button type="button" class="btn btn-gold" data-pct-v2-review-submit>SUBMIT MY INTAKE</button><div class="pct-v2-review-message" aria-live="polite"></div></section></div>`;
    screen.querySelectorAll('[data-pct-v2-review-edit]').forEach(button => button.addEventListener('click', () => hooks.edit(button.dataset.pctV2ReviewEdit)));
    screen.querySelector('[data-pct-v2-review-submit]').addEventListener('click', () => {
      const currentIssue = requiredIssue(state), message = screen.querySelector('.pct-v2-review-message');
      if (currentIssue) { message.textContent = `Please complete the additional details requested in the ${({filing:'Filing Status + Household',dependents:'Dependents',income:'Income',business:'Self-Employment / Business',education:'Education / Credits',other:'Other Tax Situations'})[currentIssue.section] || 'intake'} section before submitting your intake.`; hooks.edit(currentIssue.section, currentIssue.focusKey); return; }
      hooks.continueToUpload();
    });
    return screen;
  }
  function open(state, hooks) { if (!enabled()) return false; installStyle(); render(state, hooks); hooks.showScreen('screen-v2-review'); return true; }
  window.PCT_INTAKE_REVIEW_V2 = Object.freeze({enabled, open});
})(window, document);
