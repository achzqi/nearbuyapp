const regis = {
  render() {
    return `
    <div class="regisContainer">
      <div class="regis-item">
        <h2>Registrasi</h2>
        <form id="regisForm">
          <label for ="name">Nama</label>
          <input type="text" id="name" required>
          <label for ="email">Email</label>
          <input type="email" id="email" required>
          <label for ="password">Password</label>
          <input type="password" id="password" required minlength="8">
          <button class="btnLogin" type="submit">Daftar</button>
        </form>
      </div>
    </div>
    `;
  },
  afterRender() {
    const form = document.getElementById("regisForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (password.length < 8) {
        alert("Password minimal 8 karakter.");
        return;
      }

      try {
        const res = await fetch("https://story-api.dicoding.dev/v1/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const result = await res.json();
        if (!result.error) {
          alert("Registrasi berhasil. Silakan login.");
          window.location.href = "#/login";
        } else {
          alert(result.message || "Gagal registrasi.");
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan jaringan saat registrasi.");
      }
    });
  },
};

export default regis;
