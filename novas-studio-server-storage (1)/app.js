const ADMIN_AUTH_ENDPOINT="/api/login";
const DEFAULT_SETTINGS={school:70000,business:100000,creative:100000,siteBadge:"PRESENTATION, REIMAGINED",siteTitle:"Ý tưởng đẹp hơn|khi được trình bày|đúng cách."};
const names={school:"HỌC TẬP",business:"DOANH NGHIỆP",creative:"SÁNG TẠO"};
const defaults=[
{id:1,title:"Blue Thesis",cat:"school",price:70000,desc:"Seminar, báo cáo và thuyết trình học tập — sáng, rõ và dễ chỉnh.",tags:["thuyết trình","học tập"],badge:"BEST SELLER",featured:true,visible:true,created:1,images:[],cls:"v1"},
{id:2,title:"Business Pitch",cat:"business",price:100000,desc:"Pitch deck, proposal và giới thiệu doanh nghiệp chuyên nghiệp.",tags:["pitch","company"],badge:"PRO",featured:true,visible:true,created:2,images:[],cls:"v2"},
{id:3,title:"Creative Mood",cat:"creative",price:100000,desc:"Concept, campaign và portfolio giàu hình ảnh.",tags:["creative","portfolio"],badge:"NEW",featured:false,visible:true,created:3,images:[],cls:"v3"},
{id:4,title:"Study Notes",cat:"school",price:70000,desc:"Bộ slide tối giản cho bài học và dự án.",tags:["notes","school"],badge:"",featured:false,visible:true,created:4,images:[],cls:"v4"},
{id:5,title:"Company Profile",cat:"business",price:100000,desc:"Hồ sơ doanh nghiệp với bố cục hiện đại, dễ trình bày.",tags:["profile","business"],badge:"",featured:false,visible:true,created:5,images:[],cls:"v5"},
{id:6,title:"Visual Story",cat:"creative",price:100000,desc:"Kể chuyện bằng hình ảnh với typography nổi bật.",tags:["visual","story"],badge:"",featured:false,visible:true,created:6,images:[],cls:"v6"}];
let products=JSON.parse(localStorage.getItem("novas_products_v4")||"null")||defaults.map(x=>({...x}));
let settings=JSON.parse(localStorage.getItem("novas_settings_v4")||"null")||{...DEFAULT_SETTINGS};
let active="all",sortMode="featured",editId=null,editingImages=[];
let adminAuthenticated=false, serverStateExists=false, serverStateLoaded=false;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat("vi-VN").format(Number(n)||0)+"đ";
const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1900)}
async function save(){
  try{
    localStorage.setItem("novas_products_v4",JSON.stringify(products));
    localStorage.setItem("novas_settings_v4",JSON.stringify(settings));
    if($("#saveState"))$("#saveState").textContent=adminAuthenticated?"Đang đồng bộ lên server…":"✓ Đã lưu trên thiết bị";
    if(!adminAuthenticated)return true;
    const r=await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
      body:JSON.stringify({products,settings})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok)throw new Error(d.error||"sync failed");
    serverStateExists=true;
    if($("#saveState"))$("#saveState").textContent="✓ Đã lưu trên server";
    return true;
  }catch(e){
    if($("#saveState"))$("#saveState").textContent="⚠ Chưa đồng bộ server";
    toast("Không đồng bộ được server — kiểm tra Vercel Blob");
    return false;
  }
}
async function loadServerState(){
  try{
    const r=await fetch("/api/products",{credentials:"same-origin",cache:"no-store"});
    const d=await r.json();
    if(r.ok&&d.ok){
      serverStateExists=!!d.exists;
      if(d.state?.products){
        products=d.state.products;
        settings={...DEFAULT_SETTINGS,...(d.state.settings||{})};
        serverStateLoaded=true;
        localStorage.setItem("novas_products_v4",JSON.stringify(products));
        localStorage.setItem("novas_settings_v4",JSON.stringify(settings));
        updateLabels();render();
      }
    }
  }catch(e){/* keep local fallback */}
}
function productImages(p){return Array.isArray(p.images)?p.images:(p.image?[p.image]:[])}
function visual(p){const imgs=productImages(p);const bg=imgs[0]?`style="background-image:url('${imgs[0]}')"`:"";return `<div class="visual ${p.cls||"v1"} ${imgs.length?"has-photo":""}" ${bg}><div class="visual-shade"></div><div class="visual-top"><small>${names[p.cat]}</small>${p.badge?`<b>${esc(p.badge)}</b>`:""}</div><span class="price">${money(p.price)}</span><h3>${esc(p.title).replace(/\s+/g,"<br>")}</h3>${imgs.length>1?`<span class="photo-count">▧ ${imgs.length} ảnh</span>`:""}</div>`}
function render(){let q=$("#search").value.trim().toLowerCase();let list=products.filter(p=>p.visible!==false&&(active==="all"||p.cat===active)&&(!q||[p.title,p.desc,p.badge,...(p.tags||[])].join(" ").toLowerCase().includes(q)));if(sortMode==="priceAsc")list.sort((a,b)=>a.price-b.price);if(sortMode==="priceDesc")list.sort((a,b)=>b.price-a.price);if(sortMode==="newest")list.sort((a,b)=>b.created-a.created);if(sortMode==="featured")list.sort((a,b)=>Number(b.featured)-Number(a.featured)||b.created-a.created);$("#products").innerHTML=list.map(p=>`<article class="product reveal-card" onclick="showProduct(${p.id})">${visual(p)}<div class="product-info"><div class="product-meta"><span>${names[p.cat]}</span>${p.featured?"<i>✦ Nổi bật</i>":""}</div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><div class="mini-tags">${(p.tags||[]).slice(0,3).map(t=>`<span>#${esc(t)}</span>`).join("")}</div></div></article>`).join("");$("#emptyState").classList.toggle("hidden",!list.length);$("#resultCount").textContent=`${list.length} mẫu`}
let galleryIndex=0, galleryImages=[];
function setGallery(i){
  if(!galleryImages.length)return;
  galleryIndex=(i+galleryImages.length)%galleryImages.length;
  $$('.gallery-img').forEach((x,j)=>x.classList.toggle('active',j===galleryIndex));
  $$('.gallery-dots button').forEach((x,j)=>x.classList.toggle('active',j===galleryIndex));
  const c=$("#galleryCounter"); if(c)c.textContent=`${galleryIndex+1} / ${galleryImages.length}`;
}
window.showProduct=id=>{
  const p=products.find(x=>x.id===id);if(!p)return;
  galleryImages=productImages(p); galleryIndex=0;
  const g=$("#modalGallery");
  g.innerHTML=galleryImages.length?galleryImages.map((im,i)=>`<img class="gallery-img ${i===0?"active":""}" src="${im}" data-i="${i}" alt="${esc(p.title)} — ảnh ${i+1}">`):`<div class="gallery-empty ${p.cls}">NOVAS<br><b>${esc(p.title)}</b></div>`;
  $("#galleryDots").innerHTML=galleryImages.map((_,i)=>`<button aria-label="Xem ảnh ${i+1}" class="${i===0?"active":""}" data-i="${i}"></button>`).join("");
  const counter=$("#galleryCounter"); if(counter)counter.textContent=galleryImages.length?`1 / ${galleryImages.length}`:"1 / 1";
  $("#galleryPrev").style.display=galleryImages.length>1?"grid":"none";
  $("#galleryNext").style.display=galleryImages.length>1?"grid":"none";
  $("#modalCat").textContent=names[p.cat];$("#modalBadge").textContent=p.badge||"";$("#modalTitle").textContent=p.title;$("#modalDesc").textContent=p.desc;$("#modalPrice").textContent=money(p.price);$("#modalTags").innerHTML=(p.tags||[]).map(t=>`<span>#${esc(t)}</span>`).join("");
  $("#modalContact").onclick=e=>{e.preventDefault();openContact(p.title)};
  $("#modalFavorite").onclick=()=>{let fav=JSON.parse(localStorage.getItem("novas_favorites_v1")||"[]");fav.includes(p.id)?fav=fav.filter(x=>x!==p.id):fav.push(p.id);localStorage.setItem("novas_favorites_v1",JSON.stringify(fav));$("#modalFavorite").classList.toggle("active",fav.includes(p.id));toast(fav.includes(p.id)?"♡ Đã thêm vào yêu thích":"Đã bỏ yêu thích")};
  const fav=JSON.parse(localStorage.getItem("novas_favorites_v1")||"[]");$("#modalFavorite").classList.toggle("active",fav.includes(p.id));
  $("#modalShare").onclick=async()=>{const url=location.href.split("#")[0]+`#product-${p.id}`;try{await navigator.clipboard.writeText(url);toast("↗ Đã sao chép liên kết mẫu")}catch{toast("Hãy sao chép liên kết trên thanh địa chỉ")}};
  $("#productModal").classList.add("open");
  $$('.gallery-dots button').forEach(b=>b.onclick=()=>setGallery(+b.dataset.i));
};
$("#galleryPrev").onclick=()=>setGallery(galleryIndex-1);
$("#galleryNext").onclick=()=>setGallery(galleryIndex+1);
function openContact(productName="mẫu thiết kế"){$("#contactProduct").textContent=productName;$("#contactProductBottom").textContent=productName;$("#contactModal").classList.add("open")}
$("#contactClose").onclick=()=>$("#contactModal").classList.remove("open");
$("#contactModal").onclick=e=>{if(e.target.id==="contactModal")$("#contactModal").classList.remove("open")};
$$('.filter').forEach(b=>b.onclick=()=>{$$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');active=b.dataset.cat;render()});$("#search").oninput=render;$$('.quick-tools button').forEach(b=>b.onclick=()=>{sortMode=b.dataset.sort;render()});$("#modalClose").onclick=()=>$("#productModal").classList.remove("open");$("#productModal").onclick=e=>{if(e.target.id==="productModal")$("#productModal").classList.remove("open")};
$("#adminReveal").onclick=()=>$("#adminSecret").classList.toggle("show");
async function openAdmin(){
  const pass=$("#secretPass").value;
  if(!pass){toast("Nhập mật khẩu quản trị");return}
  const btn=$("#secretLogin"); btn.disabled=true;
  try{
    const r=await fetch(ADMIN_AUTH_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pass}),credentials:"same-origin"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok) throw new Error("bad");
    adminAuthenticated=true;
    const sr=await fetch("/api/products",{credentials:"same-origin",cache:"no-store"});
    const sd=await sr.json().catch(()=>({}));
    if(sr.ok&&sd.ok&&sd.state?.products){
      products=sd.state.products;
      settings={...DEFAULT_SETTINGS,...(sd.state.settings||{})};
      serverStateExists=true;
      localStorage.setItem("novas_products_v4",JSON.stringify(products));
      localStorage.setItem("novas_settings_v4",JSON.stringify(settings));
      updateLabels();render();
    }else if(sr.ok&&sd.ok&&!sd.exists){
      await save();
    }
    $("#adminSecret").classList.remove("show");$("#secretPass").value="";$("#adminPanel").classList.add("open");renderAdmin();toast("✓ Control Room đã mở");
  }catch(e){toast("Mật khẩu không đúng")}
  finally{btn.disabled=false}
}
$("#secretLogin").onclick=openAdmin;
$("#secretPass").addEventListener("keydown",e=>{if(e.key==="Enter")openAdmin()});
$("#adminClose").onclick=()=>$("#adminPanel").classList.remove("open");
function renderAdmin(){let total=products.length,shown=products.filter(p=>p.visible!==false).length,photos=products.reduce((n,p)=>n+productImages(p).length,0);$("#adminList").innerHTML=`<div class="admin-dashboard"><div class="admin-stat"><small>TỔNG MẪU</small><strong>${total}</strong></div><div class="admin-stat"><small>ĐANG HIỆN</small><strong>${shown}</strong></div><div class="admin-stat"><small>TỔNG ẢNH</small><strong>${photos}</strong></div><div class="admin-stat"><small>NỔI BẬT</small><strong>${products.filter(p=>p.featured).length}</strong></div></div><div class="settings-box"><div><b>Giá mặc định theo danh mục</b><small>Chỉ áp dụng khi tạo mẫu mới; giá từng mẫu vẫn chỉnh riêng.</small></div><div class="price-settings"><label>Học tập<input id="setSchool" type="number" value="${settings.school}"></label><label>Doanh nghiệp<input id="setBusiness" type="number" value="${settings.business}"></label><label>Sáng tạo<input id="setCreative" type="number" value="${settings.creative}"></label><button class="admin-btn primary" id="saveSettings">Lưu giá</button></div></div><div class="admin-list-head"><b>Danh sách sản phẩm</b><small>Chọn Sửa để mở trình chỉnh sửa chuyên sâu.</small></div>`+products.map((p,i)=>`<div class="admin-row"><div class="admin-thumb">${productImages(p)[0]?`<img src="${productImages(p)[0]}">`:"NOVAS"}<em>${productImages(p).length||0}</em></div><div class="admin-row-main"><strong>${esc(p.title)}</strong><span>${names[p.cat]} · ${money(p.price)} · ${(p.tags||[]).length} tag · ${p.featured?"★ Nổi bật":"Thường"} · ${p.visible===false?"Ẩn":"Hiện"}</span></div><button onclick="moveProduct(${p.id},-1)">↑</button><button onclick="moveProduct(${p.id},1)">↓</button><button onclick="editProduct(${p.id})">Sửa sâu</button><button onclick="toggleProduct(${p.id})">${p.visible===false?"Hiện":"Ẩn"}</button><button class="danger" onclick="deleteProduct(${p.id})">Xóa</button></div>`).join("");$("#saveSettings").onclick=()=>{settings.school=+$("#setSchool").value||0;settings.business=+$("#setBusiness").value||0;settings.creative=+$("#setCreative").value||0;save();updateLabels();toast("✓ Đã cập nhật giá mặc định")}}
function updateLabels(){$(".school-label").textContent=Math.round(settings.school/1000)+"K";$(".business-label").textContent=Math.round(settings.business/1000)+"K";$(".creative-label").textContent=Math.round(settings.creative/1000)+"K"}
window.moveProduct=(id,d)=>{let i=products.findIndex(p=>p.id===id),j=i+d;if(j<0||j>=products.length)return;[products[i],products[j]]=[products[j],products[i]];products.forEach((p,k)=>p.created=k+1);save();render();renderAdmin()};window.toggleProduct=id=>{let p=products.find(x=>x.id===id);p.visible=p.visible===false;save();render();renderAdmin()};window.deleteProduct=id=>{if(confirm("Xóa vĩnh viễn mẫu này?")){products=products.filter(p=>p.id!==id);save();render();renderAdmin();toast("Đã xóa")}};
function formHTML(p={title:"",cat:"school",price:null,desc:"",tags:[],badge:"",featured:false,visible:true,cls:"v1",images:[]}){editId=p.id||null;editingImages=productImages(p).slice();let price=p.price??(p.cat==="school"?settings.school:100000);return `<div class="editor" id="editor"><div class="editor-head"><div><div class="eyebrow">PRODUCT EDITOR</div><h3>${editId?"Chỉnh sửa":"Tạo mới"} mẫu</h3></div><button onclick="closeEditor()">×</button></div><div class="editor-grid"><label>Tên mẫu<input id="eTitle" value="${esc(p.title)}" placeholder="Ví dụ: Aurora Thesis"></label><label>Danh mục<select id="eCat"><option value="school" ${p.cat==="school"?"selected":""}>Học tập</option><option value="business" ${p.cat==="business"?"selected":""}>Doanh nghiệp</option><option value="creative" ${p.cat==="creative"?"selected":""}>Sáng tạo</option></select></label><label>Giá bán (VNĐ)<input id="ePrice" type="number" min="0" step="1000" value="${price}"></label><label>Nhãn nhỏ<input id="eBadge" value="${esc(p.badge)}" placeholder="NEW / PRO / BEST SELLER"></label><label>Phong cách card<select id="eCls"><option value="v1">Ocean Glow</option><option value="v2">Deep Blue</option><option value="v3">Aqua Pastel</option><option value="v4">Mint Wave</option><option value="v5">Sky Glass</option><option value="v6">Midnight</option></select></label><label>Tag, cách nhau bằng dấu phẩy<input id="eTags" value="${esc((p.tags||[]).join(", "))}" placeholder="toán, thuyết trình, powerpoint"></label><label class="wide">Mô tả<textarea id="eDesc" rows="4">${esc(p.desc)}</textarea></label><label class="check"><input id="eFeatured" type="checkbox" ${p.featured?"checked":""}> Đưa lên nhóm nổi bật</label><label class="check"><input id="eVisible" type="checkbox" ${p.visible!==false?"checked":""}> Hiển thị với khách</label><div class="upload-zone wide" id="uploadZone"><input id="imageInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple><div class="upload-content"><div class="upload-icon">＋</div><strong>Thả nhiều ảnh cùng lúc</strong><span>Chọn 1 hoặc hàng chục ảnh · JPG, PNG, WEBP · mỗi ảnh tối đa 2MB</span></div></div><div class="image-grid wide" id="imageGrid"></div></div><div class="editor-foot"><button class="admin-btn" onclick="closeEditor()">Hủy</button><button class="admin-btn primary" onclick="saveEditor()">✓ Lưu tất cả thay đổi</button></div></div>`}
function setupUploader(){const z=$("#uploadZone"),input=$("#imageInput");const addFiles=files=>{[...files].forEach(file=>{if(!file.type.startsWith("image/"))return;if(file.size>2*1024*1024){toast(`${file.name}: vượt 2MB`);return}const r=new FileReader();r.onload=()=>{editingImages.push(r.result);renderImageGrid()};r.readAsDataURL(file)})};z.onclick=()=>input.click();input.onchange=e=>addFiles(e.target.files);z.ondragover=e=>{e.preventDefault();z.classList.add("dragover")};z.ondragleave=()=>z.classList.remove("dragover");z.ondrop=e=>{e.preventDefault();z.classList.remove("dragover");addFiles(e.dataTransfer.files)};renderImageGrid()}
function renderImageGrid(){const g=$("#imageGrid");if(!g)return;g.innerHTML=editingImages.map((im,i)=>`<div class="image-edit"><img src="${im}"><span>#${i+1}</span><button onclick="removeEditImage(${i})">×</button><button onclick="moveEditImage(${i},-1)">←</button><button onclick="moveEditImage(${i},1)">→</button></div>`).join("")}
window.removeEditImage=i=>{editingImages.splice(i,1);renderImageGrid()};window.moveEditImage=(i,d)=>{let j=i+d;if(j<0||j>=editingImages.length)return;[editingImages[i],editingImages[j]]=[editingImages[j],editingImages[i]];renderImageGrid()};window.closeEditor=()=>{$("#editor")?.remove();editId=null;editingImages=[]};
window.editProduct=id=>{let p=products.find(x=>x.id===id);$("#editor")?.remove();$("#adminList").insertAdjacentHTML("afterbegin",formHTML(p));$("#eCls").value=p.cls||"v1";setupUploader();$("#editor").scrollIntoView({behavior:"smooth",block:"center"})};
window.saveEditor=async()=>{
  const btn=$(".editor-foot .admin-btn.primary"); if(btn){btn.disabled=true;btn.textContent="Đang tải lên…"}
  try{
    let p=editId?products.find(x=>x.id===editId):{id:Date.now(),created:Date.now(),visible:true,featured:false};
    p.title=$("#eTitle").value.trim()||"Mẫu mới";p.cat=$("#eCat").value;p.price=Math.max(0,+$("#ePrice").value||0);
    p.desc=$("#eDesc").value.trim()||"Template được thiết kế bởi Novas Studio.";p.badge=$("#eBadge").value.trim().slice(0,24);
    p.tags=$("#eTags").value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,12);p.featured=$("#eFeatured").checked;p.visible=$("#eVisible").checked;p.cls=$("#eCls").value;
    const finalImages=[];
    for(const im of editingImages){
      if(typeof im==="string"&&im.startsWith("data:image/")){
        const r=await fetch("/api/upload-image",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
          body:JSON.stringify({data:im,name:p.title||"novas-image"})});
        const d=await r.json().catch(()=>({}));
        if(!r.ok||!d.ok)throw new Error(d.error||"image upload failed");
        finalImages.push(d.url);
      }else if(im) finalImages.push(im);
    }
    p.images=finalImages;delete p.image;
    if(!editId)products.unshift(p);
    const ok=await save();
    if(!ok)throw new Error("server sync failed");
    closeEditor();render();renderAdmin();toast("✓ Đã lưu sản phẩm lên server");
  }catch(e){toast("Lưu thất bại: "+(e.message||"hãy kiểm tra Blob"))}
  finally{if(btn){btn.disabled=false;btn.textContent="✓ Lưu tất cả thay đổi"}}
};
$("#addBtn").onclick=()=>{$("#editor")?.remove();$("#adminList").insertAdjacentHTML("afterbegin",formHTML());$("#eCls").value="v1";setupUploader();$("#editor").scrollIntoView({behavior:"smooth",block:"center"})};
$("#resetBtn").onclick=()=>{if(confirm("Khôi phục 6 mẫu mặc định và xóa các mẫu hiện tại?")){products=defaults.map(x=>({...x,images:[]}));settings={...DEFAULT_SETTINGS};save();render();renderAdmin();updateLabels();toast("Đã khôi phục")}};
$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({settings,products},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="novas-backup.json";a.click();URL.revokeObjectURL(a.href);toast("✓ Đã xuất backup")};$("#importInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.products))throw 0;products=d.products;settings={...DEFAULT_SETTINGS,...(d.settings||{})};save();render();renderAdmin();updateLabels();toast("✓ Đã nhập backup")}catch{toast("File backup không hợp lệ")}};r.readAsText(f)};
window.addEventListener("scroll",()=>$("#progress").style.width=(scrollY/(document.documentElement.scrollHeight-innerHeight)*100)+"%");document.addEventListener("mousemove",e=>{const g=$(".cursor-glow");g.style.left=e.clientX+"px";g.style.top=e.clientY+"px"});
updateLabels();render();
loadServerState();

document.addEventListener("keydown",e=>{
  if($("#productModal").classList.contains("open")){
    if(e.key==="ArrowLeft")setGallery(galleryIndex-1);
    if(e.key==="ArrowRight")setGallery(galleryIndex+1);
    if(e.key==="Escape")$("#productModal").classList.remove("open");
  }
  if(e.key==="Escape"&&$("#contactModal").classList.contains("open"))$("#contactModal").classList.remove("open");
});
