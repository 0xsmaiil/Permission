import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

const REQUIRED_ENV = [
  "TELEGRAM_WEBHOOK_SECRET",
  "TELEGRAM_BOT_TOKEN",
  "ADMIN_CHAT_ID",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
];

function assertEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
    missing.push("SUPABASE_URL");
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

function safeEqual(a, b) {
  // Empty/absent values never authenticate. Two zero-length buffers would
  // otherwise compare equal, letting "no secret set + no header" pass.
  if (typeof a !== "string" || typeof b !== "string" || a === "" || b === "") {
    return false;
  }
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

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
    // Fail closed: a missing secret must never mean "skip verification".
    // safeEqual("", undefined) is false, so an unset secret rejects every request.
    if (!safeEqual(req.headers["x-telegram-bot-api-secret-token"], process.env.TELEGRAM_WEBHOOK_SECRET)) {
      console.warn("[webhook] Invalid secret token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    assertEnv();

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@example.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );

    const body = req.body;
    const message = body?.message;
    if (!message) return res.status(200).json({ ok: true });

    const chatId = String(message.chat.id);

    const text = (message.text ?? "").trim();
    if (text === "/ping") {
      await sendTelegramMessage(chatId, "Pong! Bot is running.");
      return res.status(200).json({ ok: true });
    }

    if (!safeEqual(chatId, process.env.ADMIN_CHAT_ID)) {
      console.warn(`[webhook] Unauthorized chat_id: ${chatId}`);
      return res.status(200).json({ ok: true });
    }

    if (text === "/reset") {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        await sendTelegramMessage(chatId, `❌ خطأ: ${error.message}`);
      } else {
        await sendTelegramMessage(chatId, "🗑 تم حذف جميع الاشتراكات القديمة. يمكن للمستخدمين إعادة الاشتراك الآن.");
      }
      return res.status(200).json({ ok: true });
    }

    if (text === "/start" || text === "/help") {
      await sendTelegramMessage(chatId,
        `📢 Permission Bot\n\n` +
        `الأوامر المتاحة:\n` +
        `/broadcast <نص> — إرسال إشعار لجميع المستخدمين\n` +
        `/reset — حذف جميع الاشتراكات القديمة\n` +
        `/ping — التحقق من حالة البوت\n` +
        `\n` +
        `Commandes:\n` +
        `/broadcast <texte> — Envoyer une notification à tous les utilisateurs\n` +
        `/reset — Supprimer tous les anciens abonnements\n` +
        `/ping — Vérifier l'état du bot\n` +
        `/help — Afficher cette aide`
      );
      return res.status(200).json({ ok: true });
    }

    if (!text.startsWith("/broadcast ")) {
      await sendTelegramMessage(chatId, "⚠️ Utilisez /broadcast pour envoyer une notification.\nUse /help pour plus d'infos.");
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
      title: "Permission",
      body: broadcastMessage,
      dir: "auto",
      lang: "en",
      actionOpen: "Open",
      actionClose: "Close",
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
    return res.status(500).json({ ok: false });
  }
}

async function sendTelegramMessage(chatId, text) {
  const token = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  if (!token) {
    console.error("[sendTelegramMessage] TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error("[sendTelegramMessage] HTTP error:", response.status, body);
    }
  } catch (err) {
    console.error("[sendTelegramMessage] fetch failed:", err);
  }
}
