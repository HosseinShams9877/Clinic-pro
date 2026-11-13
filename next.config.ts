import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Phase 1 is fully self-hosted: every image is copied into /public.
    // No remote patterns are allowed (NEXTJS_APP_ROUTER.md §8).
    remotePatterns: [],
    // P2 item 8 (2026-11-10): declare the optimization formats explicitly so
    // the served picture is AVIF with a WebP fallback regardless of the
    // default's drift. The Node deployment posture (item 12) runs the
    // /_next/image optimizer server-side with the bundled sharp; the same
    // origin keeps it inside CSP img-src 'self'.
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // Legacy reference URLs (services.html#gen, services.html?cat=gyn) → canonical
    // path-segment routes (approved Q2). `permanent: true` = 308 for the hash-less
    // form; hash/query variants are absorbed because the redirect target is canonical
    // regardless of what followed. Loop-free: targets are generatable routes only.
    return [
      { source: "/services.html", destination: "/services", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
  async headers() {
    // Release-gate headers (SEO_ACCESSIBILITY_SECURITY.md §5: "security headers
    // + CSP verified via response inspection").
    //
    // CSP note: the site is fully self-hosted — fonts and images are local, and
    // there is no third-party script, so the policy can be strict everywhere
    // except the two inline escapes Next.js needs in the App Router without nonce
    // middleware: inline scripts (the RSC payload `self.__next_f.push` fragments
    // and the JSON-LD blob) and inline styles (font variable class + inline
    // React styles). External subresource loads are fully blocked.
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
