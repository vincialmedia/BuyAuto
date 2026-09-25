import { useEffect } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import { MessageCenterRail } from "@/components/buyauto/messages/MessageCenterRail";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/i18n/runtime";
import { withI18n } from "@/i18n/server";
import { localizePath, toLocale } from "@/i18n/config";

export default function DashboardMessagesIndexPage() {
  const router = useRouter();
  const t = useT();
  const { user, loading: authLoading, profileLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !profileLoading && !user) {
      router.push("/auth?redirect=" + encodeURIComponent(router.asPath));
    }
  }, [authLoading, profileLoading, router, user]);

  return (
    <>
      <Head>
        <title>{t("Message Center - BuyAuto")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <DashboardLayout hideSidebar leftRail={<MessageCenterRail />}>
        <Card className="hidden lg:block rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">{t("Message Center")}</h1>
            <p className="mt-2 text-sm text-neutral-600">{t("Wähle links eine Unterhaltung aus, um den Verlauf zu sehen.")}</p>
          </CardContent>
        </Card>

        {/* The rail lives in the desktop sidebar, so below lg this page was just
            a card pointing at a conversation list that wasn't on screen. Show
            the list itself instead. */}
        <div className="lg:hidden">
          <MessageCenterRail />
        </div>
      </DashboardLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient<Database>(ctx);
  // GSSP redirects are not locale-prefixed by Next — keep /fr, /it, /en.
  const locale = toLocale(ctx.locale);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: localizePath("/auth?redirect=/dashboard/messages", locale),
        permanent: false,
      },
    };
  }

  return { props: { ...(await withI18n(ctx.locale, ["dashboard"])) } };
};