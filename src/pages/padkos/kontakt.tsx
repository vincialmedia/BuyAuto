import { useState, type FormEvent } from "react";

import { PadkosPhoto } from "@/components/padkos/PadkosPhoto";
import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import { sendContactMessage } from "@/lib/padkos/backend";
import { PADKOS } from "@/lib/padkos/routes";

const TOPICS = ["Allgemeine Frage", "Produktwunsch", "Meine Bestellung", "Großbestellung / B2B"];

/** Contact — `Padkos Kontakt.dc.html`. */
export default function PadkosKontaktPage() {
  const [sent, setSent] = useState(false);

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void sendContactMessage({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      topic: String(data.get("topic") ?? ""),
      message: String(data.get("message") ?? ""),
    });
    setSent(true);
  };

  return (
    <PadkosShell>
      <PadkosSeo
        title="Kontakt – Padkos Wien"
        description="Fragen zu Bestellung, Produkten oder Versand? Kontaktiere Padkos in Wien per E-Mail oder Formular – wir antworten innerhalb eines Werktags."
        path={PADKOS.kontakt}
      />

      <div className={chrome.pageBody}>
        <h1 className={chrome.pageTitle}>Say hello!</h1>
        <p className={chrome.pageSub}>
          Fragen, Produktwünsche, Großbestellungen – wir antworten meist am selben Tag.
        </p>

        <div className={shop.contactGrid}>
          <section className={chrome.panel}>
            <h2 className={chrome.panelTitle}>Schreib uns</h2>

            {sent ? (
              <div className={shop.contactSuccess}>
                <p>Vielen Dank!</p>
                <p>
                  Deine Nachricht ist da. Wir melden uns meist noch am selben Werktag – schau
                  auch in den Spam-Ordner.
                </p>
              </div>
            ) : (
              <form onSubmit={send} className={shop.contactForm}>
                <input
                  required
                  name="name"
                  autoComplete="name"
                  placeholder="Dein Name"
                  aria-label="Name"
                  className={chrome.input}
                />
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="deine@email.at"
                  aria-label="E-Mail"
                  className={chrome.input}
                />
                <select
                  name="topic"
                  aria-label="Thema"
                  defaultValue={TOPICS[0]}
                  className={chrome.input}
                >
                  {TOPICS.map((topic) => (
                    <option key={topic}>{topic}</option>
                  ))}
                </select>
                <textarea
                  required
                  name="message"
                  rows={5}
                  placeholder="Deine Nachricht … (z. B. welches Produkt dir aus der Heimat fehlt)"
                  aria-label="Nachricht"
                  className={chrome.input}
                />
                <button
                  type="submit"
                  className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd}`}
                  style={{ minHeight: 52, fontSize: 15 }}
                >
                  Nachricht senden
                </button>
              </form>
            )}
          </section>

          <div className={shop.contactAside}>
            <section className={shop.contactPanel}>
              <h2 className={chrome.panelTitle}>Der Laden in Wien</h2>
              <p className={shop.infoText}>
                Padkos e.U.
                <br />
                Neubaugasse 12, 1070 Wien
                <br />
                <a href="mailto:hallo@padkos.at">hallo@padkos.at</a> ·{" "}
                <a href="tel:+4319071234">+43 1 907 12 34</a>
              </p>
              <dl className={shop.hoursList}>
                <div className={shop.hoursRow}>
                  <dt>Mo–Fr</dt>
                  <dd>10:00 – 18:30</dd>
                </div>
                <div className={shop.hoursRow}>
                  <dt>Sa</dt>
                  <dd>9:00 – 17:00</dd>
                </div>
                <div className={shop.hoursRow}>
                  <dt>So &amp; Feiertag</dt>
                  <dd>geschlossen</dd>
                </div>
              </dl>
              <p className={shop.infoFine}>
                Abholung von Online-Bestellungen zu den Öffnungszeiten – einfach Bestellnummer
                mitbringen.
              </p>
            </section>

            <PadkosPhoto
              alt="Foto vom Laden in der Neubaugasse mit Anfahrtsplan"
              caption="FOTO · LADEN & ANFAHRT"
              from="#EBDCB8"
              to="#E4D1A6"
              aspectRatio="16 / 9"
              className={shop.mapPhoto}
            >
              <span className={shop.mapTag}>NEUBAUGASSE 12 · 1070</span>
            </PadkosPhoto>
          </div>
        </div>
      </div>
    </PadkosShell>
  );
}
