// My Sleep — optional Google sign-in sync (prototype). Local-first; app works fully without login.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut,setPersistence,browserLocalPersistence} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,getDocs,writeBatch,setDoc,deleteDoc,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const cfg={apiKey:"AIzaSyB2H5OB3Dv3qCD2n51qAIm4s6Cun91ihAc",authDomain:"my-sleep-sync-8340c.firebaseapp.com",projectId:"my-sleep-sync-8340c",storageBucket:"my-sleep-sync-8340c.firebasestorage.app",messagingSenderId:"470618915839",appId:"1:470618915839:web:f6033f4c442f4f171d5dca"};
const LAST='mssync.lastSync';
const app=initializeApp(cfg),auth=getAuth(app);
let db;try{db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});}catch(e){db=initializeFirestore(app,{});}
const $=s=>document.querySelector(s),KO=()=>window.MSB.lang()==='ko',L=(k,e)=>KO()?k:e;
let user=null,unsub=null,known=new Map(),busy=false,err='';
const clean=r=>({id:r.id,sleep:r.sleep,wake:r.wake??null});
const sig=r=>JSON.stringify(clean(r));
const minute=r=>Math.round(+new Date(r.sleep)/6e4);
const col=()=>collection(db,'users',user.uid,'records');
const stamp=()=>{localStorage.setItem(LAST,new Date().toISOString());render();};
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;

const SKIP='mssync.skipLogin',REDIR='mssync.redirecting';
let ready=false,pending=!!sessionStorage.getItem(REDIR),signing=false;
async function login(){err='';signing=true;render();const p=new GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
 try{await setPersistence(auth,browserLocalPersistence);
  if(isIOS||standalone){sessionStorage.setItem(REDIR,'1');await signInWithRedirect(auth,p);return}
  try{await signInWithPopup(auth,p);}catch(e){if(/popup-blocked|operation-not-supported/.test(e.code||'')){sessionStorage.setItem(REDIR,'1');await signInWithRedirect(auth,p);}else throw e}
 }catch(e){err=e.code||String(e);}signing=false;render();}

// merge local+cloud on login (union by id; skip duplicates with same id or same sleep minute, like import)
async function initialMerge(){busy=true;render();
 const snap=await getDocs(col());const cloud=snap.docs.map(d=>clean({id:d.id,...d.data()}));
 const local=window.MSB.get();const ids=new Set(local.map(r=>r.id)),mins=new Set(local.map(minute));
 const merged=local.slice();cloud.forEach(r=>{if(r.sleep&&!ids.has(r.id)&&!mins.has(minute(r))){merged.push(r);ids.add(r.id);mins.add(minute(r));}});
 const cIds=new Set(cloud.map(r=>r.id)),cMins=new Set(cloud.map(minute));
 const up=local.filter(r=>!cIds.has(r.id)&&!cMins.has(minute(r)));
 for(let i=0;i<up.length;i+=400){const b=writeBatch(db);up.slice(i,i+400).forEach(r=>b.set(doc(col(),r.id),{...clean(r),updatedAt:serverTimestamp()}));await b.commit();}
 known=new Map(merged.filter(r=>cIds.has(r.id)||up.includes(r)).map(r=>[r.id,sig(r)]));
 if(merged.length!==local.length)window.MSB.set(merged);busy=false;stamp();listen();}

// pull changes from other devices
function listen(){if(unsub)unsub();
 unsub=onSnapshot(col(),{includeMetadataChanges:false},s=>{let own=window.MSB.get(),dirty=false;
  s.docChanges().forEach(c=>{if(c.doc.metadata.hasPendingWrites)return;const r=clean({id:c.doc.id,...c.doc.data()});const i=own.findIndex(x=>x.id===r.id);
   if(c.type==='removed'){known.delete(r.id);if(i>=0){own.splice(i,1);dirty=true}}
   else{known.set(r.id,sig(r));if(i>=0){if(sig(own[i])!==sig(r)){own[i]=r;dirty=true}}else if(!own.some(x=>minute(x)===minute(r))){own.push(r);dirty=true}}});
  if(dirty)window.MSB.set(own);if(!s.metadata.fromCache)stamp();},e=>{err=e.code||String(e);render();});}

// push local edits (called from app save())
async function changed(own){if(!user||busy)return;const cur=new Map(own.map(r=>[r.id,sig(r)]));const ops=[];
 cur.forEach((v,id)=>{if(known.get(id)!==v){known.set(id,v);ops.push(setDoc(doc(col(),id),{...JSON.parse(v),updatedAt:serverTimestamp()}));}});
 [...known.keys()].forEach(id=>{if(!cur.has(id)){known.delete(id);ops.push(deleteDoc(doc(col(),id)));}});
 if(!ops.length)return;try{await Promise.all(ops);stamp();}catch(e){err=e.code||String(e);render();}}

const esc=x=>String(x).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
function errHint(e){if(e==='redirect-no-user')return L('Google에서 돌아왔지만 로그인 정보를 받지 못했어요. Safari의 사이트 간 추적 방지 때문일 수 있어요. 홈 화면 앱 대신 Safari 탭에서 다시 시도하거나, 잠시 후 다시 눌러 보세요.','Returned from Google without a signed-in user. Safari tracking prevention may block it. Try again in a Safari tab (not the home-screen app), or retry in a moment.');
 if(/popup-closed|cancelled/.test(e))return L('로그인 창이 닫혔어요. 다시 시도해 주세요.','The sign-in window was closed. Please try again.');
 if(/unauthorized-domain/.test(e))return L('이 주소가 Firebase 승인 도메인에 등록되지 않았어요.','This domain is not authorized in Firebase.');
 if(/network/.test(e))return L('인터넷 연결을 확인해 주세요.','Check your internet connection.');
 return L('잠시 후 다시 시도해 주세요.','Please try again shortly.');}
const gbtn=()=>'<button class="gbtn sIn">'+L('Google로 로그인','Sign in with Google')+'</button>';
const errBox=()=>err?'<p class="err">'+L('로그인/연동 오류: ','Sign-in/sync error: ')+esc(err)+'</p><p class="shint">'+errHint(err)+'</p>':'';
function render(){const box=$('#syncBox'),last=localStorage.getItem(LAST),fmt=d=>new Date(d).toLocaleString(KO()?'ko-KR':'en-US'),wait=pending||signing;
 const dot=$('#syncDot');if(dot){dot.classList.toggle('on',!!user);dot.title=user?L('로그인됨','Signed in'):L('로그인 안 됨','Signed out');dot.onclick=()=>document.querySelector('nav button[data-t=account]').click();}
 if(box){let h='<h2>'+L('기기 연동','Device sync')+'</h2>';
  if(user){h+='<span class="sbadge on">● '+L('로그인됨','Signed in')+'</span><div class="sprof">'+(user.photoURL?'<img src="'+esc(user.photoURL)+'" alt="" referrerpolicy="no-referrer">':'<span class="ph">👤</span>')+'<div>'+(user.displayName?esc(user.displayName)+'<br>':'')+'<b>'+esc(user.email||'')+'</b></div></div>'
   +'<div class="sstats"><div><small>'+L('동기화된 기록','Synced records')+'</small><b>'+known.size+L('건','')+'</b></div><div><small>'+L('마지막 동기화','Last synced')+'</small><b>'+(busy?L('동기화 중…','Syncing…'):last?fmt(last):'-')+'</b></div></div>'
   +'<div class="row"><button class="small sNow"'+(busy?' disabled':'')+'>'+L('지금 동기화','Sync now')+'</button><span class="sp"></span><button class="small sOut">'+L('로그아웃','Sign out')+'</button></div>';}
  else h+='<span class="sbadge">○ '+L('로그인 안 됨','Not signed in')+'</span><p class="note">'+L('로그인하지 않아도 기록은 이 기기에 그대로 저장돼요. 로그인하면 다른 기기와 기록을 맞춰요.','Records always save on this device. Sign in to sync them across devices.')+'</p>'+(wait?'<div class="row"><div class="spin"></div><span>'+L('로그인 중…','Signing in…')+'</span></div>':gbtn());
  box.innerHTML=h+errBox();}
 const st=$('#startScr');if(st){const show=!user&&!localStorage.getItem(SKIP)&&(ready||pending);
  st.classList.toggle('hide',!show);
  if(show)st.innerHTML='<img src="../icons/icon-192.png" alt=""><h1>My Sleep</h1>'+(wait?'<div class="spin"></div><p>'+L('로그인 중…','Signing in…')+'</p>':'<p>'+L('기기 간 기록을 동기화하려면 로그인하세요','Sign in to sync your records across devices')+'</p>'+gbtn()+'<button class="skip">'+L('로그인 없이 사용','Use without signing in')+'</button>'+errBox());}
 document.querySelectorAll('.sIn').forEach(b=>b.onclick=login);
 const sk=document.querySelector('.start .skip');if(sk)sk.onclick=()=>{localStorage.setItem(SKIP,'1');render();};
 const n=document.querySelector('.sNow');if(n)n.onclick=()=>initialMerge().catch(e=>{busy=false;err=e.code||String(e);render();});
 const o=document.querySelector('.sOut');if(o)o.onclick=async()=>{if(unsub)unsub();unsub=null;known.clear();await signOut(auth);};}

window.MSYNC={changed,render};
getRedirectResult(auth).then(r=>{if(pending&&!r&&!auth.currentUser)err='redirect-no-user';}).catch(e=>{err=e.code||String(e);}).finally(()=>{pending=false;sessionStorage.removeItem(REDIR);render();});
setTimeout(()=>{if(!ready){ready=true;render();}},3000); // fallback if auth init is slow
onAuthStateChanged(auth,u=>{user=u;ready=true;if(u)err='';render();if(u)initialMerge().catch(e=>{busy=false;err=e.code||String(e);render();});else if(unsub){unsub();unsub=null}});
render();
