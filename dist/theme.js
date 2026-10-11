(() => {
 'use strict';
 const key='portfolio-theme';
 const root=document.documentElement;
 const system=matchMedia('(prefers-color-scheme: dark)');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let preference=null,button=null,activeTransition=null;
 const valid=value=>value==='dark'||value==='light'?value:null;
 try{preference=valid(localStorage.getItem(key));}catch{/* Theme works even when storage is unavailable. */}
 const resolved=()=>preference||(system.matches?'dark':'light');
 function apply(theme){
  root.dataset.theme=theme;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=theme==='dark'?'#101610':'#f5f4ed';
  if(button){button.setAttribute('aria-pressed',String(theme==='dark'));button.title=theme==='dark'?'Switch to light mode':'Switch to dark mode';}
 }
 apply(resolved());
 function switchTheme(){
  const next=resolved()==='dark'?'light':'dark';
  preference=next;
  try{localStorage.setItem(key,next);}catch{/* Keep the choice for this page session. */}
  activeTransition?.skipTransition();
  if(reduce.matches||typeof document.startViewTransition!=='function'){apply(next);return;}
  const rect=button.getBoundingClientRect();
  const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
  const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  const transition=document.startViewTransition(()=>apply(next));
  activeTransition=transition;
  transition.ready.then(()=>{
   if(reduce.matches){transition.skipTransition();return;}
   root.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]}, {duration:650,easing:'cubic-bezier(.22,1,.36,1)',pseudoElement:'::view-transition-new(root)'});
  }).catch(()=>{/* A replaced transition leaves the selected theme intact. */});
  transition.finished.then(()=>{if(activeTransition===transition)activeTransition=null;},()=>{if(activeTransition===transition)activeTransition=null;});
 }
 function bind(){
  button=document.getElementById('theme-toggle');
  if(!button)return;
  apply(resolved());button.hidden=false;button.addEventListener('click',switchTheme);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
 system.addEventListener('change',()=>{if(!preference)apply(resolved());});
 reduce.addEventListener('change',()=>{if(reduce.matches)activeTransition?.skipTransition();});
 addEventListener('storage',event=>{if(event.key===key||event.key===null){activeTransition?.skipTransition();preference=valid(event.newValue);apply(resolved());}});
})();
