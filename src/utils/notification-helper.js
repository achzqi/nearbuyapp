const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

function convertBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isNotificationAvailable() {
  return "Notification" in window && "serviceWorker" in navigator;
}

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function isSubscribed() {
  const registration = await navigator.serviceWorker.getRegistration();
  const sub = await registration?.pushManager.getSubscription();
  return !!sub;
}

export async function subscribe() {
  if (!isNotificationAvailable()) {
    alert("Browser tidak mendukung Push Notification!");
    return;
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    alert("Izin notifikasi tidak diberikan.");
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    alert("Kamu sudah berlangganan notifikasi.");
    return;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const sub = subscription.toJSON();
    delete sub.expirationTime;

    const response = await fetch(
      `https://story-api.dicoding.dev/v1/notifications/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(sub),
      }
    );

    const json = await response.json();
    console.log("Subscribe berhasil:", json);

    if (json.error) {
      console.error("Gagal subscribe:", json.message);
      alert("Gagal berlangganan notifikasi!");
    } else {
      alert("Berhasil berlangganan notifikasi!");
    }
  } catch (err) {
    console.error("Gagal subscribe:", err);
    alert("Gagal berlangganan notifikasi.");
  }
}

export async function unsubscribe() {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) {
    alert("Belum berlangganan notifikasi.");
    return;
  }

  try {
    await fetch(`https://story-api.dicoding.dev/v1/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    await subscription.unsubscribe();
    alert("Berhasil berhenti berlangganan notifikasi.");
  } catch (err) {
    console.error("Gagal unsubscribe:", err);
    alert("Gagal berhenti berlangganan notifikasi.");
  }
}
