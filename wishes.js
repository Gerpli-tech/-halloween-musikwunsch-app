import {AppError,cleanName,db,fail,input,limit,ok,spotify,validTrack} from '../lib/core.js';
export default async function handler(req,res){try{
 const r=db();if(req.method==='GET'){const items=await r.lrange('party:wishes',0,199);return ok(res,{wishes:items||[]});}
 if(req.method!=='POST')throw new AppError('Methode nicht unterstützt.',405);
 await limit(req,'wish',8,3600);const data=input(req);const trackId=data.trackId;if(!validTrack(trackId))throw new AppError('Ungültiger Song.');const name=cleanName(data.name)||'Anonym';const playlist=await r.get('party:playlist');if(!playlist)throw new AppError('Der Veranstalter muss zuerst seine Playlist auswählen.',503);
 // Prevent concurrent duplicate inserts by taking a short per-track lock.
 const lock='party:track:lock:'+trackId;const locked=await r.set(lock,'1',{nx:true,ex:20});if(!locked)throw new AppError('Dieser Song wird gerade eingetragen. Bitte kurz warten.',409);
 try{if(await r.sismember('party:track:ids',trackId))throw new AppError('Dieser Song wurde bereits gewünscht! 🎃',409);
 const song=await spotify('/tracks/'+trackId+'?market=AT');if(!song?.id||song.is_playable===false)throw new AppError('Dieser Song ist nicht verfügbar.',404);
 await spotify('/playlists/'+playlist+'/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uris:['spotify:track:'+trackId]})});
 const wish={id:trackId,title:song.name,artist:(song.artists||[]).map(x=>x.name).join(', '),name,at:new Date().toISOString(),image:song.album?.images?.at(-1)?.url||''};
 // Spotify success precedes list update. If Redis fails, a later retry could duplicate in Spotify.
 await r.sadd('party:track:ids',trackId);await r.lpush('party:wishes',wish);await r.ltrim('party:wishes',0,199);return ok(res,{wish},201);
 }finally{await r.del(lock).catch(()=>{});}
 }catch(e){return fail(res,e);}}
