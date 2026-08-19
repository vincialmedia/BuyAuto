import { PadkosLanding } from "@/components/padkos/PadkosLanding";
import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import ui from "@/components/padkos/Padkos.module.css";
import { PADKOS } from "@/lib/padkos/routes";

/** Padkos landing in English — `Padkos EN - Landing.dc.html`. */
export default function PadkosEnglishPage() {
  return (
    <PadkosShell header="landing" lang="en" mainClassName={ui.landingMain}>
      <PadkosSeo
        title="South African Shop Vienna – Biltong & More | Padkos"
        description="The padstal for Austria: biltong, Mrs Ball's chutney, Ouma rusks, Chappies & homesick-cure gift boxes. Shipped across Austria from Vienna."
        path={PADKOS.en}
        lang="en"
        hreflang={[
          { lang: "de-AT", path: PADKOS.home },
          { lang: "en", path: PADKOS.en },
          { lang: "x-default", path: PADKOS.home },
        ]}
      />
      <PadkosLanding lang="en" />
    </PadkosShell>
  );
}
