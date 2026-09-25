import { useEffect } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import { GarageDashboard } from "@/components/buyauto/dashboard/GarageDashboard";
import type { Garage } from "@/services/garageService";
import { MessageCenterRail } from "@/components/buyauto/messages/MessageCenterRail";
import { localizePath, toLocale } from "@/i18n/config";
import { useT } from "@/i18n/runtime";
import { withI18n } from "@/i18n/server";

interface GarageDashboardPageProps {
  initialGarage: Garage | null;
}

export default function GarageDashboardPage({ initialGarage }: GarageDashboardPageProps) {
  const router = useRouter();
  const t = useT();
  const { user, loading: authLoading, profile, profileLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !profileLoading && user && profile?.role !== "garage") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router, profile, profileLoading]);

  if (authLoading || profileLoading || !user) {
    return (
      <DashboardLayout hideSidebar leftRail={<MessageCenterRail />}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{t("Garage Dashboard - BuyAuto")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <DashboardLayout hideSidebar leftRail={<MessageCenterRail />}>
        <GarageDashboard initialGarage={initialGarage} />
      </DashboardLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<GarageDashboardPageProps> = async (ctx) => {
  const supabase = createPagesServerClient<Database>(ctx);
  const locale = toLocale(ctx.locale);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: localizePath("/auth", locale),
        permanent: false,
      },
    };
  }

  const [{ data: profile }, { data: garage }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle(),
    supabase
      .from("garages")
      .select("*")
      .eq("owner_user_id", session.user.id)
      .maybeSingle(),
  ]);

  const role = (profile as unknown as { role?: string } | null)?.role ?? "private";

  if (role !== "garage") {
    return {
      redirect: {
        destination: localizePath("/dashboard", locale),
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialGarage: (garage as unknown as Garage | null) ?? null,
      // garage: this page + its tabs; dashboard: listings/drafts sections and the
      // message center; pricing: plan cards/matrix and plan names in the billing
      // tab; calculator: the Eintauschwert-Rechner tab; wizard: LocationAutocomplete.
      ...(await withI18n(ctx.locale, ["garage", "dashboard", "pricing", "calculator", "wizard"])),
    },
  };
};