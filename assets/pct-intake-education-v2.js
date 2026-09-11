/* Shared, feature-gated client education for V2 narrative questions. */
(function attachPCTIntakeEducationV2(window, document) {
  'use strict';
  const enabled = () => window.PCT_INTAKE_V2_CONFIG?.enabled === true;
  const fullCopy = [
    'We know this is a little more detailed than the usual yes-or-no tax questionnaire.',
    'Some tax situations can\'t be explained accurately with a checkbox. Tax preparers have due-diligence responsibilities that may require us to ask additional questions and document important information used to prepare your return.',
    'Your answer gives your preparer the full story in your own words. It helps us understand your tax situation, identify anything that may need clarification, and keep clear notes in your tax file before your return is completed.',
    'As PCT grows, we\'re being intentional about doing things the right way. A little extra detail now can also reduce unnecessary back-and-forth later.',
    'Don\'t worry about using tax language. Just tell us what happened in your own words. Your preparer will review your response and follow up if anything else is needed.'
  ];
  const shortCopy = 'Some tax situations need more than a yes-or-no answer. Your response helps your preparer understand the facts, document the return properly, and determine whether any additional questions or documents are needed.';
  function style() {
    if (document.getElementById('pctV2EducationStyle')) return;
    const node = document.createElement('style'); node.id = 'pctV2EducationStyle'; node.textContent = '.pct-v2-education{margin:0 0 16px;padding:18px;border:1px solid #d9c28e;border-radius:14px;background:#fffaf0;color:#3d2e18}.pct-v2-education h3{margin:0 0 10px;font-size:1.15rem}.pct-v2-education p{margin:0 0 10px;line-height:1.55}.pct-v2-education p:last-child{margin-bottom:0}.pct-v2-education-more{margin-top:12px;padding-top:12px;border-top:1px solid #eadfc6;font-weight:700}.pct-v2-education-toggle{appearance:none;border:0;background:transparent;padding:0;color:#604516;text-decoration:underline;font:inherit;font-weight:800;cursor:pointer}.pct-v2-education-toggle:focus-visible{outline:3px solid #b18a25;outline-offset:3px}.pct-v2-education-detail[hidden]{display:none}'; document.head.appendChild(node);
  }
  function compact() {
    const wrap = document.createElement('div'); wrap.className = 'pct-v2-education-more';
    const id = `pct-v2-education-detail-${Math.random().toString(36).slice(2,10)}`;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'pct-v2-education-toggle'; button.textContent = 'Why do we ask for details?'; button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', id);
    const detail = document.createElement('p'); detail.id = id; detail.className = 'pct-v2-education-detail'; detail.hidden = true; detail.textContent = shortCopy;
    button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(open)); detail.hidden = !open; });
    wrap.append(button, detail); return wrap;
  }
  function forNarrative(state) {
    if (!enabled()) return null;
    style();
    if (state.v2NarrativeEducationSeen) return compact();
    state.v2NarrativeEducationSeen = true;
    const card = document.createElement('aside'); card.className = 'pct-v2-education'; card.setAttribute('aria-label', 'Why PCT asks for additional tax details');
    const heading = document.createElement('h3'); heading.textContent = 'Why am I being asked to type this out?'; card.appendChild(heading);
    fullCopy.forEach(copy => { const paragraph = document.createElement('p'); paragraph.textContent = copy; card.appendChild(paragraph); });
    const secondary = document.createElement('p'); secondary.className = 'pct-v2-education-more'; secondary.innerHTML = '<strong>MORE THAN DATA ENTRY</strong><br>Our job isn\'t just to type numbers into tax software. We need to understand the facts behind your return. These questions help your preparer do that.'; card.appendChild(secondary);
    return card;
  }
  window.PCT_INTAKE_EDUCATION_V2 = Object.freeze({enabled, forNarrative});
})(window, document);
