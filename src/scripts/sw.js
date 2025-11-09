import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  console.log("Push event diterima!");

  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Gagal parse data push:", e);
    }
  } else {
    console.warn("Tidak ada data di push event");
  }

  const title = data.title || "ada produk baru nih!";
  const options = {
    body: data.options?.body || "temukan produk baru di nearbuy",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
