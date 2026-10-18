import {AppError,db,fail,input,ok,playlistId,requireAdmin,spotify} from '../lib/core.js';
export default async function handler(req,res){try{
 requireAdmin(req);
 if(req.method==='GET'){const id=await db().get('party:playlist');return ok(res,{playlistId:id||''});}
 if(req.method==='POST'){const id=playlistId(input(req).url);if(!id)throw new AppError('Bitte gültigen Spotify-Playlist-Link eingeben.');const list=await spotify('/playlists/'+id+'?fields=id,name,owner(id),collaborative');const me=await spotify('/me');if(list.owner?.id!==me.id&&!list.collaborative)throw new AppError('Diese Playlist gehört nicht deinem Spotify-Konto.');await db().set('party:playlist',id);return ok(res,{playlistId:id,name:list.name});}
 throw new AppError('Methode nicht unterstützt.',405);
}catch(e){return fail(res,e);}}
