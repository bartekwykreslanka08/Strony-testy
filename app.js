const state={routes:{},line:null,variants:[],variant:null};
const $=s=>document.querySelector(s);
const esc=x=>String(x??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
function kind(line){let x=String(line).toUpperCase();if(/^M[12]$/.test(x))return"metro";if(/^\d+$/.test(x)){let n=+x;return n>=1&&n<=39?"tram":"bus"}return"other"}
function kindName(x){return({bus:"autobus",tram:"tramwaj",metro:"metro",other:"pozostałe"})[x]||"linia"}
function clock(){let d=new Date(),t=d.toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit",second:"2-digit"});$("#clock").textContent=t;$("#displayClock").textContent=t.slice(0,5)}
setInterval(clock,1000);clock();

async function load(){
 if(!API_BASE||API_BASE.includes("WKLEJ_TUTAJ")){$("#status").textContent="USTAW ADRES WORKERA W index.html";$("#lines").innerHTML='<div class="error">W index.html zamień <b>WKLEJ_TUTAJ_ADRES_WORKERA</b> na adres Twojego Cloudflare Workera.</div>';return}
 try{let r=await fetch(API_BASE+"/routes");let d=await r.json();if(!r.ok)throw Error(d.error||"Błąd API");state.routes=d.routes||{};$("#status").textContent=`API OK • ${Object.keys(state.routes).length} linii`;render()}catch(e){$("#status").textContent="BŁĄD API";$("#lines").innerHTML=`<div class="error">${esc(e.message)}</div>`}
}
function render(){
 let q=$("#search").value.trim().toUpperCase(),f=$("#filter").value;
 let lines=Object.keys(state.routes).filter(x=>x.toUpperCase().includes(q)).filter(x=>f==="all"||kind(x)===f).sort((a,b)=>{let A=+a,B=+b;if(!Number.isNaN(A)&&!Number.isNaN(B))return A-B;return a.localeCompare(b,"pl")});
 $("#count").textContent=lines.length;
 $("#lines").innerHTML=lines.length?lines.map(x=>`<button class="line" data-line="${esc(x)}"><span class="num">${esc(x)}</span><span class="kind">${kindName(kind(x))}</span></button>`).join(""):'<div class="error">Brak wyników.</div>';
 document.querySelectorAll(".line").forEach(b=>b.onclick=()=>openLine(b.dataset.line));
}
function openLine(line){
 state.line=line;state.variants=Object.entries(state.routes[line]||{}).map(([id,stops])=>({id,stops})).filter(x=>x.stops.length);state.variant=state.variants[0]?.id;
 $("#badge").textContent=line;$("#displayLine").textContent=line;renderDirs();renderVariant();$("#modal").classList.remove("hidden");document.body.style.overflow="hidden";
}
function dest(v){return v?.stops?.at(-1)?.name||"Brak kierunku"}
function renderDirs(){$("#dirs").innerHTML=state.variants.map((v,i)=>`<button class="dir ${v.id===state.variant?"active":""}" data-v="${esc(v.id)}">KIERUNEK ${i+1}: ${esc(dest(v))}</button>`).join("");document.querySelectorAll(".dir").forEach(b=>b.onclick=()=>{state.variant=b.dataset.v;renderDirs();renderVariant()})}
function renderVariant(){
 let v=state.variants.find(x=>x.id===state.variant);if(!v)return;
 $("#title").textContent=dest(v);$("#destination").textContent=dest(v);
 $("#stops").innerHTML=v.stops.map((s,i)=>`<div class="stop"><b>${esc(s.name)}</b><div class="meta">${esc(s.stopGroupId)}/${esc(s.stopNumber)}${s.street?" • "+esc(s.street):""}</div></div>`).join("");
 $("#vehicleBox").classList.add("hidden");
}
async function vehicles(){
 $("#vehicleBox").classList.remove("hidden");$("#vehicleBox").innerHTML='<div class="loading">Pobieranie pozycji...</div>';
 try{let typ=kind(state.line)==="tram"?2:1,r=await fetch(API_BASE+"/vehicles/line/"+encodeURIComponent(state.line)+"?type="+typ),d=await r.json();if(!r.ok)throw Error(d.error||"Błąd realtime");if(!d.length){$("#vehicleBox").innerHTML='<div class="loading">Brak aktualnie raportowanych pojazdów.</div>';return}$("#vehicleBox").innerHTML=d.map(v=>`<div class="vehicle-row"><div>POJAZD<br><b>${esc(v.VehicleNumber)}</b></div><div>BRYGADA<br>${esc(v.Brigade)}</div><div>CZAS<br>${esc(v.Time)}</div></div>`).join("")}catch(e){$("#vehicleBox").innerHTML=`<div class="error">${esc(e.message)}</div>`}
}
$("#search").oninput=render;$("#filter").onchange=render;$("#vehicles").onclick=vehicles;$("#fs").onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{});document.querySelectorAll("[data-close]").forEach(x=>x.onclick=()=>{$("#modal").classList.add("hidden");document.body.style.overflow=""});document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("#modal").classList.add("hidden");document.body.style.overflow=""}});
load();
