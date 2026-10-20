(() => {
  const stopWords = new Set("about after again against all also although always among an and any are because been before being between both but can could did do does doing down during each few for from further had has have having here how into its itself just more most other our out over same she should some such than that the their them then there these they this those through too under until very was were what when where which while who why will with would you your".split(" "));
  const reviewHints = /review|testimonial|rating|comment|feedback|experience/i;
  const ratingHints = /★|☆|\b[1-5](?:\.\d)?\s*(?:\/\s*5|out of 5|stars?)\b/i;

  function isVisible(el) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  }

  function reviewCandidates() {
    const nodes = [...document.querySelectorAll('[itemtype*="Review"], [itemprop="reviewBody"], article, [class*="review" i], [id*="review" i], [data-testid*="review" i], li, blockquote')];
    const scored = [];
    for (const node of nodes) {
      if (!isVisible(node)) continue;
      const text = (node.innerText || "").replace(/\s+/g, " ").trim();
      if (text.length < 35 || text.length > 1400) continue;
      const semantic = /reviewbody/i.test(node.getAttribute("itemprop") || "") || /review/i.test(node.getAttribute("itemtype") || "") || reviewHints.test(`${node.className} ${node.id} ${node.getAttribute("data-testid") || ""}`);
      const rating = ratingHints.test(text) || !!node.querySelector('[itemprop="ratingValue"], [aria-label*="star" i], [class*="star" i], [class*="rating" i]');
      if (!semantic && !rating) continue;
      const ratingNode = node.querySelector('[itemprop="ratingValue"], [aria-label*="star" i], [class*="rating" i]');
      const ratingText = `${ratingNode?.getAttribute("content") || ""} ${ratingNode?.getAttribute("aria-label") || ""} ${ratingNode?.textContent || ""} ${text}`;
      const ratingMatch = ratingText.match(/\b([1-5](?:\.\d)?)\s*(?:\/\s*5|out of 5|stars?)\b/i) || ratingText.match(/\b([1-5](?:\.\d)?)\b/);
      const stars = (ratingNode?.getAttribute("aria-label") || "").match(/([1-5])\s*(?:out of\s*5)?\s*stars?/i);
      const numericRating = stars ? Number(stars[1]) : ratingMatch ? Number(ratingMatch[1]) : null;
      scored.push({ node, text, rating: numericRating, score: (semantic ? 2 : 0) + (rating ? 1 : 0) + (node.matches("article, blockquote") ? 1 : 0) });
    }
    scored.sort((a, b) => b.score - a.score || a.text.length - b.text.length);
    const result = [];
    const seen = new Set();
    for (const item of scored) {
      // Prefer the smallest useful review container and avoid nested duplicates.
      const key = item.text.toLowerCase().slice(0, 100);
      if (seen.has(key) || result.some(r => r.text.includes(item.text) || item.text.includes(r.text) && item.text.length > r.text.length * 1.6)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= 250) break;
    }
    return result;
  }

  function normalized(text) {
    return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }

  function tokens(text) {
    return new Set((normalized(text).match(/[\p{L}\p{N}]{3,}/gu) || []).filter(w => !stopWords.has(w)));
  }

  function similarity(a, b) {
    const A = tokens(a), B = tokens(b);
    if (!A.size || !B.size) return 0;
    let common = 0;
    for (const word of A) if (B.has(word)) common++;
    return common / (A.size + B.size - common);
  }

  function analyze() {
    const reviews = reviewCandidates().filter(r => r.rating !== null && r.rating >= 4);
    const pairs = [];
    for (let i = 0; i < reviews.length; i++) {
      for (let j = i + 1; j < reviews.length; j++) {
        const a = normalized(reviews[i].text), b = normalized(reviews[j].text);
        if (a.length > 20 && a === b) pairs.push({ a: i, b: j, score: 1 });
        else {
          const score = similarity(a, b);
          if (score >= 0.72) pairs.push({ a: i, b: j, score });
        }
      }
    }
    const exactDupes = new Set();
    const nearDupes = new Set();
    for (const p of pairs) {
      (p.score > 0.96 ? exactDupes : nearDupes).add(p.a);
      (p.score > 0.96 ? exactDupes : nearDupes).add(p.b);
    }
    const identicalCount = exactDupes.size;
    const similarCount = [...nearDupes].filter(i => !exactDupes.has(i)).length;
    const differentCount = Math.max(0, reviews.length - identicalCount - similarCount);
    const signals = reviews.length ? [] : [{ type: "info", title: "No rated positive reviews detected", detail: "This page may use a layout the extension cannot read, or its reviews may not expose a 4+ out of 5 rating." }];
    const samples = reviews.slice(0, 6).map((r, i) => ({ index: i + 1, excerpt: r.text.slice(0, 220) + (r.text.length > 220 ? "…" : "") }));
    return { count: reviews.length, identicalCount, similarCount, differentCount, signals, samples, pageTitle: document.title, pageUrl: location.href };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "REVIEW_SIGNAL_SCAN") {
      sendResponse(analyze());
    }
  });
})();
