/**
 * Photo Bot bookmark ("From your browser").
 *
 * Toast and Popmenu pages show servers a human check, so Photo Bot can't
 * read them. This bookmark runs on the menu page in the operator's own
 * browser: it opens Photo Bot, scrolls the page so lazy photos load,
 * collects { name, image_url } for each dish card and posts the list to
 * the Photo Bot window when that window says it is ready.
 *
 * The server re-checks everything (allowed page, Toast/Popmenu image hosts
 * only), so the list is a suggestion, never trusted as-is.
 */

export const HELPER_READY_MESSAGE = "menuply-photo-bot-ready";
export const HELPER_ITEMS_MESSAGE = "menuply-photo-bot-items";

/* Runs on the restaurant's page. Must stay self-contained (it is serialized). */
function menuplyPhotoGrabber(origin, readyType, itemsType) {
  var startY = window.scrollY;
  var pageUrl = location.href;
  var win = window.open(origin + "/owner/photo-bot?helper=1", "menuply-photo-bot");
  if (!win) {
    alert("Allow pop-ups for this page, then click the Menuply Photo Bot bookmark again.");
    return;
  }

  var box = document.createElement("div");
  box.setAttribute("role", "status");
  box.style.cssText =
    "position:fixed;top:16px;right:16px;z-index:2147483647;max-width:320px;padding:12px 16px;border-radius:12px;" +
    "background:#111;color:#fff;font:600 14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.3)";
  box.textContent = "Menuply Photo Bot: collecting dish photos…";
  document.body.appendChild(box);

  function largestFromSrcset(srcset) {
    var best = null;
    var bestSize = -1;
    String(srcset || "")
      .split(/,\s+/)
      .forEach(function (part) {
        var bits = part.trim().split(/\s+/);
        if (!bits[0]) return;
        var size = parseFloat(bits[1]) || 1;
        if (size > bestSize) {
          bestSize = size;
          best = bits[0];
        }
      });
    return best;
  }

  function bestSrc(img) {
    var picture = img.closest("picture");
    var candidates = [img.getAttribute("srcset")];
    if (picture) {
      picture.querySelectorAll("source").forEach(function (s) {
        candidates.push(s.getAttribute("srcset"));
      });
    }
    for (var i = 0; i < candidates.length; i++) {
      var url = largestFromSrcset(candidates[i]);
      if (url) return url;
    }
    return img.currentSrc || img.src || img.getAttribute("data-src") || "";
  }

  function collect() {
    var out = [];
    function add(nameEl, img) {
      if (!nameEl || !img) return;
      var name = nameEl.textContent.replace(/\s+/g, " ").trim();
      var url = bestSrc(img);
      if (name && url) out.push({ name: name, image_url: url });
    }
    // Toast online ordering
    document.querySelectorAll('li[data-testid="menu-item-card"]').forEach(function (card) {
      add(card.querySelector("h3"), card.querySelector("img"));
    });
    // Popmenu menus
    document.querySelectorAll(".pm-next-dish-card").forEach(function (card) {
      add(card.querySelector(".pm-next-dish-name"), card.querySelector(".pm-next-dish-photo img") || card.querySelector("img"));
    });
    return out;
  }

  var payload = null;
  function send() {
    if (payload && win && !win.closed) win.postMessage(payload, origin);
  }
  window.addEventListener("message", function (e) {
    if (e.origin === origin && e.data && e.data.type === readyType) send();
  });

  function finish() {
    window.scrollTo(0, startY);
    var items = collect();
    payload = { type: itemsType, page_url: pageUrl, page_title: document.title, items: items };
    box.textContent = items.length
      ? "Menuply Photo Bot: found " + items.length + " dish photos. Finish in the Photo Bot window."
      : "Menuply Photo Bot: no Toast or Popmenu dish photos on this page. Open the restaurant's menu page and try again.";
    send();
    setTimeout(function () {
      box.remove();
    }, 12000);
  }

  // Scroll through the page so lazy-loaded photos get their real URLs.
  var y = startY;
  var step = Math.max(500, Math.round(window.innerHeight * 0.9));
  function scrollStep() {
    y += step;
    window.scrollTo(0, y);
    if (y < document.documentElement.scrollHeight && y < 80000) setTimeout(scrollStep, 200);
    else setTimeout(finish, 900);
  }
  scrollStep();
}

/** The bookmark's href for this Menuply origin (https://menuply.com, or localhost when testing). */
export function buildPhotoBotBookmarklet(origin) {
  const args = [origin, HELPER_READY_MESSAGE, HELPER_ITEMS_MESSAGE].map((a) => JSON.stringify(a)).join(",");
  // Encoded so characters like "#" and "%" survive as a URL.
  return `javascript:${encodeURIComponent(`(${menuplyPhotoGrabber.toString()})(${args});void 0`)}`;
}
