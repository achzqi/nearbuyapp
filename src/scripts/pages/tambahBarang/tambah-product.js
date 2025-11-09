window.cameraStream = null;

const tambahBarang = {
  render() {
    return `
      <div class="tambahBcontainer">
        <div class="form-container">
          <h2>Menu Tambah Barang</h2>
          <form id="produkForm" enctype="multipart/form-data">
    
            <label for="namaProduk">Nama Produk</label>
            <input type="text" id="namaProduk" required>

            <label for="nama">Nama Anda (akan dikirim sebagai description)</label>
            <input type="text" id="nama" required>

            <label for="kontak">Kontak</label>
            <input type="text" id="kontak" required>

            <label for="deskripsi">Deskripsi</label>
            <textarea id="deskripsi" required></textarea>

            <label>Foto Produk</label>
            <div class="camera-container">
              <video id="camera" autoplay playsinline></video>
              <canvas id="preview" style="display:none;"></canvas>
              <img id="photoResult" alt="Hasil Foto">
            </div>
            <div class ="tombolgroup">
              <button id="takePhoto" type="button">Ambil Foto</button>
              <button type="button" id="switchCamera">Ganti Kamera</button>
              <button type="button" id="resetPhoto">Reset Foto</button>
            </div>
            <label for="gambar">Atau pilih dari folder:</label>
            <input type="file" id="gambar" accept="image/*">

            <label>Lokasi Anda(klik area jika dirasa gps kurang akurat)</label>
            <div id="mymap" style="height:300px;"></div>
            <input type="hidden" id="lat">
            <input type="hidden" id="lng">

            <button class="btnSubmit" type="submit">Simpan Produk (Upload)</button>

            <div id="produkList" class="produk-list">
              <h2>produk anda</h2>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  afterRender() {
    const video = document.getElementById("camera");
    const canvas = document.getElementById("preview");
    const photoResult = document.getElementById("photoResult");
    const takePhotoBtn = document.getElementById("takePhoto");
    const fileInput = document.getElementById("gambar");
    const resetPhotoBtn = document.getElementById("resetPhoto");
    const switchCameraBtn = document.getElementById("switchCamera");

    let fotoBase64 = null;
    let fileBlob = null;
    let useBackCamera = true;

    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    if (!token || !currentUser) {
      alert("Silakan login terlebih dahulu agar bisa meng-upload story.");
      window.location.href = "#/login";
      return;
    }

    function dataURLtoBlob(dataurl) {
      const arr = dataurl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    }

    const startCamera = (facing) => {
      if (window.cameraStream) {
        window.cameraStream.getTracks().forEach((t) => t.stop());
        window.cameraStream = null;
      }
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: facing ? { ideal: facing } : true },
          audio: false,
        })
        .then((stream) => {
          window.cameraStream = stream;
          video.srcObject = stream;
          video.style.display = "block";
        })
        .catch((err) => {
          console.error("Gagal akses kamera:", err);
        });
    };

    startCamera("environment");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        document.getElementById("lat").value = lat;
        document.getElementById("lng").value = lng;

        const mapContainer = document.getElementById("mymap");
        if (mapContainer._leaflet_id) {
          mapContainer._leaflet_id = null;
        }
        const map = L.map("mymap").setView([lat, lng], 20);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        }).addTo(map);
        let markerProduk = null;

        map.on("click", function (e) {
          const { lat, lng } = e.latlng;
          document.getElementById("lat").value = lat;
          document.getElementById("lng").value = lng;

          if (markerProduk) {
            map.removeLayer(markerProduk);
          }

          markerProduk = L.marker([lat, lng]).addTo(map);
          markerProduk
            .bindPopup(
              `<b>Lokasi Produk</b><br>${lat.toFixed(5)}, ${lng.toFixed(5)}`
            )
            .openPopup();
        });

        const userMarker = L.circleMarker([lat, lng], {
          radius: 8,
          color: "blue",
          fillColor: "#3388ff",
          fillOpacity: 0.8,
        }).addTo(map);
        userMarker.bindPopup("<b>Lokasi Anda</b>").openPopup();

        const produkList = document.getElementById("produkList");
        async function tampilkanProdukUser() {
          if (!produkList) return;
          produkList.innerHTML = "<h2>Produk Anda</h2>";

          try {
            const res = await fetch(
              "https://story-api.dicoding.dev/v1/stories?size=100",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const data = await res.json();
            if (data.error) {
              produkList.innerHTML +=
                "<p>Tidak dapat mengambil data produk dari server.</p>";
              return;
            }

            const hidden = JSON.parse(
              localStorage.getItem("hiddenStories") || "[]"
            );
            const storiesUser = (data.listStory || []).filter(
              (s) => s.name === currentUser.name && !hidden.includes(s.id)
            );

            if (storiesUser.length === 0) {
              produkList.innerHTML +=
                "<p>Kamu belum upload produk apapun (atau produk disembunyikan).</p>";
              return;
            }

            storiesUser.forEach((p) => {
              const div = document.createElement("div");
              div.className = "produk-item";
              div.dataset.storyId = p.id;
              div.innerHTML = `
                <img src="${p.photoUrl}" alt="${p.name}" />
                <div>
                  <h3>${p.name}</h3>
                  <p>${(p.description || "").split("\n")[0] || "-"}</p>
                  <p><i>${new Date(p.createdAt).toLocaleString()}</i></p>
                  <button class="hapusBtn">Barang sudah laku / hapus</button>
                </div>`;
              produkList.appendChild(div);
            });

            produkList.querySelectorAll(".hapusBtn").forEach((btn) => {
              btn.addEventListener("click", (e) => {
                const card = e.target.closest(".produk-item");
                const storyId = card.dataset.storyId;
                if (
                  confirm(
                    "Tandai produk ini sudah laku? (akan disembunyikan dari daftar)"
                  )
                ) {
                  const hiddenStories = JSON.parse(
                    localStorage.getItem("hiddenStories") || "[]"
                  );
                  hiddenStories.push(storyId);
                  localStorage.setItem(
                    "hiddenStories",
                    JSON.stringify(hiddenStories)
                  );
                  card.remove();
                  alert(
                    "Produk disembunyikan dari tampilan (tidak dihapus dari server)."
                  );
                }
              });
            });
          } catch (err) {
            console.error("Gagal ambil produk:", err);
            produkList.innerHTML +=
              "<p>Terjadi kesalahan saat mengambil data produk.</p>";
          }
        }
        tampilkanProdukUser();

        takePhotoBtn.addEventListener("click", () => {
          if (!window.cameraStream)
            return alert("Kamera belum aktif atau tidak tersedia.");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0);
          fotoBase64 = canvas.toDataURL("image/png");
          photoResult.src = fotoBase64;
          photoResult.style.display = "block";

          fileInput.disabled = true;
          fileInput.style.opacity = "0.5";
        });

        fileInput.addEventListener("change", () => {
          if (fileInput.files.length > 0) {
            if (window.cameraStream) {
              window.cameraStream.getTracks().forEach((track) => track.stop());
              window.cameraStream = null;
            }
            video.style.display = "none";
            takePhotoBtn.disabled = true;
            fotoBase64 = null;
            fileBlob = fileInput.files[0];

            if (fileBlob.size > 1_000_000) {
              alert(
                "Ukuran foto lebih dari 1MB, silakan pilih foto lebih kecil."
              );
              fileInput.value = "";
              fileBlob = null;
            }
          }
        });

        resetPhotoBtn.addEventListener("click", () => {
          fotoBase64 = null;
          fileBlob = null;
          photoResult.src = "";
          photoResult.style.display = "none";
          fileInput.disabled = false;
          fileInput.style.opacity = "1";
          fileInput.value = "";

          startCamera(useBackCamera ? "environment" : "user");
        });

        switchCameraBtn.addEventListener("click", () => {
          useBackCamera = !useBackCamera;
          startCamera(useBackCamera ? "environment" : "user");
        });

        const form = document.getElementById("produkForm");
        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          const namaBarang = document.getElementById("namaProduk").value.trim();
          const nama = document.getElementById("nama").value.trim();
          const kontak = document.getElementById("kontak").value.trim();
          const deskripsi = document.getElementById("deskripsi").value.trim();
          const latVal = parseFloat(document.getElementById("lat").value);
          const lngVal = parseFloat(document.getElementById("lng").value);

          if (!fotoBase64 && !fileBlob) {
            alert("Silakan ambil foto atau pilih dari folder!");
            return;
          }

          try {
            let blobToUpload = null;
            if (fotoBase64) {
              blobToUpload = dataURLtoBlob(fotoBase64);

              if (blobToUpload.size > 1_000_000) {
                alert(
                  "Foto hasil kamera > 1MB, silakan kurangi resolusi atau pilih file lain."
                );
                return;
              }
            } else if (fileBlob) {
              blobToUpload = fileBlob;
            }

            const formData = new FormData();
            const finalDescription = `${deskripsi}\nPenjual: ${nama}\nKontak: ${kontak}\nProduk: ${namaBarang}`;
            formData.append("description", finalDescription);
            formData.append("photo", blobToUpload, "photo.png");
            if (!Number.isNaN(latVal) && !Number.isNaN(lngVal)) {
              formData.append("lat", latVal);
              formData.append("lon", lngVal);
            }

            const response = await fetch(
              "https://story-api.dicoding.dev/v1/stories",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              }
            );

            const result = await response.json();
            if (!result.error) {
              alert("Upload berhasil: " + (result.message || "success"));
              form.reset();
              photoResult.src = "";
              photoResult.style.display = "none";

              window.location.href = "#/nearby";
            } else {
              alert(result.message || "Gagal upload story.");
            }
          } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat upload (jaringan/CORS?).");
          }
        });
      },
      (err) => {
        console.error(err);
        alert("Gagal mendapatkan lokasi Anda. Pastikan GPS aktif.");
      }
    );
  },
};

export default tambahBarang;
