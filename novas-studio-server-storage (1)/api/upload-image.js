const crypto = require("crypto");
const { put } = require("@vercel/blob");

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
function parseDataUrl(v){
  const m=String(v||"").match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
  if(!m)return null;
  return {type:m[1].toLowerCase().replace("jpg","jpeg"),data:Buffer.from(m[2],"base64")};
}
module.exports=async(req,res)=>{
  try{
    if(req.method!=="POST")return res.status(405).json({ok:false,error:"Method not allowed"});
    if(!valid(req))return res.status(401).json({ok:false,error:"Unauthorized"});
    const body=typeof req.body==="string"?JSON.parse(req.body):req.body;
    const parsed=parseDataUrl(body?.data);
    if(!parsed)return res.status(400).json({ok:false,error:"Invalid image"});
    if(parsed.data.length>2*1024*1024)return res.status(413).json({ok:false,error:"Image exceeds 2MB"});
    const ext=parsed.type.split("/")[1];
    const name=String(body?.name||"image").replace(/[^a-zA-Z0-9._-]/g,"-").slice(0,80)||"image";
    const blob=await put(`novas/images/${Date.now()}-${crypto.randomBytes(5).toString("hex")}-${name}.${ext}`,parsed.data,{
      access:"public",addRandomSuffix:false,contentType:parsed.type
    });
    return res.status(200).json({ok:true,url:blob.url});
  }catch(e){
    console.error(e);
    return res.status(500).json({ok:false,error:"Upload failed"});
  }
};
