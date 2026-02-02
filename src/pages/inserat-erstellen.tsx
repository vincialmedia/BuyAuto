import Head from "next/head";
import { GetServerSideProps } from "next";
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
      
      <ListingWizard />
    </>
  );
}

// Force server-side rendering to disable static export for this page
// This prevents the server-side Stripe SDK from being bundled into client code
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}, // No props needed, just forces SSR
  };
};