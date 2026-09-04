(function () {
  "use strict";

  var replacements = [
    [/HoneyBook Smart Files?/gi, "PCT Smart Files"],
    [/Firebase Auth password/gi, "Password"],
    [/Firebase connected/gi, "PCT system ready"],
    [/Firebase not connected/gi, "PCT system connecting"],
    [/Firebase error/gi, "PCT system unavailable"],
    [/Firestore records/gi, "PCT client records"],
    [/Firestore/gi, "PCT records"],
    [/Firebase/gi, "PCT system"],
    [/Backend status/gi, "PCT system status"],
    [/backend/gi, "PCT system"],
  ];

  function cleanText(value) {
    return replacements.reduce(function (text, pair) {
      return text.replace(pair[0], pair[1]);
    }, String(value || ""));
  }

  function apply() {
    var contractorAgent = new URLSearchParams(location.search).get("contractorAgent");
    if (contractorAgent && location.pathname === "/admin" && !document.getElementById("contractorSupportContext")) {
      var wrap = document.querySelector(".wrap");
      if (wrap) {
        var context = document.createElement("div");
        context.id = "contractorSupportContext";
        context.className = "lock-banner";
        context.innerHTML =
          '<strong>Contractor support view</strong> — You are reviewing returns assigned to the selected contractor. <a href="/contractors">Return to Contractor Manager</a>';
        wrap.insertBefore(context, wrap.firstChild);
      }
    }
    document
      .querySelectorAll("button, a")
      .forEach(function (control) {
        var label = (control.textContent || "").trim().replace(/\s+/g, " ");
        if (
          /^(Copy Tax Software Summary|Download Lead JSON)$/i.test(label)
        ) {
          control.remove();
          return;
        }
        if (/^Setup help$/i.test(label)) control.remove();
      });

    document.querySelectorAll(".lock-banner, .security-note").forEach(function (box) {
      if (/Security standard:|PCT records itself should still use secure rules/i.test(box.textContent || "")) {
        box.remove();
      }
    });

    var setup = document.getElementById("setupHelp");
    if (setup) setup.remove();

    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.parentElement || /SCRIPT|STYLE|NOSCRIPT/.test(node.parentElement.tagName))
        return;
      var next = cleanText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });

    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(
      function (field) {
        field.placeholder = cleanText(field.placeholder);
      },
    );
  }

  document.addEventListener(
    "click",
    function (event) {
      var button = event.target.closest("[data-agent-profile]");
      if (button) button.dataset.sandboxHandled = "1";
    },
    true,
  );

  window.addEventListener("DOMContentLoaded", apply);
  new MutationObserver(apply).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
