function login() {
      const username = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;

      fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      }).then(res => {
        if (res.ok) {
          localStorage.setItem("username", username);
          window.location.href = "home.html";
          alert("Login efetuado com sucesso");
        } else {
          alert("Login inválido");
        }
      });
    }