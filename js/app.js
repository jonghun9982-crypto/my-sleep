(function(){
const KEY='mysleep.records.v1', MODE='mysleep.sample.v1', LANG='mysleep.lang', THEME='mysleep.theme';
const $=s=>document.querySelector(s);
let lang=localStorage.getItem(LANG)||((navigator.language||'ko').startsWith('ko')?'ko':'en');
const I={ko:{
 sample:'샘플 데이터',recent:'최근 기록',addManual:'+ 추가',unfold:'펼치기 ▾',fold:'숨기기 ▴',daily14:'일별 수면 시간 (최근 14일)',lgLow:'7h 미만 (0h 검정)',lgHigh:'9h 초과 (16h+ 검정)',
 week:'주간',month:'월간',timeNote:'취침/기상 시각은 자정을 넘는 경우를 위해 “18시 기준 경과 시간”으로 계산 후 실제 시각으로 표시합니다.',
 pred7:'앞으로 7일 예측',predictBtn:'예측하기',predNote:'방법: 최근 14일 가중평균 + 요일 보정, 범위 = 최근 28일 ±1 표준편차 (추정치).',
 navHome:'기록',navCharts:'차트',navPredict:'예측',navReport:'리포트',fSleep:'잠든 시각',fWake:'기상 시각 (비워두면 수면 중)',del:'삭제',cancel:'취소',save:'저장',
 editRec:'기록 수정',addRec:'기록 추가',edit:'수정',night:'밤',sleeping:'수면 중',noRec:'기록이 없습니다',sleepingSince:(a,b)=>'😴 '+a+'부터 수면 중 · '+b+' 경과',
 sampleInfo:'지금 보이는 기록은 체험용 가짜 데이터(약 90일)입니다.',useOwn:'샘플 지우고 내 기록 사용하기',ownInfo:n=>'내 기록 사용 중 ('+n+'건, 이 기기 브라우저에만 저장)',showSample:'샘플 데이터 다시 보기',
 cfOwn:'샘플 데이터를 지우고 내 기록으로 시작할까요?',guard:'샘플 데이터 모드입니다. 리포트 탭 하단(또는 상단 배지)의 "샘플 지우고 내 기록 사용하기"를 눌러 주세요.',
 eSleep:'잠든 시각을 입력하세요',eRange:'깬 시각은 잠든 시각 이후, 24시간 이내여야 합니다',eOpen:'이미 수면 중인 기록이 있습니다',cfDel:'이 기록을 삭제할까요?',
 noChart:'차트 라이브러리를 불러오지 못했습니다.',sleepH:'수면 시간(h)',hours:'시간',clock:'시각',trendW:'주간 추이 (12주)',trendM:'월간 추이 (6개월)',avgDur:'평균 수면 시간',avgBed:'평균 취침 시각',avgWake:'평균 기상 시각',
 mon:m=>m+'월',actual:'실제 수면',predicted:'예측 수면',bedAct:'실제 취침',bedPred:'예상 취침 창',pDay:'날짜',pDur:'예상 수면',pRange:'범위',
 needPred:n=>'예측하려면 최소 7일 이상의 기록이 필요합니다 (현재 '+n+'일).',predSum:(a,b,c)=>'🔮 다음 7일 평균 약 <b>'+a+'</b>, 취침 <b>'+b+'~'+c+'</b> 예상 <span class="est">추정치</span>',
 rpTitle:'🩺 건강 리포트',needRp:'리포트를 만들려면 최소 5일 기록이 필요합니다.',
 rpSum:(n,a,b,s)=>'최근 '+n+'일 평균 <b>'+a+'</b> · 취침 '+b+' · 7시간 미만 '+s+'일',
 rpOk:'권장 범위(7~9시간) 안이에요 👍',rpLow:'권장(7~9시간)보다 조금 부족해요.',rpHigh:'권장(7~9시간)보다 길어요.',
 askPh:'수면에 대해 물어보세요…',ask:'질문',
 chips:['내 평균 수면은?','주말에 많이 자나?','가장 늦게 잔 날?','수면이 부족한 날은?','언제 자야 해?','추세는?','규칙적이야?','적정 수면시간은?','카페인 팁','낮잠 괜찮아?'],
 disc:'⚠️ 기록을 바탕으로 한 일반 정보이며 의학적 진단이나 조언이 아닙니다. 수면 문제가 계속되면 의사와 상담하세요.',sampleCalc:'현재 샘플 데이터로 계산된 결과입니다.',
 fallback:'잘 이해하지 못했어요. 이런 걸 물어볼 수 있어요:\n• 평균 수면 / 어젯밤 / 가장 오래·짧게 잔 날\n• 가장 늦게·일찍 잔 날 / 평균 기상 시각\n• 주말 vs 평일 / 사회적 시차 / 요일별\n• 수면 부족한 날 / 수면 부채 / 추세 / 규칙성\n• 언제 자야 해? / 적정 수면시간 / 예측\n• 팁: 카페인, 낮잠, 운동, 휴대폰, 술, 불면, 기록 수'
},en:{
 sample:'Sample data',recent:'Recent records',addManual:'+ Add',unfold:'Show ▾',fold:'Hide ▴',daily14:'Daily sleep (last 14 days)',lgLow:'<7h (0h black)',lgHigh:'>9h (16h+ black)',
 week:'Week',month:'Month',timeNote:'Bed/wake times are computed as hours after 18:00 (to handle midnight) and shown as clock times.',
 pred7:'Next 7 days forecast',predictBtn:'Predict',predNote:'Method: 14-day weighted average + day-of-week adjustment; range = ±1 SD of last 28 days (estimate).',
 navHome:'Log',navCharts:'Charts',navPredict:'Predict',navReport:'Report',fSleep:'Fell asleep',fWake:'Awake time (blank = still asleep)',del:'Delete',cancel:'Cancel',save:'Save',
 editRec:'Edit record',addRec:'Add record',edit:'Edit',night:'night',sleeping:'sleeping',noRec:'No records yet',sleepingSince:(a,b)=>'😴 Asleep since '+a+' · '+b,
 sampleInfo:'The records shown are fake demo data (~90 days).',useOwn:'Clear sample & use my records',ownInfo:n=>'Using my records ('+n+', stored only in this browser)',showSample:'Show sample data again',
 cfOwn:'Clear sample data and start with your own records?',guard:'Sample mode is on. Tap "Clear sample & use my records" at the bottom of the Report tab (or the badge) first.',
 eSleep:'Enter the time you fell asleep',eRange:'Wake time must be after sleep time and within 24h',eOpen:'There is already an open sleep record',cfDel:'Delete this record?',
 noChart:'Failed to load chart library.',sleepH:'Sleep (h)',hours:'hours',clock:'time',trendW:'Weekly trend (12 wks)',trendM:'Monthly trend (6 mo)',avgDur:'Avg sleep',avgBed:'Avg bedtime',avgWake:'Avg wake time',
 mon:m=>['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1],actual:'Actual sleep',predicted:'Predicted sleep',bedAct:'Actual bedtime',bedPred:'Bedtime window',pDay:'Date',pDur:'Est. sleep',pRange:'Range',
 needPred:n=>'Need at least 7 nights to predict (currently '+n+').',predSum:(a,b,c)=>'🔮 Next 7 days: ~<b>'+a+'</b> avg, bedtime <b>'+b+'–'+c+'</b> <span class="est">estimate</span>',
 rpTitle:'🩺 Health report',needRp:'Need at least 5 nights for a report.',
 rpSum:(n,a,b,s)=>'Last '+n+' nights: avg <b>'+a+'</b> · bedtime '+b+' · '+s+' nights under 7h',
 rpOk:'Within the recommended 7–9h 👍',rpLow:'A bit below the recommended 7–9h.',rpHigh:'Above the recommended 7–9h.',
 askPh:'Ask about your sleep…',ask:'Ask',
 chips:['My average sleep?','Do I sleep more on weekends?','Latest bedtime?','Short sleep nights?','When should I sleep?','Trend?','Am I regular?','How much sleep do I need?','Caffeine tips','Are naps OK?'],
 disc:'⚠️ General information based on your records, not medical diagnosis or advice. See a doctor if sleep problems persist.',sampleCalc:'Currently calculated from sample data.',
 fallback:"Sorry, I didn't get that. You can ask about:\n• average sleep / last night / longest & shortest night\n• latest & earliest bedtime / average wake time\n• weekend vs weekday / social jetlag / day of week\n• short nights / sleep debt / trend / regularity\n• when to sleep / recommended hours / prediction\n• tips: caffeine, naps, exercise, phone, alcohol, insomnia, record count"
}};
const t=(k,...a)=>{const v=I[lang][k];return typeof v==='function'?v(...a):v};
const DOW=()=>lang==='ko'?['일','월','화','수','목','금','토']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let sample=localStorage.getItem(MODE)!=='off';
let own=JSON.parse(localStorage.getItem(KEY)||'[]');
let sampleRecs=null, charts={}, period='week', folded=true;
const recs=()=>sample?(sampleRecs||(sampleRecs=genSample())):own;
function save(){if(!sample)localStorage.setItem(KEY,JSON.stringify(own));}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function genSample(){let s=42;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
 const g=()=>{let u=0;for(let i=0;i<6;i++)u+=r();return u-3};const out=[];const now=new Date();
 for(let i=90;i>=1;i--){const w=new Date(now);w.setDate(now.getDate()-i+1);const dow=w.getDay();const wkend=dow===0||dow===6;
  const trend=i/90*0.4;
  let bed=23.6+(wkend?1.1:0)+trend+g()*0.45+(r()<0.07?1.5:0); let dur=6.8+(wkend?0.9:0)-trend*0.5+g()*0.5;
  const sl=new Date(w);sl.setDate(w.getDate()-1);sl.setHours(0,0,0,0);sl.setMinutes(Math.round(bed*60));
  const wk=new Date(sl.getTime()+Math.round(dur*60)*60000);out.push({id:'s'+i,sleep:sl.toISOString(),wake:wk.toISOString()});}
 return out;}
// helpers
const pad=n=>String(n).padStart(2,'0');
const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
const md=d=>(d.getMonth()+1)+'/'+d.getDate()+'('+DOW()[d.getDay()]+')';
const fmtH=h=>{if(h==null||isNaN(h))return'-';const m=Math.round(h*60);return lang==='ko'?Math.floor(m/60)+'시간 '+(m%60)+'분':Math.floor(m/60)+'h '+(m%60)+'m'};
const fmtM=m=>{m=Math.round(Math.abs(m));return lang==='ko'?(m>=60?Math.floor(m/60)+'시간 ':'')+(m%60)+'분':(m>=60?Math.floor(m/60)+'h ':'')+(m%60)+'m'};
const off=d=>((d.getHours()+d.getMinutes()/60-18)+24)%24;
const clk=v=>{let x=((v+18)%24+24)%24;const m=Math.round(x*60)%1440;return pad(Math.floor(m/60))+':'+pad(m%60)};
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;
const sd=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/(a.length-1))};
const dkey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const toLocal=iso=>{if(!iso)return'';const d=new Date(iso);return dkey(d)+'T'+hm(d)};
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function nights(){return recs().filter(r=>r.wake).map(r=>{const s=new Date(r.sleep),w=new Date(r.wake);
 return{s,w,dur:(w-s)/36e5,bed:off(s),wk:off(w),key:dkey(w),dow:w.getDay()}}).filter(n=>n.dur>0&&n.dur<24).sort((a,b)=>a.w-b.w);}
const nightLabel=n=>md(new Date(n.s-12*36e5));
// theme & lang
function applyTheme(){const th=document.documentElement.dataset.theme;$('#btnTheme').textContent=th==='dark'?'☀️':'🌙';
 document.querySelector('meta[name=theme-color]').content=css('--bg');
 if(hasChart()){Chart.defaults.color=css('--mut');Chart.defaults.borderColor=css('--line');}}
$('#btnTheme').onclick=()=>{const th=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=th;localStorage.setItem(THEME,th);applyTheme();refresh();};
matchMedia('(prefers-color-scheme: light)').addEventListener('change',e=>{if(!localStorage.getItem(THEME)){document.documentElement.dataset.theme=e.matches?'light':'dark';applyTheme();refresh();}});
function applyLang(){document.documentElement.lang=lang;$('#btnLang').textContent=lang==='ko'?'EN':'한';
 document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));}
$('#btnLang').onclick=()=>{lang=lang==='ko'?'en':'ko';localStorage.setItem(LANG,lang);applyLang();refresh();};
function refresh(){render();if(typeof miniRender==='function')miniRender();if(typeof accRefresh==='function')accRefresh();}
// home
function render(){
 $('#badge').classList.toggle('hide',!sample);
 const all=recs().slice().sort((a,b)=>new Date(b.sleep)-new Date(a.sleep));const open=all.find(r=>!r.wake);
 const tb=$('#btnToggle'),KOx=lang==='ko';tb.classList.toggle('zz',!!open);
 tb.innerHTML=open?'<span class="w">'+(KOx?'기상':'Awake')+'</span><span class="el">'+fmtH((Date.now()-new Date(open.sleep))/36e5)+'</span>':'<span class="w">'+(KOx?'수면':'Sleep')+'</span>';
 $('#disc').innerHTML=t('disc')+(sample?'<br><b>'+t('sampleCalc')+'</b>':'');
 $('#btnFold').textContent=folded?t('unfold'):t('fold');$('#list').classList.toggle('hide',folded);
 $('#list').innerHTML=all.slice(0,10).map(r=>{const s=new Date(r.sleep),w=r.wake&&new Date(r.wake);
  return '<li><span><span class="d">'+md(new Date(s-12*36e5))+' '+t('night')+'</span> '+hm(s)+' → '+(w?hm(w)+' <span class="note">'+fmtH((w-s)/36e5)+'</span>':t('sleeping'))+'</span><button class="small" data-id="'+r.id+'">'+t('edit')+'</button></li>'}).join('')||'<li class="note">'+t('noRec')+'</li>';
 $('#sampleBox').innerHTML=sample?'<p>⚙️ '+t('sampleInfo')+'</p><button id="btnOwn" class="small">'+t('useOwn')+'</button>'
  :'<p class="note">'+t('ownInfo',own.length)+'</p><button id="btnSample" class="small">'+t('showSample')+'</button>';
 const bo=$('#btnOwn');if(bo)bo.onclick=()=>{if(confirm(t('cfOwn'))){sample=false;localStorage.setItem(MODE,'off');render();}};
 const bs=$('#btnSample');if(bs)bs.onclick=()=>{sample=true;localStorage.setItem(MODE,'on');render();};
 bkRender();document.querySelectorAll('#list button').forEach(b=>b.onclick=()=>openDlg(b.dataset.id));
 if($('#tab-charts').classList.contains('active'))drawCharts();
 if($('#tab-report').classList.contains('active'))report();
}
$('#btnFold').onclick=()=>{folded=!folded;render();};
$('#badge').style.cursor='pointer';$('#badge').onclick=()=>document.querySelector('nav button[data-t=report]').click();
function guardSample(){if(sample){alert(t('guard'));return true}return false}
function setTh(th){document.documentElement.dataset.theme=th;localStorage.setItem(THEME,th);applyTheme();}
$('#btnToggle').onclick=()=>{if(guardSample())return;const o=own.find(r=>!r.wake);
 if(o){o.wake=new Date().toISOString();setTh('light');}else{own.push({id:uid(),sleep:new Date().toISOString(),wake:null});setTh('dark');}save();refresh();};
setInterval(()=>{if(own.some(r=>!r.wake)&&!sample)render()},60000);
$('#btnAdd').onclick=()=>{if(guardSample())return;openDlg(null)};
let editId=null;
function openDlg(id){if(id&&guardSample())return;editId=id;const r=own.find(x=>x.id===id);
 $('#dlgTitle').textContent=r?t('editRec'):t('addRec');$('#dlgDel').style.visibility=r?'visible':'hidden';$('#dlgErr').textContent='';
 $('#fSleep').value=r?toLocal(r.sleep):'';$('#fWake').value=r?toLocal(r.wake):'';$('#dlg').showModal();}
$('#dlgSave').onclick=()=>{const sv=$('#fSleep').value,wv=$('#fWake').value;if(!sv){$('#dlgErr').textContent=t('eSleep');return}
 const s=new Date(sv),w=wv?new Date(wv):null;if(w&&(w<=s||(w-s)>24*36e5)){$('#dlgErr').textContent=t('eRange');return}
 if(!w&&own.some(r=>!r.wake&&r.id!==editId)){$('#dlgErr').textContent=t('eOpen');return}
 const rec={id:editId||uid(),sleep:s.toISOString(),wake:w?w.toISOString():null};
 if(editId)own[own.findIndex(r=>r.id===editId)]=rec;else own.push(rec);save();$('#dlg').close();render();};
$('#dlgDel').onclick=()=>{if(confirm(t('cfDel'))){own=own.filter(r=>r.id!==editId);save();$('#dlg').close();render();}};
// tabs
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id==='tab-'+b.dataset.t));
 if(b.dataset.t==='charts')drawCharts();if(b.dataset.t==='report')report();window.scrollTo(0,0);});
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{period=b.dataset.p;document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b));drawCharts();});
// charts
const hasChart=()=>typeof Chart!=='undefined';
function mk(id,cfg){if(charts[id])charts[id].destroy();charts[id]=new Chart($('#'+id),cfg);}
if(hasChart()){Chart.defaults.animation=false;Chart.defaults.maintainAspectRatio=false;}
const lerp=(a,b,f)=>{const p=x=>[1,3,5].map(i=>parseInt(x.substr(i,2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>pad(Math.round(v+(B[i]-v)*f).toString(16))).join('')};
function barColor(v){if(v==null)return'#888';
 if(v>=7&&v<=9)return'#4fb3ff';
 if(v<7){return v>=3.5?lerp('#e02020','#ff9a7a',(v-3.5)/3.5):lerp('#000000','#e02020',Math.max(0,v)/3.5)}
 return v<=12.5?lerp('#3d8bff','#0a1a8f',(v-9)/3.5):lerp('#0a1a8f','#000000',Math.min(1,(v-12.5)/3.5));}
function drawCharts(){if(!hasChart()){$('#tab-charts .card').insertAdjacentHTML('afterbegin','<p class="err">'+t('noChart')+'</p>');return}
 const N=nights();const byDay={};N.forEach(n=>{(byDay[n.key]=byDay[n.key]||[]).push(n)});
 const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d)}
 const vals=days.map(d=>{const a=byDay[dkey(d)];return a?+a.reduce((x,n)=>x+n.dur,0).toFixed(2):null});
 mk('cDaily',{type:'bar',data:{labels:days.map(d=>(d.getMonth()+1)+'/'+d.getDate()),datasets:[{label:t('sleepH'),data:vals,
  backgroundColor:vals.map(barColor),borderColor:css('--line'),borderWidth:1,borderRadius:4}]},
  options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtH(c.raw)}}},scales:{y:{min:0,suggestedMax:10,title:{display:true,text:t('hours')}}}}});
 const groups=[];const cnt=period==='week'?12:6;
 for(let i=cnt-1;i>=0;i--){let a,b,label;const now=new Date();
  if(period==='week'){b=new Date(now);b.setHours(23,59,59);b.setDate(b.getDate()-7*i);a=new Date(b);a.setDate(a.getDate()-6);a.setHours(0,0,0);label=(a.getMonth()+1)+'/'+a.getDate()+'~';}
  else{a=new Date(now.getFullYear(),now.getMonth()-i,1);b=new Date(now.getFullYear(),now.getMonth()-i+1,0,23,59,59);label=t('mon',a.getMonth()+1);}
  const g=N.filter(n=>n.w>=a&&n.w<=b);groups.push({label,dur:g.length?mean(g.map(n=>n.dur)):null,bed:g.length?mean(g.map(n=>n.bed)):null,wk:g.length?mean(g.map(n=>n.wk)):null});}
 $('#trendTitle').textContent=period==='week'?t('trendW'):t('trendM');
 const L=groups.map(g=>g.label),r2=v=>v==null?null:+v.toFixed(2);
 mk('cDur',{type:'line',data:{labels:L,datasets:[{label:t('avgDur'),data:groups.map(g=>r2(g.dur)),borderColor:'#4fb3ff',tension:.3,spanGaps:true}]},
  options:{plugins:{tooltip:{callbacks:{label:c=>fmtH(c.raw)}}},scales:{y:{suggestedMin:5,suggestedMax:9,title:{display:true,text:t('hours')}}}}});
 mk('cTime',{type:'line',data:{labels:L,datasets:[{label:t('avgBed'),data:groups.map(g=>r2(g.bed)),borderColor:'#8f93ff',tension:.3,spanGaps:true},
  {label:t('avgWake'),data:groups.map(g=>r2(g.wk)),borderColor:'#f0a030',tension:.3,spanGaps:true}]},
  options:{plugins:{tooltip:{callbacks:{label:c=>c.dataset.label+': '+clk(c.raw)}}},scales:{y:{reverse:true,ticks:{callback:v=>clk(v),stepSize:2},title:{display:true,text:t('clock')}}}}});
}
// prediction
function model(N){const last=N.slice(-28);const wma=k=>{const a=last.slice(-14);let sw=0,s=0;a.forEach((n,i)=>{s+=n[k]*(i+1);sw+=i+1});return s/sw};
 const base={dur:wma('dur'),bed:wma('bed')};
 const eff=k=>{const e={};const all=N.slice(-56);for(let d=0;d<7;d++){const a=all.filter(n=>n.dow===d).map(n=>n[k]);e[d]=a.length>=2?mean(a)-mean(all.map(n=>n[k])):0}return e};
 return{base,e:{dur:eff('dur'),bed:eff('bed')},sd:{dur:sd(last.map(n=>n.dur)),bed:sd(last.map(n=>n.bed))}};}
function forecast(N){const M=model(N);const out=[];for(let i=1;i<=7;i++){const d=new Date();d.setDate(d.getDate()+i);const w=d.getDay();
  out.push({d,dur:M.base.dur+M.e.dur[w],bed:M.base.bed+M.e.bed[w]})}return{M,f:out};}
function predict(){const N=nights();$('#predEst').textContent=lang==='ko'?'* 추정치':'* Estimate';
 if(N.length<7){$('#predErr').textContent=t('needPred',N.length);if(charts.cPred){charts.cPred.destroy();delete charts.cPred}return}
 $('#predErr').textContent='';if(!hasChart())return;const {M,f}=forecast(N),r=v=>+v.toFixed(2);
 mk('cPred',{type:'line',data:{labels:f.map(x=>md(x.d)),datasets:[
  {label:'hi',data:f.map(x=>r(x.dur+M.sd.dur)),borderColor:'transparent',pointRadius:0,fill:false,tension:.3},
  {label:'lo',data:f.map(x=>r(x.dur-M.sd.dur)),borderColor:'transparent',backgroundColor:'rgba(240,160,48,.18)',pointRadius:0,fill:'-1',tension:.3},
  {label:t('predicted'),data:f.map(x=>r(x.dur)),borderColor:'#f0a030',backgroundColor:'#f0a030',borderWidth:2.5,pointRadius:3,tension:.3}]},
  options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{filter:i=>i.datasetIndex===2,callbacks:{label:c=>fmtH(c.raw)}}},
   scales:{x:{ticks:{maxRotation:0,font:{size:10}}},y:{suggestedMin:5,suggestedMax:9,ticks:{callback:v=>v+'h'}}}}});
}
const KO=()=>lang==='ko';
const ACC={f7:['📅 7일 예측','📅 7-day forecast'],bed:['⏰ 목표 기상 시간 → 권장 취침 시간','⏰ Target wake time → bedtime'],debt:['💳 수면 빚','💳 Sleep debt'],acc:['🎯 예측 정확도','🎯 Prediction accuracy'],warn:['⚠️ 다음 주 수면 부족 주의일','⚠️ Short-sleep risk days next week']};
function need(){const N=nights().slice(-28);const m=N.length>=7?mean(N.map(n=>n.dur)):7.5;return Math.min(9,Math.max(7,m||7.5))}
function bedCalc(){const v=$('#wkIn').value||'07:00';const [H,Mi]=v.split(':').map(Number);const W=H+Mi/60,nd=need(),lat=0.25;
 const c=x=>clk(x-18);let s='<p>'+(KO()?'평소 필요 수면 ':'Your sleep need ')+'<b>'+fmtH(nd)+'</b>'+(KO()?' (최근 28일 평균, 7~9h 범위·기록 부족 시 7.5h) + 잠드는 시간 15분':' (28-day avg, clamped 7–9h, 7.5h default) + 15 min to fall asleep')+'</p>';
 s+='<p>'+(KO()?'권장 취침: ':'Recommended bedtime: ')+'<b>'+c(W-nd-lat)+'</b></p><p>'+(KO()?'90분 주기 옵션:':'90-min cycle options:')+'</p><ul>';
 [6,5,4].forEach(k=>{s+='<li><span>'+k+(KO()?' 주기 ('+fmtH(k*1.5)+')':' cycles ('+fmtH(k*1.5)+')')+'</span><b>'+c(W-k*1.5-lat)+'</b></li>'});$('#bedOut').innerHTML=s+'</ul>';}
function debtCalc(){const N=nights().slice(-14);if(N.length<3){$('#debtOut').innerHTML='<p class="err">'+t('needPred',N.length)+'</p>';return}
 const d=N.reduce((s,n)=>s+(8-n.dur),0),pos=Math.max(0,d);
 let s='<p>'+(KO()?'최근 '+N.length+'일 기준 8시간 대비 누적 ':'Last '+N.length+' nights vs 8h, accumulated ')+(d>0?(KO()?'부족':'deficit'):(KO()?'여유':'surplus'))+': <b>'+fmtH(Math.abs(d))+'</b></p>';
 if(pos>0)s+='<p>'+(KO()?'회복: 매일 +30분이면 약 <b>'+Math.ceil(pos/0.5)+'일</b>, +60분이면 약 <b>'+Math.ceil(pos)+'일</b>':'Recovery: ~<b>'+Math.ceil(pos/0.5)+' days</b> at +30 min/night, ~<b>'+Math.ceil(pos)+' days</b> at +60 min/night')+'</p>';
 $('#debtOut').innerHTML=s+'<p class="note">'+(KO()?'단순 합산 추정치입니다.':'Simple sum; estimate only.')+'</p>';}
function accCalc(){const N=nights();if(N.length<21){$('#accOut').innerHTML='<p class="err">'+(KO()?'백테스트에는 최소 21일 기록이 필요합니다 (현재 '+N.length+'일).':'Backtest needs at least 21 nights (currently '+N.length+').')+'</p>';return}
 let ed=0,eb=0,rows='',k=0;for(let i=N.length-14;i<N.length;i++){const M=model(N.slice(0,i)),n=N[i];const pd=M.base.dur+M.e.dur[n.dow],pb=M.base.bed+M.e.bed[n.dow];ed+=Math.abs(pd-n.dur);eb+=Math.abs(pb-n.bed);k++;
  rows+='<tr><td>'+md(n.w)+'</td><td>'+fmtH(pd)+'</td><td>'+fmtH(n.dur)+'</td><td>'+Math.round(Math.abs(pd-n.dur)*60)+(KO()?'분':'m')+'</td></tr>'}
 $('#accOut').innerHTML='<p>'+(KO()?'최근 14일을 각각 이전 기록만으로 예측한 결과 — 평균 절대 오차: 수면 <b>'+Math.round(ed/k*60)+'분</b>, 취침 <b>'+Math.round(eb/k*60)+'분</b>':'Each of the last 14 nights predicted from prior data only — mean abs error: sleep <b>'+Math.round(ed/k*60)+' min</b>, bedtime <b>'+Math.round(eb/k*60)+' min</b>')+'</p><table><tr><th>'+t('pDay')+'</th><th>'+(KO()?'예측':'Pred')+'</th><th>'+(KO()?'실제':'Actual')+'</th><th>'+(KO()?'오차':'Err')+'</th></tr>'+rows+'</table>';}
function warnCalc(){const N=nights();if(N.length<7){$('#warnOut').innerHTML='<p class="err">'+t('needPred',N.length)+'</p>';return}
 const {M,f}=forecast(N);const lows=f.filter(x=>x.dur<7||M.e.dur[x.d.getDay()]<-0.33);
 let s=lows.length?'<ul>'+lows.map(x=>{const why=x.dur<7?(KO()?'예측 7시간 미만':'forecast <7h'):(KO()?'평소 이 요일이 짧음 ('+Math.round(M.e.dur[x.d.getDay()]*60)+'분)':'this weekday usually short ('+Math.round(M.e.dur[x.d.getDay()]*60)+' min)');return '<li><span>'+md(x.d)+' · '+why+'</span><b>'+fmtH(x.dur)+'</b></li>'}).join('')+'</ul>'
  :'<p>'+(KO()?'다음 7일 중 특별히 주의할 날이 없어요 👍':'No risk days in the next 7 days 👍')+'</p>';
 $('#warnOut').innerHTML=s+'<p class="note">'+(KO()?'기준: 예측 < 7시간 또는 요일 평균이 전체보다 20분 이상 짧음.':'Rule: forecast < 7h or weekday avg ≥20 min below overall.')+'</p>';}
const CALC={f7:predict,bed:bedCalc,debt:debtCalc,acc:accCalc,warn:warnCalc};
function accLabels(){document.querySelectorAll('.accb').forEach(b=>b.textContent=ACC[b.dataset.k][KO()?0:1]+(b.classList.contains('open')?' ▴':' ▾'));$('#wkLbl').textContent=KO()?'목표 기상 시간':'Target wake time';}
function accRefresh(){accLabels();document.querySelectorAll('.accb.open').forEach(b=>CALC[b.dataset.k]())}
document.querySelectorAll('.accb').forEach(b=>b.onclick=()=>{const p=b.nextElementSibling,o=p.classList.toggle('hide');b.classList.toggle('open',!o);if(!o)CALC[b.dataset.k]();accLabels();});
$('#wkIn').oninput=bedCalc;accLabels();
// report + Q&A
function stats(){const all=nights();const N=all.slice(-30);if(N.length<5)return null;
 const avg=mean(N.map(n=>n.dur)),bed=mean(N.map(n=>n.bed)),bsd=sd(N.map(n=>n.bed))*60,wk=mean(N.map(n=>n.wk)),wsd=sd(N.map(n=>n.wk))*60;
 const wd=N.filter(n=>n.dow>=1&&n.dow<=5),we=N.filter(n=>n.dow===0||n.dow===6);
 const mid=a=>mean(a.map(n=>n.bed+n.dur/2));const sj=(wd.length&&we.length)?(mid(we)-mid(wd)):NaN;
 const prev=all.slice(-60,-30);const tr=prev.length>=5?avg-mean(prev.map(n=>n.dur)):NaN;
 const by=(k,dir)=>N.reduce((a,b)=>(dir>0?b[k]>a[k]:b[k]<a[k])?b:a);
 const dowAvg=[0,1,2,3,4,5,6].map(d=>{const a=N.filter(n=>n.dow===d);return a.length?mean(a.map(n=>n.dur)):NaN});
 return{all,N,avg,bed,bsd,wk,wsd,wd,we,sj,tr,short:N.filter(n=>n.dur<7),vshort:N.filter(n=>n.dur<6),latest:by('bed',1),earliest:by('bed',-1),longest:by('dur',1),shortest:by('dur',-1),
  debt:N.slice(-7).reduce((s,n)=>s+Math.max(0,7.5-n.dur),0),dowAvg,wdAvg:wd.length?mean(wd.map(n=>n.dur)):NaN,weAvg:we.length?mean(we.map(n=>n.dur)):NaN};}
const INTENTS=[
 ['recommended',['적정','권장','몇시간자야','몇시간이좋','얼마나자야','howmuchsleep','howmanyhours','recommended','needsleep','ideal']],
 ['caffeine',['카페인','커피','에너지음료','caffeine','coffee','energydrink']],
 ['nap',['낮잠','낙잠','nap']],
 ['exercise',['운동','exercise','workout','gym']],
 ['phone',['휴대폰','핸드폰','스마트폰','폰','화면','블루라이트','phone','screen','bluelight']],
 ['alcohol',['술','알코올','음주','alcohol','beer','wine','drink']],
 ['insomnia',['잠이안','불면','잠이안와','못자','뒤척','insomnia','cantsleep','can\'tsleep','fallasleep']],
 ['predict',['예측','내일','앞으로','predict','forecast','tomorrow']],
 ['jetlag',['사회적시차','시차','jetlag']],
 ['debt',['부채','빚','sleepdebt','debt']],
 ['weekend',['주말','weekend']],
 ['weekday',['평일','weekday']],
 ['dow',['요일','dayofweek','whichday','bestday']],
 ['latest',['가장늦게','제일늦게','늦게잔','latest','latebed','latestbed']],
 ['earliest',['가장일찍','제일일찍','일찍잔','earliest']],
 ['longest',['가장많이','제일많이','가장오래','제일오래','최대','longest','most']],
 ['shortest',['가장적게','제일적게','가장짧','제일짧','최소','shortest','least']],
 ['short',['부족','모자','7시간미만','짧은날','short','lack','notenough','under7']],
 ['when',['언제자','몇시에자','취침시간','잘시간','whenshould','whentosleep','bedtime','whatime','whattime']],
 ['wake',['기상','일어나','wake','wakeup','getup']],
 ['trend',['추세','변화','좋아지','나빠지','trend','improv','gettingbetter','worse']],
 ['regular',['규칙','일정','들쭉','regular','consistent','consistency']],
 ['last',['어젯밤','어제','지난밤','최근수면','lastnight','yesterday']],
 ['count',['기록','몇일','며칠','데이터','records','howmanydays','count','data']],
 ['tips',['팁','조언','개선','방법','잘자','tip','advice','improve','better']],
 ['avg',['평균','보통','얼마나자','몇시간','average','mean','usually','howlong','howmuch']],
 ['hello',['안녕','하이','hello','hey']]];
function answer(q){const S=stats();const s=q.toLowerCase().replace(/[\s?!.,~]/g,'');
 const it=(INTENTS.find(([,ks])=>ks.some(k=>s.includes(k)))||[])[0];const ko=lang==='ko';
 const nd=n=>nightLabel(n)+(ko?' 밤':' night');
 const A={
  recommended:()=>ko?'성인 권장 수면은 7~9시간이에요(AASM/미국수면재단). 내 평균은 '+fmtH(S.avg)+'(으)로 '+(S.avg<7?'조금 부족해요.':S.avg>9?'권장보다 길어요.':'권장 범위 안이에요.'):'Adults are generally advised 7–9h (AASM/NSF). Your average is '+fmtH(S.avg)+' — '+(S.avg<7?'a bit short.':S.avg>9?'above the range.':'within range.'),
  caffeine:()=>ko?'카페인은 반감기가 5~6시간이라, 취침 평균 '+clk(S.bed)+' 기준 '+clk(S.bed-8)+' 이후로는 커피·에너지음료를 피하는 걸 권해요.':'Caffeine has a 5–6h half-life. With your avg bedtime '+clk(S.bed)+', try to avoid coffee/energy drinks after '+clk(S.bed-8)+'.',
  nap:()=>ko?'낮잠은 오후 3시 이전, 20~30분 이내가 좋아요. 길거나 늦은 낮잠은 밤잠을 방해할 수 있어요.'+(S.avg<7?' 평균 수면이 부족한 편이라 짧은 낮잠은 도움이 될 수 있어요.':''):'Keep naps to 20–30 min and before 3 PM; long or late naps can hurt night sleep.'+(S.avg<7?' Since your average is short, a brief nap may help.':''),
  exercise:()=>ko?'규칙적인 운동은 수면의 질을 높여요. 다만 격한 운동은 취침 2~3시간 전('+clk(S.bed-2.5)+' 이전)까지 마치는 게 좋아요.':'Regular exercise improves sleep quality. Finish intense workouts 2–3h before bed (before '+clk(S.bed-2.5)+').',
  phone:()=>ko?'잠들기 1시간 전('+clk(S.bed-1)+'쯤)부터 휴대폰을 내려놓거나 밝기를 낮춰 보세요. 빛과 알림이 잠드는 걸 늦춰요.':'Put the phone down or dim it ~1h before bed (around '+clk(S.bed-1)+'). Light and notifications delay sleep.',
  alcohol:()=>ko?'술은 잠들기는 쉽게 해도 밤중에 자주 깨게 하고 깊은 잠을 줄여요. 취침 3시간 전부터는 피하는 게 좋아요.':'Alcohol may help you doze off but fragments sleep and reduces deep sleep. Avoid it within 3h of bed.',
  insomnia:()=>ko?'20분 이상 잠이 안 오면 잠시 일어나 어두운 곳에서 조용한 활동을 하다 졸릴 때 다시 누워 보세요. 기상 시각을 매일 같게 유지하는 게 핵심이에요. 몇 주 이상 계속되면 전문의 상담을 권해요.':"If you can't sleep for 20+ min, get up, do something calm in dim light, and return when sleepy. Keep a fixed wake time. If it lasts weeks, see a specialist.",
  predict:()=>{const {M,f}=forecast(S.all);const x=f[0];return ko?'내일('+md(x.d)+') 예상 수면은 약 '+fmtH(x.dur)+', 취침은 '+clk(x.bed)+' 전후예요(추정치). 예측 탭에서 7일 예측을 볼 수 있어요.':'Tomorrow ('+md(x.d)+'): ~'+fmtH(x.dur)+', bedtime around '+clk(x.bed)+' (estimate). See the Predict tab for the 7-day list.'},
  jetlag:()=>isNaN(S.sj)?(ko?'평일/주말 데이터가 부족해요.':'Not enough weekday/weekend data.'):(ko?'주말 수면 중간점이 평일보다 '+fmtM(S.sj*60)+' '+(S.sj>=0?'늦어요':'빨라요')+'. '+(Math.abs(S.sj)>1?'1시간 이상이라 사회적 시차가 있어요.':'1시간 이내라 양호해요.'):'Your weekend sleep midpoint is '+fmtM(S.sj*60)+' '+(S.sj>=0?'later':'earlier')+' than weekdays. '+(Math.abs(S.sj)>1?'Over 1h — that is social jetlag.':'Within 1h — fine.')),
  debt:()=>ko?'최근 7일 수면 부채(7.5시간 기준)는 약 '+fmtH(S.debt)+'이에요. '+(S.debt>3?'며칠간 30분씩 일찍 자며 천천히 갚아 보세요.':'크지 않아요.'):'Sleep debt over the last 7 nights (vs 7.5h): ~'+fmtH(S.debt)+'. '+(S.debt>3?'Repay it gradually by going to bed 30 min earlier for a few days.':'Not much.'),
  weekend:()=>ko?'주말 평균 '+fmtH(S.weAvg)+', 평일 평균 '+fmtH(S.wdAvg)+' → 주말에 '+fmtM((S.weAvg-S.wdAvg)*60)+' '+(S.weAvg>=S.wdAvg?'더 자요.':'덜 자요.'):'Weekend avg '+fmtH(S.weAvg)+' vs weekday '+fmtH(S.wdAvg)+' → '+fmtM((S.weAvg-S.wdAvg)*60)+' '+(S.weAvg>=S.wdAvg?'more on weekends.':'less on weekends.'),
  weekday:()=>ko?'평일 평균 수면은 '+fmtH(S.wdAvg)+'이에요 (주말 '+fmtH(S.weAvg)+').':'Weekday average is '+fmtH(S.wdAvg)+' (weekend '+fmtH(S.weAvg)+').',
  dow:()=>{const D=DOW(),v=S.dowAvg.map((x,i)=>[x,i]).filter(x=>!isNaN(x[0])).sort((a,b)=>b[0]-a[0]);return(ko?'요일별(기상일 기준) 평균: ':'By wake day: ')+v.map(x=>D[x[1]]+' '+fmtH(x[0])).join(', ')},
  latest:()=>ko?'가장 늦게 잔 날은 '+nd(S.latest)+' '+hm(S.latest.s)+'이에요 ('+fmtH(S.latest.dur)+' 수면).':'Latest bedtime: '+nd(S.latest)+' at '+hm(S.latest.s)+' ('+fmtH(S.latest.dur)+').',
  earliest:()=>ko?'가장 일찍 잔 날은 '+nd(S.earliest)+' '+hm(S.earliest.s)+'이에요.':'Earliest bedtime: '+nd(S.earliest)+' at '+hm(S.earliest.s)+'.',
  longest:()=>ko?'가장 오래 잔 날은 '+nd(S.longest)+', '+fmtH(S.longest.dur)+'이에요.':'Longest sleep: '+nd(S.longest)+', '+fmtH(S.longest.dur)+'.',
  shortest:()=>ko?'가장 짧게 잔 날은 '+nd(S.shortest)+', '+fmtH(S.shortest.dur)+'이에요.':'Shortest sleep: '+nd(S.shortest)+', '+fmtH(S.shortest.dur)+'.',
  short:()=>{const l=S.short.slice(-5).reverse().map(n=>nightLabel(n)+' '+fmtH(n.dur)).join(', ');return ko?'최근 '+S.N.length+'일 중 7시간 미만은 '+S.short.length+'일(6시간 미만 '+S.vshort.length+'일)이에요.'+(l?'\n최근: '+l:''):S.short.length+' of the last '+S.N.length+' nights were under 7h ('+S.vshort.length+' under 6h).'+(l?'\nRecent: '+l:'')},
  when:()=>{const target=S.wk-8;return ko?'평균 기상 '+clk(S.wk)+' 기준으로 8시간을 자려면 '+clk(target)+' 쯤 잠드는 게 좋아요. 잠드는 데 걸리는 시간을 고려해 '+clk(target-0.25)+'에 누워 보세요.':'With your avg wake time '+clk(S.wk)+', aim to fall asleep around '+clk(target)+' for 8h — get in bed around '+clk(target-0.25)+'.'},
  wake:()=>ko?'평균 기상 시각은 '+clk(S.wk)+' (±'+Math.round(S.wsd)+'분)이에요.':'Average wake time: '+clk(S.wk)+' (±'+Math.round(S.wsd)+' min).',
  trend:()=>isNaN(S.tr)?(ko?'추세를 보려면 60일 정도 기록이 필요해요.':'Need ~60 days of data for a trend.'):(ko?'이전 30일 대비 평균 수면이 '+fmtM(S.tr*60)+' '+(S.tr>=0?'늘었어요 📈':'줄었어요 📉'):'Vs the previous 30 days, average sleep '+(S.tr>=0?'rose':'fell')+' by '+fmtM(S.tr*60)+(S.tr>=0?' 📈':' 📉')),
  regular:()=>ko?'취침 시각 편차는 ±'+Math.round(S.bsd)+'분, 기상은 ±'+Math.round(S.wsd)+'분이에요. '+(S.bsd<=45?'꽤 규칙적이에요 👍':'들쭉날쭉한 편이에요. 매일 같은 시각에 일어나는 것부터 시작해 보세요.'):'Bedtime varies ±'+Math.round(S.bsd)+' min, wake ±'+Math.round(S.wsd)+' min. '+(S.bsd<=45?'Fairly regular 👍':'Quite irregular — start with a fixed wake time.'),
  last:()=>{const n=S.all[S.all.length-1];return ko?'지난 수면: '+nd(n)+' '+hm(n.s)+' → '+hm(n.w)+' ('+fmtH(n.dur)+')':'Last sleep: '+nd(n)+' '+hm(n.s)+' → '+hm(n.w)+' ('+fmtH(n.dur)+')'},
  count:()=>ko?'완료된 수면 기록은 '+S.all.length+'건이고, 리포트는 최근 '+S.N.length+'일 기준이에요.':S.all.length+' completed nights recorded; the report uses the last '+S.N.length+'.',
  tips:()=>{const tp=[];if(S.avg<7)tp.push(ko?'취침을 하루 15분씩 앞당겨 보세요.':'Move bedtime 15 min earlier each day.');if(S.bsd>45)tp.push(ko?'매일 같은 시각에 눕고 일어나세요.':'Keep consistent bed/wake times.');if(S.sj>1)tp.push(ko?'주말 기상을 평일과 1시간 이내로 맞춰 보세요.':'Keep weekend wake time within 1h of weekdays.');
   tp.push(ko?'아침 햇빛 10분, 오후 카페인 피하기, 자기 전 화면 줄이기.':'Morning sunlight 10 min, no afternoon caffeine, less screen before bed.');return '• '+tp.join('\n• ')},
  avg:()=>ko?'최근 '+S.N.length+'일 평균 수면은 '+fmtH(S.avg)+', 평균 취침 '+clk(S.bed)+', 기상 '+clk(S.wk)+'이에요.':'Last '+S.N.length+' nights: average '+fmtH(S.avg)+', bedtime '+clk(S.bed)+', wake '+clk(S.wk)+'.',
  hello:()=>ko?'안녕하세요! 아래 추천 질문을 눌러 보거나 수면에 대해 자유롭게 물어보세요.':'Hi! Tap a suggestion below or ask anything about your sleep.'};
 return it?A[it]():t('fallback');}
function report(){const S=stats();if(!S){$('#report').innerHTML='<div class="card"><h2>'+t('rpTitle')+'</h2><p>'+t('needRp')+'</p></div>';return}
 const prevAns=$('#ans')?$('#ans').dataset.q:'';
 $('#report').innerHTML='<div class="card"><h2>'+t('rpTitle')+'</h2><p class="sum">'+t('rpSum',S.N.length,fmtH(S.avg),clk(S.bed)+' ±'+Math.round(S.bsd)+(lang==='ko'?'분':'m'),S.short.length)+'<br><span class="'+(S.avg>=7&&S.avg<=9?'good':'bad')+'">'+(S.avg<7?t('rpLow'):S.avg>9?t('rpHigh'):t('rpOk'))+'</span></p>'
 +'<form class="qa" id="qaForm"><input id="qIn" placeholder="'+t('askPh')+'" autocomplete="off"><button class="primary">'+t('ask')+'</button></form>'
 +'<div class="chips">'+t('chips').map(c=>'<button type="button">'+c+'</button>').join('')+'</div><div id="ans" class="ans hide"></div><div class="mini" data-m="health"></div></div>'
;
 const ask=q=>{q=q.trim();if(!q)return;const a=$('#ans');a.dataset.q=q;a.classList.remove('hide');a.innerHTML='';const qs=document.createElement('span');qs.className='q';qs.textContent='Q. '+q;a.append(qs,document.createTextNode(answer(q)));};
 $('#qaForm').onsubmit=e=>{e.preventDefault();ask($('#qIn').value);$('#qIn').value='';};
 document.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>ask(b.textContent));
 if(prevAns)ask(prevAns);miniRender();}
function fitH(){const r=document.documentElement.style;r.setProperty('--hh',document.querySelector('header').offsetHeight+'px');r.setProperty('--nh',document.querySelector('nav').offsetHeight+'px');}
addEventListener('resize',fitH);addEventListener('orientationchange',fitH);if(window.visualViewport)visualViewport.addEventListener('resize',fitH);
applyTheme();applyLang();render();fitH();

// mini pattern reports
const MINI_EMO={daily:'📊',trend:'📈',pred:'🔮',health:'🩺',bed:'🌙'};
const miniOpen=new Set();
function miniText(k){const ko=KO(),N=nights(),MORE=ko?'기록이 더 쌓이면 보여드릴게요 🌱':"I'll show this once more records build up 🌱";
 const mins=v=>fmtM(v*60),D=DOW();
 if(k==='daily'){const now=new Date(),c1=new Date(now),c2=new Date(now);c1.setDate(now.getDate()-7);c2.setDate(now.getDate()-14);
  const a=N.filter(n=>n.w>c1),b=N.filter(n=>n.w>c2&&n.w<=c1);if(a.length<3||b.length<3)return MORE;
  const d=mean(a.map(n=>n.dur))-mean(b.map(n=>n.dur)),sh=a.filter(n=>n.dur<7).length,same=Math.abs(d)<1/6;
  return ko?'최근 7일 평균은 '+fmtH(mean(a.map(n=>n.dur)))+'로, 그 전 7일보다 '+(same?'거의 비슷해요.':mins(d)+' '+(d>0?'늘었어요.':'줄었어요.'))+' 최근 7일 중 7시간 미만은 '+sh+'일이에요.'
   :'Your last-7-day average is '+fmtH(mean(a.map(n=>n.dur)))+', '+(same?'about the same as':mins(d)+' '+(d>0?'more than':'less than'))+' the previous 7 days. '+sh+' of the last 7 nights were under 7h.';}
 const L=N.slice(-28);if(L.length<7)return MORE;
 if(k==='trend'){const wd=L.filter(n=>n.dow>=1&&n.dow<=5),we=L.filter(n=>n.dow===0||n.dow===6);if(wd.length<3||we.length<2)return MORE;
  const dd=mean(we.map(n=>n.dur))-mean(wd.map(n=>n.dur)),db=mean(we.map(n=>n.bed))-mean(wd.map(n=>n.bed));
  return ko?'주말(기상일 기준)에는 평일보다 '+mins(dd)+' '+(dd>=0?'더':'덜')+' 자고, '+mins(db)+' '+(db>=0?'늦게':'일찍')+' 잠들어요.'+(Math.abs(db)>1?' 주말 리듬 차이가 1시간 넘게 커요.':' 평일·주말 리듬이 비슷한 편이에요.')
   :'On weekends (by wake day) you sleep '+mins(dd)+' '+(dd>=0?'more':'less')+' and fall asleep '+mins(db)+' '+(db>=0?'later':'earlier')+' than on weekdays.'+(Math.abs(db)>1?' That is a rhythm gap of over 1 hour.':' Your weekday/weekend rhythm is fairly similar.');}
 if(k==='pred'){const cnt=[0,0,0,0,0,0,0],tot=[0,0,0,0,0,0,0];L.forEach(n=>{tot[n.dow]++;if(n.dur<7)cnt[n.dow]++});
  const mx=Math.max(...cnt);if(!mx)return ko?'최근 4주 동안 7시간 미만으로 잔 날이 없어요 👍':'No nights under 7h in the last 4 weeks 👍';
  const days=cnt.map((c,i)=>c===mx?D[i]:null).filter(Boolean);const tw=new Date();tw.setDate(tw.getDate()+1);
  return ko?'최근 4주 동안 7시간 미만으로 잔 날은 '+days.join('·')+'요일(기상일 기준)에 가장 많았어요 ('+mx+'회). 이 요일 전날 밤엔 조금 일찍 누워 보세요.'
   :'Over the last 4 weeks, short nights (<7h) happened most before '+days.join('/')+' (wake day, '+mx+'×). Try heading to bed a bit earlier the night before.';}
 if(k==='health'){const S=L.map(n=>n.dur),sv=sd(S)*60,sh=S.filter(x=>x<7).length;
  return ko?'최근 '+L.length+'일 수면 시간은 평균 '+fmtH(mean(S))+', 편차 ±'+Math.round(sv)+'분이에요. 권장(7~9시간)에 맞은 날은 '+S.filter(x=>x>=7&&x<=9).length+'일, 부족한 날은 '+sh+'일이에요.'
   :'Over the last '+L.length+' nights you averaged '+fmtH(mean(S))+' (±'+Math.round(sv)+' min). '+S.filter(x=>x>=7&&x<=9).length+' nights were within 7–9h and '+sh+' were short.';}
 if(k==='bed'){const bs=sd(L.map(n=>n.bed))*60,ws=sd(L.map(n=>n.wk))*60;const g=bs<=30?0:bs<=60?1:2;
  return ko?'최근 '+L.length+'일 취침 시각은 평균 '+clk(mean(L.map(n=>n.bed)))+' ±'+Math.round(bs)+'분, 기상은 ±'+Math.round(ws)+'분 흔들려요. '+['아주 규칙적이에요 👍','대체로 규칙적이에요.','들쭉날쭉한 편이라, 기상 시각부터 고정해 보세요.'][g]
   :'Over the last '+L.length+' nights your bedtime averaged '+clk(mean(L.map(n=>n.bed)))+' ±'+Math.round(bs)+' min, wake time ±'+Math.round(ws)+' min. '+['Very consistent 👍','Mostly consistent.','Fairly irregular — try fixing your wake time first.'][g];}
 return '';}
function miniRender(){document.querySelectorAll('.mini').forEach(m=>{const k=m.dataset.m,o=miniOpen.has(k);
 if(!m.firstChild){m.innerHTML='<button type="button" class="minib"></button><p class="minip hide"></p>';m.firstChild.onclick=()=>{o2=!miniOpen.has(k);o2?miniOpen.add(k):miniOpen.delete(k);miniRender();};}
 const b=m.firstChild,p=m.lastChild;b.textContent=MINI_EMO[k];b.classList.toggle('on',o);b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',KO()?'패턴 미니 리포트':'Pattern mini report');b.title=KO()?'패턴 보기':'Show pattern';
 p.classList.toggle('hide',!o);if(o)p.textContent=miniText(k);});}
let o2;miniRender();

// backup
function L(k,e){return lang==='ko'?k:e}
function pad2(n){return String(n).padStart(2,'0')}
function dl(name,text,type){const b=new Blob([text],{type});const f=new File([b],name,{type});
 if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:name}).catch(()=>{});}else{const u=URL.createObjectURL(b);const x=document.createElement('a');x.href=u;x.download=name;x.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}}
function bkRender(){const d=new Date(),st=d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate());
 $('#bkBox').innerHTML='<h2>'+L('데이터 내보내기·불러오기','Export & import data')+'</h2><p class="note">'+L('내 기록을 파일로 저장해 두면, 폰을 바꾸거나 사파리 데이터를 지워도 다시 불러올 수 있어요. 불러오기는 JSON·CSV 파일 둘 다 돼요. CSV는 엑셀에서 열 수 있어요.','Save your records to a file so you can restore them after changing phones or clearing Safari data.')+'</p><div class="row"><button id="bkSave" class="small">'+L('JSON 내보내기','Export JSON')+'</button><button id="bkCsv" class="small">'+L('CSV 내보내기','Export CSV')+'</button><button id="bkLoad" class="small">'+L('불러오기','Import')+'</button></div>';
 $('#bkSave').onclick=()=>{if(!own.length){alert(L('내보낼 내 기록이 없어요.','No records to export.'));return}dl('mysleep-backup-'+st+'.json',JSON.stringify({app:'MySleep',version:1,exportedAt:new Date().toISOString(),sleep:own},null,1),'application/json');};
 $('#bkLoad').onclick=()=>$('#fileIn').click();
 $('#bkCsv').onclick=()=>{const R=own.filter(r=>r.wake);if(!R.length){alert(L('내보낼 내 기록이 없어요.','No records to export.'));return}const f=x=>{const d=new Date(x);return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+' '+pad2(d.getHours())+':'+pad2(d.getMinutes())};
  const rows=[L('취침,기상,수면시간(시간)','bedtime,wake,hours')].concat(R.sort((a,b)=>new Date(a.sleep)-new Date(b.sleep)).map(r=>f(r.sleep)+','+f(r.wake)+','+((new Date(r.wake)-new Date(r.sleep))/36e5).toFixed(2)));
  dl('mysleep-'+st+'.csv','\ufeff'+rows.join('\n'),'text/csv');};}
$('#fileIn').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(s=>{try{let arr;const tx=s.replace(/^\ufeff/,'').trim();if(tx[0]==='{'||tx[0]==='['){const d=JSON.parse(tx);arr=Array.isArray(d)?d:d.sleep;}else{const P=x=>{const m=(x||'').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/);return m?new Date(+m[1],m[2]-1,+m[3],+m[4],+m[5]):null};
 arr=tx.split(/\r?\n/).map(l=>l.split(',')).map(c=>({s:P(c[0]),w:P(c[1])})).filter(o=>o.s&&o.w&&o.w>o.s).map(o=>({id:'csv'+(+o.s),sleep:o.s.toISOString(),wake:o.w.toISOString()}));if(!arr.length)throw 0;}
 if(!Array.isArray(arr))throw 0;
 if(!confirm(L(arr.length+'건을 불러와 지금 기록과 합칠까요?','Merge '+arr.length+' records into your records?')))return;const ids=new Set(own.map(r=>r.id)),sl=new Set(own.map(r=>Math.round(+new Date(r.sleep)/6e4)));let n=0;arr.forEach(r=>{if(r&&r.sleep&&!ids.has(r.id)&&!sl.has(Math.round(+new Date(r.sleep)/6e4))){own.push(r);n++}});
 if(sample){sample=false;localStorage.setItem(MODE,'off');}localStorage.setItem(KEY,JSON.stringify(own));refresh();alert(L(n+'건을 새로 불러왔어요.',n+' new records imported.'));}catch(_){alert(L('My Sleep 백업 파일(JSON)이나 CSV 파일이 아니에요.','Not a My Sleep JSON or CSV file.'))}});e.target.value='';};
setInterval(()=>{if($('#tab-home').classList.contains('active')&&!$('#dlg').open)render()},60000);
})();
