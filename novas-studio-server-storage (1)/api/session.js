const crypto=require("crypto");
function sign(v,s){return crypto.createHmac("sha256",s).update(v).digest("base64url")}
function valid(req){
  const secret=process.env.ADMIN_PASSWORD || process.env["MẬT KHẨU QUẢN TRỊ"];if(!secret)return false;
  const raw=req.headers.cookie||""; const m=raw.match(/(?:^|; )novas_admin=([^;]+)/);if(!m)return false;
  const [p,sig]=m[1].split(".");if(!p||!sig)return false;
  let payload;try{payload=Buffer.from(p,"base64url").toString()}catch{return false}
  if(sign(payload,secret)!==sig)return false;
  try{return Date.now()-JSON.parse(payload).iat<8*60*60*1000}catch{return false}
}
module.exports=(req,res)=>res.status(200).json({ok:valid(req)});
