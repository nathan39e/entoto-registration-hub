import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY;
const firebaseConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID,
  appId,
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export type PushStatus = "registered" | "not-configured" | "unsupported" | "open-in-new-tab" | "denied";

/** Must be called from a click. Registers this device for application reminders. */
export async function enablePush(): Promise<PushStatus> {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !appId || !vapidKey || !firebaseConfig.messagingSenderId) return "not-configured";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) return "unsupported";
  if (window.top !== window.self) return "open-in-new-tab";
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const query = new URLSearchParams(firebaseConfig).toString();
  const serviceWorkerRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration });
  if (!token) return "denied";
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from("push_tokens").upsert({ token, user_id: user.id });
  localStorage.setItem("pushEnabled", "1");
  return "registered";
}

export const pushMessages: Record<Exclude<PushStatus, "registered">, string> = {
  "not-configured": "Notifications are not set up yet.",
  unsupported: "This browser does not support notifications. On iPhone, install the portal to your home screen first.",
  "open-in-new-tab": "Open the portal in its own tab (or the installed app) to turn on notifications.",
  denied: "Notifications are blocked. Allow them in your browser's site settings.",
};
