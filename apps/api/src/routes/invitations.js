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
exports.invitationsRoutes = void 0;
var db_1 = require("../db");
var invitationsRoutes = function (app) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, Worlds, WorldInvitations, WorldActivity;
    return __generator(this, function (_b) {
        _a = (0, db_1.getCollections)(), Worlds = _a.Worlds, WorldInvitations = _a.WorldInvitations, WorldActivity = _a.WorldActivity;
        // GET /invitations - get pending invites for current user
        app.get("/invitations", function (req) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, email, invites;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = req.user.uid;
                        email = req.user.email;
                        return [4 /*yield*/, WorldInvitations.find({
                                inviteeEmail: email,
                                status: "pending",
                            })
                                .sort({ createdAt: -1 })
                                .toArray()];
                    case 1:
                        invites = _a.sent();
                        return [2 /*return*/, invites.map(function (inv) { return ({
                                _id: inv._id.toString(),
                                worldId: inv.worldId.toString(),
                                worldName: inv.worldName,
                                inviterEmail: inv.inviterEmail,
                                role: inv.role,
                                createdAt: inv.createdAt,
                            }); })];
                }
            });
        }); });
        // POST /worlds/:worldId/invitations - send invitation
        app.post("/worlds/:worldId/invitations", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, email, worldId, _a, inviteeEmail, role, worldObjectId, world, userMember, existingMember, existingInvite, now, invite;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        uid = req.user.uid;
                        email = req.user.email;
                        worldId = req.params.worldId;
                        _a = req.body, inviteeEmail = _a.email, role = _a.role;
                        if (!inviteeEmail || !role) {
                            return [2 /*return*/, reply.code(400).send({ error: "email and role are required" })];
                        }
                        if (!["admin", "editor"].includes(role)) {
                            return [2 /*return*/, reply.code(400).send({ error: "role must be admin or editor" })];
                        }
                        try {
                            worldObjectId = new db_1.ObjectId(worldId);
                        }
                        catch (_c) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid worldId" })];
                        }
                        return [4 /*yield*/, Worlds.findOne({ _id: worldObjectId })];
                    case 1:
                        world = _b.sent();
                        if (!world) {
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        }
                        userMember = world.members.find(function (m) { return m.uid === uid; });
                        if (!userMember || !["owner", "admin"].includes(userMember.role)) {
                            return [2 /*return*/, reply
                                    .code(403)
                                    .send({ error: "only owners and admins can invite" })];
                        }
                        existingMember = world.members.find(function (m) { return m.uid === inviteeEmail || m.uid.includes(inviteeEmail); });
                        if (existingMember) {
                            return [2 /*return*/, reply.code(400).send({ error: "user already has access" })];
                        }
                        return [4 /*yield*/, WorldInvitations.findOne({
                                worldId: worldObjectId,
                                inviteeEmail: inviteeEmail,
                                status: "pending",
                            })];
                    case 2:
                        existingInvite = _b.sent();
                        if (existingInvite) {
                            return [2 /*return*/, reply
                                    .code(400)
                                    .send({ error: "invitation already sent to this email" })];
                        }
                        now = new Date();
                        invite = {
                            _id: new db_1.ObjectId(),
                            worldId: worldObjectId,
                            worldName: world.name,
                            inviterUid: uid,
                            inviterEmail: email || "Unknown",
                            inviteeEmail: inviteeEmail,
                            role: role,
                            status: "pending",
                            createdAt: now,
                        };
                        return [4 /*yield*/, WorldInvitations.insertOne(invite)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: worldObjectId,
                                actorUid: uid,
                                type: "member_invited",
                                meta: { email: inviteeEmail, role: role },
                                createdAt: now,
                            })];
                    case 4:
                        _b.sent();
                        return [2 /*return*/, { ok: true, inviteId: invite._id.toString() }];
                }
            });
        }); });
        // POST /invitations/:inviteId/accept - accept invitation
        app.post("/invitations/:inviteId/accept", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, email, inviteId, inviteObjectId, invite, now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = req.user.uid;
                        email = req.user.email;
                        inviteId = req.params.inviteId;
                        try {
                            inviteObjectId = new db_1.ObjectId(inviteId);
                        }
                        catch (_b) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid inviteId" })];
                        }
                        return [4 /*yield*/, WorldInvitations.findOne({ _id: inviteObjectId })];
                    case 1:
                        invite = _a.sent();
                        if (!invite) {
                            return [2 /*return*/, reply.code(404).send({ error: "invitation not found" })];
                        }
                        if (invite.inviteeEmail !== email) {
                            return [2 /*return*/, reply.code(403).send({ error: "invitation not for you" })];
                        }
                        if (invite.status !== "pending") {
                            return [2 /*return*/, reply
                                    .code(400)
                                    .send({ error: "invitation already responded to" })];
                        }
                        now = new Date();
                        // Add user to world members
                        return [4 /*yield*/, Worlds.updateOne({ _id: invite.worldId }, {
                                $push: {
                                    members: {
                                        uid: uid,
                                        role: invite.role,
                                        addedAt: now,
                                    },
                                },
                                $inc: { "stats.collaboratorCount": 1 },
                                $set: { updatedAt: now },
                            })];
                    case 2:
                        // Add user to world members
                        _a.sent();
                        // Update invitation status
                        return [4 /*yield*/, WorldInvitations.updateOne({ _id: inviteObjectId }, { $set: { status: "accepted", respondedAt: now } })];
                    case 3:
                        // Update invitation status
                        _a.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: invite.worldId,
                                actorUid: uid,
                                type: "member_joined",
                                meta: { role: invite.role },
                                createdAt: now,
                            })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        // POST /invitations/:inviteId/reject - reject invitation
        app.post("/invitations/:inviteId/reject", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var email, inviteId, inviteObjectId, invite;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        email = req.user.email;
                        inviteId = req.params.inviteId;
                        try {
                            inviteObjectId = new db_1.ObjectId(inviteId);
                        }
                        catch (_b) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid inviteId" })];
                        }
                        return [4 /*yield*/, WorldInvitations.findOne({ _id: inviteObjectId })];
                    case 1:
                        invite = _a.sent();
                        if (!invite) {
                            return [2 /*return*/, reply.code(404).send({ error: "invitation not found" })];
                        }
                        if (invite.inviteeEmail !== email) {
                            return [2 /*return*/, reply.code(403).send({ error: "invitation not for you" })];
                        }
                        if (invite.status !== "pending") {
                            return [2 /*return*/, reply
                                    .code(400)
                                    .send({ error: "invitation already responded to" })];
                        }
                        return [4 /*yield*/, WorldInvitations.updateOne({ _id: inviteObjectId }, { $set: { status: "rejected", respondedAt: new Date() } })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        // GET /worlds/:worldId/members - get members of a world
        app.get("/worlds/:worldId/members", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, worldId, worldObjectId, world, userMember;
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
                        if (!world) {
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        }
                        userMember = world.members.find(function (m) { return m.uid === uid; });
                        if (!userMember) {
                            return [2 /*return*/, reply.code(403).send({ error: "access denied" })];
                        }
                        return [2 /*return*/, world.members.map(function (m) { return ({
                                uid: m.uid,
                                role: m.role,
                                addedAt: m.addedAt,
                            }); })];
                }
            });
        }); });
        // DELETE /worlds/:worldId/members/:userId - remove member
        app.delete("/worlds/:worldId/members/:userId", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, _a, worldId, userId, worldObjectId, world, userMember, targetMember, now;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        uid = req.user.uid;
                        _a = req.params, worldId = _a.worldId, userId = _a.userId;
                        try {
                            worldObjectId = new db_1.ObjectId(worldId);
                        }
                        catch (_c) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid worldId" })];
                        }
                        return [4 /*yield*/, Worlds.findOne({ _id: worldObjectId })];
                    case 1:
                        world = _b.sent();
                        if (!world) {
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        }
                        userMember = world.members.find(function (m) { return m.uid === uid; });
                        if (!userMember || !["owner", "admin"].includes(userMember.role)) {
                            return [2 /*return*/, reply
                                    .code(403)
                                    .send({ error: "only owners and admins can remove members" })];
                        }
                        targetMember = world.members.find(function (m) { return m.uid === userId; });
                        if ((targetMember === null || targetMember === void 0 ? void 0 : targetMember.role) === "owner") {
                            return [2 /*return*/, reply.code(400).send({ error: "cannot remove owner" })];
                        }
                        now = new Date();
                        return [4 /*yield*/, Worlds.updateOne({ _id: worldObjectId }, {
                                $pull: { members: { uid: userId } },
                                $inc: { "stats.collaboratorCount": -1 },
                                $set: { updatedAt: now },
                            })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: worldObjectId,
                                actorUid: uid,
                                type: "member_removed",
                                meta: { removedUid: userId },
                                createdAt: now,
                            })];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        // PATCH /worlds/:worldId/members/:userId - update member role
        app.patch("/worlds/:worldId/members/:userId", function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            var uid, _a, worldId, userId, role, worldObjectId, world, userMember, targetMember, now;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        uid = req.user.uid;
                        _a = req.params, worldId = _a.worldId, userId = _a.userId;
                        role = req.body.role;
                        if (!["admin", "editor"].includes(role)) {
                            return [2 /*return*/, reply.code(400).send({ error: "role must be admin or editor" })];
                        }
                        try {
                            worldObjectId = new db_1.ObjectId(worldId);
                        }
                        catch (_c) {
                            return [2 /*return*/, reply.code(400).send({ error: "invalid worldId" })];
                        }
                        return [4 /*yield*/, Worlds.findOne({ _id: worldObjectId })];
                    case 1:
                        world = _b.sent();
                        if (!world) {
                            return [2 /*return*/, reply.code(404).send({ error: "world not found" })];
                        }
                        userMember = world.members.find(function (m) { return m.uid === uid; });
                        if (!userMember || !["owner", "admin"].includes(userMember.role)) {
                            return [2 /*return*/, reply
                                    .code(403)
                                    .send({ error: "only owners and admins can update roles" })];
                        }
                        targetMember = world.members.find(function (m) { return m.uid === userId; });
                        if ((targetMember === null || targetMember === void 0 ? void 0 : targetMember.role) === "owner") {
                            return [2 /*return*/, reply.code(400).send({ error: "cannot change owner role" })];
                        }
                        now = new Date();
                        return [4 /*yield*/, Worlds.updateOne({ _id: worldObjectId, "members.uid": userId }, {
                                $set: { "members.$.role": role, updatedAt: now },
                            })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, WorldActivity.insertOne({
                                _id: new db_1.ObjectId(),
                                worldId: worldObjectId,
                                actorUid: uid,
                                type: "member_role_updated",
                                meta: { targetUid: userId, newRole: role },
                                createdAt: now,
                            })];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); };
exports.invitationsRoutes = invitationsRoutes;
