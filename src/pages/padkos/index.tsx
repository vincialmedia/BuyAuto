import { PadkosLanding } from "@/components/padkos/PadkosLanding";
import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import ui from "@/components/padkos/Padkos.module.css";
import { PADKOS } from "@/lib/padkos/routes";
import { onlineStoreSchema, webSiteSchema } from "@/lib/padkos/schema";

/**
 * Padkos — "Padstal Heritage" landing page (German).
 * Desktop design: `Padkos 3 - Padstal Heritage Desktop.dc.html`;
 * mobile (<760px): `Padkos 3 - Padstal Heritage v2.dc.html`.
 */
export default function PadkosHomePage() {
  return (
    <PadkosShell header="landing" mainClassName={ui.landingMain}>
      <PadkosSeo
        title="Padkos – Südafrikanische Lebensmittel online kaufen | Wien"
        description="Biltong, Boerewors, Mrs Ball's Chutney & mehr – südafrikanische Spezialitäten aus Wien. Schneller Versand in ganz Österreich, ab 59 € versandkostenfrei."
        path={PADKOS.home}
        hreflang={[
          { lang: "de-AT", path: PADKOS.home },
          { lang: "en", path: PADKOS.en },
          { lang: "x-default", path: PADKOS.home },
        ]}
        jsonLd={[onlineStoreSchema(), webSiteSchema()]}
      />
      <PadkosLanding lang="de" />
    </PadkosShell>
  );
}
