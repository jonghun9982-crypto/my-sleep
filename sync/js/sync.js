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

async function login(){err='';const p=new GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
 try{await setPersistence(auth,browserLocalPersistence);
  if(isIOS||standalone){await signInWithRedirect(auth,p);return}
  try{await signInWithPopup(auth,p);}catch(e){if(/popup-blocked|operation-not-supported|cancelled-popup/.test(e.code||''))await signInWithRedirect(auth,p);else throw e}
 }catch(e){err=e.code||String(e);render();}}

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

function render(){const box=$('#syncBox');if(!box)return;const last=localStorage.getItem(LAST);
 let h='<h2>'+L('기기 연동','Device sync')+'</h2>';
 if(user){h+='<p class="sync-who">'+L('로그인됨: ','Signed in: ')+'<b></b></p><p class="note">'+(busy?L('동기화 중…','Syncing…'):L('마지막 동기화: ','Last synced: ')+(last?new Date(last).toLocaleString(KO()?'ko-KR':'en-US'):'-'))+'</p><div class="row"><button id="syncOut" class="small">'+L('로그아웃','Sign out')+'</button></div>';}
 else h+='<p class="note">'+L('선택 사항이에요. 로그인하지 않아도 기록은 이 기기에 그대로 저장돼요. 로그인하면 다른 기기와 기록을 맞춰요.','Optional. Records always save on this device; sign in to keep them in sync across devices.')+'</p><button id="syncIn" class="gbtn">'+L('Google로 로그인','Sign in with Google')+'</button>';
 if(err)h+='<p class="err">'+L('연동 오류: ','Sync error: ')+err.replace(/[<>&]/g,'')+'</p>';
 box.innerHTML=h;if(user)box.querySelector('.sync-who b').textContent=user.email||'';
 const i=$('#syncIn');if(i)i.onclick=login;const o=$('#syncOut');if(o)o.onclick=async()=>{if(unsub)unsub();unsub=null;known.clear();await signOut(auth);};}

window.MSYNC={changed,render};
getRedirectResult(auth).catch(e=>{err=e.code||String(e);render();});
onAuthStateChanged(auth,u=>{user=u;err='';render();if(u)initialMerge().catch(e=>{busy=false;err=e.code||String(e);render();});else if(unsub){unsub();unsub=null}});
render();
