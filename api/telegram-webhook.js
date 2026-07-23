import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@example.com",
      process.env.VITE_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );

    const body = req.body;
    const message = body?.message;
    if (!message) return res.status(200).json({ ok: true });

    const chatId = String(message.chat.id);
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (chatId !== adminChatId) {
      console.warn(`[webhook] Unauthorized chat_id: ${chatId}`);
      return res.status(200).json({ ok: true });
    }

    const text = (message.text ?? "").trim();
    if (!text.startsWith("/broadcast ")) {
      await sendTelegramMessage(chatId, "⚠️ استخدم:\n/broadcast رسالتك هنا");
      return res.status(200).json({ ok: true });
    }

    const broadcastMessage = text.replace("/broadcast ", "").trim();
    if (!broadcastMessage) {
      await sendTelegramMessage(chatId, "⚠️ الرسالة فارغة.");
      return res.status(200).json({ ok: true });
    }

    const supabase = getSupabaseAdmin();

    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (fetchError) {
      await sendTelegramMessage(chatId, `❌ خطأ: ${fetchError.message}`);
      return res.status(200).json({ ok: true });
    }

    const rows = subscriptions ?? [];
    if (rows.length === 0) {
      await sendTelegramMessage(chatId, "ℹ️ لا يوجد مشتركون.");
      return res.status(200).json({ ok: true });
    }

    const payload = JSON.stringify({
      title: "Permission | حاسبة العطل",
      body: broadcastMessage,
    });

    const staleIds = [];
    let successCount = 0;
    let failCount = 0;

    await Promise.allSettled(
      rows.map(async (row) => {
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            payload,
          );
          successCount++;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleIds.push(row.id);
          } else {
            console.error(`[webhook] Push failed:`, err);
          }
          failCount++;
        }
      }),
    );

    if (staleIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", staleIds);
    }

    const report =
      `✅ تم الإرسال!\n` +
      `👥 المشتركون: ${rows.length}\n` +
      `✔️ ناجح: ${successCount}\n` +
      (failCount > 0 ? `❌ فاشل: ${failCount}\n` : "") +
      (staleIds.length > 0 ? `🗑 محذوف: ${staleIds.length}` : "");

    await sendTelegramMessage(chatId, report);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return res.status(200).json({ ok: true });
  }
}

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
