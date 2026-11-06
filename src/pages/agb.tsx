import Head from "next/head";

// Fixed revision date: legal terms carry the date they were last changed, not
// the visitor's current date — and a static value lets the page fully SSR.
const AGB_STAND = "6.11.2026";

export default function AGB() {
  return (
    <>
      <Head>
        <title>Allgemeine Geschäftsbedingungen (AGB) | BuyAuto</title>
        <meta name="description" content="Allgemeine Geschäftsbedingungen von BuyAuto - Ihre Plattform für Leasingübernahmen." />
      </Head>

      <div className="min-h-screen bg-neutral-50">
        {/* Content Wrapper */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32">
          
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">Allgemeine Geschäftsbedingungen (AGB)</h1>
            <p className="text-neutral-500">Stand: {AGB_STAND}</p>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 md:p-12 space-y-12">
            
            {/* 1. Geltungsbereich */}
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="bg-red-50 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                Geltungsbereich
              </h2>
              <div className="text-neutral-600 space-y-4 leading-relaxed pl-11">
                <p>
                  Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge und Dienstleistungen zwischen BuyAuto (nachfolgend "Betreiber") und den Nutzern der Plattform (nachfolgend "Nutzer").
                </p>
                <p>
                  Abweichende Bedingungen der Nutzer werden nicht anerkannt, es sei denn, der Betreiber stimmt ihrer Geltung ausdrücklich schriftlich zu.
                </p>
              </div>
            </section>

            {/* 2. Leistungsbeschreibung */}
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="bg-red-50 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                Leistungsbeschreibung
              </h2>
              <div className="text-neutral-600 space-y-4 leading-relaxed pl-11">
                <p>
                  BuyAuto stellt eine Online-Plattform zur Verfügung, auf der Nutzer Leasingverträge zur Übernahme anbieten und suchen können. Der Betreiber selbst ist nicht Vertragspartei der Leasingübernahmeverträge, die zwischen den Nutzern geschlossen werden.
                </p>
                <p>
                  Der Betreiber übernimmt keine Gewähr für die Richtigkeit und Vollständigkeit der von den Nutzern eingestellten Inhalte und Angebote.
                </p>
              </div>
            </section>

            {/* 3. Registrierung und Nutzerkonto */}
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="bg-red-50 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
                Registrierung und Nutzerkonto
              </h2>
              <div className="text-neutral-600 space-y-4 leading-relaxed pl-11">
                <p>
                  Für die Nutzung bestimmter Funktionen der Plattform ist eine Registrierung erforderlich. Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemässe Angaben zu machen.
                </p>
                <p>
                  Der Nutzer ist für die Geheimhaltung seiner Zugangsdaten verantwortlich. Dritte dürfen das Nutzerkonto nicht nutzen.
                </p>
              </div>
            </section>

            {/* 4. Pflichten der Nutzer */}
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="bg-red-50 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">4</span>
                Pflichten der Nutzer
              </h2>
              <div className="text-neutral-600 space-y-4 leading-relaxed pl-11">
                <p>
                  Nutzer, die Inserate einstellen, sind verpflichtet, die Fahrzeuge wahrheitsgemäss und vollständig zu beschreiben. Insbesondere sind Mängel und Schäden offen zu legen.
                </p>
                <p>
                  Es ist untersagt, Inhalte einzustellen, die gegen geltendes Recht oder Rechte Dritter verstossen.
                </p>
              </div>
            </section>

            {/* 5. Nutzung von Inseratsinhalten */}
            <section id="nutzung-inseratsinhalte">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="bg-red-50 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">5</span>
                Nutzung von Inseratsinhalten
              </h2>
              <div className="text-neutral-600 space-y-4 leading-relaxed pl-11">
                <p>
                  Mit der Veröffentlichung eines Inserats räumt der Nutzer dem Betreiber das unentgeltliche, nicht
                  ausschliessliche und räumlich unbeschränkte Recht ein, die Inhalte des Inserats, insbesondere Fotos,
                  Fahrzeugdaten, Monatsrate, Restlaufzeit und weitere Konditionen, auf der Plattform und zur Bewerbung
                  der Plattform und des Inserats zu nutzen. Dazu gehören unter anderem Beiträge in sozialen Medien,
                  bezahlte Werbung bei Online-Werbediensten, Newsletter, Presse- und Medienarbeit sowie Präsentationen.
                </p>
                <p>
                  Der Betreiber darf die Inhalte dafür bearbeiten, insbesondere zuschneiden, mit Text und Grafiken
                  ergänzen, in andere Formate übertragen und mit anderen Inhalten kombinieren. Kontrollschilder werden
                  unkenntlich gemacht. Name, Kontaktdaten und weitere Personendaten des Nutzers erscheinen in solchen
                  Beiträgen nur mit seiner gesonderten Zustimmung.
                </p>
                <p>
                  Der Betreiber darf dieses Recht an Dienstleister und Plattformen weitergeben, soweit dies für die
                  Veröffentlichung nötig ist, etwa an Betreiber sozialer Netzwerke und Werbenetzwerke.
                </p>
                <p>
                  Nach dem Ende eines Inserats verwendet der Betreiber dessen Inhalte nicht mehr für neue Beiträge und
                  beendet bezahlte Werbung dazu. Bereits veröffentlichte, unbezahlte Beiträge dürfen bestehen bleiben.
                </p>
                <p>
                  Der Nutzer sichert zu, dass er die für diese Nutzung nötigen Rechte an den von ihm hochgeladenen
                  Inhalten besitzt, auch an Fotos, die nicht von ihm selbst stammen (zum Beispiel Fotos eines Händlers).
                  Er stellt den Betreiber von Ansprüchen Dritter frei, die auf einer Verletzung dieser Zusicherung
                  beruhen.
                </p>
                <p>
                  Der Nutzer kann der Nutzung seiner Inseratsinhalte zur Bewerbung jederzeit per E-Mail an
                  hello@buyauto.ch widersprechen. Der Betreiber verwendet die Inhalte danach nicht mehr für neue
                  Beiträge und entfernt bestehende Beiträge in seinen eigenen Kanälen innert angemessener Frist.
                </p>
              </div>
            </section>

            {/* 6. Gebühren und Zahlungen */}
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="bg-red-50 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">6</span>
                Gebühren und Zahlungen
              </h2>
              <div className="text-neutral-600 space-y-4 leading-relaxed pl-11">
                <p>
                  Die Nutzung der Plattform als Interessent ist grundsätzlich kostenlos. Für das Inserieren von Fahrzeugen können Gebühren anfallen, die vor Abschluss des Inseriervorgangs deutlich ausgewiesen werden.
                </p>
                <p>
                  Inserate haben eine planabhängige Laufzeit. Nach Ablauf der Laufzeit wird das Inserat deaktiviert
                  ("Abgelaufen") und ist öffentlich nicht mehr sichtbar. Für die erneute Veröffentlichung eines
                  abgelaufenen Inserats kann eine Gebühr von CHF 30 erhoben werden (für Inserate im Plan
                  "Verlängert": CHF 15); die jeweils geltende Gebühr wird vor der Zahlung ausgewiesen. Im Rahmen von
                  Aktionen kann der Betreiber diese Gebühr vorübergehend ganz oder teilweise erlassen. Inserate im
                  Plan "Unlimitiert" haben keine Laufzeitbegrenzung; Ablauf- und Verlängerungsgebühren fallen dort
                  nicht an.
                </p>
                <p>
                  In den Plänen "Verlängert" und "Unlimitiert" ist die Premium-Platzierung ohne Aufpreis enthalten.
                  Für andere Pläne kann die Premium-Platzierung als kostenpflichtige Zusatzleistung erworben werden.
                </p>
                <p>
                  Unvollständige Inserats-Entwürfe, die während 30 Tagen nicht bearbeitet werden, werden automatisch
                  archiviert und 5 Tage nach der Archivierung endgültig gelöscht. Betroffene Nutzer werden vorgängig
                  per E-Mail informiert; durch Bearbeiten bzw. Veröffentlichen des Entwurfs wird die Löschung abgewendet.
                </p>
                <p>
                  Beim Bezahlvorgang kann eine freiwillige Unterstützung (Spende) an den Betreiber vorausgewählt sein.
                  Sie wird vor Abschluss der Zahlung als separater Posten ausgewiesen und kann jederzeit mit einem
                  Klick entfernt werden; ein Anspruch auf Gegenleistung entsteht daraus nicht.
                </p>
              </div>
            </section>

             {/* 7. Haftung */}
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="bg-red-50 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">7</span>
                Haftung
              </h2>
              <div className="text-neutral-600 space-y-4 leading-relaxed pl-11">
                <p>
                  Der Betreiber haftet nur für Vorsatz und grobe Fahrlässigkeit. Für leichte Fahrlässigkeit haftet der Betreiber nur bei Verletzung wesentlicher Vertragspflichten.
                </p>
                <p>
                  Die Haftung für Datenverlust ist auf den typischen Wiederherstellungsaufwand beschränkt.
                </p>
              </div>
            </section>

             {/* 8. Schlussbestimmungen */}
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="bg-red-50 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">8</span>
                Schlussbestimmungen
              </h2>
              <div className="text-neutral-600 space-y-4 leading-relaxed pl-11">
                <p>
                  Der Betreiber kann diese AGB ändern. Änderungen werden den Nutzern mindestens 30 Tage vor ihrem
                  Inkrafttreten per E-Mail oder auf der Plattform mitgeteilt. Widerspricht ein Nutzer nicht innert
                  dieser Frist, gelten die geänderten AGB auch für seine bestehenden Inserate. Widerspricht er, kann er
                  sein Inserat jederzeit beenden.
                </p>
                <p>
                  Es gilt Schweizer Recht. Gerichtsstand ist Zürich.
                </p>
                <p>
                  Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
