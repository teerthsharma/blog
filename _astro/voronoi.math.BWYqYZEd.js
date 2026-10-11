import{H as e,St as t,X as n,st as r,xt as i}from"./three.module.CHqds8NI.js";import{G as a,O as o,_ as s,g as c,t as l}from"./_lib.D1O4gDA1.js";var u=`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`,d=`
${o}
uniform vec2 uR[4];
uniform float uP[4];
uniform vec2 uCenter;
uniform float uHalf;      // data half-width of the (square) plane
uniform float uMode;      // 0 seq ramp, 1 two-colour ramp, 2 borders only
uniform float uAlpha;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uEdge;
varying vec2 vUv;
void main(){
  vec2 p = uCenter + (vUv - 0.5) * 2.0 * uHalf;
  float d1 = 1e9; float d2 = 1e9; int k1 = 0;
  for (int k = 0; k < 4; k++) {
    float d = distance(p, uR[k]);
    if (d < d1) { d2 = d1; d1 = d; k1 = k; } else if (d < d2) { d2 = d; }
  }
  float pk = uP[0];
  if (k1 == 1) pk = uP[1]; else if (k1 == 2) pk = uP[2]; else if (k1 == 3) pk = uP[3];
  vec3 fill = seqRamp(pk);
  if (uMode > 0.5 && uMode < 1.5) fill = mix(uC0, uC1, clamp(pk, 0.0, 1.0));
  if (uMode > 1.5) fill = uEdge;
  float w = length(vec2(dFdx(d1), dFdy(d1))) + 1e-9;
  float edge = 1.0 - smoothstep(0.6, 1.6, (d2 - d1) / (2.0 * w));
  float a = (uMode > 1.5 ? 0.0 : uAlpha);
  vec3 col = mix(fill, uEdge, edge * 0.55);
  gl_FragColor = vec4(col, max(a, edge * 0.55));
  #include <colorspace_fragment>
}
`;function f(o,s,c,l,f=1,p){let m=o.palette,h=new r({vertexShader:u,fragmentShader:d,transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,uniforms:{uRamp:{value:a(o)},uR:{value:[0,1,2,3].map(()=>new i)},uP:{value:[0,0,0,0]},uCenter:{value:new i},uHalf:{value:3.2},uMode:{value:0},uAlpha:{value:1},uC0:{value:new t(...p?p.c0.toArray():[1,1,1])},uC1:{value:new t(...p?p.c1.toArray():[0,0,0])},uEdge:{value:new t(m.ink3.r,m.ink3.g,m.ink3.b)}}}),g=new e(new n(l,l),h);g.position.set(s,c,0),g.renderOrder=f,g.frustumCulled=!1;let _=h.uniforms;return{mesh:g,set(e){for(let t=0;t<4;t++)_.uR.value[t].set(e.r[2*t],e.r[2*t+1]),_.uP.value[t]=e.P[t];_.uCenter.value.set(e.cx??0,e.cy??0),_.uHalf.value=e.half,_.uMode.value=e.mode??0,_.uAlpha.value=e.alpha??1},dispose(){g.geometry.dispose(),h.dispose()}}}var p=.02,m=(e,t)=>({sh:e*Math.sqrt(1-t),sid:t===0?p:Math.sqrt(p*p+e*e*t)});function h(e){let t=new Float64Array(8);for(let n=0;n<8;n++)t[n]=e();return t}function g(e,t,n){let r=0,i=1/0;for(let a=0;a<4;a++){let o=1*e[2*a]-t,s=1*e[2*a+1]-n,c=o*o+s*s;c<i&&(i=c,r=a)}return r}function _(e){let t=[0,1,2,3].map(t=>(1*e[2*t])**2+(1*e[2*t+1])**2),n=[0,1,2,3].sort((e,n)=>t[e]-t[n]||e-n),r=[0,0,0,0];return n.forEach((e,t)=>r[e]=t),{rank:r,pick:n[0]}}var v=e=>{let t=0;for(let n=1;n<e.length;n++)e[n]>e[t]&&(t=n);return t},y=e=>Math.floor(2*e*3+1e-9);function b(e,t,n){let r=-1;for(let i=0;i<4;i++)t[i]<=n&&(r<0||e[i]>e[r])&&(r=i);return r}function x(e,t,n,r,i=1,a=new Float64Array(4)){let{sh:o,sid:l}=m(t,n),u=s(c(i)),d=[0,0,0,0];for(let t=0;t<r;t++){let t=o*u(),n=o*u(),r=0,i=1/0;for(let a=0;a<4;a++){let o=1*e[2*a]-t+l*u(),s=1*e[2*a+1]-n+l*u(),c=o*o+s*s;c<i&&(i=c,r=a)}d[r]++}for(let e=0;e<4;e++)a[e]=d[e]/r;return a}function S(e,t=4096){let n=[0,0,0,0];for(let r=0;r<t;r++){let i=Math.cos(l*r/t),a=Math.sin(l*r/t),o=0,s=-1/0;for(let t=0;t<4;t++){let n=e[2*t]*i+e[2*t+1]*a;n>s&&(s=n,o=t)}n[o]++}return Float64Array.from(n,e=>e/t)}function C(e,t,n=720,r=400,i=new Float64Array(4)){let a=[0,0,0,0],o=new Float64Array(n),s=new Float64Array(n);for(let e=0;e<n;e++)o[e]=Math.cos(l*(e+.5)/n),s[e]=Math.sin(l*(e+.5)/n);for(let i=0;i<r;i++){let c=t*Math.sqrt(-2*Math.log(1-(i+.5)/r));for(let t=0;t<n;t++)a[g(e,c*o[t],c*s[t])]++}for(let e=0;e<4;e++)i[e]=a[e]/(n*r);return i}function w(e){let t=[0,1,2,3].sort((t,n)=>e[2*t]-e[2*n]||e[2*t+1]-e[2*n+1]),n=(t,n,r)=>(e[2*n]-e[2*t])*(e[2*r+1]-e[2*t+1])-(e[2*n+1]-e[2*t+1])*(e[2*r]-e[2*t]),r=[],i=[];for(let e of t){for(;r.length>=2&&n(r[r.length-2],r[r.length-1],e)<=0;)r.pop();r.push(e)}for(let e of[...t].reverse()){for(;i.length>=2&&n(i[i.length-2],i[i.length-1],e)<=0;)i.pop();i.push(e)}return r.pop(),i.pop(),[...r,...i]}function T(e,t,n,r=1500,i=256,a=99){let o=c(a);return{sigma:e,m:t,eps:n,N:r,M:i,done:0,hitB:0,hitD:0,hitBound:0,sumD:0,sumD2:0,rng:o,g:s(o)}}var E=()=>performance.now();function D(e,t,n=E){let{sh:r,sid:i}=m(e.sigma,e.m),a=e.g,o=y(e.eps),s=n(),c=new Float64Array(8),l=[0,0,0,0];for(;e.done<e.N&&n()-s<t;){for(let e=0;e<8;e++)c[e]=a();let{rank:t,pick:n}=_(c);l[0]=l[1]=l[2]=l[3]=0;for(let t=0;t<e.M;t++){let e=r*a(),t=r*a(),n=0,o=1/0;for(let r=0;r<4;r++){let s=c[2*r]-e+i*a(),l=c[2*r+1]-t+i*a(),u=s*s+l*l;u<o&&(o=u,n=r)}l[n]++}let s=v(l),u=b(l,t,o),d=r*a(),f=r*a(),p=0,m=1/0;for(let e=0;e<4;e++){let t=c[2*e]-d+i*a(),n=c[2*e+1]-f+i*a(),r=t*t+n*n;r<m&&(m=r,p=e)}let h=+(s===p),g=+(n===p);e.hitB+=h,e.hitD+=g,u===p&&e.hitBound++,e.sumD+=h-g,e.sumD2+=(h-g)*(h-g),e.done++}return e.done>=e.N}function O(e){let t=Math.max(1,e.done),n=e.sumD/t,r=Math.max(0,e.sumD2/t-n*n);return{hitB:e.hitB/t,hitD:e.hitD/t,hitBound:e.hitBound/t,gap:n,se:Math.sqrt(r/t)}}var k={sigma:[.1,1,3,10,30],gap:[0,.024,.149,.213,.241],src:`README.md:315; tests/resolvent/test_reproduce.py:12`},A={bayes:.381,bounded:.289,src:`README.md:316; tests/resolvent/test_reproduce.py:19`};function j(e,t,n,r,i=128){let a=[],o=(e,t)=>e>=r[0]&&e<=r[2]&&t>=r[1]&&t<=r[3],s=e+n,c=t;for(let r=1;r<=i;r++){let u=l*r/i,d=e+n*Math.cos(u),f=t+n*Math.sin(u);o(s,c)&&o(d,f)&&a.push([[s,c],[d,f]]),s=d,c=f}return a}export{f as _,j as a,v as c,x as d,T as f,D as g,y as h,b as i,w as l,C as m,A as n,_ as o,O as p,m as r,h as s,k as t,S as u};