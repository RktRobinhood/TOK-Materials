# Offline QR dependencies

Unmodified browser distributions fetched from the official npm registry on 22 October 2026 using `npm pack --ignore-scripts`. No runtime CDN, install or build step is needed.

| File | Package/source | License | SHA-256 |
|---|---|---|---|
| qrcode-generator-2.0.4.js | [qrcode-generator 2.0.4](https://github.com/kazuhikoarase/qrcode-generator) | MIT, adjacent qrcode-generator-LICENSE.txt | 79ec86f82856005b1c887905cfccfcfbec3821ca61c7fd5a952faa5f778f791c |
| jsqr-1.4.0.js | [jsQR 1.4.0](https://github.com/cozmo/jsQR) | Apache 2.0, adjacent jsqr-LICENSE.txt | bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859 |

Registry tarball integrity: qrcode-generator `sha512-mZSiP6RnbHl4xL2Ap5HfkjLnmxfKcPWpWe/c+5XxCuetEenqmNFf1FH/ftXPCtFG5/TDobjsjz6sSNL0Sr8Z9g==`; jsqr `sha512-dxLob7q65Xg2DvstYkRpkYtmKm2sPJ9oFhrhmudT1dZvNFFTlroai3AWSpLey/w5vMcLBXRgOJsbXpdN9HzU/A==`.

The generator's npm tarball omits LICENSE; its MIT license was copied from the linked upstream repository. Existing copyright notices are retained. `Rift.PeerQR` draws integer-sized black/white modules with a four-module quiet zone and decodes local camera frames. Frames are never stored or uploaded; cancellation, timeout, connection and screen departure stop the tracks. A decoded code still passes the transport's role/expiry/checksum checks. No QR opens a URL or executes its contents.
