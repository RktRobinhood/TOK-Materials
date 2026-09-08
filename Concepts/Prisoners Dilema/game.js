const opponents = {
  nova: {
    name: "Nova", avatar: "assets/avatars/nova.png", tagline: "Guarded. Patient. Remembers betrayal.",
    voice: ["I can keep my mouth shut. The question is whether you can.", "Burn me once and I remember it."],
    choose(state) {
      if (state.round === 1) return Math.random() < .82 ? "cooperate" : "defect";
      if (state.lastPlayerChoice === "defect") return Math.random() < .82 ? "defect" : "cooperate";
      return Math.random() < .86 ? "cooperate" : "defect";
    }
  },
  rex: {
    name: "Rex", avatar: "assets/avatars/rex.png", tagline: "Charming. Self-interested. Likes an easy advantage.",
    voice: ["Nothing personal. I just like good deals.", "Trust is expensive in a room like this."],
    choose(state) {
      if (state.lastPlayerChoice === "defect") return Math.random() < .88 ? "defect" : "cooperate";
      return Math.random() < .72 ? "defect" : "cooperate";
    }
  },
  miles: {
    name: "Miles", avatar: "assets/avatars/miles.png", tagline: "Nervous. Unpredictable. Panics after being burned.",
    voice: ["I do not want five years. I really do not want five years.", "Just... do not make me regret trusting you."],
    choose(state) {
      const betrayals = state.history.filter(x => x.playerChoice === "defect" && x.oppChoice === "cooperate").length;
      const defectChance = Math.min(.35 + betrayals * .24 + (state.round-1)*.04, .9);
      return Math.random() < defectChance ? "defect" : "cooperate";
    }
  },
  kai: {
    name: "Kai", avatar: "assets/avatars/kai.png", tagline: "Cold. Consistent. Gives back what you gave last time.",
    voice: ["I return what I am given.", "Your last move tells me everything I need."],
    choose(state) {
      if (state.round === 1) return "cooperate";
      return Math.random() < .9 ? state.lastPlayerChoice : (state.lastPlayerChoice === "cooperate" ? "defect" : "cooperate");
    }
  }
};

const state = { round:1, maxRounds:5, playerYears:0, oppYears:0, history:[], lastPlayerChoice:null, opponentKey:"nova", playerName:"You", sound:true };
const $ = id => document.getElementById(id);
const screens = [$("titleScreen"),$("gameScreen"),$("endScreen")];
let tutorialStep = 0;
const tutorialPages = [
  {title:"Your goal", body:"You are being questioned separately from another suspect. Across <b>5 rounds</b>, collect as <b>few prison years as possible</b>. Lower is better."},
  {title:"Two choices", body:"<b>Stay Quiet</b>: protect the other suspect.<br><br><b>Snitch</b>: give evidence against them.<br><br>You both choose simultaneously, so you cannot wait to see what they do."},
  {title:"The catch", body:"If you both stay quiet, you each get only <b>1 year</b>. But if you stay quiet while they snitch, you get <b>5 years</b> and they get <b>0</b>. Snitching protects you from the worst outcome—but mutual snitching costs <b>3 years each</b>."},
  {title:"Watch the person", body:"Each opponent has a consistent personality. Some forgive. Some exploit trust. Some copy you. Your choices can change what happens later. Try different opponents and see what strategy works."}
];

function showScreen(screen){ screens.forEach(s=>s.classList.remove("active")); screen.classList.add("active"); window.scrollTo({top:0,behavior:"smooth"}); }
function currentOpponent(){ return opponents[state.opponentKey]; }
function cleanName(v){ return (v||"").trim().replace(/[<>]/g,"").slice(0,18) || "You"; }

function renderOpponentPicker(){
  const wrap=$("opponentPicker"); wrap.innerHTML="";
  Object.entries(opponents).forEach(([key,o])=>{
    const b=document.createElement("button"); b.className="opponent-pick"+(key===state.opponentKey?" selected":""); b.dataset.key=key;
    b.innerHTML=`<img src="${o.avatar}" alt=""><span><b>${o.name}</b><small>${o.tagline}</small></span>`;
    b.addEventListener("click",()=>{ state.opponentKey=key; renderOpponentPicker(); playAvatarCue(key); }); wrap.appendChild(b);
  });
}

function resetGame(){
  Object.assign(state,{round:1,playerYears:0,oppYears:0,history:[],lastPlayerChoice:null});
  state.playerName=cleanName($("playerNameInput").value);
  const o=currentOpponent();
  $("playerDisplayName").textContent=state.playerName; $("scorePlayerName").textContent=state.playerName.toUpperCase(); $("resultPlayerName").textContent=state.playerName.toUpperCase();
  $("playerInitial").textContent=state.playerName[0].toUpperCase();
  $("opponentName").textContent=o.name; $("scoreOpponentName").textContent=o.name.toUpperCase(); $("resultOpponentName").textContent=o.name.toUpperCase(); $("opponentTagline").textContent=o.tagline; $("opponentAvatar").src=o.avatar;
  $("historyRow").innerHTML=""; $("decisionPanel").classList.remove("hidden"); $("resultPanel").classList.add("hidden");
  updateHud(); updatePersonalBest();
}
function updateHud(){ $("roundNum").textContent=state.round; $("playerYears").textContent=state.playerYears; $("oppYears").textContent=state.oppYears; }
function updatePersonalBest(){ const rows=getBoard(); const best=rows.length?rows[0].years:null; $("personalBest").textContent=best===null?"—":`${best} yrs`; }

function resolve(player,opp){
  if(player==="cooperate"&&opp==="cooperate") return {p:1,o:1,key:"trust",burst:"TRUST HOLDS!",comment:"You both kept quiet. Mutual trust keeps the damage low."};
  if(player==="cooperate"&&opp==="defect") return {p:5,o:0,key:"betrayed",burst:"SOLD OUT!",comment:`${currentOpponent().name} snitched while you stayed quiet. You take the full hit.`};
  if(player==="defect"&&opp==="cooperate") return {p:0,o:5,key:"escape",burst:"YOU WALK!",comment:`You snitched while ${currentOpponent().name} stayed quiet. You walk this round.`};
  return {p:3,o:3,key:"double",burst:"DOUBLE CROSS!",comment:"You both snitched. Neither of you gets the best deal."};
}
function displayChoice(c){ return c==="cooperate"?"STAY QUIET":"SNITCH"; }

function playRound(playerChoice){
  document.querySelectorAll(".choice").forEach(b=>b.disabled=true);
  clearTimeout(autoAdvanceTimer);
  playSfx("lock");
  setTimeout(()=>{
    const oppChoice=currentOpponent().choose(state); const out=resolve(playerChoice,oppChoice);
    state.playerYears+=out.p; state.oppYears+=out.o; state.lastPlayerChoice=playerChoice; state.history.push({round:state.round,playerChoice,oppChoice,...out});
    $("resultRound").textContent=state.round; $("yourChoiceText").textContent=displayChoice(playerChoice); $("theirChoiceText").textContent=displayChoice(oppChoice);
    $("sentenceText").textContent=out.p===0?"You receive no prison time.":`You receive ${out.p} year${out.p===1?"":"s"}.`; $("resultComment").textContent=out.comment;
    $("outcomeBurst").textContent=out.burst;
    $("resultPanel").className=`result-panel panel outcome-${out.key}`;
    $("nextBtn").textContent=state.round===state.maxRounds?"SEE FINAL SENTENCE NOW":"NEXT ROUND NOW";
    updateHud(); appendHistory(state.history.at(-1)); $("decisionPanel").classList.add("hidden");
    requestAnimationFrame(()=>$("resultPanel").classList.add("reveal-pop"));
    playOutcomeSound(out.key);
    startAutoAdvance();
    document.querySelectorAll(".choice").forEach(b=>b.disabled=false);
  },420);
}

let autoAdvanceTimer=null, countdownTimer=null;
function startAutoAdvance(){
  clearTimeout(autoAdvanceTimer); clearInterval(countdownTimer);
  let left=3; $("autoAdvanceText").textContent=state.round===state.maxRounds?`Final sentence in ${left}…`:`Next round in ${left}…`;
  countdownTimer=setInterval(()=>{ left--; if(left>0) $("autoAdvanceText").textContent=state.round===state.maxRounds?`Final sentence in ${left}…`:`Next round in ${left}…`; },900);
  autoAdvanceTimer=setTimeout(()=>{ clearInterval(countdownTimer); nextRound(); },3000);
}
function appendHistory(e){ const c=document.createElement("div"); c.className="history-chip"; c.innerHTML=`<b>R${e.round}</b><span>${e.playerChoice==="cooperate"?"Q":"S"}/${e.oppChoice==="cooperate"?"Q":"S"}</span><strong>+${e.p}y</strong>`; $("historyRow").appendChild(c); }
function nextRound(){ clearTimeout(autoAdvanceTimer); clearInterval(countdownTimer); if(state.round>=state.maxRounds) return endGame(); state.round++; updateHud(); $("resultPanel").className="result-panel panel hidden"; $("decisionPanel").classList.remove("hidden"); }

function boardKey(){ return `pd-board-${state.opponentKey}`; }
function getBoard(){ try{return JSON.parse(localStorage.getItem(boardKey())||"[]");}catch{return [];} }
function saveScore(){
  const rows=getBoard(); rows.push({name:state.playerName,years:state.playerYears,ts:Date.now()}); rows.sort((a,b)=>a.years-b.years||a.ts-b.ts); localStorage.setItem(boardKey(),JSON.stringify(rows.slice(0,12))); return rows[0]?.years===state.playerYears;
}
function renderBoard(){
  const rows=getBoard(); $("leaderboardTitle").textContent=`Lowest years vs ${currentOpponent().name}`; const list=$("leaderboardList"); list.innerHTML="";
  if(!rows.length){ list.innerHTML="<li class='empty-board'>No scores yet.</li>"; return; }
  rows.slice(0,8).forEach((r,i)=>{const li=document.createElement("li"); li.innerHTML=`<span class="place">#${i+1}</span><b>${escapeHtml(r.name)}</b><strong>${r.years} yrs</strong>`; list.appendChild(li);});
}
function escapeHtml(s){ return s.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }

function endGame(){
  const isBest=saveScore(); $("finalPlayer").textContent=state.playerYears; $("finalOpp").textContent=state.oppYears; $("endPlayerLabel").textContent=`${state.playerName.toUpperCase()}'S SENTENCE`; $("endOpponentLabel").textContent=`${currentOpponent().name.toUpperCase()}'S SENTENCE`;
  $("rankStamp").textContent=isBest?"NEW BEST SCORE":"SCORE RECORDED"; $("rankStamp").classList.toggle("muted-stamp",!isBest);
  const snitches=state.history.filter(x=>x.playerChoice==="defect").length; const quiet=state.maxRounds-snitches;
  $("strategyReadout").textContent=`You stayed quiet ${quiet} time${quiet===1?"":"s"} and snitched ${snitches} time${snitches===1?"":"s"}. Against ${currentOpponent().name}, that produced ${state.playerYears} total years. Replay and test whether a different pattern does better.`;
  renderBoard(); updatePersonalBest(); showScreen($("endScreen")); playReal("door",.5,.78);
}

function renderTutorial(){ const p=tutorialPages[tutorialStep]; $("tutorialPage").innerHTML=`<span class="eyebrow">TUTORIAL</span><h2 id="tutorialTitle">${p.title}</h2><p>${p.body}</p>`; $("tutorialStepLabel").textContent=`${tutorialStep+1} / ${tutorialPages.length}`; $("tutorialProgressBar").style.width=`${((tutorialStep+1)/tutorialPages.length)*100}%`; $("tutorialBack").style.visibility=tutorialStep?"visible":"hidden"; $("tutorialNext").textContent=tutorialStep===tutorialPages.length-1?"GOT IT":"NEXT"; }
function openTutorial(){ tutorialStep=0; renderTutorial(); $("tutorialModal").classList.remove("hidden"); }

let audioCtx;
const prisonAudio = {
  bars: new Audio("https://upload.wikimedia.org/wikipedia/commons/2/24/Hitting_a_wire_cage.ogg"),
  door: new Audio("https://upload.wikimedia.org/wikipedia/commons/0/04/Open_metallic_door.ogg"),
  knock: new Audio("https://upload.wikimedia.org/wikipedia/commons/7/7c/Door_knocker_audio.ogg")
};
Object.values(prisonAudio).forEach(a=>{ a.preload="auto"; a.volume=.45; });
function playReal(name,volume=.45,rate=1){
  if(!state.sound) return false;
  const src=prisonAudio[name]; if(!src) return false;
  try{ const a=src.cloneNode(); a.volume=volume; a.playbackRate=rate; const p=a.play(); if(p&&p.catch)p.catch(()=>playSfx(name==="door"?"door":"reveal")); return true; }catch{ return false; }
}
const comicAudio = {
  trust: new Audio("assets/audio/trust-holds.wav"),
  betrayed: new Audio("assets/audio/sold-out.wav"),
  escape: new Audio("assets/audio/you-walk.wav"),
  double: new Audio("assets/audio/double-cross.wav")
};
Object.values(comicAudio).forEach(a=>{ a.preload="auto"; a.volume=.58; });
let quoteTimer=null;
function showOpponentQuote(key){
  const bubble=$("opponentQuote");
  if(!bubble) return;
  const o=opponents[key], line=o.voice[Math.floor(Math.random()*o.voice.length)];
  bubble.textContent=`“${line}”`;
  bubble.classList.add("show");
  clearTimeout(quoteTimer);
  quoteTimer=setTimeout(()=>bubble.classList.remove("show"),2400);
}
function playAvatarCue(key){
  showOpponentQuote(key);
  playReal("bars",.16,.9+Math.random()*.08);
}
function playOutcomeSound(key){
  if(!state.sound) return;
  const src=comicAudio[key];
  if(src){
    try{ const a=src.cloneNode(); a.volume=.62; const p=a.play(); if(p&&p.catch)p.catch(()=>playSfx(key==="trust"||key==="escape"?"good":"bad")); return; }catch{}
  }
  playSfx(key==="trust"||key==="escape"?"good":"bad");
}
function playSfx(type){
  if(!state.sound) return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); const t=audioCtx.currentTime;
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain(), filter=audioCtx.createBiquadFilter(); filter.type="lowpass"; filter.frequency.value=type==="door"?650:1500; osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    const map={tick:[700,.04,.04],lock:[145,.12,.14],reveal:[220,.18,.12],good:[420,.18,.10],bad:[92,.28,.18],door:[70,.45,.22]}; const [f,d,v]=map[type]||map.tick;
    osc.type=type==="bad"||type==="door"?"sawtooth":"square"; osc.frequency.setValueAtTime(f,t); if(type==="door") osc.frequency.exponentialRampToValueAtTime(38,t+d); if(type==="good") osc.frequency.exponentialRampToValueAtTime(680,t+d);
    gain.gain.setValueAtTime(.0001,t); gain.gain.exponentialRampToValueAtTime(v,t+.01); gain.gain.exponentialRampToValueAtTime(.0001,t+d); osc.start(t); osc.stop(t+d+.02);
  }catch{}
}

function tickClock(){ const now=new Date(), m=47+Math.floor(now.getSeconds()/30); $("clockDisplay").textContent=`23:${String(m).padStart(2,"0")}`; }
setInterval(tickClock,1000); tickClock();

$("startBtn").addEventListener("click",()=>{resetGame(); showScreen($("gameScreen")); playReal("door",.38,.92);});
$("opponentAvatarButton").addEventListener("click",()=>playAvatarCue(state.opponentKey));
$("restartBtn").addEventListener("click",()=>{resetGame(); showScreen($("gameScreen"));});
$("changeOpponentBtn").addEventListener("click",()=>showScreen($("titleScreen")));
$("nextBtn").addEventListener("click",nextRound);
document.querySelectorAll(".choice").forEach(b=>b.addEventListener("click",()=>playRound(b.dataset.choice)));
$("tutorialBtn").addEventListener("click",openTutorial);
$("tutorialNext").addEventListener("click",()=>{ if(tutorialStep<tutorialPages.length-1){tutorialStep++;renderTutorial();playSfx("tick");}else $("tutorialModal").classList.add("hidden"); });
$("tutorialBack").addEventListener("click",()=>{if(tutorialStep){tutorialStep--;renderTutorial();}});
$("debriefBtn").addEventListener("click",()=>$("debriefModal").classList.remove("hidden"));
$("soundToggle").addEventListener("click",()=>{state.sound=!state.sound; $("soundToggle").textContent=state.sound?"SOUND ON":"SOUND OFF"; $("soundToggle").setAttribute("aria-pressed",String(!state.sound)); if(state.sound)playSfx("tick");});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).classList.add("hidden")));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.add("hidden");}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));});
renderOpponentPicker();
