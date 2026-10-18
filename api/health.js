import {ok,ready} from '../lib/core.js';
export default function handler(req,res){return ok(res,{ready:ready()});}
