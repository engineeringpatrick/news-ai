"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARTESIA_API_KEY = exports.OPENAI_API_KEY = exports.NEWSAPI_KEY = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.PORT = process.env.PORT || 4000;
exports.NEWSAPI_KEY = process.env.NEWSAPI_KEY;
exports.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
exports.CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
if (!exports.NEWSAPI_KEY)
    console.warn('WARN: NEWSAPI_KEY missing');
if (!exports.OPENAI_API_KEY)
    console.warn('WARN: OPENAI_API_KEY missing');
if (!exports.CARTESIA_API_KEY)
    console.warn('WARN: CARTESIA_API_KEY missing');
