const defaultSectors = [
  {id:1,name:"Invernadero",moisture:32,threshold:40},
  {id:2,name:"Hortalizas",moisture:58,threshold:35},
  {id:3,name:"Frutales",moisture:24,threshold:30}
];
let sectors = JSON.parse(localStorage.getItem("agrosense-sectors") || "null") || defaultSectors;
let lastAlert = {};
const $ = id => document.getElementById(id);
function save(){localStorage.setItem("agrosense-sectors",JSON.stringify(sectors))}
function statusFor(s){return s.moisture < s.threshold ? "low" : s.moisture < s.threshold+10 ? "warn" : "good"}
function labelFor(status){return status==="low"?"Humedad baja":status==="warn"?"Atención":"Nivel adecuado"}
function render(){
  $("sectors").innerHTML = sectors.map(s=>{
    const st=statusFor(s);
    return `<article class="sector">
      <div class="sector-head"><h3>${escapeHtml(s.name)}</h3><span class="status ${st}">${labelFor(st)}</span></div>
      <div class="reading">${s.moisture}<small>% humedad</small></div>
      <div class="meter"><span class="${st==="low"?"lowbar":""}" style="width:${s.moisture}%"></span></div>
      <div class="threshold"><label for="threshold-${s.id}">Umbral mínimo</label><strong>${s.threshold}%</strong></div>
      <input id="threshold-${s.id}" type="range" min="10" max="80" value="${s.threshold}" aria-label="Umbral de ${escapeHtml(s.name)}" data-threshold="${s.id}">
      <div class="sector-actions"><button class="secondary" data-water="${s.id}">Simular riego</button><button class="secondary" data-rename="${s.id}">Cambiar nombre</button></div>
    </article>`;
  }).join("");
  document.querySelectorAll("[data-threshold]").forEach(el=>el.addEventListener("input",e=>{
    const s=sectors.find(x=>x.id===Number(e.target.dataset.threshold));s.threshold=Number(e.target.value);save();render();checkAlerts();
  }));
  document.querySelectorAll("[data-water]").forEach(el=>el.addEventListener("click",()=>{
    const s=sectors.find(x=>x.id===Number(el.dataset.water));s.moisture=Math.min(100,s.moisture+20);save();addHistory(`Riego simulado en ${s.name}: ${s.moisture}%`);render();checkAlerts();
  }));
  document.querySelectorAll("[data-rename]").forEach(el=>el.addEventListener("click",()=>{
    const s=sectors.find(x=>x.id===Number(el.dataset.rename));const name=prompt("Nuevo nombre del sector:",s.name);
    if(name&&name.trim()){s.name=name.trim().slice(0,35);save();render()}
  }));
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function addHistory(msg){const li=document.createElement("li");li.textContent=new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})+" · "+msg;$("history").prepend(li);while($("history").children.length>8)$("history").lastChild.remove()}
function checkAlerts(){
  sectors.forEach(s=>{
    if(s.moisture<s.threshold && lastAlert[s.id]!==s.moisture){
      addHistory(`ALERTA: ${s.name} está bajo el umbral (${s.moisture}% / mínimo ${s.threshold}%).`);
      lastAlert[s.id]=s.moisture;
      if("Notification" in window && Notification.permission==="granted"){
        new Notification("AgroSense: humedad baja",{body:`${s.name}: ${s.moisture}% (mínimo ${s.threshold}%).`});
      }
    }
    if(s.moisture>=s.threshold)delete lastAlert[s.id];
  });
}
$("addSector").addEventListener("click",()=>{
  const name=prompt("Nombre del nuevo sector:");if(!name||!name.trim())return;
  sectors.push({id:Date.now(),name:name.trim().slice(0,35),moisture:50,threshold:35});save();render();addHistory(`Sector ${name.trim()} agregado.`);
});
$("simulate").addEventListener("click",()=>{
  sectors.forEach(s=>s.moisture=Math.max(5,Math.min(95,s.moisture+Math.round(Math.random()*30-18))));
  save();render();checkAlerts();addHistory("Se actualizaron las lecturas simuladas.");
});
$("enableNotifications").addEventListener("click",async()=>{
  const out=$("notificationStatus");
  if(!("Notification" in window)){out.textContent="Este navegador no permite notificaciones.";return}
  const permission=await Notification.requestPermission();
  out.textContent=permission==="granted"?"Permiso concedido. Recibirás avisos de prueba mientras la app esté activa.":permission==="denied"?"Permiso denegado. Puedes cambiarlo en los ajustes del navegador/iPhone.":"No se concedió el permiso.";
  if(permission==="granted")new Notification("AgroSense",{body:"Notificaciones de prueba activadas."});
});
if("serviceWorker" in navigator && location.protocol!=="file:"){navigator.serviceWorker.register("./sw.js").catch(()=>{});}
render();checkAlerts();addHistory("Aplicación iniciada en modo demostración.");
