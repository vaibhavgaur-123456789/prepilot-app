/**
 * Android app (Trusted Web Activity) made with PWABuilder, for the Play Store.
 * After generating the package on pwabuilder.com, copy the package id and the SHA-256 fingerprint(s)
 * from its "assetlinks.json" here. Include the Play App Signing fingerprint from Play Console too.
 * While this is empty the app still works, but Android shows a browser address bar at the top.
 */
export const ANDROID_APP = {
  packageName: "com.rozpadh.app",
  sha256Fingerprints: [
    // PWABuilder signing key (the owner keeps signing.keystore safe offline).
    "E6:8C:CB:A0:2F:23:6B:BE:5B:D8:CE:D5:1D:05:2F:BF:72:D9:56:CC:AE:72:D3:EA:21:39:89:4E:21:CB:5F:87",
    // TODO: add Play Console → Setup → App signing → "App signing key certificate" SHA-256 after the first upload.
  ] as string[],
};
