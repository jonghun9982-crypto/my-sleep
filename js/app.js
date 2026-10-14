(function(){
const KEY='mysleep.records.v1', MODE='mysleep.sample.v1';
const $=s=>document.querySelector(s);
const DOW=['일','월','화','수','목','금','토'];
let sample=localStorage.getItem(MODE)!=='off';
let own=JSON.parse(localStorage.getItem(KEY)||'[]');
let sampleRecs=null, charts={}, period='week';
const recs=()=>sample?(sampleRecs||(sampleRecs=genSample())):own;
function save(){if(!sample)localStorage.setItem(KEY,JSON.stringify(own));}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
// --- sample generator (deterministic) ---
function genSample(){let s=42;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
 const g=()=>{let u=0;for(let i=0;i<6;i++)u+=r();return u-3};const out=[];const now=new Date();
 for(let i=90;i>=1;i--){const w=new Date(now);w.setDate(now.getDate()-i+1);const dow=w.getDay();const wkend=dow===0||dow===6;
  const trend=i/90*0.4; // slightly improving
  let bed=23.6+(wkend?1.1:0)+trend+g()*0.45+(r()<0.07?1.5:0); let dur=6.8+(wkend?0.9:0)-trend*0.5+g()*0.5;
  const sl=new Date(w);sl.setDate(w.getDate()-1);sl.setHours(0,0,0,0);sl.setMinutes(Math.round(bed*60));
  const wk=new Date(sl.getTime()+Math.round(dur*60)*60000);out.push({id:'s'+i,sleep:sl.toISOString(),wake:wk.toISOString()});}
 return out;}
// --- helpers ---
const pad=n=>String(n).padStart(2,'0');
const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
const md=d=>(d.getMonth()+1)+'/'+d.getDate()+'('+DOW[d.getDay()]+')';
const fmtH=h=>{if(h==null||isNaN(h))return'-';const m=Math.round(h*60);return Math.floor(m/60)+'시간 '+(m%60)+'분'};
const off=d=>((d.getHours()+d.getMinutes()/60-18)+24)%24; // hours after 18:00
const clk=v=>{let t=((v+18)%24+24)%24;const m=Math.round(t*60)%1440;return pad(Math.floor(m/60))+':'+pad(m%60)};
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;
const sd=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/(a.length-1))};
const dkey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const toLocal=iso=>{if(!iso)return'';const d=new Date(iso);return dkey(d)+'T'+hm(d)};
function nights(){return recs().filter(r=>r.wake).map(r=>{const s=new Date(r.sleep),w=new Date(r.wake);
 return{s,w,dur:(w-s)/36e5,bed:off(s),wk:off(w),key:dkey(w),dow:w.getDay()}}).filter(n=>n.dur>0&&n.dur<24).sort((a,b)=>a.w-b.w);}
// --- home ---
function render(){
 $('#badge').classList.toggle('hide',!sample);
 const all=recs().slice().sort((a,b)=>new Date(b.sleep)-new Date(a.sleep));const open=all.find(r=>!r.wake);
 if(open){const s=new Date(open.sleep);const h=(Date.now()-s)/36e5;
  $('#status').innerHTML='😴 수면 중<br><b>'+md(s)+' '+hm(s)+'</b> 부터<br><span class="note">'+fmtH(h)+' 경과</span>';}
 else{const n=nights().pop();$('#status').innerHTML='☀️ 깨어 있음'+(n?'<br><span class="note">지난 수면: '+md(n.s)+' '+hm(n.s)+' → '+hm(n.w)+' ('+fmtH(n.dur)+')</span>':'<br><span class="note">아래 Sleep 버튼으로 기록을 시작하세요</span>');}
 $('#btnSleep').disabled=!!open;$('#btnWake').disabled=!open;
 $('#list').innerHTML=all.slice(0,10).map(r=>{const s=new Date(r.sleep),w=r.wake&&new Date(r.wake);
  return '<li><span><span class="d">'+md(new Date(s-12*36e5))+' 밤</span> '+hm(s)+' → '+(w?hm(w)+' <span class="note">'+fmtH((w-s)/36e5)+'</span>':'수면 중')+'</span><button class="small" data-id="'+r.id+'">수정</button></li>'}).join('')||'<li class="note">기록이 없습니다</li>';
 $('#sampleBox').innerHTML=sample?'<p><span class="badge">샘플 데이터</span> 지금 보이는 기록은 체험용 가짜 데이터(약 90일)입니다.</p><button id="btnOwn" class="primary">샘플 지우고 내 기록 사용하기</button>'
  :'<p class="note">내 기록 사용 중 ('+own.length+'건, 이 기기 브라우저에만 저장)</p><button id="btnSample" class="small">샘플 데이터 다시 보기</button>';
 const bo=$('#btnOwn');if(bo)bo.onclick=()=>{if(confirm('샘플 데이터를 지우고 내 기록으로 시작할까요?')){sample=false;localStorage.setItem(MODE,'off');render();}};
 const bs=$('#btnSample');if(bs)bs.onclick=()=>{sample=true;localStorage.setItem(MODE,'on');render();};
 document.querySelectorAll('#list button').forEach(b=>b.onclick=()=>openDlg(b.dataset.id));
 if($('#tab-charts').classList.contains('active'))drawCharts();
 if($('#tab-report').classList.contains('active'))report();
}
function guardSample(){if(sample){alert('샘플 데이터 모드입니다. 먼저 "샘플 지우고 내 기록 사용하기"를 눌러 주세요.');return true}return false}
$('#btnSleep').onclick=()=>{if(guardSample())return;own.push({id:uid(),sleep:new Date().toISOString(),wake:null});save();render();};
$('#btnWake').onclick=()=>{if(guardSample())return;const o=own.find(r=>!r.wake);if(o){o.wake=new Date().toISOString();save();render();}};
$('#btnAdd').onclick=()=>{if(guardSample())return;openDlg(null)};
let editId=null;
function openDlg(id){if(id&&guardSample())return;editId=id;const r=own.find(x=>x.id===id);
 $('#dlgTitle').textContent=r?'기록 수정':'기록 추가';$('#dlgDel').style.visibility=r?'visible':'hidden';$('#dlgErr').textContent='';
 $('#fSleep').value=r?toLocal(r.sleep):'';$('#fWake').value=r?toLocal(r.wake):'';$('#dlg').showModal();}
$('#dlgSave').onclick=()=>{const sv=$('#fSleep').value,wv=$('#fWake').value;if(!sv){$('#dlgErr').textContent='잠든 시각을 입력하세요';return}
 const s=new Date(sv),w=wv?new Date(wv):null;if(w&&(w<=s||(w-s)>24*36e5)){$('#dlgErr').textContent='깬 시각은 잠든 시각 이후, 24시간 이내여야 합니다';return}
 if(!w&&own.some(r=>!r.wake&&r.id!==editId)){$('#dlgErr').textContent='이미 수면 중인 기록이 있습니다';return}
 const rec={id:editId||uid(),sleep:s.toISOString(),wake:w?w.toISOString():null};
 if(editId)own[own.findIndex(r=>r.id===editId)]=rec;else own.push(rec);save();$('#dlg').close();render();};
$('#dlgDel').onclick=()=>{if(confirm('이 기록을 삭제할까요?')){own=own.filter(r=>r.id!==editId);save();$('#dlg').close();render();}};
// --- tabs ---
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));
 document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.id==='tab-'+b.dataset.t));
 if(b.dataset.t==='charts')drawCharts();if(b.dataset.t==='report')report();window.scrollTo(0,0);});
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{period=b.dataset.p;document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b));drawCharts();});
// --- charts ---
const hasChart=()=>typeof Chart!=='undefined';
function mk(id,cfg){if(charts[id])charts[id].destroy();charts[id]=new Chart($('#'+id),cfg);}
if(hasChart()){Chart.defaults.color='#c9d1ff';Chart.defaults.borderColor='#2c376e';Chart.defaults.animation=false;Chart.defaults.maintainAspectRatio=false;}
function drawCharts(){if(!hasChart()){$('#tab-charts').querySelector('.card').insertAdjacentHTML('afterbegin','<p class="err">차트 라이브러리를 불러오지 못했습니다(인터넷 연결 필요).</p>');return}
 const N=nights();const byDay={};N.forEach(n=>{(byDay[n.key]=byDay[n.key]||[]).push(n)});
 const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d)}
 const vals=days.map(d=>{const a=byDay[dkey(d)];return a?+a.reduce((x,n)=>x+n.dur,0).toFixed(2):null});
 mk('cDaily',{type:'bar',data:{labels:days.map(d=>(d.getMonth()+1)+'/'+d.getDate()),datasets:[{label:'수면 시간(h)',data:vals,
  backgroundColor:vals.map(v=>v==null?'#555':v<7?'#ff8a8a':v>9?'#ffd38a':'#7be0a0')}]},
  options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtH(c.raw)}}},scales:{y:{min:0,suggestedMax:10,title:{display:true,text:'시간'}}}}});
 // grouping
 const groups=[];const cnt=period==='week'?12:6;
 for(let i=cnt-1;i>=0;i--){let a,b,label;const now=new Date();
  if(period==='week'){b=new Date(now);b.setHours(23,59,59);b.setDate(b.getDate()-7*i);a=new Date(b);a.setDate(a.getDate()-6);a.setHours(0,0,0);label=(a.getMonth()+1)+'/'+a.getDate()+'~';}
  else{a=new Date(now.getFullYear(),now.getMonth()-i,1);b=new Date(now.getFullYear(),now.getMonth()-i+1,0,23,59,59);label=(a.getMonth()+1)+'월';}
  const g=N.filter(n=>n.w>=a&&n.w<=b);groups.push({label,dur:g.length?mean(g.map(n=>n.dur)):null,bed:g.length?mean(g.map(n=>n.bed)):null,wk:g.length?mean(g.map(n=>n.wk)):null});}
 $('#trendTitle').textContent=period==='week'?'주간 추이 (12주)':'월간 추이 (6개월)';
 const L=groups.map(g=>g.label),r2=v=>v==null?null:+v.toFixed(2);
 mk('cDur',{type:'line',data:{labels:L,datasets:[{label:'평균 수면 시간',data:groups.map(g=>r2(g.dur)),borderColor:'#7be0a0',tension:.3,spanGaps:true}]},
  options:{plugins:{tooltip:{callbacks:{label:c=>fmtH(c.raw)}}},scales:{y:{suggestedMin:5,suggestedMax:9,title:{display:true,text:'시간'}}}}});
 mk('cTime',{type:'line',data:{labels:L,datasets:[{label:'평균 취침 시각',data:groups.map(g=>r2(g.bed)),borderColor:'#8f93ff',tension:.3,spanGaps:true},
  {label:'평균 기상 시각',data:groups.map(g=>r2(g.wk)),borderColor:'#f0a030',tension:.3,spanGaps:true}]},
  options:{plugins:{tooltip:{callbacks:{label:c=>c.dataset.label+': '+clk(c.raw)}}},scales:{y:{reverse:true,ticks:{callback:v=>clk(v),stepSize:2},title:{display:true,text:'시각'}}}}});
}
// --- prediction ---
function model(N){const last=N.slice(-28);const wma=k=>{const a=last.slice(-14);let sw=0,s=0;a.forEach((n,i)=>{s+=n[k]*(i+1);sw+=i+1});return s/sw};
 const base={dur:wma('dur'),bed:wma('bed')},m={dur:mean(last.map(n=>n.dur)),bed:mean(last.map(n=>n.bed))};
 const eff=k=>{const e={};for(let d=0;d<7;d++){const a=N.slice(-56).filter(n=>n.dow===d).map(n=>n[k]);e[d]=a.length>=2?mean(a)-mean(N.slice(-56).map(n=>n[k])):0}return e};
 return{base,m,e:{dur:eff('dur'),bed:eff('bed')},sd:{dur:sd(last.map(n=>n.dur)),bed:sd(last.map(n=>n.bed))}};}
$('#btnPredict').onclick=()=>{const N=nights();if(N.length<7){$('#predOut').innerHTML='<p class="err">예측하려면 최소 7일 이상의 기록이 필요합니다 (현재 '+N.length+'일).</p>';return}
 const M=model(N);let rows='';for(let i=1;i<=7;i++){const d=new Date();d.setDate(d.getDate()+i);const w=d.getDay();
  const pd=M.base.dur+M.e.dur[w],pb=M.base.bed+M.e.bed[(w+6)%7];
  rows+='<tr><td>'+md(d)+'</td><td><b>'+fmtH(pd)+'</b><br><span class="note">'+(pd-M.sd.dur).toFixed(1)+'~'+(pd+M.sd.dur).toFixed(1)+'h</span></td><td>'+clk(pb-M.sd.bed)+'~'+clk(pb+M.sd.bed)+'</td></tr>';}
 $('#predOut').innerHTML='<p><span class="est">추정치</span> 실제와 다를 수 있습니다.</p><table><tr><th>아침(기상일)</th><th>예상 수면</th><th>예상 취침 범위<br><span class="note">전날 밤</span></th></tr>'+rows+'</table>'
  +'<p class="note">계산: 최근 14일 가중평균 '+fmtH(M.base.dur)+' + 요일 보정(최근 8주 요일 평균 − 전체 평균). 범위 = 최근 28일 표준편차(±'+M.sd.dur.toFixed(1)+'h, 취침 ±'+Math.round(M.sd.bed*60)+'분).</p>';};
// --- report ---
function report(){const all=nights();const N=all.slice(-30);if(N.length<5){$('#report').innerHTML='<div class="card"><h2>건강 리포트</h2><p>리포트를 만들려면 최소 5일 기록이 필요합니다.</p></div>';return}
 const avg=mean(N.map(n=>n.dur)),bsd=sd(N.map(n=>n.bed))*60;
 const wd=N.filter(n=>n.dow>=1&&n.dow<=5),we=N.filter(n=>n.dow===0||n.dow===6);
 const mid=a=>mean(a.map(n=>n.bed+n.dur/2));const sj=(wd.length&&we.length)?(mid(we)-mid(wd)):NaN;
 const short=N.filter(n=>n.dur<7).length,vshort=N.filter(n=>n.dur<6).length;
 const prev=all.slice(-60,-30);const tr=prev.length>=5?avg-mean(prev.map(n=>n.dur)):NaN;
 const ok=avg>=7&&avg<=9;
 const tips=[];
 if(avg<7)tips.push('평균 수면이 7시간보다 짧아요. 잠자리에 드는 시간을 하루 15분씩 앞당겨 보세요.');
 if(avg>9)tips.push('평균 수면이 9시간보다 길어요. 피로가 계속되면 전문가와 상담해 보세요.');
 if(bsd>45)tips.push('잠드는 시각이 들쭉날쭉해요. 매일 같은 시간에 눕는 습관이 몸의 리듬을 안정시켜요.');
 if(sj>1)tips.push('주말에 수면 시간대가 1시간 이상 늦어져요(사회적 시차). 주말에도 기상 시간을 평일과 1시간 이내로 맞춰 보세요.');
 ['잠들기 1시간 전에는 휴대폰 화면 밝기를 줄이거나 내려놓아 보세요.','오후 늦게는 커피 등 카페인을 피하는 것이 좋아요.','아침에 일어나면 햇빛을 10분 정도 쬐어 보세요.'].forEach(t=>tips.length<3&&tips.push(t));
 const met=(k,v,c)=>'<div class="metric"><span>'+k+'</span><b class="'+(c||'')+'">'+v+'</b></div>';
 $('#report').innerHTML='<div class="card"><h2>🩺 건강 리포트 <span class="note">최근 '+N.length+'일</span></h2>'
 +met('평균 수면 시간',fmtH(avg),ok?'good':'bad')
 +'<p class="note">성인 권장 수면: 7~9시간 (일반적 가이드라인 · 미국수면의학회(AASM)/미국수면재단 권고 기준)</p>'
 +met('취침 시각 평균',clk(mean(N.map(n=>n.bed))))
 +met('취침 시각 규칙성(표준편차)','±'+Math.round(bsd)+'분',bsd<=45?'good':'bad')
 +met('평일 vs 주말 차이(사회적 시차)',isNaN(sj)?'-':(sj>=0?'+':'')+Math.round(sj*60)+'분',Math.abs(sj)<=1?'good':'bad')
 +met('7시간 미만 수면한 날',short+'일 (6시간 미만 '+vshort+'일)',short>N.length/3?'bad':'good')
 +met('추세 (이전 30일 대비)',isNaN(tr)?'데이터 부족':(tr>=0?'▲ ':'▼ ')+Math.abs(Math.round(tr*60))+'분 '+(tr>=0?'증가':'감소'))
 +'</div><div class="card"><h2>💡 이렇게 해보세요</h2><ul class="tips">'+tips.map(t=>'<li>'+t+'</li>').join('')+'</ul></div>'
 +'<div class="card note">⚠️ 이 리포트는 기록을 바탕으로 한 일반 정보이며 의학적 진단이나 조언이 아닙니다. 수면 문제가 계속되면 의사와 상담하세요.'+(sample?'<br><b>현재 샘플 데이터로 계산된 결과입니다.</b>':'')+'</div>';}
render();setInterval(()=>{if($('#tab-home').classList.contains('active')&&!$('#dlg').open)render()},60000);
})();
