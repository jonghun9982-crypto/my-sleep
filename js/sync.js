// My Sleep — optional Google sign-in sync (merged from the sync prototype). Local-first: the app works fully without login.
// Local store stays mysleep.records.v1 (via window.MSB). Cloud: Firestore users/{uid}/records/{id}. Only id, sleep, wake (and optional tags) are synced.
const FB='https://www.gstatic.com/firebasejs/10.12.5/';
const cfg={apiKey:"AIzaSyB2H5OB3Dv3qCD2n51qAIm4s6Cun91ihAc",authDomain:"my-sleep-sync-8340c.firebaseapp.com",projectId:"my-sleep-sync-8340c",storageBucket:"my-sleep-sync-8340c.firebasestorage.app",messagingSenderId:"470618915839",appId:"1:470618915839:web:f6033f4c442f4f171d5dca"};
const LAST='mysleep.lastSync',SKIP='mysleep.skipLogin',REDIR='mysleep.redirecting';
const $=s=>document.querySelector(s),KO=()=>window.MSB.lang()==='ko',L=(k,e)=>KO()?k:e;
const track=p=>{try{if(typeof window.mysleepCount==='function')window.mysleepCount(p);}catch(_){}};
let F=null,auth=null,db=null; // firebase modules + instances, loaded below
let user=null,unsub=null,known=new Map(),busy=false,err='',online=navigator.onLine!==false,mock=false,lastLocal=null;
const clean=r=>{const o={id:r.id,sleep:r.sleep,wake:r.wake??null};if(Array.isArray(r.tags)&&r.tags.length)o.tags=r.tags.map(String);return o};
const sig=r=>JSON.stringify(clean(r));
const minute=r=>Math.round(+new Date(r.sleep)/6e4);
const col=()=>F.fs.collection(db,'users',user.uid,'records');
const stamp=()=>{localStorage.setItem(LAST,new Date().toISOString());render();};
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let ready=false,pending=!!sessionStorage.getItem(REDIR)&&Date.now()-(+sessionStorage.getItem(REDIR)||0)<120000,signing=false,userLogin=false;if(!pending)sessionStorage.removeItem(REDIR);
function clearPending(){pending=false;sessionStorage.removeItem(REDIR);}

// Popup first on every platform (incl. iOS Safari). signInWithPopup must be the first async call in the click handler (no awaits before it).
function login(){err='';if(!F){err=online?'not-loaded':'auth/network-request-failed';render();return}
 const p=new F.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
 const pr=F.auth.signInWithPopup(auth,p);signing=true;userLogin=true;render();
 pr.then(()=>{signing=false;render();}).catch(e=>{const c=e.code||String(e);
  if(c==='auth/operation-not-supported-in-environment'){sessionStorage.setItem(REDIR,String(Date.now()));pending=true;signing=false;render();
   F.auth.signInWithRedirect(auth,p).catch(e2=>{clearPending();err=e2.code||String(e2);render();});return}
  signing=false;err=c;render();});}

// merge local+cloud on login: union by id; skip records whose id or sleep-minute already exists (same rule as file import)
async function initialMerge(){if(!user||mock)return;busy=true;err='';render();
 try{const snap=await F.fs.getDocs(col());const cloud=snap.docs.map(d=>clean({id:d.id,...d.data()}));
 const local=window.MSB.get();const ids=new Set(local.map(r=>r.id)),mins=new Set(local.map(minute));
 const merged=local.slice();cloud.forEach(r=>{if(r.sleep&&!ids.has(r.id)&&!mins.has(minute(r))){merged.push(r);ids.add(r.id);mins.add(minute(r));}});
 const cIds=new Set(cloud.map(r=>r.id)),cMins=new Set(cloud.map(minute));
 const up=local.filter(r=>!cIds.has(r.id)&&!cMins.has(minute(r)));
 for(let i=0;i<up.length;i+=400){const b=F.fs.writeBatch(db);up.slice(i,i+400).forEach(r=>b.set(F.fs.doc(col(),r.id),{...clean(r),updatedAt:F.fs.serverTimestamp()}));await b.commit();}
 // "known" = records that exist in the cloud AND locally under the same id. Local same-minute duplicates of a cloud record are never uploaded or deleted.
 known=new Map(merged.filter(r=>cIds.has(r.id)||up.includes(r)).map(r=>[r.id,sig(r)]));
 if(merged.length!==local.length)window.MSB.set(merged);lastLocal=new Set(window.MSB.get().map(r=>r.id));busy=false;stamp();listen();}
 catch(e){busy=false;err=e.code||String(e);render();}}

// pull changes from other devices
function listen(){if(unsub)unsub();
 unsub=F.fs.onSnapshot(col(),{includeMetadataChanges:false},s=>{let own=window.MSB.get(),dirty=false;
  s.docChanges().forEach(c=>{if(c.doc.metadata.hasPendingWrites)return;const r=clean({id:c.doc.id,...c.doc.data()});const i=own.findIndex(x=>x.id===r.id);
   if(c.type==='removed'){known.delete(r.id);if(i>=0){own.splice(i,1);dirty=true}}
   else if(i>=0){known.set(r.id,sig(r));if(sig(own[i])!==sig(r)){own[i]=r;dirty=true}}
   else if(!own.some(x=>minute(x)===minute(r))){known.set(r.id,sig(r));own.push(r);dirty=true}});
  if(dirty){window.MSB.set(own);lastLocal=new Set(own.map(r=>r.id));}if(!s.metadata.fromCache)stamp();},e=>{err=e.code||String(e);render();});}

// push local edits (called from app save()). Deletes only records the user removed on this device.
async function changed(own){if(!user||busy||mock||!F)return;const cur=new Map(own.map(r=>[r.id,sig(r)]));const ops=[];
 const cMin=new Map([...known.values()].map(v=>{const r=JSON.parse(v);return[minute(r),r.id]}));
 cur.forEach((v,id)=>{if(known.get(id)===v)return;const r=JSON.parse(v);const m=cMin.get(minute(r));if(!known.has(id)&&m&&m!==id)return;
  known.set(id,v);ops.push(F.fs.setDoc(F.fs.doc(col(),id),{...r,updatedAt:F.fs.serverTimestamp()}));});
 if(lastLocal)[...known.keys()].forEach(id=>{if(!cur.has(id)&&lastLocal.has(id)){known.delete(id);ops.push(F.fs.deleteDoc(F.fs.doc(col(),id)));}});
 lastLocal=new Set(cur.keys());
 if(!ops.length)return;busy=true;render();try{await Promise.all(ops);busy=false;stamp();}catch(e){busy=false;err=e.code||String(e);render();}}

// ---------- UI ----------
const esc=x=>String(x).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
function errHint(e){if(/network|unavailable|not-loaded/.test(e)||!online)return L('인터넷 연결을 확인하고 다시 시도해 주세요. 기록은 이 기기에 그대로 저장돼요.','Check your internet connection and try again. Records stay saved on this device.');
 if(standalone&&/redirect-no-user|operation-not-supported|popup/.test(e))return L('홈 화면 앱에서는 Google 로그인이 막힐 수 있어요. Safari 탭에서 이 주소를 열어 로그인해 주세요.','Google sign-in may be blocked in the home-screen app. Open this address in a Safari tab to sign in.');
 if(e==='redirect-no-user')return L('Google에서 돌아왔지만 로그인 정보를 받지 못했어요. Safari 탭에서 다시 시도하거나 잠시 후 다시 눌러 주세요.','Returned from Google without a signed-in user. Try again in a Safari tab, or retry in a moment.');
 if(/popup-blocked/.test(e))return L('팝업이 차단됐어요. 버튼을 다시 눌러 주세요.','The popup was blocked. Tap the button again.');
 if(/popup-closed|cancelled/.test(e))return L('로그인 창이 닫혔어요. 다시 시도해 주세요.','The sign-in window was closed. Please try again.');
 if(/unauthorized-domain/.test(e))return L('이 주소에서는 아직 로그인할 수 없어요.','Sign-in is not enabled for this address yet.');
 if(/permission-denied/.test(e))return L('클라우드 기록에 접근하지 못했어요. 다시 로그인해 주세요.','Could not access cloud records. Please sign in again.');
 return L('잠시 후 다시 시도해 주세요.','Please try again shortly.');}
const G='<svg class="glogo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const gbtn=label=>'<button type="button" class="gsi sIn">'+G+'<span>'+(label||L('Google로 계속하기','Continue with Google'))+'</span></button>';
const SYNC_NOTE=()=>L('수면 기록(시각과 선택 태그)만 동기화돼요. 로그인하지 않아도 기록은 이 기기에 저장돼요.','Only sleep records (times and selected tags) are synced. Without signing in, records stay on this device.');
// one of: ok, busy, off, login, err
function state(){if(mock&&mock.state)return mock.state;const u=mock&&mock.user||user;if(!u)return err&&!signing&&!pending?'err':(signing||pending)?'busy':'login';if(!online)return'off';if(err)return'err';if(busy)return'busy';return'ok';}
const STX=s=>({ok:L('동기화됨','Synced'),busy:L('동기화 중','Syncing'),off:L('오프라인','Offline'),login:L('로그인','Sign in'),err:L('오류','Error')})[s];
const SBIG=s=>({ok:L('동기화됨','Synced'),busy:L('동기화 중…','Syncing…'),off:L('오프라인 · 이 기기에 저장 중','Offline · saving on this device'),login:L('로그인 필요','Not signed in'),err:L('동기화 오류','Sync error')})[s];
function relTime(iso){const d=new Date(iso),n=new Date(),day=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()),diff=Math.round((day(n)-day(d))/864e5);
 const tm=d.toLocaleTimeString(KO()?'ko-KR':'en-US',{hour:'numeric',minute:'2-digit'});
 if(diff===0)return L('오늘 ','Today ')+tm;if(diff===1)return L('어제 ','Yesterday ')+tm;
 return KO()?(d.getMonth()+1)+'월 '+d.getDate()+'일':d.toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function device(){const u=navigator.userAgent;const dv=/iPad/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'iPad':/iPhone/.test(u)?'iPhone':/Android/.test(u)?'Android':/Mac/.test(u)?'Mac':/Win/.test(u)?'Windows':'';
 const br=/CriOS|Chrome/.test(u)&&!/Edg/.test(u)?'Chrome':/Edg/.test(u)?'Edge':/Firefox|FxiOS/.test(u)?'Firefox':/Safari/.test(u)?'Safari':'';
 return (dv+' '+(standalone?L('홈 화면 앱','Home Screen app'):br)).trim()||L('이 브라우저','This browser');}
const shape=s=>'<i class="sd" aria-hidden="true"></i>';
function render(){if(!window.MSB)return;const st=state(),u=mock&&mock.user||user,last=localStorage.getItem(LAST),wait=pending||signing;
 try{if(window.MSB.sampleRender)window.MSB.sampleRender();}catch(_){}
 const dot=$('#syncDot');if(dot){dot.className='spill st-'+st;dot.innerHTML=shape(st)+'<span class="stx">'+STX(st)+'</span>';dot.setAttribute('aria-label',L('동기화 상태: ','Sync status: ')+STX(st));dot.onclick=()=>window.MSB.goAccount();}
 const ab=$('#acctBox');if(ab){
  if(u){const nm=u.displayName||(u.email||'').split('@')[0]||'?';
   ab.innerHTML='<div class="prof">'+(u.photoURL?'<img class="av" src="'+esc(u.photoURL)+'" alt="" referrerpolicy="no-referrer">':'<span class="av" aria-hidden="true">'+esc([...nm][0].toUpperCase())+'</span>')+'<div class="pt"><div class="nm">'+esc(nm)+'</div><div class="em">'+esc(u.email||'')+'</div></div></div>';}
  else ab.innerHTML='<div class="nm">'+L('로그인하지 않았어요','You are not signed in')+'</div><p class="subt">'+L('Google로 로그인하면 아이폰·아이패드·PC에서 같은 기록을 볼 수 있어요.','Sign in with Google to see the same records on iPhone, iPad and PC.')+'</p>'
   +(wait?'<div class="waitrow"><span class="spin" aria-hidden="true"></span>'+L('로그인 중…','Signing in…')+'</div>':gbtn())+'<p class="snote">'+SYNC_NOTE()+'</p>';}
 const sb=$('#syncBox');if(sb){const cnt=mock&&mock.count!=null?mock.count:known.size,lt=mock&&mock.last||last;
  let act='';if(st==='err')act='<button type="button" class="tbtn sRetry">'+L('다시 시도','Try again')+'</button>';else if(u&&st!=='busy')act='<button type="button" class="tbtn sNow"'+(st==='off'?' disabled':'')+'>'+L('지금 동기화','Sync now')+'</button>';
  let h='<div class="syncrow st-'+st+'"><div class="t"><div class="sbig">'+shape(st)+'<span>'+SBIG(st)+'</span></div><div class="sub">'+(st==='err'?esc(errHint(err||(mock&&mock.err)||'')):u?L('마지막 동기화 ','Last synced ')+'<b>'+(lt?relTime(lt):'-')+'</b>':L('지금은 이 기기에만 저장돼요','Saved on this device only for now'))+'</div></div>'+act+'</div>';
  if(u)h+='<div class="kv"><div><small>'+L('동기화된 기록','Synced records')+'</small><b>'+cnt+L('건','')+'</b></div><div><small>'+L('이 기기','This device')+'</small><b>'+esc(device())+'</b></div></div>';
  if(err)sb.title=err;else sb.removeAttribute('title');
  sb.innerHTML=h;}
 const ob=$('#outBox');if(ob)ob.innerHTML=u?'<button type="button" class="logout sOut">'+L('로그아웃','Sign out')+'</button><p class="outnote">'+L('로그아웃해도 이 기기의 기록은 지워지지 않아요','Signing out does not delete records on this device')+'</p>':'';
 const sc=$('#startScr');if(sc){const show=!u&&!localStorage.getItem(SKIP)&&(ready||pending);
  sc.classList.toggle('hide',!show);document.body.classList.toggle('starting',show);
  if(show)sc.innerHTML='<div class="top"><img src="icons/icon-192.png" alt=""><h1>My Sleep</h1><p class="lead">'+L('버튼 한 번으로 기록하고,<br><b>폰을 바꿔도 기록은 그대로.</b>','Log with one tap.<br><b>Keep your records when you change phones.</b>')+'</p>'
   +'<ul class="feat"><li><span class="n">1</span>'+L('아이폰·아이패드·PC에서 같은 기록','Same records on iPhone, iPad and PC')+'</li><li><span class="n">2</span>'+L('폰을 바꾸거나 Safari를 지워도 복구','Restore after a new phone or clearing Safari')+'</li></ul></div>'
   +'<div class="bot">'+(err&&!wait?'<p class="serr" role="alert">'+esc(errHint(err))+'</p>':'')
   +(wait?'<div class="waitrow"><span class="spin" aria-hidden="true"></span>'+L('로그인 중…','Signing in…')+'</div>':gbtn(err?L('Google로 다시 시도','Try again with Google'):''))
   +'<button type="button" class="skip">'+L('로그인 없이 사용하기','Use without signing in')+'</button><p class="priv">'+SYNC_NOTE()+'</p></div>';}
 document.querySelectorAll('.sIn').forEach(b=>b.onclick=login);
 const sk=document.querySelector('.start .skip');if(sk)sk.onclick=()=>{localStorage.setItem(SKIP,'1');signing=false;clearPending();render();};
 const n=document.querySelector('.sNow');if(n)n.onclick=()=>initialMerge();
 const rt=document.querySelector('.sRetry');if(rt)rt.onclick=()=>{if(user)initialMerge();else login();};
 const o=document.querySelector('.sOut');if(o)o.onclick=async()=>{if(!confirm(L('로그아웃할까요?\n로그아웃해도 이 기기의 기록은 지워지지 않아요.','Sign out?\nSigning out does not delete records on this device.')))return;
  if(mock){mock=false;render();return}if(unsub)unsub();unsub=null;known.clear();lastLocal=null;localStorage.setItem(SKIP,'1');try{await F.auth.signOut(auth);}catch(e){err=e.code||String(e);render();}};}

// signed-in user = the real Firebase user from onAuthStateChanged (mock only via the localhost-only test hook below)
window.MSYNC={changed,render,status:()=>({state:state(),user:!!(mock&&mock.user||user),synced:!!localStorage.getItem(LAST)})};
// Screenshot/test hook: only on localhost, never on the real site.
if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname))window.MSYNC._mock=m=>{mock=m||false;ready=true;render();};
addEventListener('online',()=>{online=true;render();});addEventListener('offline',()=>{online=false;render();});
setTimeout(()=>{if(pending){clearPending();if(!user&&!err)err='redirect-no-user';render();}},8000); // never spin forever
setTimeout(()=>{if(!ready){ready=true;render();}},3000); // fallback if auth init is slow
render();

// Load Firebase without blocking the UI; if it fails (offline / blocked), the app keeps working locally.
Promise.all([import(FB+'firebase-app.js'),import(FB+'firebase-auth.js'),import(FB+'firebase-firestore.js')]).then(([A,Au,Fs])=>{F={app:A,auth:Au,fs:Fs};
 const app=A.initializeApp(cfg);auth=Au.initializeAuth(app,{persistence:[Au.indexedDBLocalPersistence,Au.browserLocalPersistence],popupRedirectResolver:Au.browserPopupRedirectResolver});
 try{db=Fs.initializeFirestore(app,{localCache:Fs.persistentLocalCache({tabManager:Fs.persistentMultipleTabManager()})});}catch(e){db=Fs.initializeFirestore(app,{});}
 Au.getRedirectResult(auth).then(r=>{if(pending&&!r&&!auth.currentUser)err='redirect-no-user';}).catch(e=>{err=e.code||String(e);}).finally(()=>{clearPending();render();});
 Au.onAuthStateChanged(auth,u=>{if(mock)return;const was=user;user=u;ready=true;
  if(u){err='';signing=false;const fromLogin=userLogin||pending;clearPending();if(!was){if(fromLogin)track('mysleep-login');userLogin=false;const sc=$('#startScr');if(sc)sc.classList.add('hide');window.MSB.goHome();}render();initialMerge();}
  else{render();if(unsub){unsub();unsub=null}}});
}).catch(()=>{ready=true;render();});
