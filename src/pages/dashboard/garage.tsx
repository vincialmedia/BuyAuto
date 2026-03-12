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

interface GarageDashboardPageProps {
  initialGarage: Garage | null;
}

export default function GarageDashboardPage({ initialGarage }: GarageDashboardPageProps) {
  const router = useRouter();
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
        <title>Garage Dashboard - BuyAuto</title>
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = (profile as unknown as { role?: string } | null)?.role ?? "private";

  if (role !== "garage") {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const { data: garage } = await supabase
    .from("garages")
    .select("*")
    .eq("owner_user_id", session.user.id)
    .maybeSingle();

  return {
    props: {
      initialGarage: (garage as unknown as Garage | null) ?? null,
    },
  };
};