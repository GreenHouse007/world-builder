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
exports.worldsRoutes = void 0;
var db_1 = require("../db");
var worldsRoutes = function (app) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, Worlds, Pages, PageContent, Favorites, WorldActivity;
    return __generator(this, function (_b) {
        _a = (0, db_1.getCollections)(), Worlds = _a.Worlds, Pages = _a.Pages, PageContent = _a.PageContent, Favorites = _a.Favorites, WorldActivity = _a.WorldActivity;
        // GET /worlds - all worlds current user is a member of
        app.get("/worlds", function (req) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, worlds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = req.user.uid;
                        return [4 /*yield*/, Worlds.find({
                                $or: [
                                    { ownerUid: uid },
                                    { "members.uid": uid }, // for shared worlds
                                ],
                            })
                                .sort({ lastActivityAt: -1, createdAt: -1 })
                                .toArray()];
                    case 1:
                        worlds = _a.sent();
                        return [2 /*return*/, worlds.map(function (w) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                                return ({
                                    _id: w._id.toString(),
                                    name: w.name,
                                    emoji: w.emoji,
                                    ownerUid: w.ownerUid,
                                    members: (_a = w.members) !== null && _a !== void 0 ? _a : [],
                                    stats: {
                                        pageCount: (_c = (_b = w.stats) === null || _b === void 0 ? void 0 : _b.pageCount) !== null && _c !== void 0 ? _c : 0,
                                        favoriteCount: (_e = (_d = w.stats) === null || _d === void 0 ? void 0 : _d.favoriteCount) !== null && _e !== void 0 ? _e : 0,
                                        collaboratorCount: (_j = (_g = (_f = w.stats) === null || _f === void 0 ? void 0 : _f.collaboratorCount) !== null && _g !== void 0 ? _g : (_h = w.members) === null || _h === void 0 ? void 0 : _h.length) !== null && _j !== void 0 ? _j : 1,
                                    },
                                    createdAt: w.createdAt,
                                    updatedAt: w.updatedAt,
                                    lastActivityAt: (_k = w.lastActivityAt) !== null && _k !== void 0 ? _k : w.createdAt,
                                });
                            })];
                }
            });
        }); });
        // POST /worlds - create world
        app.post("/worlds", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, _a, name, emoji, now, member, doc;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        uid = req.user.uid;
                        _a = req.body, name = _a.name, emoji = _a.emoji;
                        if (!name || !name.trim()) {
                            return [2 /*return*/, reply.code(400).send({ error: "name is required" })];
                        }
                        now = new Date();
                        member = {
                            uid: uid,
                            role: "owner",
                            addedAt: now,
                        };
                        doc = {
                            _id: new db_1.ObjectId(),
                            ownerUid: uid,
                            name: name.trim(),
                            emoji: emoji || "🌍",
                            members: [member],
                            stats: {
                                pageCount: 0,
                                favoriteCount: 0,
                                collaboratorCount: 1,
                            },
                            createdAt: now,
                            updatedAt: now,
                            lastActivityAt: now,
                        };
                        return [4 /*yield*/, Worlds.insertOne(doc)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: doc._id,
                                actorUid: uid,
                                type: "world_created",
                                meta: { name: doc.name },
                                createdAt: now,
                            })];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, {
                                _id: doc._id.toString(),
                                name: doc.name,
                                emoji: doc.emoji,
                                ownerUid: doc.ownerUid,
                                members: doc.members,
                                stats: doc.stats,
                                createdAt: doc.createdAt,
                                updatedAt: doc.updatedAt,
                                lastActivityAt: doc.lastActivityAt,
                            }];
                }
            });
        }); });
        // PATCH /worlds/:worldId - rename / change emoji
        app.patch("/worlds/:worldId", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, worldId, _a, name, emoji, worldObjectId, world, member, update, meta;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        uid = req.user.uid;
                        worldId = req.params.worldId;
                        _a = req.body, name = _a.name, emoji = _a.emoji;
                        try {
                            worldObjectId = new db_1.ObjectId(worldId);
                        }
                        catch (_c) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid worldId" })];
                        }
                        return [4 /*yield*/, Worlds.findOne({ _id: worldObjectId })];
                    case 1:
                        world = _b.sent();
                        if (!world)
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        member = world.members.find(function (m) { return m.uid === uid; });
                        if (!member || (member.role !== "owner" && member.role !== "admin")) {
                            return [2 /*return*/, reply.code(403).send({ error: "forbidden" })];
                        }
                        update = { updatedAt: new Date() };
                        meta = {};
                        if (name && name.trim() && name.trim() !== world.name) {
                            update.name = name.trim();
                            meta.name = { from: world.name, to: update.name };
                        }
                        if (emoji && emoji !== world.emoji) {
                            update.emoji = emoji;
                            meta.emoji = { from: world.emoji, to: update.emoji };
                        }
                        if (!Object.keys(meta).length) {
                            return [2 /*return*/, { ok: true }];
                        }
                        return [4 /*yield*/, Worlds.updateOne({ _id: worldObjectId }, { $set: update })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: worldObjectId,
                                actorUid: uid,
                                type: "world_updated",
                                meta: meta,
                                createdAt: new Date(),
                            })];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        // DELETE /worlds/:worldId - cascades pages, content, favorites, activity
        app.delete("/worlds/:worldId", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, worldId, worldObjectId, world, pages, pageIds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = req.user.uid;
                        worldId = req.params.worldId;
                        try {
                            worldObjectId = new db_1.ObjectId(worldId);
                        }
                        catch (_b) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid worldId" })];
                        }
                        return [4 /*yield*/, Worlds.findOne({ _id: worldObjectId })];
                    case 1:
                        world = _a.sent();
                        if (!world)
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        if (world.ownerUid !== uid) {
                            return [2 /*return*/, reply.code(403).send({ error: "only owner can delete world" })];
                        }
                        return [4 /*yield*/, Pages.find({ worldId: worldObjectId }).toArray()];
                    case 2:
                        pages = _a.sent();
                        pageIds = pages.map(function (p) { return p._id; });
                        return [4 /*yield*/, Pages.deleteMany({ worldId: worldObjectId })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, PageContent.deleteMany({ worldId: worldObjectId })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, Favorites.deleteMany({ worldId: worldObjectId })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, WorldActivity.deleteMany({ worldId: worldObjectId })];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, Worlds.deleteOne({ _id: worldObjectId })];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: worldObjectId,
                                actorUid: uid,
                                type: "world_deleted",
                                meta: { pageCount: pageIds.length },
                                createdAt: new Date(),
                            })];
                    case 8:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); };
exports.worldsRoutes = worldsRoutes;
