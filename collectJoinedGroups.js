(async function collectJoinedGroups() {
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function autoScroll(maxScrolls = 50) {
    let lastHeight = 0;
    for (let i = 0; i < maxScrolls; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(1500);
      const h = document.body.scrollHeight;
      if (h === lastHeight) break;
      lastHeight = h;
    }
  }

  function isPending(el) {
    let cur = el.closest("div");
    while (cur) {
      if (
        cur.innerText &&
        /pending|requested|approval required/i.test(cur.innerText) &&
        cur.innerText.length < 500
      ) {
        return true;
      }
      cur = cur.parentElement;
    }
    return false;
  }

  function collectGroupLinks() {
    const out = new Set();

    // Find any clickable element linking to a group
    const linkCandidates = Array.from(document.querySelectorAll('[href*="/groups/"], [role="link"]'));

    linkCandidates.forEach(el => {
      let href = el.getAttribute("href");
      if (!href) return;

      if (href.startsWith("/")) {
        href = location.origin + href;
      }

      if (!/^https:\/\/www\.facebook\.com\/groups\/[^\/?#]+\/?$/.test(href)) return;
      if (isPending(el)) return;

      out.add(href);
    });

    return Array.from(out);
  }

  console.log("Scrolling to load all joined groups...");
  await autoScroll(100);

  console.log("Collecting group links...");
  const groups = collectGroupLinks();

  if (groups.length === 0) {
    console.warn("⚠️ No group links found! Try manually scrolling first, or inspect DOM.");
  } else {
    console.log(`✅ Found ${groups.length} group links.`);
    const blob = new Blob([groups.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "facebook_joined_groups.txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
})();
