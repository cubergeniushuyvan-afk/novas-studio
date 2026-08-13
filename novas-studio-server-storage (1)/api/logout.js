module.exports=(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({ok:false});
  res.setHeader("Set-Cookie","novas_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  res.status(200).json({ok:true});
};
