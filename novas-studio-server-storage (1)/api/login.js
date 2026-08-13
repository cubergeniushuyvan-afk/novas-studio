const crypto = require("crypto");

function b64(v){return Buffer.from(v).toString("base64url")}
function sign(value, secret){return crypto.createHmac("sha256",secret).update(value).digest("base64url")}
function safeEqual(a,b){
  const A=Buffer.from(a),B=Buffer.from(b);
  return A.length===B.length && crypto.timingSafeEqual(A,B);
}
function cookie(token,maxAge){return `novas_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
module.exports=(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({ok:false,error:"Method not allowed"});
  const secret=process.env.ADMIN_PASSWORD || process.env["MẬT KHẨU QUẢN TRỊ"];
  if(!secret) return res.status(500).json({ok:false,error:"ADMIN_PASSWORD is not configured"});
  let password="";
  try{password=typeof req.body==="string"?JSON.parse(req.body).password:req.body?.password||""}catch{}
  if(!safeEqual(String(password),String(secret))) return res.status(401).json({ok:false,error:"Invalid credentials"});
  const payload=JSON.stringify({iat:Date.now()});
  const token=`${b64(payload)}.${sign(payload,secret)}`;
  res.setHeader("Set-Cookie",cookie(token,60*60*8));
  return res.status(200).json({ok:true});
};
