import type { FastifyPluginAsync } from "fastify";
import { chromium } from "playwright";
import { getCollections, ObjectId } from "../db";

export const exportRoutes: FastifyPluginAsync = async (app) => {
  const { Worlds, Pages, PageContent } = getCollections();

  app.post<{
    Body: { worldId: string; pageIds: string[]; order?: string[] };
  }>("/export/pdf", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId, pageIds, order } = req.body;

    // Validate world
    let wid: ObjectId;
    try {
      wid = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }
    const world = await Worlds.findOne({ _id: wid });
    if (!world) return reply.code(404).send({ error: "world not found" });

    // Membership / share access (owner or member)
    const isMember =
      world.ownerUid === uid ||
      (world.members ?? []).some((m) => m.uid === uid);
    if (!isMember) return reply.code(403).send({ error: "forbidden" });

    // Resolve ids in desired order
    const orderIds = (order?.length ? order : pageIds) as string[];
    const oids = orderIds.map((id) => new ObjectId(id));

    const pages = await Pages.find({ _id: { $in: oids } }).toArray();
    if (!pages.length) return reply.code(400).send({ error: "no pages found" });

    const contents = await PageContent.find({
      pageId: { $in: pages.map((p) => p._id) },
    }).toArray();

    const contentById = new Map(
      contents.map((c) => [c.pageId.toString(), c.doc as string | null])
    );

    // Build HTML
    const blocks = oids.map((oid) => {
      const p = pages.find((pp) => pp._id.equals(oid));
      if (!p) return "";
      const body = contentById.get(p._id.toString()) ?? "";
      return `<section class="page">
        <h1>${esc(p.title || "Untitled")}</h1>
        <div class="content">${body}</div>
      </section>`;
    });

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(world.name)} — Export</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="cover">
    <div class="cover__inner">
      <div class="emoji">${esc(world.emoji ?? "🌍")}</div>
      <h1>${esc(world.name)}</h1>
      <div class="meta">Exported ${new Date().toLocaleString()}</div>
    </div>
  </div>
  ${blocks.join("\n")}
</body>
</html>`;

    // Render to PDF
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      const pdf = await page.pdf({
        format: "Letter",
        printBackground: true,
        preferCSSPageSize: true,
      });

      reply
        .header("Content-Type", "application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename="${slug(world.name)}.pdf"`
        )
        .send(pdf);
    } finally {
      await browser.close();
    }
  });
};

function esc(s: string) {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[
        ch
      ]!)
  );
}
function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PRINT_CSS = `
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto;
    color: #111;
    margin: 0;
    padding: 0;
  }
  .cover {
    break-after: page;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(11in - 1.2in); /* Letter height minus margins */
  }
  .cover__inner { text-align: center; }
  .cover .emoji { font-size: 64px; margin-bottom: 12px; }
  .cover h1 { font-size: 28px; margin: 0 0 8px; color: #111 !important; }
  .cover .meta { color: #555; font-size: 12px; }
  .page { break-after: page; }
  .page:last-child { break-after: auto; }
  h1 { font-size: 20px; margin: 0 0 10px; color: #111 !important; }
  h2 { font-size: 16px; margin: 18px 0 8px; color: #111 !important; }
  h3 { font-size: 14px; margin: 14px 0 6px; color: #111 !important; }
  p { margin: 8px 0; color: #111 !important; }
  li { color: #111 !important; }
  strong { color: #111 !important; }
  em { color: #111 !important; }
  code { color: #111 !important; }
  .content table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .content th, .content td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; color: #111 !important; }
  .content th { background: #f5f5f5; text-align: left; }
  .content ul, .content ol { margin: 8px 0 8px 20px; }
  blockquote { border-left: 3px solid #ccc; padding-left: 10px; color: #555 !important; margin: 10px 0; }
  hr { border: 0; border-top: 1px solid #ddd; margin: 14px 0; }
`;
