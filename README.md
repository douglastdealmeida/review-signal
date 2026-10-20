# Review Signal — prototype

A privacy-first browser extension prototype that compares positive reviews on the current page. It reports counts of identical, similar, and different review text without calling reviews fraudulent.

## Load it in Chrome

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Choose **Load unpacked** and select this folder.
3. Open a page with visible reviews and click the Review Signal toolbar icon, then **Scan this page**.

## What this prototype does

- Scans visible page content locally in the browser.
- Uses common review markup and wording in page structure to find likely review containers.
- Counts repeated text, high wording similarity, and reviews without a close text match among reviews rated 4 or 5 out of 5.
- Shows short excerpts so the user can see what the extension actually analyzed.

## Limits

This is an early prototype, not a fraud detector. Rating extraction varies by site; the positive-review counts include only reviews where a 4+ out of 5 rating can be read. “Different” only means no close match was found among reviews detected on this page. The extension cannot establish whether a reviewer purchased or experienced something, detect coordinated activity across sites, or reliably read every site's custom layout. A lack of flags is not evidence that reviews are authentic. It does not send page data to a server.

The next useful step is testing extraction on a varied set of real review pages and improving coverage based on where detection misses. Cross-site reputation checks, reviewer history, and date-pattern analysis would need additional data sources and careful privacy choices.

## Contributing

Contributions are welcome. Please open an issue to describe a site layout or detection problem, or submit a pull request with a focused change and a short explanation of how you checked it. Do not include personal data or private page content in issues.
