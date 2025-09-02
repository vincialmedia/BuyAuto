import Head from "next/head";
import ListingWizard from "@/components/buyauto/create-listing/ListingWizard";

export default function CreateListingPage() {
  return (
    <>
      <Head>
        <title>Inserat erstellen | BuyAuto Schweiz</title>
        <meta 
          name="description" 
          content="Erstelle dein Auto-Leasing-Inserat auf BuyAuto. Gratis oder Premium, 30 Tage, 90 Tage oder Unlimitiert." 
        />
        <meta name="robots" content="index, follow" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
        <ListingWizard />
      </div>
    </>
  );
}