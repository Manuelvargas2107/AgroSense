const SERVICE_UUID = "7b6e0001-8f4a-4c2a-9b1e-5d6f7a8b9000";
const HUMIDITY_UUID = "7b6e0002-8f4a-4c2a-9b1e-5d6f7a8b9000";
const STORAGE_KEY = "agrosense.sectors.v1";
let sectors = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [
  {id: crypto.randomUUID(), name:"Invernadero norte", crop:"Tomates", threshold:35, humidity:null, sensorName:"", connected:false, simulated:false},
  {id: crypto.randomUUID(), name:"Parcela 2", crop:"Lechugas", threshold:40, humidity:null, sensorName:"", connected:false, simulated:false},
  {id: crypto.randomUUID(), name:"Sector sur", crop:"Pimientos", threshold:30, humidity:null, sensorName:"", connected:false, simulated:false}
];
const $ = id => document.getElementById(id);
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(sectors)); }
function toast(message){ const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); }
function statusOf(s){ if(s.humidity===null) return ["Sin lectura","warn"]; return s.humidity < s.threshold ? ["Revisar riego","danger"] : ["Humedad adecuada","good"]; }
function render(){
  $("sectorCount").textContent=sectors.length;
  $("alertCount").textContent=sectors.filter(s=>s.humidity!==null && s.humidity<s.threshold).length;
  $("connectedCount").textContent=sectors.filter(s=>s.connected).length;
  $("sectorList").innerHTML="";
  if(!sectors.length){ $("sectorList").innerHTML='<p class="muted">Aún no hay sectores. Crea el primero.</p>'; return; }
  sectors.forEach(s=>{
    const [label,cls]=statusOf(s);
    const value=s.humidity===null?0:s.humidity;
    const card=document.createElement("article"); card.className="sector-card";
    card.innerHTML=`
      <div class="sector-head"><div><h3></h3><p class="crop"></p></div><span class="pill ${cls}">${label}</span></div>
      <div class="reading"><strong>${s.humidity===null?"—":value+"%"}</strong><span>${s.simulated?"Lectura simulada":s.humidity===null?"Esperando sensor":"Humedad del suelo"}</span></div>
      <div class="meter"><span class="${s.humidity!==null && value<s.threshold?"low":""}" style="width:${value}%"></span></div>
      <div class="meta"><span>0% seco</span><span>Umbral: ${s.threshold}%</span><span>100%</span></div>
      <div class="sensor-line"><span class="sensor-state">${s.connected?"● Sensor conectado":s.sensorName?"Sensor: "+s.sensorName:"Sin sensor vinculado"}</span><span>${s.connected?"BLE":""}</span></div>
      <div class="sensor-actions">
        <button class="primary connect">Vincular sensor</button>
        <button class="secondary edit">Editar</button>
        <button class="secondary delete">Eliminar</button>
      </div>`;
    card.querySelector("h3").textContent=s.name;
    card.querySelector(".crop").textContent=s.crop;
    card.querySelector(".connect").addEventListener("click",()=>connectSensor(s.id));
    card.querySelector(".edit").addEventListener("click",()=>openEdit(s.id));
    card.querySelector(".delete").addEventListener("click",()=>removeSector(s.id));
    $("sectorList").appendChild(card);
  });
}
function openEdit(id=null){
  const s=sectors.find(x=>x.id===id);
  $("dialogTitle").textContent=s?"Editar sector":"Nuevo sector";
  $("sectorId").value=s?.id||"";
  $("sectorName").value=s?.name||"";
  $("sectorCrop").value=s?.crop||"";
  $("sectorThreshold").value=s?.threshold??35;
  $("sectorDialog").showModal();
}
function removeSector(id){
  const s=sectors.find(x=>x.id===id);
  if(!confirm(`¿Eliminar el sector "${s.name}"?`)) return;
  sectors=sectors.filter(x=>x.id!==id); save(); render();
}
$("addSectorBtn").onclick=()=>openEdit();
$("closeDialog").onclick=$("cancelDialog").onclick=()=>$("sectorDialog").close();
$("sectorForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("sectorId").value;
  const data={name:$("sectorName").value.trim(),crop:$("sectorCrop").value.trim(),threshold:Number($("sectorThreshold").value)};
  if(id){ Object.assign(sectors.find(s=>s.id===id),data); }
  else sectors.push({id:crypto.randomUUID(),...data,humidity:null,sensorName:"",connected:false,simulated:false});
  save(); render(); $("sectorDialog").close(); toast("Sector guardado");
});
async function connectSensor(id){
  const sector=sectors.find(s=>s.id===id);
  if(!("bluetooth" in navigator)){ toast("Este navegador no ofrece Web Bluetooth. Prueba Chrome/Edge compatible."); return; }
  if(!window.isSecureContext){ toast("Bluetooth requiere HTTPS o localhost."); return; }
  try{
    const device=await navigator.bluetooth.requestDevice({
      filters:[{namePrefix:"AgroSense"}],
      optionalServices:[SERVICE_UUID]
    });
    device.addEventListener("gattserverdisconnected",()=>{
      sector.connected=false; save(); render(); toast("Sensor desconectado");
    });
    const server=await device.gatt.connect();
    const service=await server.getPrimaryService(SERVICE_UUID);
    const characteristic=await service.getCharacteristic(HUMIDITY_UUID);
    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged",event=>{
      const dv=event.target.value;
      const humidity=dv.getUint8(0);
      sector.humidity=Math.max(0,Math.min(100,humidity));
      sector.sensorName=device.name||"AgroSense";
      sector.connected=true; sector.simulated=false; save(); render();
    });
    sector.sensorName=device.name||"AgroSense";
    sector.connected=true; sector.simulated=false;
    // Lee el valor inicial si la característica lo permite.
    try{
      const initial=await characteristic.readValue();
      sector.humidity=Math.max(0,Math.min(100,initial.getUint8(0)));
    }catch(_){}
    save(); render(); toast("Sensor vinculado a "+sector.name);
  }catch(err){
    console.error(err);
    toast(err.name==="NotFoundError"?"No se seleccionó ningún sensor.":"No se pudo conectar: "+err.message);
  }
}
$("demoBtn").onclick=()=>{
  sectors.forEach(s=>{
    s.humidity=Math.floor(18+Math.random()*65);
    s.connected=false; s.sensorName="Modo demostración"; s.simulated=true;
  });
  save(); render(); toast("Se cargaron lecturas simuladas; no son datos físicos.");
};
render();
