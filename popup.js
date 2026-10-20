const scanButton = document.getElementById("scan");
const status = document.getElementById("status");
const results = document.getElementById("results");

scanButton.addEventListener("click", async () => {
  scanButton.disabled = true;
  status.textContent = "Scanning visible review text…";
  results.hidden = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const data = await chrome.tabs.sendMessage(tab.id, { type: "REVIEW_SIGNAL_SCAN" });
    document.getElementById("count").textContent = `${data.count} positive review${data.count === 1 ? "" : "s"} detected`;
    document.getElementById("identical-count").textContent = data.identicalCount;
    document.getElementById("similar-count").textContent = data.similarCount;
    document.getElementById("different-count").textContent = data.differentCount;
    const host = document.getElementById("signals");
    host.replaceChildren();
    for (const signal of data.signals) {
      const card = document.createElement("div");
      card.className = `signal ${signal.type}`;
      const title = document.createElement("strong"); title.textContent = signal.title;
      const detail = document.createElement("span"); detail.textContent = signal.detail;
      card.append(title, detail); host.append(card);
    }
    const list = document.getElementById("samples");
    list.replaceChildren();
    for (const sample of data.samples) { const li = document.createElement("li"); li.textContent = sample.excerpt; list.append(li); }
    status.textContent = new URL(data.pageUrl).hostname;
    results.hidden = false;
  } catch (_error) {
    status.textContent = "Could not read this page. Try refreshing it, or open a regular website tab.";
  } finally {
    scanButton.disabled = false;
  }
});
