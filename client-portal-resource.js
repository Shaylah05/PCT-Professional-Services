(function () {
  "use strict";

  var CLIENT_PORTAL_URL =
    "https://www.pctquickfile.com/pct-check-my-return-prep-status";

  function link(className, label) {
    var anchor = document.createElement("a");
    anchor.className = className;
    anchor.href = CLIENT_PORTAL_URL;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.dataset.clientPortalResource = "true";
    anchor.setAttribute(
      "aria-label",
      "Open the PCT Client Portal login in a new tab",
    );
    anchor.textContent = label || "Client Portal Login ↗";
    return anchor;
  }

  function addTopNavigation() {
    document.querySelectorAll(".top-actions").forEach(function (host) {
      if (host.querySelector("[data-client-portal-resource]")) return;
      host.insertBefore(
        link("btn btn-soft btn-sm", "Client Portal ↗"),
        host.querySelector("#signOutBtn"),
      );
    });
  }

  function addGuidedWorkspaceResources() {
    document.querySelectorAll(".pct-helpful-resources").forEach(function (host) {
      if (host.querySelector("[data-client-portal-resource]")) return;
      var actions = host.querySelector(".actions") || host;
      actions.appendChild(
        link("btn btn-soft btn-sm", "Client Portal Login ↗"),
      );
      var note = document.createElement("div");
      note.className = "small";
      note.dataset.clientPortalResource = "true";
      note.textContent =
        "Clients log in here to upload another file, send or respond to messages, review or sign their return, and check return activity.";
      host.appendChild(note);
    });
  }

  function addSupportResources() {
    document.querySelectorAll(".agp-guide, .asc-side, .securebox").forEach(
      function (host) {
        if (!/helpful resources/i.test(host.textContent || "")) return;
        if (host.querySelector("[data-client-portal-resource]")) return;
        var anchor = link(
          host.classList.contains("agp-guide")
            ? "agp-resource"
            : host.classList.contains("asc-side")
              ? "asc-resource"
              : "btn btn-soft btn-sm",
          "Client Portal Login ↗",
        );
        host.appendChild(anchor);
        var note = document.createElement("div");
        note.className = "small";
        note.dataset.clientPortalResource = "true";
        note.textContent =
          "Send this login to a client who needs to upload files, message you, review, sign, or check their return.";
        host.appendChild(note);
      },
    );
  }

  function updateEmailTemplatePreview() {
    var field = document.getElementById("emailTemplateText");
    if (!field || field.dataset.clientPortalResource) return;
    field.dataset.clientPortalResource = "true";
    if (field.value.indexOf(CLIENT_PORTAL_URL) === -1) {
      field.value =
        field.value.trim() +
        "\n\nClient Portal Login: " +
        CLIENT_PORTAL_URL +
        "\nClients use this portal to upload additional files, send or respond to messages, review or sign their return, and check return activity.";
    }
  }

  function apply() {
    addTopNavigation();
    addGuidedWorkspaceResources();
    addSupportResources();
    updateEmailTemplatePreview();
  }

  window.addEventListener("DOMContentLoaded", apply);
  new MutationObserver(apply).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
