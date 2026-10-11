(() => {
 'use strict';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const ownedAnimations=new Set();
 const springs=new Set();
 const states=[];
 let frame=0,previous=0,scrollFrame=0,sourceCard=null,closing=false;
 const ease='cubic-bezier(.22,1,.36,1)';
 const animate=(element,keyframes,options)=>{
  if(reduce.matches || !element || typeof element.animate!=='function')return null;
  const animation=element.animate(keyframes,options);
  ownedAnimations.add(animation);
  animation.finished.then(()=>ownedAnimations.delete(animation),()=>ownedAnimations.delete(animation));
  return animation;
 };
 function springTick(time){
  frame=0;
  const dt=Math.min((time-(previous||time-16.67))/1000,.032);
  previous=time;
  for(const state of springs){
   let settled=true;
   for(const axis of Object.keys(state.value)){
    const delta=state.target[axis]-state.value[axis];
    state.velocity[axis]=(state.velocity[axis]+delta*190*dt)*Math.exp(-19*dt);
    state.value[axis]+=state.velocity[axis]*dt;
    if(Math.abs(delta)>.008||Math.abs(state.velocity[axis])>.015)settled=false;
   }
   state.render(state.value);
   if(settled){Object.assign(state.value,state.target);state.render(state.value);springs.delete(state);}
  }
  if(springs.size&&!document.hidden&&!reduce.matches)frame=requestAnimationFrame(springTick);
 }
 function wake(state){
  if(reduce.matches||!fine.matches)return;
  springs.add(state);
  if(!frame&&!document.hidden){previous=0;frame=requestAnimationFrame(springTick);}
 }
 function makeSpring(element,type){
  const state={element,value:{x:0,y:0,lift:0},target:{x:0,y:0,lift:0},velocity:{x:0,y:0,lift:0},render(value){
   if(type==='card'){
    element.style.setProperty('--tilt-x',(-value.y*6).toFixed(3)+'deg');
    element.style.setProperty('--tilt-y',(value.x*6).toFixed(3)+'deg');
    element.style.setProperty('--lift',value.lift.toFixed(3)+'px');
    element.style.setProperty('--art-x',(value.x*12).toFixed(3)+'px');
    element.style.setProperty('--art-y',(value.y*10).toFixed(3)+'px');
    element.style.setProperty('--arrow-x',(value.x*4).toFixed(3)+'px');
    element.style.setProperty('--arrow-y',(value.y*4).toFixed(3)+'px');
   }else{
    element.style.setProperty('--magnet-x',(value.x*17).toFixed(3)+'px');
    element.style.setProperty('--magnet-y',(value.y*17).toFixed(3)+'px');
    element.style.setProperty('--magnet-inner-x',(value.x*7).toFixed(3)+'px');
    element.style.setProperty('--magnet-inner-y',(value.y*7).toFixed(3)+'px');
   }
  }};
  states.push(state);
  element.addEventListener('pointermove',event=>{
   if(reduce.matches||!fine.matches||element.classList.contains('motion-revealing'))return;
   const box=element.getBoundingClientRect();
   const x=Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1));
   const y=Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1));
   Object.assign(state.target,{x,y,lift:type==='card'?-5:0});
   element.style.setProperty('--spot-x',((x+1)*50).toFixed(2)+'%');
   element.style.setProperty('--spot-y',((y+1)*50).toFixed(2)+'%');
   element.classList.add('is-active');wake(state);
  },{passive:true});
  const reset=()=>{Object.assign(state.target,{x:0,y:0,lift:0});element.classList.remove('is-active');wake(state);};
  element.addEventListener('pointerleave',reset);
  element.addEventListener('pointercancel',reset);
  element.addEventListener('blur',reset);
 }
 const hero=document.querySelector('.hero');
 const headline=document.getElementById('hero-title');
 if(headline){
  const lines=[...headline.childNodes].filter(node=>node.nodeName!=='BR').map(node=>node.textContent).filter(Boolean);
  headline.setAttribute('aria-label',lines.join(' '));
  headline.replaceChildren();
  let index=0;
  lines.forEach(text=>{
   const line=document.createElement('span');line.className='headline-line';line.setAttribute('aria-hidden','true');
   [...text].forEach(character=>{
    const letter=document.createElement('span');letter.className='headline-letter';letter.textContent=character;line.append(letter);
    animate(letter,[{transform:'translate3d(0,118%,0) rotate(8deg)',opacity:0,filter:'blur(6px)'},{transform:'translate3d(0,0,0) rotate(0deg)',opacity:1,filter:'blur(0)'}],{duration:1150,delay:160+index++*19,easing:ease,fill:'backwards'});
   });
   headline.append(line);
  });
 }
 const orbit=document.createElement('div');orbit.className='hero-orbit';orbit.setAttribute('aria-hidden','true');
 orbit.innerHTML='<div class="orbit-core"><div class="orbit-cross"></div><div class="orbit-ring ring-one"></div><div class="orbit-ring ring-two"></div><div class="orbit-ring ring-three"></div><div class="orbit-center"></div></div>';
 hero?.append(orbit);
 animate(orbit,[{opacity:0,transform:'scale(.7) rotate(-45deg)'},{opacity:getComputedStyle(orbit).opacity,transform:'scale(1) rotate(0deg)'}],{duration:1800,delay:550,easing:ease,fill:'backwards'});
 const progress=document.createElement('div');progress.className='scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 function updateScroll(){
  scrollFrame=0;
  if(reduce.matches)return;
  const height=document.documentElement.scrollHeight-innerHeight;
  const fraction=height>0?Math.min(1,Math.max(0,scrollY/height)):0;
  progress.style.transform='scaleX('+fraction+')';
  const rect=hero?.getBoundingClientRect();
  if(rect&&rect.bottom>0){
   const phase=Math.max(0,-rect.top/Math.max(1,rect.height));
   orbit.style.setProperty('--orbit-z',(-20+phase*120)+'deg');
   orbit.style.setProperty('--orbit-y',(-12+phase*70)+'deg');
   orbit.style.setProperty('--orbit-x',(14+phase*35)+'deg');
  }
 }
 const scheduleScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);};
 addEventListener('scroll',scheduleScroll,{passive:true});addEventListener('resize',scheduleScroll,{passive:true});updateScroll();
 const cards=[...document.querySelectorAll('.project')];
 cards.forEach(card=>makeSpring(card,'card'));
 document.querySelectorAll('.round-link,.contact>div>a').forEach(element=>makeSpring(element,'magnet'));
 const revealIllustration=card=>{
  card.querySelectorAll('.bar').forEach((bar,i)=>animate(bar,[{transform:'scaleY(.08)'},{transform:'scaleY(1)'}],{duration:1000,delay:400+i*75,easing:ease,fill:'backwards'}));
  const phone=card.querySelector('.phone');
  animate(phone,[{transform:'translate3d(0,80px,0) rotate(20deg)'},{transform:'translate3d(0,0,0) rotate(7deg)'}],{duration:1400,delay:150,easing:ease,fill:'backwards'});
  card.querySelectorAll('.plot').forEach((plot,i)=>animate(plot,[{transform:'scale(.5) rotate(8deg)',opacity:0},{transform:'scale(1) rotate(0deg)',opacity:1}],{duration:1000,delay:300+i*100,easing:ease,fill:'backwards'}));
  card.querySelectorAll('.arch').forEach((arch,i)=>animate(arch,[{transform:'translateY(100%) scaleX(.8)'},{transform:'translateY(0) scaleX(1)'}],{duration:1200,delay:200+i*180,easing:ease,fill:'backwards'}));
 };
 const reveal=element=>{
  if(reduce.matches)return;
  const card=element.classList.contains('project');
  const delay=card?(cards.indexOf(element)%2)*110:0;
  element.classList.add('motion-revealing');
  const animation=animate(element,[{opacity:0,transform:'perspective(1100px) translateY(65px) rotateX(7deg)',clipPath:'inset(10% 0 0 0 round 24px)'},{opacity:1,transform:'perspective(1100px) translateY(0) rotateX(0deg)',clipPath:'inset(0 0 0 0 round 24px)'}],{duration:1150,delay,easing:ease,fill:'backwards'});
  if(animation)animation.finished.then(()=>element.classList.remove('motion-revealing'),()=>element.classList.remove('motion-revealing'));
  if(card)revealIllustration(element);
  if(element.classList.contains('about'))animate(element.querySelector('.asterisk'),[{transform:'rotate(-110deg) scale(.6)'},{transform:'rotate(0deg) scale(1)'}],{duration:1700,delay:100,easing:ease,fill:'backwards'});
 };
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);reveal(entry.target);}}),{threshold:.12});
  [...cards,...document.querySelectorAll('.about,.contact')].forEach(element=>observer.observe(element));
 }
 animate(document.querySelector('.hero-bottom'),[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:1000,delay:900,easing:ease,fill:'backwards'});
 const dialog=document.getElementById('project-dialog');
 function cancelDialogAnimations(){dialog.getAnimations().forEach(animation=>animation.cancel());dialog.querySelectorAll('*').forEach(element=>element.getAnimations().forEach(animation=>animation.cancel()));}
 window.animatePortfolioProject=card=>{
  sourceCard=card;closing=false;dialog.classList.remove('is-closing');
  if(reduce.matches)return;
  cancelDialogAnimations();
  const from=card.getBoundingClientRect(),to=dialog.getBoundingClientRect();
  const dx=from.left+from.width/2-to.left-to.width/2,dy=from.top+from.height/2-to.top-to.height/2;
  animate(dialog,[{transform:`translate(${dx*.35}px,${dy*.35}px) scale(.72)`,clipPath:'inset(35% 18% round 32px)',opacity:.25},{transform:'translate(0,0) scale(1)',clipPath:'inset(0 0 round 22px)',opacity:1}],{duration:680,easing:ease});
  dialog.querySelectorAll('#dialog-label,#dialog-title,#dialog-description,.detail-block,.source-link,.private-note').forEach((element,i)=>{
   if(!element.hidden)animate(element,[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:160+i*45,easing:ease,fill:'backwards'});
  });
 };
 window.closePortfolioProject=()=>{
  if(closing||!dialog.open)return;
  if(reduce.matches){dialog.close();return;}
  closing=true;cancelDialogAnimations();dialog.classList.add('is-closing');
  const from=dialog.getBoundingClientRect(),to=sourceCard?.getBoundingClientRect();
  const dx=to?(to.left+to.width/2-from.left-from.width/2)*.12:0;
  const dy=to?(to.top+to.height/2-from.top-from.height/2)*.12:12;
  const animation=animate(dialog,[{transform:'translate(0,0) scale(1)',opacity:1,clipPath:'inset(0 0 round 22px)'},{transform:`translate(${dx}px,${dy}px) scale(.88)`,opacity:0,clipPath:'inset(12% 8% round 32px)'}],{duration:280,easing:'cubic-bezier(.4,0,.8,.3)'});
  const finish=()=>{dialog.close();closing=false;dialog.classList.remove('is-closing');};
  if(animation)animation.finished.then(finish,finish);else finish();
 };
 function configure(){
  document.body.classList.toggle('motion-ready',!reduce.matches);
  if(reduce.matches){
   ownedAnimations.forEach(animation=>animation.cancel());
   cancelAnimationFrame(frame);frame=0;springs.clear();
   states.forEach(state=>{for(const key of Object.keys(state.value)){state.value[key]=state.target[key]=state.velocity[key]=0;}state.render(state.value);state.element.classList.remove('is-active');});
   if(closing){dialog.close();closing=false;dialog.classList.remove('is-closing');}
  }
  updateScroll();
 }
 reduce.addEventListener('change',configure);configure();
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;}
  else if(springs.size&&!reduce.matches){previous=0;frame=requestAnimationFrame(springTick);}
 });
})();
