import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 4000;
export const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;

if (!NEWSAPI_KEY) console.warn('WARN: NEWSAPI_KEY missing');
if (!OPENAI_API_KEY) console.warn('WARN: OPENAI_API_KEY missing');
if (!CARTESIA_API_KEY) console.warn('WARN: CARTESIA_API_KEY missing');
