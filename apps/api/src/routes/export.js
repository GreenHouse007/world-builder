"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRoutes = void 0;
var playwright_1 = require("playwright");
var db_1 = require("../db");
var exportRoutes = function (app) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, Worlds, Pages, PageContent;
    return __generator(this, function (_b) {
        _a = (0, db_1.getCollections)(), Worlds = _a.Worlds, Pages = _a.Pages, PageContent = _a.PageContent;
        app.post("/export/pdf", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, _a, worldId, pageIds, order, wid, world, isMember, orderIds, oids, pages, contents, contentById, blocks, html, browser, page, pdf;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        uid = req.user.uid;
                        _a = req.body, worldId = _a.worldId, pageIds = _a.pageIds, order = _a.order;
                        try {
                            wid = new db_1.ObjectId(worldId);
                        }
                        catch (_e) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid worldId" })];
                        }
                        return [4 /*yield*/, Worlds.findOne({ _id: wid })];
                    case 1:
                        world = _d.sent();
                        if (!world)
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        isMember = world.ownerUid === uid ||
                            ((_b = world.members) !== null && _b !== void 0 ? _b : []).some(function (m) { return m.uid === uid; });
                        if (!isMember)
                            return [2 /*return*/, reply.code(403).send({ error: "forbidden" })];
                        orderIds = ((order === null || order === void 0 ? void 0 : order.length) ? order : pageIds);
                        oids = orderIds.map(function (id) { return new db_1.ObjectId(id); });
                        return [4 /*yield*/, Pages.find({ _id: { $in: oids } }).toArray()];
                    case 2:
                        pages = _d.sent();
                        if (!pages.length)
                            return [2 /*return*/, reply.code(400).send({ error: "no pages found" })];
                        return [4 /*yield*/, PageContent.find({
                                pageId: { $in: pages.map(function (p) { return p._id; }) },
                            }).toArray()];
                    case 3:
                        contents = _d.sent();
                        contentById = new Map(contents.map(function (c) { return [c.pageId.toString(), c.doc]; }));
                        blocks = oids.map(function (oid) {
                            var _a;
                            var p = pages.find(function (pp) { return pp._id.equals(oid); });
                            if (!p)
                                return "";
                            var body = (_a = contentById.get(p._id.toString())) !== null && _a !== void 0 ? _a : "";
                            return "<section class=\"page\">\n        <h1>".concat(esc(p.title || "Untitled"), "</h1>\n        <div class=\"content\">").concat(body, "</div>\n      </section>");
                        });
                        html = "<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\" />\n  <title>".concat(esc(world.name), " \u2014 Export</title>\n  <style>").concat(PRINT_CSS, "</style>\n</head>\n<body>\n  <div class=\"cover\">\n    <div class=\"cover__inner\">\n      <div class=\"emoji\">").concat(esc((_c = world.emoji) !== null && _c !== void 0 ? _c : "🌍"), "</div>\n      <h1>").concat(esc(world.name), "</h1>\n      <div class=\"meta\">Exported ").concat(new Date().toLocaleString(), "</div>\n    </div>\n  </div>\n  ").concat(blocks.join("\n"), "\n</body>\n</html>");
                        return [4 /*yield*/, playwright_1.chromium.launch()];
                    case 4:
                        browser = _d.sent();
                        _d.label = 5;
                    case 5:
                        _d.trys.push([5, , 9, 11]);
                        return [4 /*yield*/, browser.newPage()];
                    case 6:
                        page = _d.sent();
                        return [4 /*yield*/, page.setContent(html, { waitUntil: "networkidle" })];
                    case 7:
                        _d.sent();
                        return [4 /*yield*/, page.pdf({
                                format: "Letter",
                                printBackground: true,
                                preferCSSPageSize: true,
                            })];
                    case 8:
                        pdf = _d.sent();
                        reply
                            .header("Content-Type", "application/pdf")
                            .header("Content-Disposition", "attachment; filename=\"".concat(slug(world.name), ".pdf\""))
                            .send(pdf);
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, browser.close()];
                    case 10:
                        _d.sent();
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); };
exports.exportRoutes = exportRoutes;
function esc(s) {
    return s.replace(/[&<>"']/g, function (ch) {
        return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]);
    });
}
function slug(s) {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
var PRINT_CSS = "\n  @page { size: Letter; margin: 0.6in; }\n  * { box-sizing: border-box; }\n  body {\n    font-family: ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto;\n    color: #111;\n    margin: 0;\n    padding: 0;\n  }\n  .cover {\n    break-after: page;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    min-height: calc(11in - 1.2in); /* Letter height minus margins */\n  }\n  .cover__inner { text-align: center; }\n  .cover .emoji { font-size: 64px; margin-bottom: 12px; }\n  .cover h1 { font-size: 28px; margin: 0 0 8px; }\n  .cover .meta { color: #555; font-size: 12px; }\n  .page { break-after: page; }\n  .page:last-child { break-after: auto; }\n  h1 { font-size: 20px; margin: 0 0 10px; }\n  h2 { font-size: 16px; margin: 18px 0 8px; }\n  h3 { font-size: 14px; margin: 14px 0 6px; }\n  p { margin: 8px 0; }\n  .content table { width: 100%; border-collapse: collapse; margin: 12px 0; }\n  .content th, .content td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }\n  .content th { background: #f5f5f5; text-align: left; }\n  .content ul, .content ol { margin: 8px 0 8px 20px; }\n  blockquote { border-left: 3px solid #ccc; padding-left: 10px; color: #555; margin: 10px 0; }\n  hr { border: 0; border-top: 1px solid #ddd; margin: 14px 0; }\n";
