/**
 * The Month in Food picture for sharing to texts and social (Andre 2026-10-30): 1080×1350, drawn in
 * the browser from the public report, so it holds only what the public link shows.
 */

const FOREST = "#16302A";
const CREAM = "#F7F2E7";
const AMBER = "#DE9E33";
const SOFT = "#5B5548";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

function fitted(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

export function drawMonthInFoodImage(canvas, report) {
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  const margin = 90;
  const width = canvas.width - margin * 2;

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = SOFT;
  ctx.font = `600 38px ${SANS}`;
  ctx.fillText(report.month_label, margin, 150);

  ctx.fillStyle = FOREST;
  ctx.font = `600 84px ${SERIF}`;
  ctx.fillText(fitted(ctx, `${report.subject.display_name}'s`, width), margin, 260);
  ctx.fillText("month in", margin, 355);
  const monthIn = ctx.measureText("month in ").width;
  ctx.fillStyle = AMBER;
  ctx.font = `italic 600 84px ${SERIF}`;
  ctx.fillText("food", margin + monthIn, 355);

  const stats = [
    [report.stats.meals, "Meals"],
    [report.stats.restaurants, "Restaurants"],
    [report.stats.dishes, "Dishes"],
  ];
  stats.forEach(([value, label], i) => {
    const x = margin + (i * width) / 3;
    ctx.fillStyle = FOREST;
    ctx.font = `600 96px ${SERIF}`;
    ctx.fillText(String(value), x, 520);
    ctx.fillStyle = SOFT;
    ctx.font = `500 32px ${SANS}`;
    ctx.fillText(label, x, 570);
  });

  const list = report.top_dishes.length ? report.top_dishes : report.restaurants.map((r) => r.name);
  ctx.fillStyle = FOREST;
  ctx.font = `600 44px ${SERIF}`;
  ctx.fillText(report.top_dishes.length ? "Top dishes" : "Restaurants", margin, 690);
  ctx.font = `500 38px ${SANS}`;
  list.slice(0, 5).forEach((name, i) => ctx.fillText(fitted(ctx, name, width), margin, 760 + i * 62));

  ctx.fillStyle = FOREST;
  ctx.fillRect(0, canvas.height - 200, canvas.width, 200);
  ctx.fillStyle = AMBER;
  ctx.font = `italic 600 60px ${SERIF}`;
  ctx.fillText("Menuply", margin, canvas.height - 112);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `500 32px ${SANS}`;
  ctx.fillText("Great food. Good people. Better together.", margin, canvas.height - 62);
}

/** Shares the picture where the device can, else downloads it. */
export async function shareMonthInFoodImage(report) {
  const canvas = document.createElement("canvas");
  drawMonthInFoodImage(canvas, report);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Couldn't make the picture");
  const name = `month-in-food-${report.ym}.png`;
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "My Month in Food on Menuply", url: window.location.href });
    return "shared";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return "saved";
}
