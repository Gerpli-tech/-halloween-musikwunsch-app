import {AppError,admin,adminCookie,authorizeCode,callbackUrl,clearAdmin,clearOAuth,db,fail,getCookie,input,limit,nonce,ok,passwordGood,requireAdmin,stateCookie} from '../lib/core.js';
export default async function handler(req,res){try{
 const action=req.query.action||'';
 if(req.method==='POST'&&action==='login'){await limit(req,'login',8,600);if(!passwordGood(input(req).password))throw new AppError('Passwort nicht richtig.',401);res.setHeader('Set-Cookie',adminCookie());return ok(res,{success:true});}
 if(req.method==='POST'&&action==='logout'){res.setHeader('Set-Cookie',clearAdmin);return ok(res,{success:true});}
 if(req.method==='GET'&&action==='status'){const manager=admin(req);const connected=manager?!!(await db().get('spotify:auth')):undefined;return ok(res,{admin:manager,connected});}
 if(req.method==='GET'&&action==='connect'){requireAdmin(req);const state=nonce();res.setHeader('Set-Cookie',stateCookie(state));const params=new URLSearchParams({client_id:process.env.SPOTIFY_CLIENT_ID,response_type:'code',redirect_uri:callbackUrl(),scope:'playlist-modify-public playlist-modify-private playlist-read-private',state,show_dialog:'true'});return res.redirect(302,'https://accounts.spotify.com/authorize?'+params);}
 if(req.method==='GET'&&action==='callback'){requireAdmin(req);const received=String(req.query.state||'');if(!received||received!==getCookie(req,'halloween_oauth')||!req.query.code)throw new AppError('Spotify-Anmeldung fehlgeschlagen. Bitte neu verbinden.',400);res.setHeader('Set-Cookie',clearOAuth);await authorizeCode(String(req.query.code));return res.redirect(302,'/?connected=1');}
 throw new AppError('Ungültige Anfrage.',404);
}catch(e){return fail(res,e);}}
