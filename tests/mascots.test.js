const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const pages = [
  "index.html", "how-to-play.html", "score.html", "badges.html", "demo.html",
  "privacy.html", "version3.html", "wordle-alternative/index.html",
  "download/index.html", "component.html", "index copy.html",
];

function mascotFor(page) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const mascots = (html.match(/<img\b[^>]*>/g) || [])
    .filter((image) => /\bsrc="(?:\.\.\/)?assets\/cat\//.test(image));
  assert.equal(mascots.length, 1, `${page} should have exactly one mascot`);
  return mascots[0];
}

for (const page of pages) {
  test(`${page} has one decorative mascot with an existing local image`, () => {
    const mascot = mascotFor(page);
    assert.match(mascot, /\bdata-mascot\b/);
    assert.match(mascot, /\balt=""/);
    assert.match(mascot, /\bwidth="\d+"/);
    assert.match(mascot, /\bheight="\d+"/);
    const src = mascot.match(/\bsrc="([^"]+)"/)[1];
    assert.ok(src.endsWith(".webp"), "use a lightweight WebP image");
    assert.ok(fs.existsSync(path.resolve(root, path.dirname(page), src)), src);
  });
}

test("each page uses a different cat picture", () => {
  const sources = pages.map((page) => {
    const src = mascotFor(page).match(/\bsrc="([^"]+)"/)[1];
    return path.resolve(root, path.dirname(page), src);
  });
  assert.equal(new Set(sources).size, pages.length);
});
