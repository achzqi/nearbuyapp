import "../styles/styles.css";
import "../scripts/app.js";
import { router } from "./routes/routes.js";

function isServiceWorkerAvailable() {
  return "serviceWorker" in navigator;
}
async function registerServiceWorker() {
  if (!isServiceWorkerAvailable()) {
    console.log("Service Worker API unsupported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/sw.bundle.js"
    );
    console.log("Service worker telah terpasang", registration);
  } catch (error) {
    console.log("Failed to install service worker:", error);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  router();
  await registerServiceWorker();
});

window.addEventListener("hashchange", () => {
  if (window.cameraStream) {
    window.cameraStream.getTracks().forEach((track) => track.stop());
    window.cameraStream = null;
  }
  router();
});

window.addEventListener("load", () => {
  router();
});
