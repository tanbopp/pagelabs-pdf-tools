import React from "react";
import Head from "next/head";

export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
}

export function SEO({
  title,
  description,
  canonical,
  ogType = "website",
}: SEOProps) {
  const fullTitle = title.includes("PageLabs")
    ? title
    : `${title} - Free Online PDF Tool | PageLabs`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="PageLabs" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Head>
  );
}

