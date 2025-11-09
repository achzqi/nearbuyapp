import { ProdukIDB } from "../../data/database.js";

const nearby = {
  render() {
    return `
      <div class="NearbyMap">
        <h2>Peta Produk Sekitar</h2>
        <div id="map" class="map"></div>
        <a href="#/tambahkan" class="tambahkan">Tambahkan Barang anda</a>
        <div id="modal" class="modal" aria-hidden="true">
          <div class="modal-content" role="dialog" aria-modal="true">
            <button id="closeModal" class="close" aria-label="Tutup">&times;</button>
            <img id="modalImg" class="modal-img" src="" alt="Barang">
            <h2 id="modalNamaBarang"></h2>
            <p><b>Nama Penjual:</b> <span id="modalNama"></span></p>
            <p><b>Kontak:</b> <span id="modalKontak"></span></p>
            <p id="modaldeskripsi"></p>
          </div>
          </div>
          </div>
          <h2>Daftar Produk Sekitar</h2>
          <div class="NearbyProducts">
          <div class="NearbyContainer">
          <div class="grid-produk"></div>
          </div>
          </div>
    `;
  },

  async afterRender() {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const token = localStorage.getItem("token");
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const userId = currentUser?.email || "guest";

        document.querySelector(".tambahkan").addEventListener("click", (e) => {
          e.preventDefault();
          if (token) window.location.href = "#/tambahkan";
          else window.location.href = "#/login";
        });

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const mapContainer = document.getElementById("map");
        if (mapContainer._leaflet_id) {
          mapContainer._leaflet_id = null;
        }

        const map = L.map("map").setView([lat, lng], 11);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        }).addTo(map);

        const produkTersimpan =
          JSON.parse(localStorage.getItem("produk")) || [];
        const usersLocal = JSON.parse(localStorage.getItem("users")) || [];

        let semuaProduk = [];

        const extractContact = (desc = "") => {
          const m = desc.match(/Kontak:\s*(.+)/i);
          return m ? m[1].split("\n")[0].trim() : "-";
        };

        const formatDescription = (text = "") => {
          return text
            .replace(/\nPenjual:/g, "<br><b>Penjual:</b>")
            .replace(/\nKontak:/g, "<br><b>Kontak:</b>")
            .replace(/\nProduk:/g, "<br><b>Produk:</b>")
            .replace(/\n/g, "<br>");
        };

        if (token) {
          try {
            const res = await fetch(
              "https://story-api.dicoding.dev/v1/stories?location=1&size=100",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const data = await res.json();
            if (!data.error && data.listStory) {
              const apiItems = data.listStory
                .filter((s) => s.lat && s.lon)
                .map((s) => ({
                  id: s.id,
                  namaBarang: s.name || "Story",
                  nama: s.name || "Anonymous",
                  deskripsi: s.description || "",
                  foto: s.photoUrl,
                  lokasi: [s.lat, s.lon],
                }));
              semuaProduk = [...apiItems];
            } else {
              console.warn("API stories response:", data);
            }
          } catch (err) {
            console.error("Gagal ambil stories dari API:", err);
          }
        } else {
          console.warn(
            "Token tidak ditemukan. Login agar peta mengambil data dari Story API."
          );
        }

        semuaProduk = [
          ...semuaProduk,
          ...produkTersimpan.map((p) => ({
            id: p.id || null,
            namaBarang: p.namaBarang,
            nama: p.nama,
            deskripsi: p.deskripsi,
            foto: p.gambar,
            lokasi: [p.lat, p.lng],
          })),
          ...usersLocal.flatMap((u) =>
            (u.products || []).map((p) => ({
              id: p.id || null,
              namaBarang: p.namaBarang,
              nama: p.nama,
              deskripsi: p.deskripsi,
              foto: p.gambar,
              lokasi: [p.lat, p.lng],
            }))
          ),
        ];

        const userMarker = L.circleMarker([lat, lng], {
          radius: 8,
          color: "blue",
          fillColor: "#3388ff",
          fillOpacity: 0.8,
        }).addTo(map);
        userMarker.bindPopup("<b>Lokasi Anda</b>");

        semuaProduk.forEach((item) => {
          if (!item.lokasi || item.lokasi.length !== 2) return;

          const icon = L.divIcon({
            html: `
              <img 
                src="${item.foto}" 
                alt="${item.namaBarang}"
                style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #fff; object-fit: cover;"
              >
            `,
            className: "",
          });

          const marker = L.marker(item.lokasi, { icon }).addTo(map);

          const contactText = extractContact(item.deskripsi);
          const shortDesc = (item.deskripsi || "").split("\n")[0] || "-";

          const popupHtml = `
            <div>
              <img src="${item.foto}" alt="${item.namaBarang}" style="width:120px;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px;">
              <div><b>${item.namaBarang}</b></div>
              <div>
              <p>${shortDesc}</p>
              <div>Kontak: ${contactText}</div>
              <div>lokasi: ${item.lokasi}</div>
            </div>
          `;
          marker.bindPopup(popupHtml);

          marker.on("click", () => {
            document.getElementById("modalImg").src = item.foto;
            document.getElementById("modalNamaBarang").textContent =
              item.namaBarang;
            document.getElementById("modalNama").textContent = item.nama;
            document.getElementById("modaldeskripsi").innerHTML =
              formatDescription(item.deskripsi || "-");
            document.getElementById("modalKontak").textContent = extractContact(
              item.deskripsi || "-"
            );
            const modal = document.getElementById("modal");
            modal.style.display = "flex";
            modal.setAttribute("aria-hidden", "false");
          });
        });
        const nearbyContainer = document.querySelector(".NearbyContainer");
        const gridContainer = nearbyContainer.querySelector(".grid-produk");

        semuaProduk.forEach((item) => {
          const contactText = extractContact(item.deskripsi);
          const shortDesc = (item.deskripsi || "").split("\n")[0] || "-";

          const card = document.createElement("div");
          card.className = "produk-card";
          card.innerHTML = `
          <img src="${item.foto}" alt="${item.namaBarang}">
        <div >
        <h4>${item.namaBarang}</h4>
        <p>${shortDesc}</p>
        <p>Kontak: ${contactText}</p>
        <p>lokasi: ${item.lokasi}</p>
        <button class="save"><i class="fa-regular fa-bookmark"></i></button>
        <button class="see">Lihat di Peta</button>
    </div>
  `;
          const seeButton = card.querySelector(".see");
          const saveButton = card.querySelector(".save");
          ProdukIDB.getProduk(item.id, userId).then((savedProduk) => {
            if (savedProduk) {
              saveButton.innerHTML = `<i class="fa-solid fa-bookmark"></i>`;
            }
          });
          saveButton.addEventListener("click", async () => {
            const isSaved = await ProdukIDB.getProduk(item.id, userId);
            if (isSaved) {
              await ProdukIDB.deleteProduk(item.id, userId);
              saveButton.innerHTML = `<i class="fa-regular fa-bookmark"></i>`;
            } else {
              await ProdukIDB.putProduk(item, userId);
              saveButton.innerHTML = `<i class="fa-solid fa-bookmark"></i>`;
            }
          });

          seeButton.addEventListener("click", () => {
            const [latProduk, lngProduk] = item.lokasi;
            if (latProduk && lngProduk) {
              map.flyTo([latProduk, lngProduk], 15, {
                animate: true,
                duration: 1.2,
              });
              L.popup()
                .setLatLng([latProduk, lngProduk])
                .setContent(`<b>${item.namaBarang}</b><br>${shortDesc}`)
                .openOn(map);
            }
          });

          gridContainer.appendChild(card);
        });

        const closeModal = document.getElementById("closeModal");
        closeModal.addEventListener("click", () => {
          const modal = document.getElementById("modal");
          closeModal.blur();

          modal.style.display = "none";
          modal.setAttribute("aria-hidden", "true");
        });
      },
      (err) => {
        console.error(err);
        alert("Gagal mendapatkan lokasi Anda. Pastikan GPS aktif.");
      }
    );
  },
};

export default nearby;
