const crypto = require("crypto");
const { list, put } = require("@vercel/blob");

function sign(v,s){return crypto.createHmac("sha256",s).update(v).digest("base64url")}
function valid(req){
  const secret=process.env.ADMIN_PASSWORD || process.env["MẬT KHẨU QUẢN TRỊ"];
  if(!secret)return false;
  const raw=req.headers.cookie||""; const m=raw.match(/(?:^|; )novas_admin=([^;]+)/);if(!m)return false;
  const [p,sig]=m[1].split(".");if(!p||!sig)return false;
  let payload;try{payload=Buffer.from(p,"base64url").toString()}catch{return false}
  if(sign(payload,secret)!==sig)return false;
  try{return Date.now()-JSON.parse(payload).iat<8*60*60*1000}catch{return false}
}
function hasBlobToken(){return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_RW_TOKEN)}
async function getState(){
  const r=await list({prefix:"novas/data/products.json",limit:1});
  const b=r.blobs?.[0];
  if(!b)return null;
  const res=await fetch(b.url,{cache:"no-store"});
  if(!res.ok)throw new Error("Could not read products state");
  return await res.json();
}
module.exports=async(req,res)=>{
  try{
    if(req.method==="GET"){
      const state=await getState();
      return res.status(200).json({ok:true,exists:!!state,state});
    }
    if(req.method!=="POST")return res.status(405).json({ok:false,error:"Method not allowed"});
    if(!valid(req))return res.status(401).json({ok:false,error:"Unauthorized"});
    if(!hasBlobToken())return res.status(500).json({ok:false,error:"BLOB_READ_WRITE_TOKEN is not configured"});
    const body=typeof req.body==="string"?JSON.parse(req.body):req.body;
    if(!body||!Array.isArray(body.products)||!body.settings) return res.status(400).json({ok:false,error:"Invalid state"});
    const payload=JSON.stringify({products:body.products,settings:body.settings,updatedAt:Date.now()});
    const blob=await put("novas/data/products.json",payload,{
      access:"public",addRandomSuffix:false,contentType:"application/json",
      cacheControlMaxAge:0
    });
    return res.status(200).json({ok:true,url:blob.url});
  }catch(e){
    console.error(e);
    return res.status(500).json({ok:false,error:"Storage error"});
  }
};
