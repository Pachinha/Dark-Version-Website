import "server-only";

// WhatsApp para a equipa quando chega um pedido novo, através do bot CallMeBot
// (gratuito). Cada pessoa ativa o bot no próprio telemóvel e recebe uma "apikey":
//   1. Em https://www.callmebot.com/blog/free-api-whatsapp-messages/ ver o número
//      atual do bot e guardá-lo nos contactos do telemóvel
//   2. Enviar-lhe por WhatsApp a frase indicada nessa página
//   3. O bot responde com a apikey
// Depois, em .env.local (vários destinatários separados por vírgula):
//   STAFF_WHATSAPP=351912345678:1234567,351913456789:7654321
//
// A mensagem não leva dados pessoais do cliente (nome, telefone, morada):
// passa por um serviço externo, por isso só diz que há um pedido e dá o link.
export async function alertStaff(message: string) {
  const recipients = (process.env.STAFF_WHATSAPP ?? "")
    .split(",")
    .map((r) => r.trim().split(":"))
    .filter(([phone, key]) => phone && key);

  if (!recipients.length) {
    console.info("[alerta equipa] STAFF_WHATSAPP não configurado — mensagem não enviada:\n" + message);
    return;
  }

  await Promise.all(
    recipients.map(async ([phone, apikey]) => {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&apikey=${apikey}&text=${encodeURIComponent(message)}`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) console.error(`[alerta equipa] falhou para ${phone.slice(0, 5)}…: HTTP ${res.status}`);
      } catch (error) {
        console.error(`[alerta equipa] falhou para ${phone.slice(0, 5)}…`, error);
      }
    }),
  );
}
