import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = "MyassistantA1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isGitHubPages
    ? {
        output: "export",
        basePath: `/${repositoryName}`,
        assetPrefix: `/${repositoryName}/`,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
