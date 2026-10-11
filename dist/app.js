const projects = {
 bizrail: {title:'Bizrail Africa',label:'BUSINESS SOFTWARE / OFFLINE FIRST',description:'An SME workspace that connects merchant capture, stock, a ZMW ledger, and device sync.',approach:'Capture sales, purchases, quotations, receipts, and expenses with provisional balances and stock. An installable PWA stores device-scoped records locally and syncs after reconnecting, with safe retries and device-revocation workflows.',stack:'Next.js, TypeScript, shadcn/ui, NestJS, PostgreSQL, IndexedDB.',status:'Phase 1 local application. Production infrastructure, accounting approval, and physical-device qualification remain outside local acceptance. The portfolio illustration is an interface concept, not a screenshot of the application.',source:'https://github.com/chimwemwemasona/Bizrail_Africa'},
 farms: {title:'Masona Farms',label:'MOBILE / AGRICULTURE',description:'A crop-neutral Android farm-management app with offline field records.',approach:'Link farm activities to fields and crop cycles, persist records in SQLite, and calculate revenue, expenses, and profit from saved records. A crop calendar connects planting dates with planned tasks and expected harvest dates.',stack:'React Native, Expo, TypeScript, SQLite.',status:'In development. Field management, activity records, financial calculations, and calendar workflows are implemented; some planned features remain unfinished. The portfolio illustration is an interface concept.',source:null},
 outgrower: {title:'Outgrower OS',label:'AGRICULTURE / PROTOTYPE',description:'A production and procurement management prototype for smallholder farming networks.',approach:'Connect farmer, field, crop-cycle, input, and visit records. Mobile field capture and offline drafts support work in low-connectivity conditions; the broader prototype is intended to connect production with collection and finance workflows.',stack:'React, Vite, TypeScript, Go / Gin.',status:'Prototype for field and business validation. Production modules are in progress; procurement, reporting, and pilot evaluation are planned phases.',source:null},
 community: {title:'Twin Palm',label:'WEB / COMMUNITY',description:'A community website project built around a modern React frontend.',approach:'A web experience built with reusable interface components and a responsive application stack. The portfolio artwork is an original editorial illustration.',stack:'React, TypeScript, Vite, shadcn/ui, Tailwind CSS.',status:'Website project. The repository contains the frontend source.',source:'https://github.com/chimwemwemasona/tpbc_prod'}
};
const dialog=document.getElementById('project-dialog');
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
 const project=projects[button.dataset.project];
 if(!project)return;
 ['title','label','description','approach','stack','status'].forEach(key=>document.getElementById('dialog-'+key).textContent=project[key]);
 const source=document.getElementById('dialog-source');
 source.hidden=!project.source;
 if(project.source)source.href=project.source;else source.removeAttribute('href');
 document.getElementById('dialog-private').hidden=Boolean(project.source);
 dialog.showModal();
 window.animatePortfolioProject?.(button);
}));
function requestProjectClose(){if(window.closePortfolioProject)window.closePortfolioProject();else dialog.close();}
document.querySelector('.dialog-close').addEventListener('click',requestProjectClose);
dialog.addEventListener('cancel',event=>{if(window.closePortfolioProject){event.preventDefault();requestProjectClose();}});
dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))requestProjectClose();});
document.getElementById('year').textContent=new Date().getFullYear();
