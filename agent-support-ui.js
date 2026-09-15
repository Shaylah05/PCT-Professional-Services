/* Phase 3B return-level support entry point. The complete messaging and support
   experience remains in the existing dedicated Agent/Admin workspace. */
(function(){
  'use strict';
  const byId=id=>document.getElementById(id);
  const isAdminPage=/\/admin(?:\/|\.html|$)/i.test(location.pathname);
  function context(){
    const lead=typeof selectedLead==='function'?selectedLead():null;
    const current=typeof currentCompletedReturn==='undefined'?null:currentCompletedReturn;
    return {leadId:String(lead?.id||''),returnId:String(current?.returnId||current?.id||'')};
  }
  function openSupport(){
    const scoped=context();
    window.pctSupportReturnContext=scoped;
    const options={startSupport:true,...scoped};
    if(isAdminPage&&typeof window.pctOpenAdminMessages==='function')return window.pctOpenAdminMessages(options);
    if(!isAdminPage&&typeof window.pctOpenAgentMessages==='function')return window.pctOpenAgentMessages(options);
    const fallback=document.querySelector(isAdminPage?'[onclick*="pctOpenAdminMessages"]':'[onclick*="pctOpenAgentMessages"]');
    if(fallback)return fallback.click();
    const state=byId('pctReturnSupportStatus');if(state)state.textContent='Messages & Support is still loading. Please try again.';
  }
  function mount(){
    const host=byId('completedReturnWorkspace');
    if(!host||byId('pctReturnSupportAction'))return;
    const scoped=context(),section=document.createElement('section');
    section.id='pctReturnSupportAction';
    section.className='securebox pct-return-support-action pct-p20-section';
    section.dataset.leadId=scoped.leadId;
    section.dataset.returnId=scoped.returnId;
    const description=isAdminPage?'Open the existing secure Messages & Support workspace to review support conversations.':'Open the existing secure Messages & Support workspace. This tax-year return will be linked when you start a new Agent Support request.';
    section.innerHTML='<div><strong>Need help with this return?</strong><p class="small">'+description+'</p></div><button type="button" class="btn btn-soft btn-sm" id="pctReturnSupportOpen" aria-label="Open Messages and Support for this return">OPEN MESSAGES &amp; SUPPORT</button><div id="pctReturnSupportStatus" class="small" role="status" aria-live="polite"></div>';
    section.querySelector('#pctReturnSupportOpen').addEventListener('click',openSupport);
    host.appendChild(section);
  }
  window.pctMountReturnSupportAction=mount;
  window.pctOpenReturnSupport=openSupport;
  window.addEventListener('DOMContentLoaded',mount);
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
  if(!byId('pctReturnSupportStyles')){const style=document.createElement('style');style.id='pctReturnSupportStyles';style.textContent='.pct-return-support-action{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 18px;align-items:center;margin:14px 0}.pct-return-support-action p{margin:4px 0 0}.pct-return-support-action [role="status"]{grid-column:1/-1}@media(max-width:620px){.pct-return-support-action{grid-template-columns:1fr}.pct-return-support-action .btn{width:100%}}';document.head.appendChild(style);}
})();
