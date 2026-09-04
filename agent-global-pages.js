(function () {
  "use strict";
  var live =
      new URLSearchParams(location.search).get("mode") === "live" ||
      location.pathname === "/admin",
    app,
    oldHtml,
    oldClass,
    current;
  var SANDBOX_PROFILE_KEY = "pctTrainingPublishedProfile";
  function sandboxProfile() {
    var fallback = {
      publicAgentId: "agent-training-demo",
      displayName: "Jane Doe",
      businessName: "Jane Doe Tax Services",
      phone: "222-555-3333",
      email: "janedoetaxes@filewithme.com",
      websiteUrl: "https://example.com",
      bookingUrl: "https://example.com/book",
      introduction: "Friendly, accurate tax preparation with personal support.",
      photoUrl: "/jane-doe-profile.jpg",
    };
    try {
      return Object.assign(
        fallback,
        JSON.parse(localStorage.getItem(SANDBOX_PROFILE_KEY) || "{}"),
      );
    } catch (_) {
      return fallback;
    }
  }
  var demoReturns = [
    {
      client: "Jasmine Carter",
      returnId: "RET-2025-0001",
      fee: 1250,
      share: 1000,
      adjustment: 0,
      method: "Pay by Refund",
      status: "Pending IRS Funding",
    },
    {
      client: "Marcus Bell",
      returnId: "RET-2025-0002",
      fee: 950,
      share: 760,
      adjustment: 0,
      method: "Stripe Invoice",
      status: "Invoice Cleared",
    },
    {
      client: "Danielle Brooks",
      returnId: "RET-2025-0003",
      fee: 2100,
      share: 1680,
      adjustment: -40,
      method: "Pay by Refund",
      status: "Processing",
    },
    {
      client: "Kevin Wallace",
      returnId: "RET-2025-0004",
      fee: 1350,
      share: 1080,
      adjustment: 0,
      method: "Stripe Invoice",
      status: "Paid",
    },
  ];
  var demoMessages = [
    {
      id: "demo-1",
      subject: "Tax form question",
      client: "FRESH TESTCLIENT",
      status: "Waiting on Support",
      message: "I need help finding where to enter a tax form in the software.",
    },
    {
      id: "demo-2",
      subject: "New document uploaded",
      client: "DEMO RETURN",
      status: "Waiting on Me",
      message: "A new document is ready for review.",
    },
    {
      id: "demo-3",
      subject: "Payment question",
      client: "SAMPLE CLIENT",
      status: "Resolved",
      message: "Please confirm the payment step.",
    },
  ];
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m];
    });
  }
  function stageName(v) {
    return String(v || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }
  function money(v) {
    return (
      "$" +
      Number(v || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  function call(n) {
    return typeof fb !== "undefined" && fb.functions
      ? fb.functions.httpsCallable(n)
      : null;
  }
  function css() {
    if (document.getElementById("agentGlobalPagesCss")) return;
    var s = document.createElement("style");
    s.id = "agentGlobalPagesCss";
    s.textContent =
      ".agp{background:var(--paper);min-height:680px}.agp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;padding:25px 30px 18px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#fffdf9,#fbf4e7)}.agp-head h2{font-size:clamp(30px,4vw,48px)}.agp-head p{margin:8px 0;color:var(--muted)}.agp-body{padding:20px 30px}.agp-banner{border:1px solid #b8d0bb;background:#f6fbf6;color:#27683b;padding:15px 18px;border-radius:8px;font-weight:800;margin-bottom:20px}.agp-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:15px;margin-bottom:20px}.agp-stat{background:#fff;border:1px solid var(--line);border-radius:7px;padding:16px;box-shadow:0 3px 10px #0000000b}.agp-stat h4{font-family:var(--body);font-size:13px;margin:0 0 13px}.agp-stat strong{font-family:var(--display);font-size:24px}.agp-stat .small{display:block;margin-top:7px}.agp-columns{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:16px}.agp-panel{border:1px solid var(--line);border-radius:7px;background:#fff;overflow:hidden}.agp-panel-head{padding:17px 19px;border-bottom:1px solid var(--line)}.agp-panel-head h3{font-size:23px;margin-bottom:12px}.agp-filters{display:flex;gap:9px;flex-wrap:wrap}.agp-filters input,.agp-filters select{max-width:220px;padding:10px}.agp-table{width:100%;border-collapse:collapse;min-width:900px}.agp-table th,.agp-table td{padding:11px 10px;border-bottom:1px solid #eee;text-align:left;font-size:12px;white-space:nowrap}.agp-table th{font-size:10px;text-transform:uppercase;letter-spacing:.06em}.agp-status{padding:5px 8px;border-radius:5px;background:#e6eef7;color:#435f86;font-weight:800}.agp-status.paid{background:#e4f1e6;color:#27683b}.agp-status.pending{background:#fff0c9;color:#7c5917}.agp-guide{padding:18px}.agp-guide h3{font-size:17px}.agp-guide p{font-size:12px;margin:8px 0}.agp-messages{display:grid;grid-template-columns:320px minmax(0,1fr) 280px;gap:16px}.agp-list{max-height:570px;overflow:auto}.agp-message-item{width:100%;display:block;text-align:left;border:0;border-bottom:1px solid var(--line);background:#fff;padding:14px;cursor:pointer}.agp-message-item.active{background:#fff8e8;border-left:4px solid var(--gold)}.agp-message-item strong,.agp-message-item span{display:block}.agp-message-item .badge{display:inline-block;margin-top:6px;padding:4px 7px;border-radius:999px;background:#e6eef7;color:#435f86;font-size:10px;font-weight:900}.agp-thread{min-height:600px;display:flex;flex-direction:column}.agp-thread-head,.agp-compose{padding:17px;border-bottom:1px solid var(--line)}.agp-thread-head h3{font-size:24px}.agp-thread-body{flex:1;padding:18px;background:#fbf7ef}.agp-bubble{max-width:84%;padding:13px 15px;border-radius:14px;background:#f2eee8;margin-bottom:12px}.agp-bubble.mine{margin-left:auto;background:#fff1cf}.agp-resource{display:block;padding:11px;margin:7px 0;border:1px solid var(--line);border-radius:9px;background:var(--cream2);color:var(--ink);text-decoration:none;font-weight:800}.agp-resource span{float:right}@media(max-width:1100px){.agp-stats{grid-template-columns:repeat(3,1fr)}.agp-messages{grid-template-columns:270px 1fr}.agp-messages>.agp-panel:last-child{grid-column:1/-1}}@media(max-width:700px){.agp-head,.agp-body{padding:18px 14px}.agp-stats{grid-template-columns:1fr 1fr}.agp-columns,.agp-messages{grid-template-columns:1fr}.agp-list{max-height:260px}.agp-thread{min-height:500px}}";
    document.head.appendChild(s);
  }
  function restore() {
    if (app && oldHtml !== undefined) {
      app.innerHTML = oldHtml;
      app.className = oldClass || "grid";
    }
    oldHtml = undefined;
    oldClass = undefined;
    current = null;
  }
  function shell(title, subtitle, body) {
    app = document.getElementById("appScreen");
    if (!app) return;
    oldHtml = app.innerHTML;
    oldClass = app.className;
    app.innerHTML =
      '<div class="agp"><header class="agp-head"><div><div class="eyebrow">SECURE AGENT WORKSPACE</div><h2>' +
      title +
      "</h2><p>" +
      subtitle +
      '</p></div><div class="actions"><button type="button" class="btn btn-ghost" id="agpBack">← BACK TO DASHBOARD</button></div></header><div class="agp-body">' +
      body +
      "</div></div>";
    app.className = "portal-fullscreen-view";
    document.getElementById("agpBack").onclick = restore;
  }
  function renderEarnings(rows, fines, directDeposit) {
    fines = fines || [];
    directDeposit = directDeposit || {};
    shell(
      "Agent Earnings",
      "Track every return, funding stage, adjustment, and payout in one place.",
      '<div class="agp-banner">Direct deposit: '+esc(stageName(directDeposit.status||'NOT_STARTED'))+(directDeposit.bankName?' · '+esc(directDeposit.bankName):'')+(directDeposit.accountLast4?' · ending '+esc(directDeposit.accountLast4):'')+'<br><span class="small">PCT processes commissions within 3 business days after cleared funds.</span> <button type="button" class="btn btn-soft btn-sm" id="agpDepositUpdate">UPDATE DIRECT DEPOSIT</button><span id="agpDepositResult" class="small" role="status"></span></div><section class="agp-stats"><div class="agp-stat"><h4>Expected Earnings ⓘ</h4><strong>' +
        money(
          rows
            .filter((x) => /pending/i.test(x.status))
            .reduce((a, x) => a + x.share + x.adjustment, 0),
        ) +
        '</strong><span class="small">Projected share · not funded</span></div><div class="agp-stat"><h4>Pending Funding ⓘ</h4><strong>' +
        money(
          rows
            .filter((x) => /pending/i.test(x.status))
            .reduce((a, x) => a + x.share + x.adjustment, 0),
        ) +
        '</strong><span class="small">Awaiting released funds</span></div><div class="agp-stat"><h4>Funded ⓘ</h4><strong>' +
        money(
          rows
            .filter((x) => /cleared|processing|paid/i.test(x.status))
            .reduce((a, x) => a + x.share + x.adjustment, 0),
        ) +
        '</strong><span class="small">Cleared funds received</span></div><div class="agp-stat"><h4>Processing ⓘ</h4><strong>' +
        money(
          rows
            .filter((x) => /processing/i.test(x.status))
            .reduce((a, x) => a + x.share + x.adjustment, 0),
        ) +
        '</strong><span class="small">PCT processing payout</span></div><div class="agp-stat"><h4>Paid YTD ⓘ</h4><strong style="color:#27683b">' +
        money(
          rows
            .filter((x) => /paid/i.test(x.status))
            .reduce((a, x) => a + x.share + x.adjustment, 0),
        ) +
        '</strong><span class="small">Direct deposit issued</span></div></section><div class="agp-columns"><section class="agp-panel"><div class="agp-panel-head"><div class="section-title"><h3>Return Earnings</h3><button type="button" class="btn btn-soft btn-sm" id="agpDownload">⇩ DOWNLOAD STATEMENT</button></div><div class="agp-filters"><input id="agpSearch" placeholder="Search client or return ID"><select id="agpStatus"><option value="">Funding Status</option><option>Pending IRS Funding</option><option>Invoice Cleared</option><option>Processing</option><option>Paid</option></select></div></div><div style="overflow:auto"><table class="agp-table"><thead><tr><th>Client / Return</th><th>Tax Year</th><th>Final Prep Fee</th><th>80% Agent Share</th><th>Adjustments</th><th>Net Earnings</th><th>Payment Method</th><th>Funding Status</th><th>Action</th></tr></thead><tbody id="agpRows"></tbody></table></div></section><aside class="agp-panel agp-guide"><h3>▥ Funding Guide</h3><p><strong>Accepted ≠ Funded</strong></p><p>Funded means the invoice cleared or the settlement bank received refund funds.</p><p><strong>Paid</strong> means direct deposit was issued.</p><p class="small">Admin adjustments are shown separately and never overwrite original settled calculations.</p></aside></div><section class="agp-panel" style="margin-top:16px;padding:18px"><h3>Fines &amp; Disputes</h3><p class="small">A new fine is not deducted until the five-day dispute window closes. Disputed fines remain on hold for Master Admin review.</p><div id="agpFines"></div></section>',
    );
    var finesHost = document.getElementById("agpFines");
    finesHost.innerHTML =
      fines
        .map(function (fine) {
          return (
            '<div class="agp-panel" style="padding:13px;margin-top:10px"><strong>' +
            money(fine.amount) +
            " · " +
            esc(fine.status || "pending") +
            "</strong><div>" +
            esc(fine.reason || "No reason supplied") +
            '</div><div class="small">Ledger ' +
            esc(fine.ledgerId || "—") +
            (fine.disputeWindowEndsAt
              ? " · Dispute deadline " +
                new Date(fine.disputeWindowEndsAt).toLocaleString()
              : "") +
            "</div>" +
            (fine.canDispute
              ? '<button type="button" class="btn btn-soft btn-sm" data-fine-dispute="' +
                esc(fine.fineId) +
                '">DISPUTE FINE</button>'
              : "") +
            "</div>"
          );
        })
        .join("") || '<div class="small">No fines or disputes.</div>';
    finesHost
      .querySelectorAll("[data-fine-dispute]")
      .forEach(function (button) {
        button.onclick = function () {
          var reason = prompt("Explain why you are disputing this fine:");
          if (!reason || !reason.trim()) return;
          var fn = call("disputeAgentFine");
          if (!live || !fn) {
            if (typeof toast === "function")
              toast("Training sandbox: dispute demonstrated only.");
            return;
          }
          button.disabled = true;
          fn({ fineId: button.dataset.fineDispute, reason: reason.trim() })
            .then(function () {
              button.textContent = "DISPUTED ✓";
              if (typeof toast === "function") toast("Fine dispute submitted.");
            })
            .catch(function (error) {
              button.disabled = false;
              if (typeof toast === "function")
                toast(error.message || "The dispute could not be submitted.");
            });
        };
      });
    var draw = function () {
      var q = (document.getElementById("agpSearch").value || "").toLowerCase(),
        st = document.getElementById("agpStatus").value,
        filtered = rows.filter(function (x) {
          return (
            (!q || (x.client + " " + x.returnId).toLowerCase().includes(q)) &&
            (!st || x.status === st)
          );
        });
      document.getElementById("agpRows").innerHTML =
        filtered
          .map(function (x) {
            return (
              "<tr><td><strong>" +
              x.client +
              "</strong>" +
              x.returnId +
              "</td><td>2025</td><td>" +
              money(x.fee) +
              "</td><td>" +
              money(x.share) +
              "</td><td>" +
              money(x.adjustment) +
              "</td><td><strong>" +
              money(x.share + x.adjustment) +
              "</strong></td><td>" +
              x.method +
              '</td><td><span class="agp-status ' +
              (/paid/i.test(x.status)
                ? "paid"
                : /pending/i.test(x.status)
                  ? "pending"
                  : "") +
              '">' +
              x.status +
              '</span></td><td><button type="button" class="btn btn-soft btn-sm">VIEW DETAILS</button></td></tr>'
            );
          })
          .join("") ||
        '<tr><td colspan="9">No earnings records match.</td></tr>';
    };
    document.getElementById("agpSearch").oninput = draw;
    document.getElementById("agpStatus").onchange = draw;
    document.getElementById("agpDepositUpdate").onclick = async function(){var out=document.getElementById("agpDepositResult"),fn=call("requestDirectDepositUpdate");this.disabled=true;if(!live||!fn){out.textContent=" Training request demonstrated ✓";return}try{var r=await fn({});out.textContent=" "+(r.data.message||"Your direct-deposit update request was sent.")}catch(e){out.textContent=" "+(e.message||"The update request could not be sent.");this.disabled=false}};
    document.getElementById("agpDownload").onclick = function () {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob(
          [
            "PCT AGENT EARNINGS STATEMENT\n\n" +
              rows
                .map(function (x) {
                  return (
                    x.client +
                    " | " +
                    x.returnId +
                    " | " +
                    money(x.share + x.adjustment) +
                    " | " +
                    x.status
                  );
                })
                .join("\n"),
          ],
          { type: "text/plain" },
        ),
      );
      a.download = "agent-earnings-statement.txt";
      a.click();
    };
    draw();
  }
  function installPtinCard(onboarding) {
    var section=document.querySelector(".agp-body section"),ptin=onboarding.ptin||{},year=Number(ptin.requiredCalendarYear||new Date().getFullYear()),card=document.createElement("div"),previewUrl=!live?"/fake-ptin-sample.svg":"",rotation=0,zoom=1,currentFile=null;
    if(!section)return;
    card.className="securebox";
    card.id="ptinVerificationCard";
    card.style.margin="18px 0";
    card.innerHTML=(live?"":'<div class="warnbox"><strong>Training Sandbox — Do Not Upload Real PTIN Information.</strong><br>Use only the fake sample information and document shown below.</div>')+
      '<div class="section-title"><div><h3>Current-Year PTIN Verification — Required</h3><div class="small">Status: <strong id="ptinStatusText">'+esc(stageName(ptin.status||"MISSING"))+'</strong> · Required year: '+esc(year)+'</div></div><a class="btn btn-soft btn-sm" href="https://www.irs.gov/tax-professionals/ptin-requirements-for-tax-return-preparers" target="_blank" rel="noopener noreferrer">IRS PTIN Requirements ↗</a></div>'+
      '<p>Upload proof from your IRS PTIN account showing your legal name, PTIN number, active status, and the current calendar year. PCT must verify your current PTIN before we can create your tax-software account or allow return preparation.</p>'+
      (ptin.correctionReason?'<div class="warnbox"><strong>Correction required:</strong> '+esc(ptin.correctionReason)+'</div>':'')+
      '<div class="two"><div><div class="field"><label>Legal name exactly as displayed by the IRS</label><input id="ptinLegalName" value="'+esc(ptin.legalName||(!live?"Taylor Training":""))+'"></div><div class="field"><label>PTIN number</label><input id="ptinNumber" maxlength="9" placeholder="P00000000" value="'+esc(ptin.ptinNumber||(!live?"P00000000":""))+'"></div><div class="field"><label>PTIN calendar year</label><input id="ptinYear" type="number" readonly value="'+esc(year)+'"></div><div class="field"><label>PTIN status</label><select id="ptinReportedStatus"><option value="">Choose status</option><option value="ACTIVE" '+((ptin.reportedStatus||(!live?"ACTIVE":""))==="ACTIVE"?"selected":"")+'>Active</option><option value="CURRENT" '+(ptin.reportedStatus==="CURRENT"?"selected":"")+'>Current</option></select></div><div class="field"><label>Supporting PTIN image or PDF</label><input id="ptinFile" type="file" accept="application/pdf,image/png,image/jpeg"><div class="small">PDF, PNG, JPG, or JPEG · maximum 8 MB. Replace blurry, cropped, or unreadable files.</div></div><label class="checkline"><input id="ptinAcknowledge" type="checkbox"> I confirm that this is my current IRS-issued PTIN information and that the information entered above matches the uploaded document.</label><button type="button" class="btn btn-gold" id="ptinSubmit">SUBMIT PTIN VERIFICATION</button><div id="ptinSubmitResult" class="small" role="status" aria-live="polite"></div></div>'+
      '<div><div id="ptinTypedSummary" class="infobox"></div><div id="ptinPreviewFrame" style="height:430px;overflow:auto;background:#2a241d;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:16px"><img id="ptinPreviewImage" alt="PTIN document preview" style="max-width:100%;max-height:100%;transform-origin:center;transition:transform .15s" src="'+esc(previewUrl)+'"><iframe id="ptinPreviewPdf" title="PTIN PDF preview" style="display:none;width:100%;height:100%;background:#fff"></iframe></div><div class="actions" style="margin-top:10px"><button type="button" class="btn btn-soft btn-sm" id="ptinZoomIn">ZOOM +</button><button type="button" class="btn btn-soft btn-sm" id="ptinZoomOut">ZOOM −</button><button type="button" class="btn btn-soft btn-sm" id="ptinRotate">ROTATE</button><button type="button" class="btn btn-soft btn-sm" id="ptinReplace">REPLACE</button><button type="button" class="btn btn-soft btn-sm" id="ptinFullscreen">FULL SCREEN</button>'+(live&&ptin.hasDocument?'<button type="button" class="btn btn-soft btn-sm" id="ptinLoadStored">OPEN SUBMITTED DOCUMENT</button>':'')+'</div><div id="ptinImageWarning" class="small"></div><div class="small">Document version: '+esc(ptin.documentVersion||0)+' · Upload date: '+esc(ptin.uploadedAt?"Recorded in PCT":"Not submitted")+'</div></div></div>';
    var boxes=section.querySelectorAll(".securebox");section.insertBefore(card,boxes.length>1?boxes[boxes.length-1]:document.getElementById("profileSave"));
    if(!live){var sampleHost=document.createElement("div");sampleHost.className="actions";sampleHost.style.marginTop="8px";sampleHost.innerHTML='<button type="button" class="btn btn-soft btn-sm" id="ptinUseSample">USE FAKE SAMPLE DOCUMENT</button><button type="button" class="btn btn-soft btn-sm" id="ptinSimCorrection">SIMULATE CORRECTION</button><button type="button" class="btn btn-soft btn-sm" id="ptinSimVerified">SIMULATE VERIFIED</button>';document.getElementById("ptinFile").parentElement.appendChild(sampleHost);document.getElementById("ptinUseSample").onclick=async function(){var response=await fetch("/fake-ptin-sample.svg"),blob=await response.blob();currentFile=new File([blob],"fake-ptin-training-sample.png",{type:"image/png"});showFile(currentFile,"/fake-ptin-sample.svg");document.getElementById("ptinSubmitResult").textContent="Fake training document loaded. No real PTIN information is used."};document.getElementById("ptinSimCorrection").onclick=function(){document.getElementById("ptinStatusText").textContent="Needs Correction";document.getElementById("ptinSubmitResult").textContent="Training example: Image is blurry or cropped. Replace the fake document and resubmit."};document.getElementById("ptinSimVerified").onclick=function(){document.getElementById("ptinStatusText").textContent="Verified";document.getElementById("ptinSubmitResult").textContent="Training example: PTIN verified. Tax-software setup may now begin — no production task was created."}}
    function summary(){document.getElementById("ptinTypedSummary").innerHTML='<strong>Typed PTIN details</strong><br>'+esc(document.getElementById("ptinLegalName").value||"Name not entered")+'<br>'+esc(document.getElementById("ptinNumber").value.toUpperCase()||"PTIN not entered")+' · '+esc(document.getElementById("ptinYear").value)+' · '+esc(document.getElementById("ptinReportedStatus").value||"Status not selected")}
    ["ptinLegalName","ptinNumber","ptinReportedStatus"].forEach(function(id){document.getElementById(id).addEventListener("input",summary)});summary();
    function transform(){document.getElementById("ptinPreviewImage").style.transform="scale("+zoom+") rotate("+rotation+"deg)"}
    function showFile(file,url){var img=document.getElementById("ptinPreviewImage"),pdf=document.getElementById("ptinPreviewPdf"),warn=document.getElementById("ptinImageWarning");if(file.type==="application/pdf"){img.style.display="none";pdf.style.display="block";pdf.src=url;warn.textContent="Review the PDF at full size and replace it if any required detail cannot be read."}else{pdf.style.display="none";img.style.display="block";img.src=url;img.onload=function(){warn.textContent=(img.naturalWidth<1000||img.naturalHeight<600)?"This image may be too small or blurry. Replace it if the name, year, status, or PTIN cannot be read.":"Image size check passed. Admin must still verify the original manually."}}}
    document.getElementById("ptinFile").onchange=function(){currentFile=this.files[0]||null;if(!currentFile)return;if(currentFile.size>8*1024*1024||!["application/pdf","image/png","image/jpeg"].includes(currentFile.type)){document.getElementById("ptinSubmitResult").textContent="Use a PDF, PNG, JPG, or JPEG file no larger than 8 MB.";this.value="";currentFile=null;return}showFile(currentFile,URL.createObjectURL(currentFile))};
    document.getElementById("ptinZoomIn").onclick=function(){zoom=Math.min(3,zoom+.25);transform()};document.getElementById("ptinZoomOut").onclick=function(){zoom=Math.max(.5,zoom-.25);transform()};document.getElementById("ptinRotate").onclick=function(){rotation=(rotation+90)%360;transform()};document.getElementById("ptinReplace").onclick=function(){document.getElementById("ptinFile").click()};document.getElementById("ptinFullscreen").onclick=function(){var frame=document.getElementById("ptinPreviewFrame");if(frame.requestFullscreen)frame.requestFullscreen()};
    var loadStored=document.getElementById("ptinLoadStored");if(loadStored)loadStored.onclick=async function(){var out=document.getElementById("ptinSubmitResult"),fn=call("getMyPtinDocument");this.disabled=true;out.textContent="Opening protected document…";try{var r=await fn({calendarYear:year}),d=r.data.document,url="data:"+d.contentType+";base64,"+d.dataBase64;showFile({type:d.contentType,size:0},url);out.textContent="Protected document opened."}catch(e){out.textContent=e.message||"The document could not be opened.";this.disabled=false}};
    document.getElementById("ptinSubmit").onclick=async function(){var out=document.getElementById("ptinSubmitResult"),legal=document.getElementById("ptinLegalName").value.trim(),number=document.getElementById("ptinNumber").value.trim().toUpperCase(),status=document.getElementById("ptinReportedStatus").value,ack=document.getElementById("ptinAcknowledge").checked;if(!legal||!/^P\d{8}$/.test(number)||!status||!ack||!currentFile){out.textContent="Enter the fake/current legal name, PTIN, year, active status, acknowledgment, and supporting document.";return}if(!live){out.textContent="Training submission demonstrated ✓ — no production record, task, file, or notification was created.";document.getElementById("ptinStatusText").textContent="Under Review";return}var fn=call("submitPtinVerification");if(!fn){out.textContent="PTIN submission is temporarily unavailable.";return}this.disabled=true;out.textContent="Submitting protected PTIN verification…";try{var base64=await new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(String(reader.result).split(",")[1]||"")};reader.onerror=reject;reader.readAsDataURL(currentFile)}),r=await fn({legalName:legal,ptinNumber:number,calendarYear:year,reportedStatus:status,acknowledged:true,contentType:currentFile.type,originalFileName:currentFile.name,documentDataBase64:base64});out.textContent=r.data.message;document.getElementById("ptinStatusText").textContent="Under Review"}catch(e){out.textContent=e.message||"PTIN verification could not be submitted.";this.disabled=false}};
  }
  function renderProfile(profile, onboarding) {
    var p = (profile && profile.agentProfile) || {};
    var deposit = (onboarding && onboarding.directDeposit) || {};
    shell(
      "Profile Setup",
      "Update the public identity used by your permanent personalized link.",
      '<section class="agp-panel" style="padding:22px;max-width:820px"><div class="securebox">Permanent personalized link name: <strong>' +
        esc(
          p.publicAgentId ||
            profile.publicAgentId ||
            "Assigned after activation",
        ) +
        '</strong><br><span class="small">Your link stays the same when you update your profile.</span></div><div class="card" style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><img id="profilePreviewPhoto" src="' +
        esc(p.photoUrl || "/agent-image-placeholder.png") +
        '" alt="Profile preview" style="width:76px;height:76px;border-radius:50%;object-fit:cover"><div><strong id="profilePreviewName">' +
        esc(p.displayName || "Your name") +
        '</strong><div id="profilePreviewBusiness" class="small">' +
        esc(p.businessName || "Your business") +
        '</div><div class="small">This is how clients will recognize you.</div></div></div><div class="two"><div><div class="field"><label>Professional display name</label><input id="profileDisplayName" value="' +
        esc(p.displayName || "") +
        '"></div><div class="field"><label>Business name</label><input id="profileBusinessName" value="' +
        esc(p.businessName || "") +
        '"></div><div class="field"><label>Phone number</label><input id="profilePhone" value="' +
        esc(p.phone || "") +
        '"></div><div class="field"><label>Professional email</label><input id="profileEmail" type="email" value="' +
        esc(p.email || "") +
        '"></div><div class="field"><label>Website (optional)</label><input id="profileWebsite" type="url" placeholder="https://example.com" value="' +
        esc(p.websiteUrl || "") +
        '"></div></div><div><div class="field"><label>Profile photo</label><input id="profilePhoto" type="file" accept="image/png,image/jpeg,image/webp"><div class="small">PNG, JPEG, or WEBP · maximum 3 MB</div></div><div class="field"><label>Booking link (optional)</label><input id="profileBooking" type="url" placeholder="https://calendly.com/agent-name" value="' +
        esc(p.bookingUrl || "") +
        '"></div><div class="field"><label>Short introduction</label><textarea id="profileIntroduction" rows="4">' +
        esc(p.introduction || "") +
        '</textarea></div><div class="field"><label>Partner-branding preference</label><input id="profilePartnerBranding" value="' +
        esc(p.partnerBranding || "") +
        '" placeholder="Optional approved partner business"></div></div></div><div class="securebox"><h3>Direct Deposit</h3><div class="small">Status: <strong>'+esc(stageName(deposit.status||"NOT_STARTED"))+'</strong>'+(deposit.bankName?' · '+esc(deposit.bankName):'')+(deposit.accountLast4?' · account ending '+esc(deposit.accountLast4):'')+'</div><button type="button" class="btn btn-soft btn-sm" id="profileDepositUpdate">UPDATE DIRECT DEPOSIT</button><span id="profileDepositResult" class="small" role="status"></span></div><button type="button" class="btn btn-gold" id="profileSave">SAVE &amp; PUBLISH</button><div id="profileStatus" class="small" role="status" aria-live="polite"></div></section>',
    );
    installPtinCard(onboarding || {});
    document.getElementById("profileSave").onclick = async function () {
      var out = document.getElementById("profileStatus"),
        file = document.getElementById("profilePhoto").files[0],
        data = {
          displayName: document
            .getElementById("profileDisplayName")
            .value.trim(),
          businessName: document
            .getElementById("profileBusinessName")
            .value.trim(),
          phone: document.getElementById("profilePhone").value.trim(),
          email: document.getElementById("profileEmail").value.trim(),
          websiteUrl: document.getElementById("profileWebsite").value.trim(),
          bookingUrl: document.getElementById("profileBooking").value.trim(),
          introduction: document
            .getElementById("profileIntroduction")
            .value.trim(),
          partnerBranding: document
            .getElementById("profilePartnerBranding")
            .value.trim(),
        };
      if (
        (data.websiteUrl && !/^https:\/\/[^\s]+$/i.test(data.websiteUrl)) ||
        (data.bookingUrl && !/^https:\/\/[^\s]+$/i.test(data.bookingUrl))
      ) {
        out.textContent = "Website and Booking Link must use valid HTTPS URLs.";
        return;
      }
      if (file) {
        if (
          file.size > 3 * 1024 * 1024 ||
          !/^image\/(png|jpeg|webp)$/.test(file.type)
        ) {
          out.textContent = "Use a PNG, JPEG, or WEBP image under 3 MB.";
          return;
        }
        data.photoContentType = file.type;
        data.photoDataBase64 = await new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () {
            resolve(String(reader.result).split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        data.photoUrl = "data:" + file.type + ";base64," + data.photoDataBase64;
      }
      if (!live) {
        var saved = Object.assign({}, sandboxProfile(), data);
        localStorage.setItem(SANDBOX_PROFILE_KEY, JSON.stringify(saved));
        document.getElementById("profilePreviewName").textContent = saved.displayName;
        document.getElementById("profilePreviewBusiness").textContent = saved.businessName;
        document.getElementById("profilePreviewPhoto").src = saved.photoUrl;
        out.textContent = "Training profile published ✓";
        return;
      }
      var fn = call("savePreparerPublicProfile");
      if (!fn) {
        out.textContent = "Profile publishing is temporarily unavailable.";
        return;
      }
      try {
        await fn(data);
        out.textContent = "Profile published ✓";
      } catch (e) {
        out.textContent = e.message || "Profile could not be published.";
      }
    };
    document.getElementById("profileDepositUpdate").onclick = async function(){var out=document.getElementById("profileDepositResult"),fn=call("requestDirectDepositUpdate");this.disabled=true;if(!live||!fn){out.textContent=" Training request demonstrated ✓";return}try{var r=await fn({});out.textContent=" "+(r.data.message||"Your direct-deposit update request was sent.")}catch(e){out.textContent=" "+(e.message||"The update request could not be sent.");this.disabled=false}};
  }
  window.openAgentProfilePage = function () {
    if (current) return;
    current = "profile";
    css();
    if (live) {
      var fn = call("getPreparerPersonalizedLinks"), statusFn=call("getMyOnboardingStatus");
      if (fn)
        Promise.all([fn({}),statusFn?statusFn({}):Promise.resolve({data:{onboarding:{}}})])
          .then(function (results) {
            renderProfile(results[0].data || {},results[1].data?.onboarding||{});
          })
          .catch(function () {
            renderProfile({});
          });
      else renderProfile({});
    } else {
      var trainingProfile = sandboxProfile();
      renderProfile({
        publicAgentId: trainingProfile.publicAgentId,
        agentProfile: trainingProfile,
      },{ptin:{requiredCalendarYear:2026,status:"MISSING",legalName:"Taylor Training",ptinNumber:"P00000000",calendarYear:2026,reportedStatus:"ACTIVE",documentVersion:0,hasDocument:false}});
    }
  };
  function renderShare(link) {
    var url = (link && link.intakeUrl) || "",
      profile = (link && link.agentProfile) || (!live ? sandboxProfile() : {}),
      qrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=" +
        encodeURIComponent(url);
    shell(
      "Share",
      "One permanent personalized client link for your approved profile.",
      '<section class="agp-panel" style="padding:22px;max-width:760px"><h3>Personalized Client Link</h3><p class="small">Share this one permanent link with clients. It opens your branded estimate and intake experience.</p><div class="card" style="display:flex;align-items:center;gap:14px"><img src="' +
        esc(profile.photoUrl || "/agent-image-placeholder.png") +
        '" alt="Agent profile" style="width:70px;height:70px;border-radius:50%;object-fit:cover"><div><strong>' +
        esc(profile.displayName || "Your client page") +
        '</strong><div class="small">' +
        esc(profile.businessName || "Personalized client experience") +
        '</div></div></div><div class="field"><label>Complete URL</label><input id="shareUrl" readonly value="' +
        esc(url) +
        '"></div><div class="actions"><button type="button" class="btn btn-gold" id="shareCopy">COPY LINK</button><a class="btn btn-soft" href="' +
        esc(url) +
        '" target="_blank" rel="noopener noreferrer">OPEN MY LINK ↗</a><a class="btn btn-soft" id="shareEmail">EMAIL LINK</a><a class="btn btn-soft" id="shareText">TEXT LINK</a><a class="btn btn-soft" href="' +
        esc(qrUrl) +
        '" target="_blank" rel="noopener noreferrer">DOWNLOAD QR CODE ↗</a></div><div id="shareStatus" class="small" role="status" aria-live="polite"></div><div class="securebox"><strong>Booking Link</strong><p class="small">Add or remove your booking page. The Book button appears only when a valid link is saved.</p><input id="shareBooking" type="url" placeholder="https://calendly.com/agent-name" value="' +
        esc((link && link.bookingUrl) || "") +
        '"><button type="button" class="btn btn-soft btn-sm" id="shareSaveBooking">SAVE BOOKING LINK</button><div id="shareBookingStatus" class="small" role="status"></div></div></section>',
    );
    var fallback = function (value) {
      var t = document.createElement("textarea");
      t.value = value;
      t.setAttribute("readonly", "");
      t.setAttribute("aria-hidden", "true");
      t.style.position = "fixed";
      t.style.left = "-9999px";
      t.style.top = "0";
      document.body.appendChild(t);
      t.focus();
      t.select();
      t.setSelectionRange(0, value.length);
      var ok = false;
      var copyHandler = function (event) {
        if (!event.clipboardData) return;
        event.preventDefault();
        event.clipboardData.setData("text/plain", value);
        ok = true;
      };
      document.addEventListener("copy", copyHandler, { once: true });
      try {
        ok = document.execCommand("copy") && ok;
      } catch (_) {
        ok = false;
      }
      document.removeEventListener("copy", copyHandler);
      setTimeout(function () { t.remove(); }, 0);
      return ok;
    };
    document.getElementById("shareCopy").onclick = function () {
      var b = this,
        ok = false;
      Promise.resolve(
        window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard
              .writeText(url)
              .then(function () {
                return true;
              })
              .catch(function () {
                return fallback(url);
              })
          : fallback(url),
      ).then(function (done) {
        ok = done;
        document.getElementById("shareStatus").textContent = ok
          ? "Copied ✓"
          : "Select the link above and copy it manually.";
        b.textContent = ok ? "Copied ✓" : "COPY LINK";
        if (!ok) {
          var input = document.getElementById("shareUrl");
          input.focus();
          input.select();
        }
        setTimeout(function () {
          b.textContent = "COPY LINK";
        }, 2000);
      });
    };
    document.getElementById("shareEmail").href =
      "mailto:?subject=" +
      encodeURIComponent("Start your tax return") +
      "&body=" +
      encodeURIComponent("Use my secure tax link to get started: " + url);
    document.getElementById("shareText").href =
      "sms:?&body=" +
      encodeURIComponent("Use my secure tax link to get started: " + url);
    document.getElementById("shareSaveBooking").onclick = function () {
      var value = document.getElementById("shareBooking").value.trim(),
        out = document.getElementById("shareBookingStatus");
      if (value && !/^https:\/\/[^\s]+$/i.test(value)) {
        out.textContent = "Use a valid HTTPS booking URL or leave it empty.";
        return;
      }
      if (!live) {
        var savedProfile = Object.assign({}, sandboxProfile(), {
          bookingUrl: value,
        });
        localStorage.setItem(SANDBOX_PROFILE_KEY, JSON.stringify(savedProfile));
        out.textContent = value
          ? "Training Booking Link saved ✓"
          : "Training Booking Link removed ✓";
        return;
      }
      var fn = call("savePreparerPublicProfile");
      if (!fn) {
        out.textContent = "Authenticated profile service unavailable.";
        return;
      }
      fn({ bookingUrl: value })
        .then(function () {
          out.textContent = value
            ? "Booking Link saved."
            : "Booking Link removed.";
        })
        .catch(function (e) {
          out.textContent = e.message || "Booking Link could not be saved.";
        });
    };
  }
  function renderMessages(items) {
    shell(
      "Messages & Support Center",
      "Client conversations and agent support — all in one place.",
      '<div class="agp-messages"><section class="agp-panel"><div class="agp-tabs"><button type="button" class="active">◯ Client Messages</button><button type="button">♧ Agent Support</button></div><input id="agpMsgSearch" class="agp-search" placeholder="Search messages" style="margin:12px;width:calc(100% - 24px);padding:11px;border:1px solid var(--line);border-radius:9px"><div id="agpMsgList" class="agp-list"></div></section><section class="agp-panel agp-thread" id="agpMsgThread"><div class="detail-empty">Select a conversation to view it here.</div></section><aside class="agp-panel agp-guide"><h3>LINKED RETURN</h3><p>Client and return context appears here when a conversation is linked.</p><h3 style="margin-top:24px">HELPFUL RESOURCES</h3><a class="agp-resource" href="https://support.taxprosoftwaretraining.com/portal/en/home" target="_blank" rel="noopener noreferrer">Tax Software Help Center <span>↗</span></a><a class="agp-resource" href="https://support.taxprosoftwaretraining.com/portal/en/kb/where-do-i-enter" target="_blank" rel="noopener noreferrer">Where Do I Enter? <span>↗</span></a></aside></div>',
    );
    var list = document.getElementById("agpMsgList"),
      thread = function (x) {
        document.getElementById("agpMsgThread").innerHTML =
          '<div class="agp-thread-head"><h3>' +
          esc(x.subject) +
          '</h3><div class="small">' +
          esc(x.client) +
          " · 2025 · " +
          esc(x.status) +
          '</div></div><div class="agp-thread-body"><div class="agp-bubble"><strong>' +
          esc(x.client || "Client") +
          "</strong><div>" +
          esc(x.message) +
          '</div></div></div><div class="agp-compose"><textarea id="agpReply" placeholder="Type your secure reply..."></textarea><div class="actions"><button type="button" class="btn btn-gold btn-sm" id="agpReplyBtn">SEND REPLY</button></div><div class="small">Secure portal conversation · email notifications do not include sensitive tax data.</div></div>';
        document.getElementById("agpReplyBtn").onclick = function () {
          if (!live) {
            if (typeof toast === "function")
              toast(
                "Training sandbox: reply demonstrated only; nothing was sent.",
              );
            return;
          }
          var fn = call("replyAgentSupport");
          if (fn)
            fn({
              conversationId: x.id,
              message: document.getElementById("agpReply").value.trim(),
            }).then(function () {
              if (typeof toast === "function") toast("Secure reply sent.");
            });
        };
      };
    var draw = function () {
      var q = (
        document.getElementById("agpMsgSearch").value || ""
      ).toLowerCase();
      list.innerHTML = items
        .filter(function (x) {
          return (
            !q ||
            (x.subject + " " + x.client + " " + x.message)
              .toLowerCase()
              .includes(q)
          );
        })
        .map(function (x) {
          return (
            '<button type="button" class="agp-message-item" data-id="' +
            esc(x.id) +
            '"><strong>' +
            esc(x.subject) +
            '</strong><span class="small">' +
            esc(x.client) +
            '</span><span class="badge">' +
            esc(x.status) +
            "</span></button>"
          );
        })
        .join("");
      list.querySelectorAll("[data-id]").forEach(function (b) {
        b.onclick = function () {
          var x = items.find(function (y) {
            return y.id === b.dataset.id;
          });
          thread(x);
          draw();
          b.classList.add("active");
        };
      });
    };
    document.getElementById("agpMsgSearch").oninput = draw;
    draw();
    if (items[0]) thread(items[0]);
  }
  function open(type) {
    if (current) return;
    current = type;
    css();
    if (type === "share") {
      if (live) {
        var sf = call("getPreparerPersonalizedLinks");
        if (sf)
          sf({})
            .then(function (r) {
              renderShare(r.data || {});
            })
            .catch(function () {
              renderShare({});
            });
        else renderShare({});
      } else
        renderShare({
          intakeUrl:
            "https://pct-tax-return-review.web.app/test-intake?agent=agent-training-demo",
          bookingUrl: sandboxProfile().bookingUrl,
          agentProfile: sandboxProfile(),
        });
    } else if (type === "earnings") {
      if (live) {
        var fn = call("getPreparerEarningsSummary");
        if (fn)
          Promise.all([fn({}),call("getMyOnboardingStatus")?call("getMyOnboardingStatus")({}):Promise.resolve({data:{onboarding:{}}})])
            .then(function (results) {
              var r=results[0], onboarding=results[1].data?.onboarding||{};
              renderEarnings(
                (r.data.records || []).map(function (x) {
                  return {
                    client: x.caseId || x.returnId || "Assigned return",
                    returnId: x.returnId || x.caseId || "",
                    fee: x.eligiblePreparationFee || x.amountCollected || 0,
                    share: x.agentEarnings || 0,
                    adjustment: x.earningsAdjustment || 0,
                    method: x.paymentSource || "Payment record",
                    status: x.payoutStatus || x.paymentStatus || "Pending",
                  };
                }),
                r.data.fines || [],
                onboarding.directDeposit || {},
              );
            })
            .catch(function () {
              renderEarnings([]);
            });
        else renderEarnings([]);
      } else renderEarnings(demoReturns);
    } else {
      if (live) {
        var cf = call("listAgentSupportConversations");
        if (cf)
          cf({})
            .then(function (r) {
              renderMessages(
                (r.data.conversations || []).map(function (x) {
                  return {
                    id: x.id || x.conversationId,
                    subject: x.subject || "Support conversation",
                    client: x.linkedClient?.leadId || "",
                    status: x.status || "Open",
                    message:
                      x.latestMessage ||
                      "Secure conversation available in the portal.",
                  };
                }),
              );
            })
            .catch(function () {
              renderMessages([]);
            });
        else renderMessages([]);
      } else renderMessages(demoMessages);
    }
  }
  document.addEventListener(
    "click",
    function (e) {
      var b = e.target.closest("[data-agent-center]");
      if (!b) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      open(b.dataset.agentCenter);
    },
    true,
  );
})();
