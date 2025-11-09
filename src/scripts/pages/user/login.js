import Swal from "sweetalert2";

const login = {
  render() {
    return `
      <div class="loginContainer">
        <div class="login-item">
          <h2>Login</h2>
          <form id="loginForm">
            <label for="email">Email</label>
            <input type="email" id="email" required>
            <label for="password">Password</label>
            <input type="password" id="password" required>
            <a href="#/regis" class="daftar">Belum Punya Akun?</a>
            <button class="btnLogin" type="submit">Login</button>
          </form>
        </div>
      </div>
    `;
  },

  afterRender() {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      Swal.fire({
        title: "Sedang memproses...",
        html: "Mohon tunggu sebentar.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const res = await fetch("https://story-api.dicoding.dev/v1/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await res.json();

        Swal.close();

        if (!result.error && result.loginResult) {
          localStorage.setItem("token", result.loginResult.token);
          localStorage.setItem(
            "user",
            JSON.stringify({
              userId: result.loginResult.userId,
              name: result.loginResult.name,
              email,
            })
          );

          await Swal.fire({
            icon: "success",
            iconColor: "#fa812f",
            title: `Selamat datang, ${result.loginResult.name}!`,
            showConfirmButton: false,
            timer: 2000,
          });

          window.location.href = "#/nearby";
          window.location.reload();
        } else {
          Swal.fire({
            icon: "error",
            title: "Login Gagal",
            text: result.message || "Email atau password salah.",
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Kesalahan Jaringan",
          text: "Terjadi kesalahan saat menghubungi server.",
        });
      }
    });
  },
};

export default login;
