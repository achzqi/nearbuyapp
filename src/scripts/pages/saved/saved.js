import { ProdukIDB } from "../../data/database.js";

const saved = {
  async render() {
    return `
      <div class="saved-page">
        <h2>Produk Tersimpan</h2>
        <div class="saved-container"></div>
      </div>
    `;
  },

  async afterRender() {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const userId = currentUser?.email || "guest";

    const container = document.querySelector(".saved-container");
    const savedProduk = await ProdukIDB.getAllProduk(userId);

    if (!savedProduk.length) {
      container.innerHTML = `<p>Tidak ada produk tersimpan</p>`;
      return;
    }

    savedProduk.forEach((item) => {
      const card = document.createElement("div");
      card.className = "produk-card";
      card.innerHTML = `
        <img src="${item.foto}" alt="${item.namaBarang}">
        <div>
          <h4>${item.namaBarang}</h4>
          <p>${item.deskripsi || "-"}</p>
          <p>Kontak: ${item.kontak || "-"}</p>
          <button class="remove"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      card.querySelector(".remove").addEventListener("click", async () => {
        await ProdukIDB.deleteProduk(item.id, userId);
        card.remove();

        const sisa = await ProdukIDB.getAllProduk(userId);
        if (!sisa.length) {
          container.innerHTML = `<p>Tidak ada produk tersimpan</p>`;
        }
      });

      container.appendChild(card);
    });
  },
};

export default saved;
