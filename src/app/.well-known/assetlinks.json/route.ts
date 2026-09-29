import { ANDROID_APP } from "@/config/android";

/** Digital Asset Links: proves to Android that the Play Store app and this website belong together. */
export function GET() {
  const body = ANDROID_APP.packageName && ANDROID_APP.sha256Fingerprints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: ANDROID_APP.packageName, sha256_cert_fingerprints: ANDROID_APP.sha256Fingerprints } }]
    : [];
  return Response.json(body, { headers: { "cache-control": "public, max-age=3600" } });
}
