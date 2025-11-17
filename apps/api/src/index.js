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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/index.ts
var fastify_1 = __importDefault(require("fastify"));
var cors_1 = __importDefault(require("@fastify/cors"));
require("dotenv/config");
var auth_1 = require("./auth");
var db_1 = require("./db");
var health_1 = require("./routes/health");
var worlds_1 = require("./routes/worlds");
var pages_1 = require("./routes/pages");
var favorites_1 = require("./routes/favorites");
var activity_1 = require("./routes/activity");
var export_1 = require("./routes/export");
var invitations_1 = require("./routes/invitations");
function buildServer() {
    return __awaiter(this, void 0, void 0, function () {
        var app;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app = (0, fastify_1.default)({ logger: true });
                    // ✅ CORS must be registered before routes & hooks
                    return [4 /*yield*/, app.register(cors_1.default, {
                            // In dev, you can keep this permissive. For prod, replace with an array like:
                            // origin: ["http://localhost:5173", "https://yourdomain.com"]
                            origin: true,
                            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ allow PATCH
                            allowedHeaders: ["Content-Type", "Authorization"], // ✅ allow bearer token
                            credentials: true,
                        })];
                case 1:
                    // ✅ CORS must be registered before routes & hooks
                    _a.sent();
                    (0, auth_1.initFirebase)();
                    return [4 /*yield*/, (0, db_1.initDb)()];
                case 2:
                    _a.sent();
                    // ✅ Auth hook: bypass for public routes AND for preflight (OPTIONS)
                    app.addHook("preHandler", function (req, reply) { return __awaiter(_this, void 0, void 0, function () {
                        var authHeader, token, decoded;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (req.method === "OPTIONS")
                                        return [2 /*return*/]; // let CORS handle preflight
                                    if ((_a = req.routeOptions.config) === null || _a === void 0 ? void 0 : _a.public)
                                        return [2 /*return*/];
                                    authHeader = req.headers.authorization;
                                    token = authHeader && authHeader.startsWith("Bearer ")
                                        ? authHeader.slice("Bearer ".length)
                                        : undefined;
                                    if (!token) {
                                        req.log.warn("No Authorization header");
                                        return [2 /*return*/, reply.code(401).send({ error: "unauthorized" })];
                                    }
                                    return [4 /*yield*/, (0, auth_1.verifyBearer)(token)];
                                case 1:
                                    decoded = _c.sent();
                                    if (!decoded) {
                                        req.log.warn("Invalid token");
                                        return [2 /*return*/, reply.code(401).send({ error: "unauthorized" })];
                                    }
                                    req.user = {
                                        uid: decoded.uid,
                                        email: (_b = decoded.email) !== null && _b !== void 0 ? _b : undefined,
                                    };
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, app.register(health_1.healthRoutes)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, app.register(worlds_1.worldsRoutes)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, app.register(pages_1.pagesRoutes)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, app.register(favorites_1.favoritesRoutes)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, app.register(activity_1.activityRoutes)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, app.register(export_1.exportRoutes)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, app.register(invitations_1.invitationsRoutes)];
                case 9:
                    _a.sent();
                    return [2 /*return*/, app];
            }
        });
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var app, port, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, buildServer()];
                case 1:
                    app = _a.sent();
                    port = Number(process.env.PORT || 3001);
                    return [4 /*yield*/, app.listen({ port: port, host: "0.0.0.0" })];
                case 2:
                    _a.sent();
                    app.log.info("API running on http://localhost:".concat(port));
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error(err_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
start();
