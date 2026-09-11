/* Shared, feature-gated taxpayer narrative renderer.  It gathers facts only;
   it never makes eligibility, credit, filing-status, or due-diligence decisions. */
(function attachPCTIntakeNarrativeV2(window, document) {
  'use strict';
  const DEFINITION = () => window.PCT_INTAKE_INTERVIEW_V2;
  const enabled = () => window.PCT_INTAKE_V2_CONFIG?.enabled === true && !!DEFINITION();
  const MAX = () => Number(DEFINITION()?.narrativeMaxLength || 12000);
  const dependentLimit = () => Number(window.PCT_INTAKE_DEPENDENTS_V2?.maxDependents || 10);
  const education = () => window.PCT_INTAKE_EDUCATION_V2;
  const routineRelationship = new Set(['child','son','daughter','stepchild','foster child','brother','sister','parent','grandparent','niece','nephew']);
  const deferredQuestionIds = new Set([
    'dependent_support_context','education_student_context','education_document_difference','business_income_context',
    'business_expense_context','income_inconsistency','marketplace_household_changes','other_tax_situation'
  ]);
  const renderedQuestionIds = new Set([
    'dependent_relationship_context','dependent_residency','dependent_temporary_absence',
    'dependent_possible_claimant','dependent_custody_arrangement',
    'hoh_household_members','hoh_household_expenses','marital_living_arrangement',
    'business_activity_context','business_cash_income','business_recordkeeping','missing_tax_document'
  ]);
  const text = value => String(value ?? '').trim();
  const upper = value => text(value).toUpperCase();
  const uuid = () => {
    if (window.crypto?.randomUUID) return `dep-${window.crypto.randomUUID()}`;
    return `dep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  };
  const currentAnswers = state => state.v2NarrativeAnswers ||= {};
  const dependentSubject = (state, index) => {
    const dependent = (state.dependentDetails ||= [])[index] ||= {};
    if (!text(dependent.v2SubjectId)) dependent.v2SubjectId = uuid();
    return {subjectId: dependent.v2SubjectId, subjectType: 'DEPENDENT', subjectNameSnapshot: text(dependent.fullName)};
  };
  const showDependent = (questionId, dependent) => {
    const relationship = text(dependent.relationship).toLowerCase();
    const months = Number(dependent.monthsLived);
    const absence = upper(dependent.temporaryAbsence);
    const claimant = upper(dependent.competingClaimant);
    switch (questionId) {
      case 'dependent_relationship_context': return !!relationship && (!routineRelationship.has(relationship) || ['other','unclear','unsure','unknown'].includes(relationship));
      case 'dependent_residency': return (text(dependent.monthsLived) !== '' && Number.isFinite(months) && months < 12) || ['YES','UNSURE'].includes(absence);
      case 'dependent_temporary_absence': return absence === 'YES';
      case 'dependent_possible_claimant': return ['YES','UNSURE'].includes(claimant);
      case 'dependent_custody_arrangement': return !!text(dependent.custodyDetails) || ['YES','UNSURE'].includes(claimant);
      default: return false;
    }
  };
  const showReturn = (questionId, state) => {
    const filing = text(state.filingStatus).toLowerCase();
    switch (questionId) {
      case 'hoh_household_members':
      case 'hoh_household_expenses': return filing === 'hoh';
      case 'marital_living_arrangement': return filing === 'mfs' || filing === 'hoh';
      case 'business_activity_context': return state.flags?.selfEmployment === true;
      case 'business_cash_income': return Number(state.businessCashIncome) > 0;
      case 'business_recordkeeping': return ['NO','UNSURE'].includes(upper(state.phase17ScheduleC_recordkeeping));
      case 'missing_tax_document': return !!text(state.missingTaxDocNotes) || ['NO','UNSURE'].includes(upper(state.allTaxDocsConfirmed));
      default: return false;
    }
  };
  function visibleQuestions(state) {
    const result = [];
    const questions = DEFINITION()?.questions || [];
    for (const question of questions) {
      if (deferredQuestionIds.has(question.questionId)) continue;
      if (question.subjectType === 'DEPENDENT') {
        (state.dependentDetails || []).slice(0, Math.min(dependentLimit(), Number(state.numDeps) || 0)).forEach((dependent, index) => {
          if (showDependent(question.questionId, dependent || {})) result.push({question, subject: dependentSubject(state, index)});
        });
      } else if (showReturn(question.questionId, state)) {
        result.push({question, subject: {subjectType: 'RETURN'}});
      }
    }
    return result;
  }
  function keyFor(item) { return `${item.question.questionId}:${item.subject.subjectId || 'return'}`; }
  function clearDependentNarrativeSubjects(state) {
    const answers = currentAnswers(state);
    (state.dependentDetails || []).forEach(dependent => {
      const subjectId = text(dependent?.v2SubjectId);
      if (subjectId) Object.keys(answers).forEach(key => { if (key.endsWith(`:${subjectId}`)) delete answers[key]; });
      if (dependent) delete dependent.v2SubjectId;
    });
    state.v2NarrativeDependentCount = 0;
  }
  function purgeDependentSubject(state, dependent) {
    const answers = currentAnswers(state), subjectId = text(dependent?.v2SubjectId);
    if (subjectId) Object.keys(answers).forEach(key => { if (key.endsWith(`:${subjectId}`)) delete answers[key]; });
    if (dependent) delete dependent.v2SubjectId;
  }
  function reconcileDependentSubjects(state) {
    const count = Math.min(dependentLimit(), Number(state.numDeps) || 0), previous = Number(state.v2NarrativeDependentCount || 0), answers = currentAnswers(state);
    if (count < previous) (state.dependentDetails || []).slice(count, previous).forEach(dependent => {
      purgeDependentSubject(state, dependent);
    });
    state.v2NarrativeDependentCount = count;
  }
  function safeId(value) { return value.replace(/[^a-z0-9_-]/gi, '-'); }
  function makeBlock(item, state) {
    const key = keyFor(item), question = item.question, id = `pct-v2-${safeId(key)}`;
    const section = document.createElement('section');
    section.className = 'field pct-v2-narrative'; section.dataset.pctV2Key = key;
    section.style.cssText = 'grid-column:1/-1;margin-top:12px;padding:16px;border:1px solid #dac99e;border-radius:10px;background:#fffdf8';
    const heading = document.createElement('div'); heading.className = 'kicker'; heading.textContent = DEFINITION().narrativeHelper.heading;
    const label = document.createElement('label'); label.htmlFor = id; label.textContent = question.questionText;
    const helper = document.createElement('div'); helper.id = `${id}-helper`; helper.className = 'hint'; helper.textContent = question.helperText;
    const textarea = document.createElement('textarea'); textarea.id = id; textarea.rows = 5; textarea.required = question.requiredWhenShown === true;
    textarea.setAttribute('aria-describedby', `${id}-helper ${id}-count ${id}-error`);
    textarea.style.cssText = 'min-height:150px;resize:vertical'; textarea.value = text(currentAnswers(state)[key]?.answer);
    const count = document.createElement('div'); count.id = `${id}-count`; count.className = 'hint';
    const error = document.createElement('div'); error.id = `${id}-error`; error.className = 'err-msg'; error.setAttribute('aria-live', 'polite');
    const grow = () => { textarea.style.height = 'auto'; textarea.style.height = `${Math.max(150, textarea.scrollHeight)}px`; };
    const refresh = () => { const length = textarea.value.length; count.textContent = `${length.toLocaleString()} / ${MAX().toLocaleString()} characters`; error.textContent = length > MAX() ? `Please shorten your answer to ${MAX().toLocaleString()} characters or fewer.` : ''; };
    textarea.addEventListener('input', () => { currentAnswers(state)[key] = {answer: textarea.value, questionId: question.questionId, questionVersion: question.questionVersion, displayedQuestionText: question.questionText, category: question.category, subject: item.subject, createdAtClient: currentAnswers(state)[key]?.createdAtClient || new Date().toISOString()}; refresh(); grow(); });
    const educationPanel = education()?.forNarrative?.(state);
    if (educationPanel) section.appendChild(educationPanel);
    section.append(heading, label, helper, textarea, count, error); refresh(); requestAnimationFrame(grow); return section;
  }
  function renderDependents(state) {
    if (!enabled()) return;
    reconcileDependentSubjects(state);
    const fallback = document.getElementById('returnDependentDetails'); if (!fallback) return;
    fallback.querySelectorAll('.pct-v2-narrative').forEach(node => node.remove());
    visibleQuestions(state).filter(item => item.question.subjectType === 'DEPENDENT').forEach(item => {
      const topic = ({dependent_relationship_context:'basic',dependent_residency:'residency',dependent_temporary_absence:'residency',dependent_possible_claimant:'claimant',dependent_custody_arrangement:'claimant'})[item.question.questionId] || 'additional';
      const subjectId = item.subject.subjectId;
      const host = document.querySelector(`[data-pct-v2-dependent-subject="${subjectId}"] [data-pct-v2-narrative-slot="${topic}"]`) || fallback;
      host.appendChild(makeBlock(item, state));
    });
  }
  function renderReturnNarratives(state) {
    if (!enabled()) return;
    const fallback = document.getElementById('phase17ConsentSteps') || document.getElementById('returnDependentDetails'); if (!fallback) return;
    document.querySelectorAll('.pct-v2-return-narrative').forEach(node => node.remove());
    const anchors = {
      hoh_household_members:'[data-seg="filingStatus"]', hoh_household_expenses:'[data-seg="filingStatus"]', marital_living_arrangement:'[data-seg="filingStatus"]',
      business_activity_context:'[data-bind="seIncome"]', business_cash_income:'[data-bind="businessCashIncome"]',
      business_recordkeeping:'[data-bind="phase17ScheduleC_recordkeeping"]', missing_tax_document:'[data-bind="missingTaxDocNotes"]'
    };
    visibleQuestions(state).filter(item => item.question.subjectType === 'RETURN').forEach(item => {
      const block = makeBlock(item, state); block.classList.add('pct-v2-return-narrative');
      const anchor = anchors[item.question.questionId] ? document.querySelector(anchors[item.question.questionId]) : null;
      const field = anchor?.closest('.field');
      if (field?.parentNode) field.parentNode.insertBefore(block, field.nextSibling); else fallback.insertBefore(block, fallback.firstChild);
    });
  }
  function install(state) {
    if (!enabled() || state.v2NarrativeInstalled) return;
    state.v2NarrativeInstalled = true;
    document.addEventListener('input', event => { if (event.target.matches('[data-bind]')) renderReturnNarratives(state); });
    document.addEventListener('change', event => { if (event.target.matches('[data-bind], [data-dependent-index]')) { renderDependents(state); renderReturnNarratives(state); } });
    renderDependents(state); renderReturnNarratives(state);
  }
  function prepareSubmission(state) {
    if (!enabled()) return {ok:true, payload:null};
    const items = visibleQuestions(state), answers = currentAnswers(state), responses = [];
    for (const item of items) {
      const key = keyFor(item), saved = answers[key] || {}, answer = text(saved.answer);
      if (item.question.requiredWhenShown && !answer) return {ok:false, message:'Please complete each requested tax-situation detail before submitting.', focusKey:key};
      if (answer.length > MAX()) return {ok:false, message:`Please shorten your answer to ${MAX().toLocaleString()} characters or fewer.`, focusKey:key};
      if (!answer) continue;
      responses.push({questionId:item.question.questionId,questionVersion:item.question.questionVersion,displayedQuestionText:item.question.questionText,answer,category:item.question.category,subject:item.subject,createdAtClient:saved.createdAtClient || new Date().toISOString()});
    }
    return {ok:true,payload:{intakeInterviewVersion:DEFINITION().version,v2NarrativeResponses:responses}};
  }
  function getVisibleQuestions(state) { return visibleQuestions(state).map(item => ({question:item.question, subject:item.subject, key:keyFor(item)})); }
  window.PCT_INTAKE_NARRATIVE_V2 = Object.freeze({enabled, install, renderDependents, renderReturnNarratives, clearDependentNarrativeSubjects, purgeDependentSubject, prepareSubmission, getVisibleQuestions, deferredQuestionIds: Object.freeze([...deferredQuestionIds]), renderedQuestionIds: Object.freeze([...renderedQuestionIds])});
})(window, document);
