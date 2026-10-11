var e={structure:`var(--structure-mark)`,structureText:`var(--structure-text)`,structureWash:`var(--structure-wash)`,proof:`var(--proof-mark)`,proofText:`var(--proof-text)`,proofWash:`var(--proof-wash)`,measured:`var(--measured-mark)`,measuredText:`var(--measured-text)`,measuredWash:`var(--measured-wash)`,baseline:`var(--baseline-mark)`,baselineText:`var(--baseline-text)`,baselineWash:`var(--baseline-wash)`,withdrawn:`var(--withdrawn-mark)`,withdrawnText:`var(--withdrawn-text)`,withdrawnWash:`var(--withdrawn-wash)`,parameter:`var(--parameter-mark)`,parameterText:`var(--parameter-text)`,parameterWash:`var(--parameter-wash)`,refused:`var(--refused-mark)`,refusedText:`var(--refused-text)`,refusedWash:`var(--refused-wash)`,ink:`var(--ink)`,ink2:`var(--ink-2)`,ink3:`var(--ink-3)`,line:`var(--line)`,line2:`var(--line-2)`,surface:`var(--surface)`,paper:`var(--paper)`,paper2:`var(--paper-2)`,neg:`var(--neg)`,pos:`var(--pos)`,dim:[`var(--ink)`,`color-mix(in srgb, var(--ink) 65%, var(--surface))`,`color-mix(in srgb, var(--ink) 40%, var(--surface))`]};function t(e,t={},...n){let i=document.createElementNS(`http://www.w3.org/2000/svg`,e);r(i,t);for(let e of n)e!=null&&i.append(e);return i}function n(e,t={},...n){let i=document.createElement(e);r(i,t);for(let e of n)e!=null&&i.append(e);return i}function r(e,t){for(let[n,r]of Object.entries(t))r==null||r===!1?e.removeAttribute(n):e.setAttribute(n,r===!0?``:String(r))}var i=e=>{for(;e.firstChild;)e.removeChild(e.firstChild)};function a(e,t){let[n,r]=e,[i,a]=t,o=(e=>i+(e-n)/(r-n||1)*(a-i));return o.domain=e,o.range=t,o.invert=e=>n+(e-i)/(a-i||1)*(r-n),o}function o(e,t){let[n,r]=[Math.log10(e[0]),Math.log10(e[1])],[i,a]=t,o=(e=>i+(Math.log10(Math.max(e,1e-300))-n)/(r-n||1)*(a-i));return o.domain=e,o.range=t,o.invert=e=>10**(n+(e-i)/(a-i||1)*(r-n)),o}function s(e,t,n=5){let r=(t-e||1)/n,i=10**Math.floor(Math.log10(r)),a=[1,2,5,10].map(e=>e*i).find(e=>e>=r)??r,o=[];for(let n=Math.ceil(e/a-1e-9)*a;n<=t+a*1e-9;n+=a)o.push(+n.toPrecision(12));return o}function c(e,n={}){k();let r=t(`svg`,{class:`ae-svg${n.live?` is-live`:``}`,role:`img`,"aria-hidden":`true`,preserveAspectRatio:`none`});e.overlay.el.appendChild(r),e.onDispose(()=>r.remove());let a={svg:r,w:e.size.w,h:e.size.h,reset(){return a.w=e.size.w,a.h=e.size.h,i(r),r.setAttribute(`viewBox`,`0 0 ${a.w} ${a.h}`),r}};return a}function l(e,n,r,i,a={}){let o=t(`text`,{x:n,y:r,class:a.cls??`mono`,"text-anchor":a.anchor??`start`,fill:a.fill,"font-size":a.size,"font-weight":a.weight,"dominant-baseline":a.baseline});return o.textContent=i,e.appendChild(o),o}function u(n,r,i,a,o=4,s={}){let c={fill:s.hollow?e.surface:e.dim[Math.min(2,r)],stroke:e.dim[Math.min(2,r)],"stroke-width":s.hollow?1.4:0},l=r===0?t(`circle`,{cx:i,cy:a,r:o,...c}):r===1?t(`rect`,{x:i-o,y:a-o,width:2*o,height:2*o,rx:1,...c}):t(`path`,{d:`M${i} ${a-o*1.15}L${i+o*1.1} ${a+o*.85}L${i-o*1.1} ${a+o*.85}Z`,...c});return n.appendChild(l),l}function d(e){k();let t=e.el.querySelector(`.stage__params`);if(!t){let r=e.el.querySelector(`.stage__dock`);r||(r=n(`div`,{class:`stage__dock`}),e.el.appendChild(r)),t=n(`div`,{class:`stage__params`}),r.appendChild(t)}return t}function f(e,t,r,i={}){let a=n(`div`,{class:`ae-ctl${i.wide?` ae-ctl--wide`:``}`});return t&&a.append(n(`span`,{class:`ctl__label`},t)),a.append(r),(i.into??d(e)).appendChild(a),a}var p=0;function m(e){k();let t=e.name??`ae-seg-${++p}`,r=n(`div`,{class:`ae-seg`,role:`radiogroup`,"aria-label":e.label}),i=e.value;for(let a of e.options){let o=n(`input`,{type:`radio`,name:t,value:a.v,checked:a.v===e.value});o.addEventListener(`change`,()=>{o.checked&&(i=a.v,e.onChange(a.v))}),r.append(n(`label`,{},o,n(`span`,{},a.label)))}return{el:r,get:()=>i,set(e){i=e,r.querySelectorAll(`input`).forEach(t=>{t.checked=t.value===e})}}}function h(e){k();let t=n(`select`,{class:`ae-select`,"aria-label":e.label});for(let r of e.options)t.append(n(`option`,{value:r.v,selected:r.v===e.value},r.label));return t.addEventListener(`change`,()=>e.onChange(t.value)),{el:t,get:()=>t.value,set(e){t.value=e}}}function g(e){k();let t=e.rows&&e.rows>1?n(`textarea`,{class:`ae-text`,rows:e.rows,"aria-label":e.label,placeholder:e.placeholder,spellcheck:!1}):n(`input`,{class:`ae-text`,type:`text`,"aria-label":e.label,placeholder:e.placeholder,spellcheck:!1});return t.value=e.value,t.addEventListener(`input`,()=>e.onInput(t.value)),{el:t,get:()=>t.value,set(e){t.value=e}}}function _(e,t,r={}){k();let i=n(`button`,{type:`button`,class:`ae-btn${r.primary?` ae-btn--primary`:``}`,title:r.title},e);return i.addEventListener(`click`,t),i}function v(e,t=`plain`){return k(),n(`span`,{class:`ae-chip ae-chip--${t}`},e)}function y(e,n,r,a={}){k();let o=t(`svg`,{class:`ae-psvg is-live`,role:a.label?`img`:void 0,"aria-label":a.label,"aria-hidden":a.label?void 0:`true`});o.style.cssText=`display:block;width:100%;overflow:visible`,n.appendChild(o);let s=0,c=()=>{if(!s)return;i(o);let e=r(o,s);o.setAttribute(`viewBox`,`0 0 ${s} ${e}`),o.setAttribute(`height`,String(e))},l=typeof ResizeObserver<`u`?new ResizeObserver(()=>{let e=Math.round(n.clientWidth);e&&e!==s&&(s=e,c())}):null;return l?.observe(n),s=Math.round(n.clientWidth),c(),e.onDispose(()=>{l?.disconnect(),o.remove()}),{svg:o,redraw:c}}function b(e,t=`main`){return(e.el.closest(`[data-split]`)??e.el.parentElement)?.querySelector(`[data-panel="${t}"]`)??null}var x=(e,t,n)=>Math.min(n,Math.max(t,e)),S=e=>(e=x(e,0,1),e*e*e*(e*(e*6-15)+10)),C=(e,t=2)=>Number.isFinite(e)?e.toFixed(t):String(e),w=(e,t=2)=>e===0?`0`:e.toExponential(t).replace(`e+`,`e`),T=e=>`[${e.join(`, `)}]`;function E(e,t){let n=0,r=!1;return e.tick(()=>{if(!r)return!1;let e=performance.now(),i=n?Math.min(60,e-n):16;return n=e,r=t(i),r||(n=0),r}),{start(){r=!0,n=0,e.invalidate()},stop(){r=!1,n=0},get running(){return r}}}function D(e){e.clock.pause()}var O=!1;function k(){if(O||typeof document>`u`)return;O=!0;let e=document.createElement(`style`);e.id=`ae-ui-css`,e.textContent=`
.ae-svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:hidden}
.ae-svg text{font-family:var(--font-mono);font-size:11px;fill:var(--ink-3);font-variant-numeric:tabular-nums}
.ae-svg text.sans{font-family:var(--font-sans);font-size:12px;font-weight:500;fill:var(--ink-2)}
.ae-svg text.k{font-family:var(--font-sans);font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;fill:var(--ink-3)}
.ae-svg text.strong{fill:var(--ink);font-weight:600}
.ae-svg text.big{font-size:15px;font-weight:600;fill:var(--ink)}
.ae-svg text.halo{paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.ae-svg .hit{cursor:pointer}
.ae-svg :focus-visible{outline:2px solid var(--structure-mark);outline-offset:2px}
.ae-svg .nopt{pointer-events:none}
.ae-ctl{display:flex;align-items:center;gap:12px;min-height:40px;font-size:.875rem;color:var(--ink-2);flex-wrap:nowrap}
.ae-ctl .ae-text{flex:1;min-width:0}
.ae-ctl--wide{grid-column:1/-1;flex-wrap:wrap}
.ae-seg{display:inline-flex;gap:2px;padding:3px;border-radius:999px;background:var(--paper-2);flex-wrap:wrap}
.ae-seg label{position:relative;display:block}
.ae-seg input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.ae-seg span{display:block;padding:5px 12px;border-radius:999px;font-size:.8125rem;font-weight:600;color:var(--ink-2);line-height:1.3;transition:background 180ms var(--ease-out),color 180ms}
.ae-seg input:checked+span{background:var(--surface);color:var(--ink);box-shadow:var(--lift-1)}
.ae-seg input:focus-visible+span{outline:2px solid var(--structure-mark);outline-offset:2px}
.ae-select,.ae-text{font:inherit;font-size:.8125rem;color:var(--ink);background:var(--surface);border:1px solid var(--line-2);border-radius:var(--r-s,8px);padding:6px 10px;min-height:34px;max-width:100%}
.ae-text{font-family:var(--font-mono);width:100%}
textarea.ae-text{resize:vertical;line-height:1.45}
.ae-select:focus-visible,.ae-text:focus-visible{outline:2px solid var(--structure-mark);outline-offset:2px}
.ae-text[aria-invalid=true]{border-color:var(--withdrawn-mark)}
.ae-btn{min-height:36px;padding:6px 14px;border-radius:999px;border:0;background:var(--paper-2);color:var(--ink);font:inherit;font-size:.875rem;font-weight:600;cursor:pointer}
.ae-btn:hover{background:var(--line)}
.ae-btn:focus-visible{outline:2px solid var(--structure-mark);outline-offset:2px}
.ae-btn--primary{background:var(--ink);color:var(--surface)}
.ae-btn--primary:hover{background:var(--ink-2)}
.ae-chip{display:inline-block;padding:2px 9px;border-radius:999px;font-family:var(--font-mono);font-size:.75rem;line-height:1.5;background:var(--paper-2);color:var(--ink-2);white-space:nowrap}
.ae-chip--structure{background:var(--structure-wash);color:var(--structure-text)}
.ae-chip--proof{background:var(--proof-wash);color:var(--proof-text)}
.ae-chip--measured{background:var(--measured-wash);color:var(--measured-text)}
.ae-chip--baseline{background:var(--baseline-wash);color:var(--baseline-text)}
.ae-chip--withdrawn{background:var(--withdrawn-wash);color:var(--withdrawn-text)}
.ae-chip--parameter{background:var(--parameter-wash);color:var(--parameter-text)}
.ae-chip--refused{background:var(--refused-hatch),var(--refused-wash);color:var(--refused-text);box-shadow:inset 0 0 0 1px var(--refused-mark)}
.ae-readout{font-family:var(--font-mono);font-size:.75rem;line-height:1.5;color:var(--ink-2);font-variant-numeric:tabular-nums;white-space:normal}
.ae-readout b{color:var(--ink);font-weight:600}
.ae-panel{display:grid;gap:10px;align-content:start;min-width:0}
.ae-k{font-family:var(--font-sans);font-size:.6875rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.ae-table{width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:.75rem;font-variant-numeric:tabular-nums}
.ae-table th{font-family:var(--font-sans);font-size:.6875rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);text-align:left;padding:3px 8px;border-bottom:1px solid var(--line)}
.ae-table td{padding:3px 8px;border-bottom:1px solid var(--line);color:var(--ink-2)}
.ae-table tr.is-stop td{color:var(--ink);font-weight:600}
.ae-psvg text{font-family:var(--font-mono);font-size:11px;fill:var(--ink-3);font-variant-numeric:tabular-nums}
.ae-psvg text.sans{font-family:var(--font-sans);font-size:12px;font-weight:500;fill:var(--ink-2)}
.ae-psvg text.k{font-family:var(--font-sans);font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;fill:var(--ink-3)}
.ae-psvg text.strong{fill:var(--ink);font-weight:600}
.ae-psvg text.big{font-size:15px;font-weight:600;fill:var(--ink)}
.ae-psvg text.halo{paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.ae-psvg :focus-visible{outline:2px solid var(--structure-mark);outline-offset:2px}
.ae-more{grid-column:1/-1;margin-top:4px}
.ae-more>summary{cursor:pointer;font-size:.875rem;font-weight:600;color:var(--ink-2);padding:8px 0;min-height:36px}
.ae-more>summary:focus-visible{outline:2px solid var(--structure-mark);outline-offset:2px}
.ae-more[open]>summary{margin-bottom:4px}
.ae-note{margin:0;font-size:.75rem;line-height:1.5;color:var(--ink-3)}
.ae-warn{display:inline-grid;place-items:center;width:15px;height:15px;border-radius:50%;border:1.5px solid var(--ink-2);color:var(--ink-2);font-size:10px;font-weight:700;line-height:1;cursor:help}
.ae-svghost{min-width:0;touch-action:pan-y}
.al-split{display:grid;gap:18px;grid-template-columns:minmax(0,1fr)}
@media (min-width:820px){.al-split{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);align-items:start}}
`,document.head.appendChild(e)}function A(e,t){let n=n=>{if(n.target!==e.el)return;let r=t[n.key];r&&(r(),n.preventDefault(),n.stopImmediatePropagation())};e.el.addEventListener(`keydown`,n,!0),e.onDispose(()=>e.el.removeEventListener(`keydown`,n,!0))}function j(e,t,n,r,i,a={}){let o=a.cw??((a.cls??`mono`).includes(`sans`)?6.1:6.7),s=Math.max(8,Math.floor(r/o)),c=i;for(;c.length;){let r=c.length;r>s&&(r=c.lastIndexOf(` `,s),r<s/2&&(r=s)),l(e,t,n,c.slice(0,r),{cls:a.cls,fill:a.fill,anchor:a.anchor}),n+=a.lh??15,c=c.slice(r).trimStart()}return n}export{h as C,l as D,c as E,g as O,m as S,D as T,b as _,x as a,f as b,d as c,C as d,n as f,s as g,o as h,v as i,T as k,w as l,a as m,E as n,i as o,k as p,_ as r,u as s,e as t,S as u,y as v,A as w,t as x,j as y};