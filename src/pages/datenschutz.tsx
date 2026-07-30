import Head from "next/head";

// Fixed revision date (see agb.tsx): a privacy policy carries the date it was
// last changed, and a static value avoids a post-hydration text swap.
const DATENSCHUTZ_STAND = "26.11.2025";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <Head>
        <title>Datenschutz & Impressum | BuyAuto</title>
        <meta name="description" content="Datenschutzerklärung und Impressum von BuyAuto" />
      </Head>

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-neutral-200">
          <h1 className="text-3xl font-bold mb-8 text-neutral-900">Datenschutz / Impressum</h1>

          <div className="prose prose-neutral max-w-none">
            <p className="text-sm text-neutral-500 mb-8">
              Stand: {DATENSCHUTZ_STAND}
            </p>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">1. Einleitung und Überblick</h2>
              <p className="mb-4">
                Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften (insb. Schweizer Datenschutzgesetz (nDSG) und, sofern anwendbar, DSGVO) sowie dieser Datenschutzerklärung.
              </p>
              <p>
                In dieser Datenschutzerklärung erläutern wir Ihnen, welche Daten wir erheben, wie wir sie verwenden und welche Rechte Sie haben.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">2. Verantwortliche Stelle</h2>
              <p className="mb-2">Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                <p className="font-medium">BuyAuto</p>
                <p>Vincent Hänggi</p>
                <p>Brandstrasse 21</p>
                <p>8952 Schlieren (Zürich)</p>
                <p className="mt-2">E-Mail: <a href="mailto:hello@buyauto.ch" className="text-red-600 hover:underline">hello@buyauto.ch</a></p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">3. Erhebung und Bearbeitung von Daten</h2>
              <h3 className="text-lg font-medium mb-2">Beim Besuch der Website</h3>
              <p className="mb-4">
                Beim Aufrufen unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sog. Logfile gespeichert. Folgende Informationen werden dabei ohne Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>IP-Adresse des anfragenden Rechners</li>
                <li>Datum und Uhrzeit des Zugriffs</li>
                <li>Name und URL der abgerufenen Datei</li>
                <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
                <li>Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners sowie der Name Ihres Access-Providers</li>
              </ul>
              <p className="mb-4">
                Diese Daten werden durch unseren Hosting-Provider <strong>Vercel Inc.</strong> (USA) verarbeitet. Wir haben mit Vercel entsprechende Vereinbarungen zur Auftragsverarbeitung abgeschlossen.
              </p>

              <h3 className="text-lg font-medium mb-2">Bei Registrierung und Nutzung der Plattform</h3>
              <p className="mb-4">
                Wenn Sie sich auf unserer Plattform registrieren, Inserate erstellen oder Anfragen senden, verarbeiten wir folgende Daten:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Kontaktdaten (Name, E-Mail-Adresse, Telefonnummer, Adresse)</li>
                <li>Login-Daten (verschlüsseltes Passwort)</li>
                <li>Vertragsdaten (Angaben zu Leasingfahrzeugen, Laufzeiten, Raten)</li>
                <li>Zahlungsdaten (werden direkt an unseren Zahlungsdienstleister übermittelt)</li>
                <li>Bilder und Dokumente, die Sie hochladen</li>
              </ul>
              <p className="mb-4">
                Diese Daten werden in unserer Datenbank bei <strong>Supabase</strong> gespeichert. Die Datenhaltung erfolgt auf Servern in der Schweiz (Zürich, AWS-Infrastruktur).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">4. Cookies und Tracking</h2>
              <p className="mb-4">
                Wir setzen auf unserer Website Cookies ein. Hierbei handelt es sich um kleine Dateien, die Ihr Browser automatisch erstellt und die auf Ihrem Endgerät (Laptop, Tablet, Smartphone o.ä.) gespeichert werden, wenn Sie unsere Seite besuchen.
              </p>
              <h3 className="text-lg font-medium mb-2">Technisch notwendige Cookies</h3>
              <p className="mb-4">
                Der Einsatz dieser Cookies dient dazu, die Nutzung unseres Angebots für Sie angenehmer zu gestalten. So setzen wir sogenannte Session-Cookies ein, um zu erkennen, dass Sie einzelne Seiten unserer Website bereits besucht haben oder in Ihrem Benutzerkonto eingeloggt sind. Diese werden nach Verlassen unserer Seite automatisch gelöscht.
              </p>
              <h3 className="text-lg font-medium mb-2">Analyse-Tools (Google Analytics 4)</h3>
              <p className="mb-4">
                Wir nutzen Google Analytics 4, einen Webanalysedienst der Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irland). Google Analytics verwendet Methoden, die eine Analyse der Benutzung der Website durch Sie ermöglichen, wie zum Beispiel Cookies. Die erzeugten Informationen über Ihre Benutzung dieser Website können an einen Server von Google, auch in den USA, übertragen und dort gespeichert werden. Ihre IP-Adresse wird dabei gekürzt (IP-Anonymisierung).
              </p>
              <p className="mb-4">
                Analyse-Cookies werden erst gesetzt, nachdem Sie im Cookie-Banner auf «Einverstanden» geklickt haben. Bis dahin – und wenn Sie «Ablehnen» wählen – werden über den Google-Consent-Modus ausschliesslich cookielose, nicht auf Sie zurückführbare Signale übermittelt. Rechtsgrundlage der Bearbeitung ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 31 DSG).
              </p>
              <p className="mb-4">
                Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, indem Sie die in Ihrem Browser für diese Website gespeicherten Daten (Cookies und lokaler Speicher) löschen. Beim nächsten Besuch erscheint das Cookie-Banner erneut und Sie können neu entscheiden. Zusätzlich können Sie die Erfassung durch das Browser-Add-on von Google unter{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:underline"
                >
                  tools.google.com/dlpage/gaoptout
                </a>{" "}
                unterbinden.
              </p>
              <h3 className="text-lg font-medium mb-2">Vercel Analytics</h3>
              <p className="mb-4">
                Zur Messung der Seitenaufrufe und der Ladeperformance setzen wir zusätzlich Vercel Analytics (Vercel Inc.) ein. Dieser Dienst arbeitet cookielos und erhebt keine personenbezogenen Profile.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">5. Newsletter</h2>
              <p className="mb-4">
                Sofern Sie nach Art. 6 Abs. 1 S. 1 lit. a DSGVO ausdrücklich eingewilligt haben, verwenden wir Ihre E-Mail-Adresse dafür, Ihnen regelmässig unseren Newsletter zu übersenden. Für den Empfang des Newsletters ist die Angabe einer E-Mail-Adresse ausreichend.
              </p>
              <p>
                Die Abmeldung ist jederzeit möglich, zum Beispiel über einen Link am Ende eines jeden Newsletters. Alternativ können Sie Ihren Abmeldewunsch gerne jederzeit an <a href="mailto:hello@buyauto.ch" className="text-red-600 hover:underline">hello@buyauto.ch</a> senden.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">6. Weitergabe von Daten (Drittanbieter)</h2>
              <p className="mb-4">Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im Folgenden aufgeführten Zwecken findet nicht statt.</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>
                  <strong>Supabase:</strong> Für Datenbank-Hosting und Authentifizierung (Serverstandort: Zürich, Schweiz).
                </li>
                <li>
                  <strong>Stripe:</strong> Für die Abwicklung von Zahlungen. Dies umfasst Inserats-Gebühren,
                  Premium-Platzierungen, Gebühren für die Wiederveröffentlichung abgelaufener Inserate sowie
                  freiwillige Unterstützungsbeiträge (Spenden). Zahlungsdaten werden direkt von Stripe verarbeitet
                  und nicht auf unseren Servern gespeichert.
                </li>
                <li>
                  <strong>Resend:</strong> Für den Versand von Transaktions- und Erinnerungs-E-Mails, etwa zu neuen
                  Nachrichten, unvollständigen Inserats-Entwürfen oder ablaufenden Inseraten. Dabei werden Ihre
                  E-Mail-Adresse, Ihr Name und die für die jeweilige E-Mail nötigen Inseratsangaben verarbeitet.
                </li>
                <li>
                  <strong>Vercel:</strong> Für das Hosting der Website und die Auslieferung von Inhalten.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">7. Datensicherheit</h2>
              <p className="mb-4">
                Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) in Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt wird. Ob eine einzelne Seite unseres Internetauftrittes verschlüsselt übertragen wird, erkennen Sie an der geschlossenen Darstellung des Schüssel- beziehungsweise Schloss-Symbols in der Statusleiste Ihres Browsers.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">8. Ihre Rechte</h2>
              <p className="mb-4">Sie haben das Recht:</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen;</li>
                <li>unverzüglich die Berichtigung unrichtiger oder Vervollständigung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen;</li>
                <li>die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen;</li>
                <li>die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen;</li>
                <li>Ihre einmal erteilte Einwilligung jederzeit gegenüber uns zu widerrufen.</li>
              </ul>
              <p>
                Möchten Sie von Ihrem Widerrufs- oder Widerspruchsrecht Gebrauch machen, genügt eine E-Mail an <a href="mailto:hello@buyauto.ch" className="text-red-600 hover:underline">hello@buyauto.ch</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
