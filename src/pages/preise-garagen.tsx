import type { GetServerSideProps } from "next";

export default function PreiseGaragenRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/garage-preise",
      permanent: true,
    },
  };
};