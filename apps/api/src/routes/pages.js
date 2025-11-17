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
exports.pagesRoutes = void 0;
var db_1 = require("../db");
var pagesRoutes = function (app) { return __awaiter(void 0, void 0, void 0, function () {
    // --- Helpers ---
    function getWorldForUser(worldId, uid) {
        return __awaiter(this, void 0, void 0, function () {
            var worldObjectId, world;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            worldObjectId = new db_1.ObjectId(worldId);
                        }
                        catch (_b) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, Worlds.findOne({
                                _id: worldObjectId,
                                $or: [{ ownerUid: uid }, { "members.uid": uid }],
                            })];
                    case 1:
                        world = _a.sent();
                        return [2 /*return*/, world !== null && world !== void 0 ? world : null];
                }
            });
        });
    }
    function ensurePageAccess(pageId, uid) {
        return __awaiter(this, void 0, void 0, function () {
            var pageObjectId, page, world;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            pageObjectId = new db_1.ObjectId(pageId);
                        }
                        catch (_b) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, Pages.findOne({ _id: pageObjectId })];
                    case 1:
                        page = _a.sent();
                        if (!page)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, Worlds.findOne({
                                _id: page.worldId,
                                $or: [{ ownerUid: uid }, { "members.uid": uid }],
                            })];
                    case 2:
                        world = _a.sent();
                        if (!world)
                            return [2 /*return*/, null];
                        return [2 /*return*/, { page: page, world: world }];
                }
            });
        });
    }
    var _a, Worlds, Pages, PageContent, Favorites, WorldActivity;
    return __generator(this, function (_b) {
        _a = (0, db_1.getCollections)(), Worlds = _a.Worlds, Pages = _a.Pages, PageContent = _a.PageContent, Favorites = _a.Favorites, WorldActivity = _a.WorldActivity;
        // --- Routes ---
        // GET /worlds/:worldId/pages
        app.get("/worlds/:worldId/pages", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, worldId, world, pages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = req.user.uid;
                        worldId = req.params.worldId;
                        return [4 /*yield*/, getWorldForUser(worldId, uid)];
                    case 1:
                        world = _a.sent();
                        if (!world) {
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        }
                        return [4 /*yield*/, Pages.find({
                                worldId: world._id,
                            })
                                .sort({ position: 1, createdAt: 1 })
                                .toArray()];
                    case 2:
                        pages = _a.sent();
                        return [2 /*return*/, pages.map(function (p) { return ({
                                _id: p._id.toString(),
                                worldId: p.worldId.toString(),
                                parentId: p.parentId ? p.parentId.toString() : null,
                                title: p.title,
                                emoji: p.emoji,
                                position: p.position,
                                lastEditedBy: p.lastEditedBy,
                                lastEditedAt: p.lastEditedAt,
                                createdAt: p.createdAt,
                                updatedAt: p.updatedAt,
                            }); })];
                }
            });
        }); });
        // POST /pages - create page
        app.post("/pages", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, _a, worldId, title, emoji, parentId, world, parentObjectId, parent_1, last, now, safeTitle, pos, page;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        uid = req.user.uid;
                        _a = req.body, worldId = _a.worldId, title = _a.title, emoji = _a.emoji, parentId = _a.parentId;
                        return [4 /*yield*/, getWorldForUser(worldId, uid)];
                    case 1:
                        world = _d.sent();
                        if (!world) {
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        }
                        parentObjectId = null;
                        if (!(parentId && parentId !== "null")) return [3 /*break*/, 3];
                        try {
                            parentObjectId = new db_1.ObjectId(parentId);
                        }
                        catch (_e) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid parentId" })];
                        }
                        return [4 /*yield*/, Pages.findOne({
                                _id: parentObjectId,
                                worldId: world._id,
                            })];
                    case 2:
                        parent_1 = _d.sent();
                        if (!parent_1) {
                            return [2 /*return*/, reply
                                    .code(400)
                                    .send({ error: "parent page not found in this world" })];
                        }
                        _d.label = 3;
                    case 3: return [4 /*yield*/, Pages.find({
                            worldId: world._id,
                            parentId: parentObjectId,
                        })
                            .sort({ position: -1 })
                            .limit(1)
                            .next()];
                    case 4:
                        last = _d.sent();
                        now = new Date();
                        safeTitle = (title && title.trim()) || "New Page";
                        pos = ((_b = last === null || last === void 0 ? void 0 : last.position) !== null && _b !== void 0 ? _b : 0) + 1;
                        page = {
                            _id: new db_1.ObjectId(),
                            ownerUid: world.ownerUid,
                            worldId: world._id,
                            title: safeTitle,
                            emoji: emoji || "📄",
                            parentId: parentObjectId,
                            position: pos,
                            createdAt: now,
                            updatedAt: now,
                            lastEditedBy: uid,
                            lastEditedAt: now,
                        };
                        return [4 /*yield*/, Pages.insertOne(page)];
                    case 5:
                        _d.sent();
                        return [4 /*yield*/, Worlds.updateOne({ _id: world._id }, {
                                $inc: { "stats.pageCount": 1 },
                                $set: {
                                    lastActivityAt: now,
                                    updatedAt: now,
                                },
                            })];
                    case 6:
                        _d.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: world._id,
                                pageId: page._id,
                                actorUid: uid,
                                type: "page_created",
                                meta: { title: safeTitle, parentId: (_c = parentObjectId === null || parentObjectId === void 0 ? void 0 : parentObjectId.toString()) !== null && _c !== void 0 ? _c : null },
                                createdAt: now,
                            })];
                    case 7:
                        _d.sent();
                        return [2 /*return*/, {
                                _id: page._id.toString(),
                                worldId: page.worldId.toString(),
                                parentId: page.parentId ? page.parentId.toString() : null,
                                title: page.title,
                                emoji: page.emoji,
                                position: page.position,
                                createdAt: page.createdAt,
                                updatedAt: page.updatedAt,
                                lastEditedBy: page.lastEditedBy,
                                lastEditedAt: page.lastEditedAt,
                            }];
                }
            });
        }); });
        // PATCH /pages/:pageId - rename
        app.patch("/pages/:pageId", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, pageId, title, ctx, page, world, now, nextTitle;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = req.user.uid;
                        pageId = req.params.pageId;
                        title = req.body.title;
                        if (!title || !title.trim()) {
                            return [2 /*return*/, reply.code(400).send({ error: "title is required" })];
                        }
                        return [4 /*yield*/, ensurePageAccess(pageId, uid)];
                    case 1:
                        ctx = _a.sent();
                        if (!ctx)
                            return [2 /*return*/, reply.code(404).send({ error: "page not found" })];
                        page = ctx.page, world = ctx.world;
                        now = new Date();
                        nextTitle = title.trim();
                        return [4 /*yield*/, Pages.updateOne({ _id: page._id }, {
                                $set: {
                                    title: nextTitle,
                                    updatedAt: now,
                                    lastEditedBy: uid,
                                    lastEditedAt: now,
                                },
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, Worlds.updateOne({ _id: world._id }, { $set: { lastActivityAt: now, updatedAt: now } })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: world._id,
                                pageId: page._id,
                                actorUid: uid,
                                type: "page_renamed",
                                meta: { from: page.title, to: nextTitle },
                                createdAt: now,
                            })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        // PATCH /pages/:pageId/move - change parent and/or position
        app.patch("/pages/:pageId/move", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, pageId, _a, parentId, position, ctx, page, world, parentObjectId, parent_2, now, newPos, oldParentId, oldPosition, movingWithinSameParent, last;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        uid = req.user.uid;
                        pageId = req.params.pageId;
                        _a = req.body, parentId = _a.parentId, position = _a.position;
                        return [4 /*yield*/, ensurePageAccess(pageId, uid)];
                    case 1:
                        ctx = _c.sent();
                        if (!ctx)
                            return [2 /*return*/, reply.code(404).send({ error: "page not found" })];
                        page = ctx.page, world = ctx.world;
                        parentObjectId = null;
                        if (!parentId) return [3 /*break*/, 3];
                        try {
                            parentObjectId = new db_1.ObjectId(parentId);
                        }
                        catch (_d) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid parentId" })];
                        }
                        return [4 /*yield*/, Pages.findOne({
                                _id: parentObjectId,
                                worldId: world._id,
                            })];
                    case 2:
                        parent_2 = _c.sent();
                        if (!parent_2) {
                            return [2 /*return*/, reply
                                    .code(400)
                                    .send({ error: "parent page not found in this world" })];
                        }
                        _c.label = 3;
                    case 3:
                        // Basic cycle guard: parent cannot be self
                        if (parentObjectId && parentObjectId.equals(page._id)) {
                            return [2 /*return*/, reply.code(400).send({ error: "page cannot be its own parent" })];
                        }
                        now = new Date();
                        oldParentId = page.parentId;
                        oldPosition = page.position;
                        movingWithinSameParent = oldParentId &&
                            parentObjectId &&
                            oldParentId.equals(parentObjectId);
                        if (!(position !== undefined && position >= 0)) return [3 /*break*/, 13];
                        // Position specified - need to handle removal + insertion
                        newPos = position;
                        if (!movingWithinSameParent) return [3 /*break*/, 8];
                        if (!(oldPosition < position)) return [3 /*break*/, 5];
                        // Moving down: shift pages between old and new position down
                        return [4 /*yield*/, Pages.updateMany({
                                worldId: world._id,
                                parentId: parentObjectId,
                                position: { $gt: oldPosition, $lte: position },
                                _id: { $ne: page._id },
                            }, { $inc: { position: -1 } })];
                    case 4:
                        // Moving down: shift pages between old and new position down
                        _c.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        if (!(oldPosition > position)) return [3 /*break*/, 7];
                        // Moving up: shift pages between new and old position up
                        return [4 /*yield*/, Pages.updateMany({
                                worldId: world._id,
                                parentId: parentObjectId,
                                position: { $gte: position, $lt: oldPosition },
                                _id: { $ne: page._id },
                            }, { $inc: { position: 1 } })];
                    case 6:
                        // Moving up: shift pages between new and old position up
                        _c.sent();
                        _c.label = 7;
                    case 7: return [3 /*break*/, 12];
                    case 8:
                        if (!oldParentId) return [3 /*break*/, 10];
                        return [4 /*yield*/, Pages.updateMany({
                                worldId: world._id,
                                parentId: oldParentId,
                                position: { $gt: oldPosition },
                            }, { $inc: { position: -1 } })];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10: 
                    // Shift up siblings at or after new position in new parent
                    return [4 /*yield*/, Pages.updateMany({
                            worldId: world._id,
                            parentId: parentObjectId,
                            position: { $gte: position },
                        }, { $inc: { position: 1 } })];
                    case 11:
                        // Shift up siblings at or after new position in new parent
                        _c.sent();
                        _c.label = 12;
                    case 12: return [3 /*break*/, 15];
                    case 13: return [4 /*yield*/, Pages.find({
                            worldId: world._id,
                            parentId: parentObjectId,
                        })
                            .sort({ position: -1 })
                            .limit(1)
                            .next()];
                    case 14:
                        last = _c.sent();
                        newPos = ((_b = last === null || last === void 0 ? void 0 : last.position) !== null && _b !== void 0 ? _b : 0) + 1;
                        _c.label = 15;
                    case 15: return [4 /*yield*/, Pages.updateOne({ _id: page._id }, {
                            $set: {
                                parentId: parentObjectId,
                                position: newPos,
                                updatedAt: now,
                                lastEditedBy: uid,
                                lastEditedAt: now,
                            },
                        })];
                    case 16:
                        _c.sent();
                        return [4 /*yield*/, Worlds.updateOne({ _id: world._id }, { $set: { lastActivityAt: now, updatedAt: now } })];
                    case 17:
                        _c.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: world._id,
                                pageId: page._id,
                                actorUid: uid,
                                type: "page_moved",
                                meta: {
                                    newParentId: parentObjectId ? parentObjectId.toString() : null,
                                },
                                createdAt: now,
                            })];
                    case 18:
                        _c.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        // DELETE /pages/:pageId - delete page + subtree
        app.delete("/pages/:pageId", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, pageId, ctx, page, world, toDelete, stack, id, children, _i, children_1, c, ids, delta, now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = req.user.uid;
                        pageId = req.params.pageId;
                        return [4 /*yield*/, ensurePageAccess(pageId, uid)];
                    case 1:
                        ctx = _a.sent();
                        if (!ctx)
                            return [2 /*return*/, reply.code(404).send({ error: "page not found" })];
                        page = ctx.page, world = ctx.world;
                        toDelete = new Set();
                        stack = [page._id];
                        _a.label = 2;
                    case 2:
                        if (!stack.length) return [3 /*break*/, 4];
                        id = stack.pop();
                        if (toDelete.has(id.toString()))
                            return [3 /*break*/, 2];
                        toDelete.add(id.toString());
                        return [4 /*yield*/, Pages.find({
                                worldId: world._id,
                                parentId: id,
                            }).toArray()];
                    case 3:
                        children = _a.sent();
                        for (_i = 0, children_1 = children; _i < children_1.length; _i++) {
                            c = children_1[_i];
                            stack.push(c._id);
                        }
                        return [3 /*break*/, 2];
                    case 4:
                        ids = Array.from(toDelete).map(function (id) { return new db_1.ObjectId(id); });
                        return [4 /*yield*/, Pages.deleteMany({ _id: { $in: ids }, worldId: world._id })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, PageContent.deleteMany({ pageId: { $in: ids } })];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, Favorites.deleteMany({ pageId: { $in: ids } })];
                    case 7:
                        _a.sent();
                        delta = ids.length;
                        now = new Date();
                        return [4 /*yield*/, Worlds.updateOne({ _id: world._id }, {
                                $inc: { "stats.pageCount": -delta },
                                $set: { lastActivityAt: now, updatedAt: now },
                            })];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: world._id,
                                pageId: page._id,
                                actorUid: uid,
                                type: "page_deleted",
                                meta: { count: delta, title: page.title },
                                createdAt: now,
                            })];
                    case 9:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        // POST /pages/:pageId/duplicate - shallow duplicate
        app.post("/pages/:pageId/duplicate", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, pageId, ctx, page, world, now, last, newPage, content;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        uid = req.user.uid;
                        pageId = req.params.pageId;
                        return [4 /*yield*/, ensurePageAccess(pageId, uid)];
                    case 1:
                        ctx = _d.sent();
                        if (!ctx)
                            return [2 /*return*/, reply.code(404).send({ error: "page not found" })];
                        page = ctx.page, world = ctx.world;
                        now = new Date();
                        return [4 /*yield*/, Pages.find({
                                worldId: world._id,
                                parentId: (_a = page.parentId) !== null && _a !== void 0 ? _a : null,
                            })
                                .sort({ position: -1 })
                                .limit(1)
                                .next()];
                    case 2:
                        last = _d.sent();
                        newPage = {
                            _id: new db_1.ObjectId(),
                            ownerUid: page.ownerUid,
                            worldId: world._id,
                            title: "".concat(page.title, " (copy)"),
                            emoji: page.emoji,
                            parentId: (_b = page.parentId) !== null && _b !== void 0 ? _b : null,
                            position: ((_c = last === null || last === void 0 ? void 0 : last.position) !== null && _c !== void 0 ? _c : 0) + 1,
                            createdAt: now,
                            updatedAt: now,
                            lastEditedBy: uid,
                            lastEditedAt: now,
                        };
                        return [4 /*yield*/, Pages.insertOne(newPage)];
                    case 3:
                        _d.sent();
                        return [4 /*yield*/, PageContent.findOne({
                                pageId: page._id,
                                ownerUid: page.ownerUid,
                            })];
                    case 4:
                        content = _d.sent();
                        if (!content) return [3 /*break*/, 6];
                        return [4 /*yield*/, PageContent.insertOne({
                                _id: new db_1.ObjectId(),
                                ownerUid: content.ownerUid,
                                worldId: world._id,
                                pageId: newPage._id,
                                doc: content.doc,
                                lastEditedBy: uid,
                                updatedAt: now,
                            })];
                    case 5:
                        _d.sent();
                        _d.label = 6;
                    case 6: return [4 /*yield*/, Worlds.updateOne({ _id: world._id }, {
                            $inc: { "stats.pageCount": 1 },
                            $set: { lastActivityAt: now, updatedAt: now },
                        })];
                    case 7:
                        _d.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: world._id,
                                pageId: newPage._id,
                                actorUid: uid,
                                type: "page_duplicated",
                                meta: { sourcePageId: page._id.toString() },
                                createdAt: now,
                            })];
                    case 8:
                        _d.sent();
                        return [2 /*return*/, {
                                _id: newPage._id.toString(),
                                worldId: newPage.worldId.toString(),
                                parentId: newPage.parentId ? newPage.parentId.toString() : null,
                                title: newPage.title,
                                emoji: newPage.emoji,
                                position: newPage.position,
                                createdAt: newPage.createdAt,
                                updatedAt: newPage.updatedAt,
                                lastEditedBy: newPage.lastEditedBy,
                                lastEditedAt: newPage.lastEditedAt,
                            }];
                }
            });
        }); });
        // GET /pages/:pageId/content
        app.get("/pages/:pageId/content", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, pageId, ctx, page, content;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        uid = req.user.uid;
                        pageId = req.params.pageId;
                        return [4 /*yield*/, ensurePageAccess(pageId, uid)];
                    case 1:
                        ctx = _c.sent();
                        if (!ctx)
                            return [2 /*return*/, reply.code(404).send({ error: "page not found" })];
                        page = ctx.page;
                        return [4 /*yield*/, PageContent.findOne({
                                pageId: page._id,
                                ownerUid: page.ownerUid,
                            })];
                    case 2:
                        content = _c.sent();
                        return [2 /*return*/, {
                                doc: (_a = content === null || content === void 0 ? void 0 : content.doc) !== null && _a !== void 0 ? _a : null,
                                updatedAt: (_b = content === null || content === void 0 ? void 0 : content.updatedAt) !== null && _b !== void 0 ? _b : null,
                            }];
                }
            });
        }); });
        // PUT /pages/:pageId/content - autosave
        app.put("/pages/:pageId/content", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, pageId, doc, ctx, page, world, now, oldContent, oldWordCount, newWordCount, wordCountDiff;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = req.user.uid;
                        pageId = req.params.pageId;
                        doc = req.body.doc;
                        if (doc === undefined) {
                            return [2 /*return*/, reply.code(400).send({ error: "doc is required" })];
                        }
                        return [4 /*yield*/, ensurePageAccess(pageId, uid)];
                    case 1:
                        ctx = _a.sent();
                        if (!ctx)
                            return [2 /*return*/, reply.code(404).send({ error: "page not found" })];
                        page = ctx.page, world = ctx.world;
                        now = new Date();
                        return [4 /*yield*/, PageContent.findOne({ pageId: page._id })];
                    case 2:
                        oldContent = _a.sent();
                        oldWordCount = (oldContent === null || oldContent === void 0 ? void 0 : oldContent.doc) && typeof oldContent.doc === 'string'
                            ? oldContent.doc.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(function (w) { return w.length > 0; }).length
                            : 0;
                        newWordCount = doc && typeof doc === 'string'
                            ? doc.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(function (w) { return w.length > 0; }).length
                            : 0;
                        wordCountDiff = newWordCount - oldWordCount;
                        return [4 /*yield*/, PageContent.updateOne({ pageId: page._id, ownerUid: page.ownerUid }, {
                                $set: {
                                    ownerUid: page.ownerUid,
                                    worldId: world._id,
                                    pageId: page._id,
                                    doc: doc,
                                    lastEditedBy: uid,
                                    updatedAt: now,
                                },
                            }, { upsert: true })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, Pages.updateOne({ _id: page._id }, {
                                $set: {
                                    lastEditedBy: uid,
                                    lastEditedAt: now,
                                    updatedAt: now,
                                },
                            })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, Worlds.updateOne({ _id: world._id }, { $set: { lastActivityAt: now, updatedAt: now } })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: world._id,
                                pageId: page._id,
                                actorUid: uid,
                                type: "content_updated",
                                meta: {
                                    wordCountDiff: wordCountDiff,
                                    oldWordCount: oldWordCount,
                                    newWordCount: newWordCount,
                                },
                                createdAt: now,
                            })];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, { ok: true, updatedAt: now.toISOString() }];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); };
exports.pagesRoutes = pagesRoutes;
