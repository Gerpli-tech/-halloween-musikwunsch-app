import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Redis } from '@upstash/redis';
export class AppError extends Error { constructor(message, status=400){ super(message); this.status=status; } }
let redis;
export function db(){
 if(!process.env.UPSTASH_REDIS_REST_URL||!process.env.UPSTASH_REDIS_REST_TOKEN) throw new AppError('Upstash Redis fehlt in den Vercel-Einstellungen.',503);
 return redis ||= new Redis({url:process.env.UPSTASH_REDIS_REST_URL,token:process.env.UPSTASH_REDIS_REST_TOKEN});
}
export function ready(){return ['SPOTIFY_CLIENT_ID','SPOTIFY_CLIENT_SECRET','APP_URL','ADMIN_PASSWORD','SESSION_SECRET','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'].every(x=>!!process.env[x]);}
export function ok(res, data, status=200){res.setHeader('Cache-Control','no-store');return res.status(status).json(data);}
export function fail(res,e){console.error(e?.message||e);return ok(res,{error:e instanceof AppError?e.message:'Interner Fehler. Bitte später versuchen.'},e instanceof AppError?e.status:500);}
export function input(req){if(typeof req.body==='string'){try{return JSON.parse(req.body);}catch{throw new AppError('Ungültige Anfrage.');}}return req.body||{};}
export function getCookie(req,k){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(k+'='))?.slice(k.length+1)||'';}
function hmac(v){return createHmac('sha256',process.env.SESSION_SECRET||'').update(v).digest('hex');}
export function admin(req){if(!process.env.SESSION_SECRET)return false;const [expiry,sig]=getCookie(req,'halloween_admin').split('.');if(!/^\d+$/.test(expiry||'')||!/^[a-f0-9]{64}$/.test(sig||''))return false; if(+expiry<Date.now()||+expiry>Date.now()+8*86400000)return false;return timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(hmac(expiry),'hex'));}
export function requireAdmin(req){if(!admin(req))throw new AppError('Bitte als Veranstalter anmelden.',401);}
export function passwordGood(s){if(typeof s!=='string'||!process.env.ADMIN_PASSWORD)return false;let a=createHmac('sha256','password').update(s).digest();let b=createHmac('sha256','password').update(process.env.ADMIN_PASSWORD).digest();return timingSafeEqual(a,b);}
export function adminCookie(){const exp=String(Date.now()+7*86400000);return `halloween_admin=${exp}.${hmac(exp)}; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax`;}
export const clearAdmin='halloween_admin=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax';
export const clearOAuth='halloween_oauth=; Max-Age=0; Path=/api/auth; HttpOnly; Secure; SameSite=Lax';
export const stateCookie=s=>`halloween_oauth=${s}; Max-Age=600; Path=/api/auth; HttpOnly; Secure; SameSite=Lax`;
export const nonce=()=>randomBytes(24).toString('hex');
export function baseUrl(){const u=(process.env.APP_URL||'').replace(/\/+$/,'');if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(u))throw new AppError('APP_URL muss die HTTPS-Vercel-Adresse sein.',503);return u;}
export const callbackUrl=()=>baseUrl()+'/api/auth?action=callback';
export function playlistId(s){if(typeof s!=='string')return null;const x=s.trim();if(/^[a-zA-Z0-9]{22}$/.test(x))return x;let m=x.match(/^spotify:playlist:([a-zA-Z0-9]{22})$/)||x.match(/^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]{22})(?:[?#].*)?\/?$/);return m?.[1]||null;}
export const validTrack=s=>typeof s==='string'&&/^[A-Za-z0-9]{22}$/.test(s);
export const cleanName=s=>typeof s==='string'?s.replace(/[\x00-\x1f\x7f<>]/g,'').trim().slice(0,30):'';
export async function limit(req,type,max,seconds){let ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim().replace(/[^a-zA-Z0-9.:_-]/g,'').slice(0,90);const key=`limit:${type}:${ip}:${Math.floor(Date.now()/seconds/1000)}`;const n=await db().incr(key);if(n===1)await db().expire(key,seconds+5);if(n>max)throw new AppError('Zu viele Anfragen. Bitte später erneut versuchen.',429);}
async function tokenRequest(values){const response=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.SPOTIFY_CLIENT_ID+':'+process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(values)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new AppError('Spotify-Anmeldung konnte nicht abgeschlossen werden.',502);return data;}
export async function authorizeCode(code){const t=await tokenRequest({grant_type:'authorization_code',code,redirect_uri:callbackUrl()});if(!t.access_token||!t.refresh_token)throw new AppError('Spotify-Tokens fehlen.',502);await db().set('spotify:auth',{access:t.access_token,refresh:t.refresh_token,until:Date.now()+t.expires_in*1000});}
export async function token(force=false){const r=db();let state=await r.get('spotify:auth');if(!state?.refresh)throw new AppError('Spotify ist noch nicht verbunden.',503);if(!force&&state.access&&Date.now()<state.until-90000)return state.access;
 const acquired=await r.set('spotify:refresh:lock','1',{nx:true,ex:12});if(!acquired){for(let i=0;i<15;i++){await new Promise(resolve=>setTimeout(resolve,250));const updated=await r.get('spotify:auth');if(updated?.access&&updated.access!==state.access&&Date.now()<updated.until-90000)return updated.access;}throw new AppError('Spotify aktualisiert die Verbindung. Bitte erneut probieren.',503);}
 try{state=await r.get('spotify:auth');if(!force&&state?.access&&Date.now()<state.until-90000)return state.access;const fresh=await tokenRequest({grant_type:'refresh_token',refresh_token:state.refresh});await r.set('spotify:auth',{access:fresh.access_token,refresh:fresh.refresh_token||state.refresh,until:Date.now()+fresh.expires_in*1000});return fresh.access_token;}finally{await r.del('spotify:refresh:lock').catch(()=>{});}}
export async function spotify(path,opts={}){async function request(t){return fetch('https://api.spotify.com/v1'+path,{...opts,headers:{Authorization:'Bearer '+t,...opts.headers}});}let response=await request(await token());if(response.status===401)response=await request(await token(true));if(!response.ok){if(response.status===403)throw new AppError('Spotify verweigert den Zugriff. Berechtigungen prüfen.',403);if(response.status===404)throw new AppError('Spotify-Song oder Playlist nicht gefunden.',404);if(response.status===429)throw new AppError('Spotify-Limit erreicht. Bitte später erneut versuchen.',429);throw new AppError('Spotify-Fehler: '+response.status,502);}return response.status===204?{}:response.json();}
