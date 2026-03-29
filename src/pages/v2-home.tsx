import type { GetServerSideProps } from "next";

export default function Gone() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.statusCode = 410;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("410 Gone");
  return { props: {} };
};