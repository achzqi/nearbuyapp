// app.js
import "./index.js";
import {
  subscribe,
  unsubscribe,
  isSubscribed,
} from "../utils/notification-helper.js";

const log = document.getElementById("log");
const subsButton = document.getElementById("subs");

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

// 🔐 Login/Logout button setup
if (token && user) {
  log.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i>`;
  log.title = `Logout (${user.name})`;

  log.addEventListener("click", () => {
    if (confirm(`Yakin mau logout dari akun ${user.name}?`)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("Berhasil logout!");
      window.location.href = "#/login";
      window.location.reload();
    } else {
      window.location.href = "#/home";
    }
  });
} else {
  log.innerHTML = `<i class="fa-solid fa-user user-icon"></i>`;
  log.title = "Login / Register";

  log.addEventListener("click", () => {
    window.location.href = "#/login";
  });
}

// 🔔 Push Notification setup
async function setupSubscribeButton() {
  const subscribed = await isSubscribed();

  if (subscribed) {
    subsButton.innerHTML = `<i class="fa-solid fa-bell-slash"></i>`;
    subsButton.title = "Berhenti berlangganan notifikasi";
    subsButton.onclick = async () => {
      await unsubscribe();
      setupSubscribeButton();
    };
  } else {
    subsButton.innerHTML = `<i class="fa-solid fa-bell"></i>`;
    subsButton.title = "Berlangganan notifikasi";
    subsButton.onclick = async () => {
      await subscribe();
      setupSubscribeButton();
    };
  }
}

setupSubscribeButton();
