(function () {
  "use strict";

  function authObject() {
    if (window.fb && window.fb.auth) return window.fb.auth;
    if (window.auth) return window.auth;
    if (window.firebase && firebase.auth) return firebase.auth();
    return null;
  }

  function emailField() {
    return (
      document.getElementById("loginEmail") ||
      document.getElementById("email")
    );
  }

  function passwordField() {
    return (
      document.getElementById("loginPassword") ||
      document.getElementById("password")
    );
  }

  function message(text, error) {
    var output =
      document.getElementById("loginError") ||
      document.getElementById("loginMsg");
    if (!output) return;
    output.textContent = text;
    output.classList.remove("hidden");
    if (error) output.classList.add("warnbox");
  }

  function decorateLogin() {
    var password = passwordField();
    if (!password) return;
    var card = password.closest(".card-pad, .login") || password.parentElement;
    if (!card || card.querySelector("#rememberDevice")) return;
    var actions = card.querySelector(".actions") || password.parentElement.nextElementSibling;
    var signInButton =
      card.querySelector("#signIn") ||
      card.querySelector('button[onclick*="emailSignIn"]') ||
      card.querySelector('button[onclick*="login"]');
    var remember = document.createElement("label");
    remember.className = "checkline";
    remember.innerHTML =
      '<input id="rememberDevice" type="checkbox" checked> Remember this device for easier sign-in';
    if (actions && card.contains(actions)) card.insertBefore(remember, actions);
    else if (signInButton) card.insertBefore(remember, signInButton);
    else card.appendChild(remember);

    var forgot = document.createElement("button");
    forgot.type = "button";
    forgot.className = "btn btn-ghost";
    forgot.textContent = "Forgot password?";
    forgot.onclick = window.pctForgotPassword;
    if (actions && card.contains(actions)) actions.appendChild(forgot);
    else if (signInButton) signInButton.insertAdjacentElement("afterend", forgot);
    else card.appendChild(forgot);

    password.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (typeof window.emailSignIn === "function") window.emailSignIn();
      else if (typeof window.login === "function") window.login();
    });
  }

  window.pctForgotPassword = async function () {
    var auth = authObject(), email = (emailField()?.value || "").trim();
    if (!email) {
      message("Enter your email address first.", true);
      return;
    }
    try {
      if (auth) await auth.sendPasswordResetEmail(email);
    } catch (_) {}
    message(
      "If an account exists for that email, a password-reset link has been sent.",
      false,
    );
  };

  async function signIn() {
    var auth = authObject(), email = (emailField()?.value || "").trim();
    var password = passwordField()?.value || "";
    if (!auth) return message("PCT sign-in is temporarily unavailable.", true);
    if (!email || !password) return message("Enter your email and password.", true);
    try {
      var remember = document.getElementById("rememberDevice")?.checked !== false;
      if (auth.setPersistence && window.firebase?.auth?.Auth?.Persistence) {
        await auth.setPersistence(
          remember
            ? firebase.auth.Auth.Persistence.LOCAL
            : firebase.auth.Auth.Persistence.SESSION,
        );
      }
      await auth.signInWithEmailAndPassword(email, password);
    } catch (_) {
      message("Sign-in was unsuccessful. Check your information or reset your password.", true);
    }
  }

  window.addEventListener("DOMContentLoaded", function () {
    window.setTimeout(function () {
      decorateLogin();
      if (typeof window.emailSignIn === "function") window.emailSignIn = signIn;
      if (typeof window.login === "function") window.login = signIn;
      var signInButton = document.getElementById("signIn");
      if (signInButton) signInButton.onclick = signIn;
    }, 0);
  });
})();
