document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");
  const errorMsg = document.getElementById("loginError");
  const loginButton = document.getElementById("loginButton");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError("Preencha todos os campos.");
      return;
    }

    try {
      loginButton.disabled = true;
      loginButton.textContent = "Entrando...";

      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Login inválido");
      }

      localStorage.setItem("username", username);
      window.location.href = "home.html";
    } catch (err) {
      showError(err.message);
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "ENTRAR";
    }
  });

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
  }
});
