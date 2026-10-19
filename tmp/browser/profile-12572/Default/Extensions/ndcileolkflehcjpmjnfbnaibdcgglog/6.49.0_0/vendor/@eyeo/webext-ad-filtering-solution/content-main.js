/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ../../node_modules/uuid/dist/esm-browser/native.js
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
/* harmony default export */ const esm_browser_native = ({
  randomUUID
});
;// ../../node_modules/uuid/dist/esm-browser/rng.js
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}
;// ../../node_modules/uuid/dist/esm-browser/stringify.js
/* unused harmony import specifier */ var validate;

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

function stringify(arr, offset = 0) {
  const uuid = unsafeStringify(arr, offset); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

/* harmony default export */ const esm_browser_stringify = ((/* unused pure expression or super */ null && (stringify)));
;// ../../node_modules/uuid/dist/esm-browser/v4.js




function v4(options, buf, offset) {
  if (esm_browser_native.randomUUID && !buf && !options) {
    return esm_browser_native.randomUUID();
  }

  options = options || {};
  const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return unsafeStringify(rnds);
}

/* harmony default export */ const esm_browser_v4 = (v4);
;// ../../node_modules/@eyeo/snippets/webext/main.mjs
/*!
 * This file is part of eyeo's Anti-Circumvention Snippets module (@eyeo/snippets),
 * Copyright (C) 2006-present eyeo GmbH
 * 
 * @eyeo/snippets is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 * 
 * @eyeo/snippets is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with @eyeo/snippets.  If not, see <http://www.gnu.org/licenses/>.
 */
let currentEnvironment = {initial: true};
const callback = (environment, ...filters) => {
const e=Proxy,{apply:t,bind:n,call:r}=Function,o=r.bind(t),s=r.bind(n),i=r.bind(r),a={get:(e,t)=>s(r,e[t])},c=t=>new e(t,a),l=(t,n)=>new e(t,{apply:(e,t,r)=>o(n,t,r)}),u={get:(e,t)=>s(e[t],e)},f=t=>new e(t,u),{assign:p,defineProperties:d,freeze:h,getOwnPropertyDescriptor:y,getOwnPropertyDescriptors:g,getPrototypeOf:w}=f(Object),{hasOwnProperty:m}=c({}),{species:v}=Symbol,b={get(e,t){const n=e[t];class r extends n{}const o=g(n.prototype);delete o.constructor,h(d(r.prototype,o));const s=g(n);return delete s.length,delete s.prototype,s[v]={value:r},h(d(r,s))}},E=t=>new e(t,b);"undefined"!=typeof currentEnvironment&&currentEnvironment.initial&&"undefined"!=typeof environment&&(currentEnvironment=environment);const $=()=>"undefined"!=typeof currentEnvironment?currentEnvironment:"undefined"!=typeof environment?environment:{};"undefined"==typeof globalThis&&(window.globalThis=window);const{apply:S,ownKeys:x}=f(Reflect),R=$(),P="world"in R,k=P&&"ISOLATED"===R.world,O=P&&"MAIN"===R.world,T="object"==typeof chrome&&!!chrome.runtime,j="object"==typeof browser&&!!browser.runtime,A=!O&&(k||T||j),L=e=>A?e:I(e,F(e)),{create:I,defineProperties:M,defineProperty:N,freeze:C,getOwnPropertyDescriptor:D,getOwnPropertyDescriptors:F}=f(Object),q=f(globalThis),W=A?globalThis:E(globalThis),{Map:H,RegExp:J,Set:B,WeakMap:_,WeakSet:V}=W,z=(e,t,n=null)=>{const r=x(t);for(const o of x(e)){if(r.includes(o))continue;const s=D(e,o);if(n&&"value"in s){const{value:e}=s;"function"==typeof e&&(s.value=n(e))}N(t,o,s)}},U=e=>{const t=W[e];class n extends t{}const{toString:r,valueOf:o}=t.prototype;M(n.prototype,{toString:{value:r},valueOf:{value:o}});const s=e.toLowerCase(),i=e=>function(){const t=S(e,this,arguments);return typeof t===s?new n(t):t};return z(t,n,i),z(t.prototype,n.prototype,i),n},X=C({frozen:new _,hidden:new V,iframePropertiesToAbort:{read:new B,write:new B},abortedIframes:new _}),G=new J("^[A-Z]"),K=A&&(T&&chrome||j&&browser)||void 0;var Q=new Proxy(new H([["chrome",K],["browser",K],["isExtensionContext",A],["variables",X],["console",L(console)],["document",globalThis.document],["JSON",L(JSON)],["Map",H],["Math",L(Math)],["Number",A?Number:U("Number")],["RegExp",J],["Set",B],["String",A?String:U("String")],["WeakMap",_],["WeakSet",V],["MouseEvent",MouseEvent]]),{get(e,t){if(e.has(t))return e.get(t);let n=globalThis[t];return"function"==typeof n&&(n=(G.test(t)?W:q)[t]),e.set(t,n),n},has:(e,t)=>e.has(t)});const Y={WeakSet:WeakSet,WeakMap:WeakMap,WeakValue:class{has(){return!1}set(){}}},{apply:Z}=Reflect;const{Map:ee,WeakMap:te,WeakSet:ne,setTimeout:re}=Q;let oe=!0,se=e=>{e.clear(),oe=!oe};var ie=function(e){const{WeakSet:t,WeakMap:n,WeakValue:r}=this||Y,o=new t,s=new n,i=new r;return function(t){if(o.has(t))return t;if(s.has(t))return s.get(t);if(i.has(t))return i.get(t);const n=Z(e,this,arguments);return o.add(n),n!==t&&("object"==typeof t&&t?s:i).set(t,n),n}}.bind({WeakMap:te,WeakSet:ne,WeakValue:class extends ee{set(e,t){return oe&&(oe=!oe,re(se,0,this)),super.set(e,t)}}});const{concat:ae,includes:ce,join:le,reduce:ue,unshift:fe}=c([]),{Map:pe,WeakMap:de}=E(globalThis),he=new pe,ye=e=>{const t=(e=>{const t=[];let n=e;for(;n;){if(he.has(n))fe(t,he.get(n));else{const e=g(n);he.set(n,e),fe(t,e)}n=w(n)}return fe(t,{}),o(p,null,t)})("function"==typeof e?e.prototype:e),n={get(e,n){if(n in t){const{value:r,get:o}=t[n];if(o)return i(o,e);if("function"==typeof r)return s(r,e)}return e[n]},set(e,n,r){if(n in t){const{set:o}=t[n];if(o)return i(o,e,r),!0}return e[n]=r,!0}};return e=>new Proxy(e,n)},{isExtensionContext:ge,Array:we,Number:me,String:ve,Object:be}=Q,{isArray:Ee}=we,{getOwnPropertyDescriptor:$e,setPrototypeOf:Se}=be,{toString:xe}=be.prototype,{slice:Re}=ve.prototype,{get:Pe}=$e(Node.prototype,"nodeType"),ke=ge?{}:{Attr:ye(Attr),CanvasRenderingContext2D:ye(CanvasRenderingContext2D),CSSStyleDeclaration:ye(CSSStyleDeclaration),Document:ye(Document),Element:ye(Element),HTMLCanvasElement:ye(HTMLCanvasElement),HTMLElement:ye(HTMLElement),HTMLImageElement:ye(HTMLImageElement),HTMLScriptElement:ye(HTMLScriptElement),MutationRecord:ye(MutationRecord),Node:ye(Node),ShadowRoot:ye(ShadowRoot),get CSS2Properties(){return ke.CSSStyleDeclaration}},Oe=(e,t)=>{if("Element"!==t&&t in ke)return ke[t](e);if(Ee(e))return Se(e,we.prototype);const n=(e=>i(Re,i(xe,e),8,-1))(e);if(n in ke)return ke[n](e);if(n in Q)return Se(e,Q[n].prototype);if("nodeType"in e)switch(i(Pe,e)){case 1:if(!(t in ke))throw new Error("unknown hint "+t);return ke[t](e);case 2:return ke.Attr(e);case 3:return ke.Node(e);case 9:return ke.Document(e)}throw new Error("unknown brand "+n)};var Te=ge?e=>e===window||e===globalThis?Q:e:ie(((e,t="Element")=>{if(e===window||e===globalThis)return Q;switch(typeof e){case"object":return e&&Oe(e,t);case"string":return new ve(e);case"number":return new me(e);default:throw new Error("unsupported value")}}));const je={get(e,t){const n=e;for(;!m(e,t);)e=w(e);const{get:r,set:s}=y(e,t);return function(){return arguments.length?o(s,n,arguments):i(r,n)}}},Ae=t=>new e(t,je);let{Array:Le,document:Ie,JSON:Me,Math:Ne,Object:Ce,RegExp:De}=Te(window);function Fe(e,t){const n="/"===e[0]?Te(e).lastIndexOf("/"):0;if(n>0){const r=Te(e).slice(1,n),o=Te(e).slice(n+1);try{return new De(r,o)}catch(e){t&&t("warn",`malformed regex /${r}/${o} (${e.message}), treating pattern as literal text`)}}return new De(Te(e).replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&"))}function qe(e,t){return e.lastIndex=0,Te(e).test(t)}function We(e,t){const n=Fe(e,t),r=Te(n.flags).includes("g")?n.flags:n.flags+"g";return new De(n.source,r)}function He(e){try{return Me.parse(e)}catch(t){return e}}function Je(e,t,n){let r=e[t];return Le.isArray(r)?(Le.isArray(n)?e[t]=Te(r).concat(n):Te(r).push(n),!0):"object"!=typeof r||null===r||"object"!=typeof n||null===n||Le.isArray(n)?"string"==typeof r?(e[t]=r+Te(n).toString(),!0):(e[t]=n,!1):(Ce.assign(r,n),!0)}function Be(e){const t=$();if("function"==typeof t.sendSnippetHitEvent)try{t.sendSnippetHitEvent(e,Ie.location.hostname)}catch(e){}}function _e(){return Te(Ne.floor(2116316160*Ne.random()+60466176)).toString(36)}function Ve(e){return Te(Le.from(e)).map((e=>`'${e}'`)).join(" ")}let{Math:ze,setInterval:Ue,performance:Xe}=Te(window);const Ge={mark(){},end(){},toString:()=>"{mark(){},end(){}}"};let Ke=!0;function Qe(e,t=10){if(Ke)return Ge;function n(){let e=Te([]);for(let{name:t,duration:n}of Xe.getEntriesByType("measure"))e.push({name:t,duration:n});e.length&&Xe.clearMeasures()}return Qe[e]||(Qe[e]=Ue(n,ze.round(6e4/ze.min(60,t)))),{mark(){Xe.mark(e)},end(t=!1){Xe.measure(e,e);const r=Xe.getEntriesByName(e,"measure"),o=r.length>0?r[r.length-1]:null;console.log("PROFILER:",o),Xe.clearMarks(e),t&&(clearInterval(Qe[e]),delete Qe[e],n())}}}let Ye=!1,Ze=null;function et(){return Ye}const{console:tt}=Te(window),nt=()=>{};function rt(...e){let{mark:t,end:n}=Qe("log");if(et()){const t=["%c DEBUG","font-weight: bold;"],n=e.indexOf("error"),r=e.indexOf("warn"),o=e.indexOf("success"),s=e.indexOf("info");-1!==n?(t[0]+=" - ERROR",t[1]+="color: red; border:2px solid red",Te(e).splice(n,1)):-1!==r?(t[0]+=" - WARNING",t[1]+="color: orange; border:2px solid orange ",Te(e).splice(r,1)):-1!==o?(t[0]+=" - SUCCESS",t[1]+="color: green; border:2px solid green",Te(e).splice(o,1)):-1!==s&&(t[1]+="color: black;",Te(e).splice(s,1)),Te(e).unshift(...t);const i=Ze;if(i){if(!Te(e).some((e=>qe(i,e))))return}}t(),tt.log(...e),n()}function ot(e){return s(et()?rt:nt,null,e)}const{Function:st,Object:it,WeakMap:at}=Te(window);let ct=!1;const lt=new at;function ut(e,t){ct||function(){const{toString:e}=st.prototype,t=l(e,(function(){const t=lt.get(this);return o(e,void 0!==t?t:this,arguments)}));it.defineProperty(window.Function.prototype,"toString",{value:t}),lt.set(t,e),ct=!0}(),lt.set(e,t)}let{parseFloat:ft,variables:pt,clearTimeout:dt,fetch:ht,setTimeout:yt,Array:gt,Error:wt,Map:mt,Object:vt,ReferenceError:bt,Set:Et,WeakMap:$t}=Te(window),{onerror:St}=Ae(window),xt=Node.prototype,Rt=Element.prototype,Pt=null;function kt(e,t,n,r=!0){let o=Te(t),s=o.indexOf(".");if(-1==s){let o=vt.getOwnPropertyDescriptor(e,t);if(o&&!o.configurable)return;let s=vt.assign({},n,{configurable:r});if(!o&&!s.get&&s.set){let n=e[t];s.get=()=>n}return void vt.defineProperty(e,t,s)}let i=o.slice(0,s).toString();t=o.slice(s+1).toString();let a=e[i];!a||"object"!=typeof a&&"function"!=typeof a||kt(a,t,n,r);let c=vt.getOwnPropertyDescriptor(e,i);if(c&&!c.configurable)return;Pt||(Pt=new $t),Pt.has(e)||Pt.set(e,new mt);let l=Pt.get(e);if(l.has(i))return void l.get(i).set(t,n);let u=new mt([[t,n]]);l.set(i,u),vt.defineProperty(e,i,{get:()=>a,set(e){if(a=e,a&&("object"==typeof a||"function"==typeof a))for(let[e,t]of u)kt(a,e,t,r)},configurable:r})}function Ot(e){let t=St();St(((...n)=>{let r=n.length&&n[0];return!("string"!=typeof r||!Te(r).includes(e))||("function"==typeof t?o(t,this,n):void 0)}))}function Tt(e,t,n,r="",o=!0){let s=ot(e);if(!n)return void s("error","no property to abort on read");let i=_e(),a=!1;s("info",`aborting on ${n} access`),kt(t,n,{get:function(){throw s("success",`${n} access aborted`,`\nFILTER: ${e} ${r}`),a||(a=!0,Be(`${e} ${r}`)),new bt(i)},set(){}},o),Ot(i)}function jt(e,t,n,r="",o=!0){let s=ot(e);if(!n)return void s("error","no property to abort on write");let i=_e(),a=!1;s("info",`aborting when setting ${n}`),kt(t,n,{set:function(){throw s("success",`setting ${n} aborted`,`\nFILTER: ${e} ${r}`),a||(a=!0,Be(`${e} ${r}`)),new bt(i)}},o),Ot(i)}function At(e,t=!1,n=!1){let r=pt.abortedIframes,s=pt.iframePropertiesToAbort;const a=Ve(e);for(let o of gt.from(window.frames))if(r.has(o))for(let s of e)t&&r.get(o).read.add({property:s,formattedProperties:a}),n&&r.get(o).write.add({property:s,formattedProperties:a});for(let r of e)t&&s.read.add({property:r,formattedProperties:a}),n&&s.write.add({property:r,formattedProperties:a});function c(){for(let e of gt.from(window.frames)){r.has(e)||r.set(e,{read:new Et(s.read),write:new Et(s.write)});let t=r.get(e).read;if(t.size>0){let n=gt.from(t);t.clear();for(let{property:t,formattedProperties:r}of n)Tt("abort-on-iframe-property-read",e,t,r)}let n=r.get(e).write;if(n.size>0){let t=gt.from(n);n.clear();for(let{property:n,formattedProperties:r}of t)jt("abort-on-iframe-property-write",e,n,r)}}}c(),r.has(document)||(r.set(document,!0),function(e){let t;function n(e,t){for(let n of t){kt(e,n,r(e,n))}}function r(t,n){let r=t[n],s=function(...t){let n;return n=o(r,this,t),e&&e(),n};return ut(s,r),{get:()=>s}}function s(t,n){let r=vt.getOwnPropertyDescriptor(t,n),{set:o}=r||{};return{set(t){let n;return n=i(o,this,t),e&&e(),n}}}n(xt,["appendChild","insertBefore","replaceChild"]),n(Rt,["append","prepend","replaceWith","after","before","insertAdjacentElement","insertAdjacentHTML"]),t=s(Rt,"innerHTML"),kt(Rt,"innerHTML",t),t=s(Rt,"outerHTML"),kt(Rt,"outerHTML",t)}(c))}let{Object:Lt}=window;function It(e,t){if(!(e instanceof Lt))return;let n=e,r=Te(t).split(".");if(0===r.length)return;for(let e=0;e<r.length-1;e++){let t=r[e];if(!m(n,t))return;if(n=n[t],!(n instanceof Lt))return}let o=r[r.length-1];return m(n,o)?[n,o]:void 0}const Mt=Te(/^\d+$/);function Nt(e){switch(e){case"false":return!1;case"true":return!0;case"falseStr":return"false";case"trueStr":return"true";case"null":return null;case"noopFunc":return()=>{};case"trueFunc":return()=>!0;case"falseFunc":return()=>!1;case"emptyArray":return[];case"emptyObj":return{};case"undefined":return;case"":return e;default:return Mt.test(e)?ft(e):e}}function Ct(e,t){if(!e||!e.length)return!0;const n=_e(),r=new wt(n),o=new URL(self.location.href);o.hash="";const s=/(.*?@)?(\S+)(:\d+):\d+\)?$/,i=[];for(let e of r.stack.split(/[\n\r]+/)){if(Te(e).includes(n))continue;e=Te(e).trim();const t=Te(s).exec(e);if(null===t)continue;let r=t[2];Te(r).startsWith("(")&&(r=Te(r).slice(1)),r===o.href?r="inlineScript":Te(r).startsWith("<anonymous>")&&(r="injectedScript");let a=t[1]?Te(t[1]).slice(0,-1):Te(e).slice(0,Te(t).index).trim();Te(a).startsWith("at")&&(a=Te(a).slice(2).trim());let c=t[3];Te(i).push(" "+`${a} ${r}${c}:1`.trim())}i[0]="stackDepth:"+(i.length-1);const a=Te(i).join("\n");for(let n of e){if(qe(Fe(n,t),a))return t("info",`Found needle in stack trace: ${n}`),!0}return t("info",`Stack trace does not match any needle. Stack trace: ${a}`),!1}new mt;let{HTMLScriptElement:Dt,Object:Ft,ReferenceError:qt}=Te(window),Wt=Ft.getPrototypeOf(Dt);const{Error:Ht,Object:Jt,Array:Bt,Map:_t}=Te(window);let Vt=null;const zt=new Set;function Ut(e){zt.has(e)||(zt.add(e),Be(e))}function Xt(e,t,n){let r=e;for(const e of n){if(!r||!m(r,e))return!1;r=r[e]}if("string"==typeof r||"number"==typeof r){return qe(t,r.toString())}return!1}const{Array:Gt,Blob:Kt,Error:Qt,Object:Yt,Reflect:Zt}=Te(window),en=[],tn=new Set;let{Error:nn,URL:rn}=Te(window),{cookie:on}=Ae(document);const{Map:sn,Object:an,Reflect:cn,WeakMap:ln}=Te(window),un=window.EventTarget.prototype.addEventListener,fn=window.EventTarget.prototype.removeEventListener,pn=new ln;let dn=[];const hn=new Set;function yn(e){hn.has(e)||(hn.add(e),Be(e))}let{console:gn,document:wn,getComputedStyle:mn,isExtensionContext:vn,variables:bn,Array:En,MutationObserver:$n,Object:Sn,DOMMatrix:xn,XPathEvaluator:Rn,XPathExpression:Pn,XPathResult:kn}=Te(window);const{querySelectorAll:On}=wn,Tn=On&&s(On,wn);function jn(e,t=!1){return In(e,Tn.bind(wn),wn,t)}function An(e,t,n,r){const o=t.getAttribute("xlink:href")||t.getAttribute("href");if(o){const i=Tn(o)[0];if(!i&&et())return gn.log("No elements found matching",o),!1;if(!(s=e)||0===s.length||s.every((e=>""===e.trim()))){const e=r.length>0?r:[];return n.push({element:i,rootParents:[...e,t]}),!1}const a=i.querySelectorAll.bind(i);return{nextBoundElement:i,nestedSelectorsString:e.join("^^"),next$$:a}}var s}function Ln(e,t){const n=function(e,t=!1){try{const n=navigator.userAgent.includes("Firefox")?e.openOrClosedShadowRoot:browser.dom.openOrClosedShadowRoot(e);return null===n&&et()&&!t&&gn.log("Shadow root not found or not added in element yet",e),n}catch(n){return et()&&!t&&gn.log("Error while accessing shadow root",e,n),null}}(t);if(n){const{querySelectorAll:r}=n,o=r&&s(r,n).bind(n);return{nextBoundElement:t,nestedSelectorsString:":host "+e.join("^^"),next$$:o}}return!1}function In(e,t,n,r,o=[]){if(e.includes("^^")){const[s,i,...a]=e.split("^^");let c,l;switch(i){case"svg":l=An;break;case"sh":l=Ln;break;default:return et()&&gn.log(i," is not supported. Supported commands are: \n^^sh^^\n^^svg^^"),[]}c=""===s.trim()?[n]:t(s);const u=[];for(const e of c){const t=l(a,e,u,o);if(!t)continue;const{next$$:n,nestedSelectorsString:s,nextBoundElement:i}=t,c=In(s,n,i,r,[...o,e]);c&&u.push(...c)}return u}const s=t(e);return r?[...s].map((e=>({element:e,rootParents:o.length>0?o:[]}))):s}const{assign:Mn,setPrototypeOf:Nn}=Sn;class Cn extends Pn{evaluate(...e){return Nn(o(super.evaluate,this,e),kn.prototype)}}class Dn extends Rn{createExpression(...e){return Nn(o(super.createExpression,this,e),Cn.prototype)}}function Fn(e){if(bn.hidden.has(e))return!1;!function(e){vn&&"function"==typeof checkElement&&checkElement(e)}(e),bn.hidden.add(e);let{style:t}=Te(e),n=Te(t,"CSSStyleDeclaration"),r=Te([]);const o=$();let{debugCSSProperties:s}=o;for(let[e,t]of s||[["display","none"]])n.setProperty(e,t,"important"),r.push([e,n.getPropertyValue(e)]);return new $n((()=>{for(let[e,t]of r){let r=n.getPropertyValue(e),o=n.getPropertyPriority(e);r==t&&"important"==o||n.setProperty(e,t,"important")}})).observe(e,{attributes:!0,attributeFilter:["style"]}),!0}function qn(e){let t=e;if(t.startsWith("xpath(")&&t.endsWith(")")){let t=function(e){let t=e;if(t.startsWith("xpath(")&&t.endsWith(")")){let e=t.slice(6,-1),n=(new Dn).createExpression(e,null),r=kn.ORDERED_NODE_SNAPSHOT_TYPE;return e=>{if(!e)return;let t=n.evaluate(wn,r,null),{snapshotLength:o}=t;for(let n=0;n<o;n++)e(t.snapshotItem(n))}}return t=>jn(e).forEach(t)}(e);return()=>{let e=Te([]);return t((t=>e.push(t))),e}}return()=>En.from(jn(e))}let{ELEMENT_NODE:Wn,TEXT_NODE:Hn,prototype:Jn}=Node,{prototype:Bn}=Element,{prototype:_n}=HTMLElement,{console:Vn,variables:zn,DOMParser:Un,Error:Xn,MutationObserver:Gn,Object:Kn,ReferenceError:Qn}=Te(window),{getOwnPropertyDescriptor:Yn}=Kn;const{CanvasRenderingContext2D:Zn,document:er,Map:tr,MutationObserver:nr,Object:rr,requestAnimationFrame:or,Set:sr,WeakMap:ir,WeakSet:ar}=Te(window);let cr,lr=new ir,ur=new ar,fr=new sr,pr=new ar;const dr=new sr;let hr=!1,yr=!1,gr=!1,wr=new sr;function mr(e,t){ur.add(e),lr.delete(e);const n=Te(e).closest(t.selector);if(n&&!pr.has(n)){Fn(n),pr.add(n),ot("hide-if-canvas-contains")("success","Matched: ",n,`\nFILTER: hide-if-canvas-contains ${t.formattedArguments}`);const e="hide-if-canvas-contains "+t.formattedArguments;dr.has(e)||(dr.add(e),Be(e))}else!function(e,t){fr.add({canvasElement:e,rule:t})}(e,t)}function vr(e){hr&&e&&!ur.has(e)&&(wr.add(e),gr||(gr=!0,or(br)))}function br(){gr=!1;const e=wr;wr=new sr;const t=ot("hide-if-canvas-contains");for(const n of e){if(ur.has(n))continue;let e=null,r=!1;for(const[o,s]of cr)if("data"===s.mode&&Te(n).closest(s.selector)&&!r){if(null===e)try{e=Te(n).toDataURL().toString()}catch(e){t("info","Could not read canvas data URL:",e.message),r=!0;continue}qe(o,e)&&mr(n,s)}}}Te(window);const{Map:Er,MutationObserver:$r,Object:Sr,Set:xr,WeakSet:Rr}=Te(window);let Pr=Element.prototype,{attachShadow:kr}=Pr,Or=new Rr,Tr=new Er;const jr=new xr;let Ar=null;const{Error:Lr,Object:Ir,Array:Mr,parseFloat:Nr,isNaN:Cr}=Te(window);class Dr{constructor(e){if("string"!=typeof e)throw new Lr("JSONPath: query must be a string");if(!e.length)throw new Lr("JSONPath: query must be a non-empty string");this._steps=this._tokenize(e)}_tokenize(e){e=Te(e);const t=new Mr;let n=0;for("$"===e[0].toString()&&(n=1);n<e.length;){let r=!1;if(e.startsWith("..",n)?(r=!0,n+=2):"."===e[n].toString()&&n++,"["===e[n].toString()){const o=e.indexOf("]",n);if(-1===o)throw new Lr(`JSONPath: unclosed bracket in query "${e}"`);const s=e.slice(n+1,o);if(!s.length)throw new Lr(`JSONPath: empty bracket notation in query "${e}"`);s.startsWith("?(")?t.push({type:"filter",key:"?",filter:this._parseFilter(s),recursive:r}):t.push({type:"direct",key:s.replace(/['"]/g,"").toString(),recursive:r}),n=o+1}else{const o=e.slice(n).search(/[.[]/),s=-1===o?e.slice(n).toString():e.slice(n,n+o).toString();if(!s&&!r)throw new Lr(`JSONPath: trailing dot with no property name in query "${e}"`);(s||r)&&t.push({type:"direct",key:s||"*",recursive:r}),n+=s.length}}return t}_parseFilter(e){const t=(e=Te(e)).match(/(?:[@.]?)([\w]+(?:\.[\w]+)*)\s*([!=^$*]=|[<>]=?)\s*(?:['"](.+?)['"]|([\w.+-]+))\)/);if(!t)throw new Lr(`JSONPath: invalid filter expression "${e}"`);return{property:t[1],operator:t[2],target:null!=t[3]?t[3]:t[4]}}evaluate(e){if(!e||"object"!=typeof e)throw new Lr("JSONPath: evaluate() requires an object or array");let t=Te([{parent:{root:e},key:"root"}]);for(const e of this._steps){const n=[];for(const{parent:r,key:o}of t){const t=r[o];t&&"object"==typeof t&&(e.recursive?this._deepSearch(t,e,n):this._match(t,e,n))}t=n}return t}_match(e,t,n){const r="*"===t.key||"?"===t.key?Ir.keys(e):[t.key];for(const o of r)if(m(e,o)){if("?"===t.key&&!this._test(e[o],t.filter))continue;n.push({parent:e,key:o})}}_deepSearch(e,t,n,r=1e4){if(this._match(e,t,n),!(r<=0))for(const o of Ir.keys(e))e[o]&&"object"==typeof e[o]&&this._deepSearch(e[o],t,n,r-1)}_test(e,t){if(!t||!e)return!1;let n=e;for(const e of Te(t.property).split(".")){if(null==n||"object"!=typeof n)return!1;n=n[e]}const r=Te(n),o=Te(t.target),s=r.toString(),i=o.toString(),a=Nr(r),c=Nr(o),l=!Cr(a)&&!Cr(c);switch(t.operator){case"==":return l?a===c:s===i;case"!=":return l?a!==c:s!==i;case"<":return l?a<c:s<i;case"<=":return l?a<=c:s<=i;case">":return l?a>c:s>i;case">=":return l?a>=c:s>=i;case"^=":return r.startsWith(o);case"$=":return r.endsWith(o);case"*=":return r.includes(o);default:return!1}}}const{Array:Fr,Error:qr,JSON:Wr,Map:Hr,Object:Jr,Response:Br}=Te(window);let _r=null;const Vr=new Set;function zr(e){Vr.has(e)||(Vr.add(e),Be(e))}let{Array:Ur,Error:Xr,JSON:Gr,Map:Kr,Object:Qr,Response:Yr}=Te(window),Zr=null;const eo=new Set;function to(e){eo.has(e)||(eo.add(e),Be(e))}const{Error:no,Object:ro,Map:oo}=Te(window);let so=null;const io=new Set;function ao(e){io.has(e)||(io.add(e),Be(e))}function co(e,t,n){if(!n.length){if("string"==typeof e||"number"==typeof e){return qe(t,e.toString())}return!1}let r=e;for(const e of n){if(!r||!m(r,e))return!1;r=r[e]}if("string"==typeof r||"number"==typeof r){return qe(t,r.toString())}return!1}let{Error:lo}=Te(window);const{Array:uo,addEventListener:fo,Error:po,Object:ho,Reflect:yo,Set:go,WeakSet:wo}=Te(window),mo=new wo,vo=new uo,bo=new go,Eo=new go;let{Error:$o,Map:So,Object:xo,console:Ro}=Te(window),{toString:Po}=Function.prototype,ko=EventTarget.prototype,{addEventListener:Oo}=ko,To=null;const jo=new Set;const Ao=Proxy,{toStringTag:Lo}=Symbol,{defineProperty:Io,deleteProperty:Mo,get:No,getOwnPropertyDescriptor:Co,has:Do,set:Fo}=f(Reflect),{Array:qo,Error:Wo,Map:Ho,Object:Jo,Set:Bo,document:_o,parseFloat:Vo,setTimeout:zo}=Te(window),Uo=new qo,Xo=new Bo;function Go(e){Xo.has(e)||(Xo.add(e),Be(e))}const Ko=new Bo(["closed","close","opener","frameElement","parent","top","self","window","globalThis","frames","location","document","history",Lo]);let{Array:Qo,Map:Yo,Object:Zo,parseInt:es,Set:ts}=Te(window);const ns=new Yo,rs=new ts,os=new ts;let{fetch:ss,Request:is}=Te(window),as=!1;const cs=[],ls=[],us=[],fs=()=>{if(!as){let e=l(ss,((...e)=>{let[t,n]=e,r="string"==typeof t?t:t&&"string"==typeof t.url?t.url:"";if(cs.length>0&&"string"==typeof t){let n;try{n=new URL(t)}catch(e){if(!(e instanceof TypeError))throw e;n=new URL(t,Te(document).location)}cs.forEach((e=>e(n))),e[0]=n.href,r=n.href}const s=e=>o(ss,self,e).then((e=>{let t=e;return ls.forEach((e=>{t=e(t,{url:r})})),t})),i=e=>{let t=e;return us.forEach((e=>{t=e(t)})),t};if(us.length>0)if(n&&"string"==typeof n.body){const t=i(n.body);t!==n.body&&(e[1]=Object.assign({},n,{body:t}))}else if(t&&"function"==typeof t.clone&&(!n||null==n.body)&&"GET"!==t.method&&"HEAD"!==t.method)return t.clone().text().then((n=>{if(!n)return s(e);const r=i(n);if(r===n)return s(e);const o=new is(t,{body:r,referrer:t.referrer,referrerPolicy:t.referrerPolicy});return s([o,...e.slice(1)])})).catch((()=>s(e)));return s(e)}));ut(e,window.fetch),window.fetch=e,as=!0}};let ps,{Error:ds,JSON:hs}=Te(window);const ys=new Set;let gs,{Map:ws,Object:ms,Response:vs}=Te(window);const bs=new Set;const{Error:Es,Object:$s,atob:Ss,btoa:xs}=Te(window);let{XMLHttpRequest:Rs,WeakMap:Ps,Object:ks}=Te(window),Os=!1;const Ts=[],js=[],As=new Ps,Ls=()=>{if(Os)return;const e=class extends Rs{open(e,t,...n){return As.set(this,{method:e,url:t}),super.open(e,t,...n)}send(e){let t=e;if("string"==typeof e&&Ts.length>0)for(const e of Ts)t=e(t);return super.send(t)}get response(){const e=super.response;if(0===js.length)return e;const t=As.get(this);if(void 0===t)return e;const n="string"==typeof e?e.length:void 0;if(t.lastResponseLength!==n&&(t.cachedResponse=void 0,t.lastResponseLength=n),void 0!==t.cachedResponse)return t.cachedResponse;if("string"!=typeof e)return t.cachedResponse=e;let r=e;for(const e of js)r=e(r,{url:t.url});return t.cachedResponse=r}get responseText(){const e=this.response;return"string"!=typeof e?super.responseText:e}};ut(e,window.XMLHttpRequest),ut(e.prototype.open,window.XMLHttpRequest.prototype.open),ut(e.prototype.send,window.XMLHttpRequest.prototype.send),ut(ks.getOwnPropertyDescriptor(e.prototype,"response").get,ks.getOwnPropertyDescriptor(window.XMLHttpRequest.prototype,"response").get),ut(ks.getOwnPropertyDescriptor(e.prototype,"responseText").get,ks.getOwnPropertyDescriptor(window.XMLHttpRequest.prototype,"responseText").get),window.XMLHttpRequest=e,Os=!0};let Is,{Error:Ms,JSON:Ns}=Te(window);const Cs=new Set;let Ds,{JSON:Fs}=Te(window);const qs=new Set;let Ws,{delete:Hs,has:Js}=c(URLSearchParams.prototype);const Bs=new Set;const{Error:_s,Object:Vs,parseInt:zs,isNaN:Us}=Te(window),{toString:Xs}=Function.prototype,Gs=window.setTimeout,Ks=window.setInterval,Qs={TIMEOUT:"timeout",INTERVAL:"interval",BOTH:"both"};let Ys=null;const Zs=new Set;const{Array:ei,Date:ti,Object:ni,Set:ri,WeakSet:oi,document:si,parseInt:ii,window:ai}=Te(window);let ci=!1;const li="param_first",ui="param_second",fi="pyv",pi="client_screen",di="ad_type",hi="none",yi={[li]:ui,[ui]:fi,[fi]:pi,[pi]:di},gi="eAFgAQ",wi="8AUB",mi="CHANNEL",vi=["playerErrorMessageRenderer","UNPLAYABLE"],bi=["AGE_CHECK_REQUIRED","AGE_VERIFICATION_REQUIRED","CONTENT_CHECK_REQUIRED","LOGIN_REQUIRED"],Ei=e=>"string"==typeof e&&-1!==bi.indexOf(e),$i=["gate","preview","shorts"];function Si(e){if("string"!=typeof e||0===e.length)return"homepage";let t=e;const n=t.indexOf("?");-1!==n&&(t=t.slice(0,n));const r=t.indexOf("#");-1!==r&&(t=t.slice(0,r));const o=t.indexOf("://");-1!==o&&(t=t.slice(o+3));const s=t.indexOf("/");if(-1===s)return"homepage";const i=/^\/([^/]+)/.exec(t.slice(s));return i?i[1].toLowerCase():"homepage"}const{Date:xi,MutationObserver:Ri,Set:Pi,document:ki,parseInt:Oi,setTimeout:Ti,window:ji}=Te(window);let Ai=!1;function Li(e,t){if(null==e)return;const n=e[t];if("function"==typeof n)try{return n.call(e)}catch(e){return}}function Ii(e,t){const n=function(e){if("string"!=typeof e||0===e.length)return"";let t=e;const n=t.indexOf("?");-1!==n&&(t=t.slice(0,n));const r=t.indexOf("#");-1!==r&&(t=t.slice(0,r));const o=t.indexOf("://");-1!==o&&(t=t.slice(o+3));const s=t.indexOf("/");if(-1===s)return"";const i=t.slice(s),a=/^\/([^/]+)/.exec(i);return a?a[1].toLowerCase():""}(e);for(let e=0;e<t.deny.length;e++)if(t.deny[e]===n)return!1;if(0===t.allow.length)return!0;for(let e=0;e<t.allow.length;e++)if(t.allow[e]===n)return!0;return!1}const Mi={"abort-current-inline-script":function(e,t=null){const n=Ve(arguments),r=ot("abort-current-inline-script"),{mark:o,end:s}=Qe("abort-current-inline-script"),a=t?Fe(t,r):null,c=_e(),l=Te(document).currentScript;let u=!1,f=window;const p=Te(e).split("."),d=Te(p).pop();for(let e of Te(p))if(f=f[e],!f||"object"!=typeof f&&"function"!=typeof f)return void r("warn",p," is not found");const{get:h,set:y}=Ft.getOwnPropertyDescriptor(f,d)||{};let g=f[d];void 0===g&&r("warn","The property",d,"doesn't exist yet. Check typos.");const w=()=>{const e=Te(document).currentScript;if(e instanceof Wt&&""==Te(e,"HTMLScriptElement").src&&e!=l&&(!a||qe(a,Te(e).textContent)))throw r("success",p," is aborted \n",e,"\nFILTER: abort-current-inline-script",n),u||(u=!0,Be("abort-current-inline-script "+n)),new qt(c)},m={get(){return w(),h?i(h,this):g},set(e){w(),y?i(y,this,e):g=e}};o(),kt(f,d,m),s(),Ot(c)},"abort-on-iframe-property-read":function(...e){const{mark:t,end:n}=Qe("abort-on-iframe-property-read");t(),At(e,!0,!1),n()},"abort-on-iframe-property-write":function(...e){const{mark:t,end:n}=Qe("abort-on-iframe-property-write");t(),At(e,!1,!0),n()},"abort-on-property-read":function(e,t){const n=!("false"===t),r=Ve(arguments),{mark:o,end:s}=Qe("abort-on-property-read");o(),Tt("abort-on-property-read",window,e,r,n),s()},"abort-on-property-write":function(e,t){const n=Ve(arguments),{mark:r,end:o}=Qe("abort-on-property-write"),s=!("false"===t);r(),jt("abort-on-property-write",window,e,n,s),o()},"array-override":function(e,t,n="false",r,s){if(!e)throw new Ht("[array-override snippet]: Missing method to override.");if(!t)throw new Ht("[array-override snippet]: Missing needle.");Vt||(Vt=new _t);let i=ot("array-override");const{mark:a,end:c}=Qe("array-override"),u=Ve(arguments);if("push"!==e||Vt.has("push"))if("includes"!==e||Vt.has("includes")){if("forEach"===e&&!Vt.has("forEach")){a();const{forEach:e}=Bt.prototype;Vt.set("forEach",Te([]));let t=l(e,(function(t,n){const r=Vt.get("forEach");return o(e,this,[function(e,s,a){for(const{needleRegex:t,pathSegments:n,stackNeedles:o,formattedArgs:s}of r)if(n.length||"string"!=typeof e&&"number"!=typeof e){if(n.length&&"object"==typeof e&&null!==e&&Xt(e,t,n)&&Ct(o,i))return i("success",`Array.forEach skipped callback for object containing needle: ${t}\nFILTER: array-override ${s}`),void Ut("array-override "+s)}else{const n=e.toString();if(n.match&&n.match(t)&&Ct(o,i))return i("success",`Array.forEach skipped callback for item matching needle: ${t}\nFILTER: array-override ${s}`),void Ut("array-override "+s)}return o(t,n||this,[e,s,a])},n])}));ut(t,e),Jt.defineProperty(window.Array.prototype,"forEach",{value:t}),i("info","Wrapped Array.prototype.forEach"),c()}}else{a();const{includes:e}=Bt.prototype;Vt.set("includes",Te([]));let t=l(e,(function(t){const n=Vt.get("includes");for(const{needleRegex:e,retVal:r,pathSegments:o,stackNeedles:s,formattedArgs:a}of n)if(o.length||"string"!=typeof t&&"number"!=typeof t){if(o.length&&"object"==typeof t&&null!==t&&Xt(t,e,o)&&Ct(s,i))return i("success",`Array.includes returned ${r} for object containing ${e}\nFILTER: array-override ${a}`),Ut("array-override "+a),r}else if(t.toString().match&&t.toString().match(e)&&Ct(s,i))return i("success",`Array.includes returned ${r} for ${e}\nFILTER: array-override ${a}`),Ut("array-override "+a),r;return o(e,this,arguments)}));ut(t,e),Jt.defineProperty(window.Array.prototype,"includes",{value:t}),i("info","Wrapped Array.prototype.includes"),c()}else{a();const{push:e}=Bt.prototype;Vt.set("push",Te([]));let t=l(e,(function(t){const n=Vt.get("push");for(const{needleRegex:e,pathSegments:r,stackNeedles:o,formattedArgs:s}of n)if(r.length||"string"!=typeof t&&"number"!=typeof t){if(r.length&&"object"==typeof t&&null!==t&&Xt(t,e,r)&&Ct(o,i))return i("success",`Array.push is ignored for object containing needle: ${e}\nFILTER: array-override ${s}`),void Ut("array-override "+s)}else{const n=t.toString();if(n.match&&n.match(e)&&Ct(o,i))return i("success",`Array.push is ignored for needle: ${e}\nFILTER: array-override ${s}`),void Ut("array-override "+s)}return o(e,this,arguments)}));ut(t,e),Jt.defineProperty(window.Array.prototype,"push",{value:t}),i("info","Wrapped Array.prototype.push"),c()}const f=Fe(t,i);let p=[];r&&(p=r.split("."));let d=[];s&&(d=s.split(",").map((e=>e.trim())));const h=Vt.get(e),y="true"===n;h.push({needleRegex:f,retVal:y,pathSegments:p,stackNeedles:d,formattedArgs:u}),Vt.set(e,h)},"blob-override":function(e,t="",n=null){if(!e)throw new Qt("[blob-override snippet]: Missing parameter search.");const r=ot("blob-override"),o=Ve(arguments),{mark:s,end:i}=Qe("blob-override");if(s(),en.push({match:We(e,r),replaceWith:t,needle:n?Fe(n,r):null,formattedArgs:o}),en.length>1)return;const a=Kt;function c(e,t={}){if(Gt.isArray(e)){let t=Te(e).join("");for(const e of Te(en))if((!e.needle||qe(e.needle,t))&&qe(e.match,t)){t=t.replace(e.match,e.replaceWith),r("success",`Replaced: ${e.match} → ${e.replaceWith},\nFILTER: blob-override ${e.formattedArgs}`);const n="blob-override "+e.formattedArgs;tn.has(n)||(tn.add(n),Be(n))}e=[t]}const n=Zt.construct(a,[e,t]);return Yt.setPrototypeOf(n,c.prototype),n}c.prototype=a.prototype,Yt.setPrototypeOf(c,a),ut(c,window.Blob),window.Blob=c,r("info","Wrapped Blob constructor in context "),i()},"cookie-remover":function(e,t=!1){if(!e)throw new nn("[cookie-remover snippet]: No cookie to remove.");const n=Ve(arguments);let r=ot("cookie-remover");const{mark:o,end:s}=Qe("cookie-remover");let i=Fe(e,r),a=!1;if(!Te(/^http|^about/).test(location.protocol))return void r("warn","Snippet only works for http or https and about.");function c(){return Te(on()).split(";").filter((e=>qe(i,Te(e).split("=")[0])))}const l=()=>{r("info","Parsing cookies for matches"),o();for(const e of Te(c())){let t=Te(location.hostname);!t&&Te(location.ancestorOrigins)&&Te(location.ancestorOrigins[0])&&(t=new rn(Te(location.ancestorOrigins[0])).hostname);const o=Te(e).split("=")[0],s="expires=Thu, 01 Jan 1970 00:00:00 GMT",i="path=/",c=t.split(".");for(let e=c.length;e>0;e--){const t=c.slice(c.length-e).join(".");on(`${Te(o).trim()}=;${s};${i};domain=${t}`),on(`${Te(o).trim()}=;${s};${i};domain=.${t}`),r("success",`Set expiration date on ${o}`,"\nFILTER: cookie-remover",n),a||(a=!0,Be("cookie-remover "+n))}}s()};if(l(),t){let e=c();setInterval((()=>{let t=c();if(t!==e)try{l()}finally{e=t}}),1e3)}},debug:function(e){Ye=!0,e&&(Ze=Fe(e))},"event-override":function(e,t,n=null,r=null,s=null,a=""){const c=Ve(arguments);let u=ot("[event-override]");if(!("rewrite"!==t||r&&s))return void u("error",`rewrite mode requires the property and pattern params.\nFILTER: event-override ${c}`);const f={eventType:e,mode:t,needle:n?Fe(n,u):null,property:r,search:"rewrite"===t?We(s,u):null,replacement:a,formattedArgs:c};if(dn.includes(f)||dn.push(f),dn.length>1)return;const{mark:p,end:d}=Qe("event-override"),h=an.getOwnPropertyDescriptor(window.EventTarget.prototype,"addEventListener");if(h.configurable){let e=l(un,(function(e,t,n){p();const r=dn.filter((t=>t.eventType===e));if(!r.length||e!==r[0].eventType)return d(),o(un,this,arguments);const s=r.find((e=>"disable"===e.mode&&(!e.needle||qe(e.needle,t.toString()))));if(s)return u("success",`Disabling ${s.eventType} event, \nFILTER: event-override ${s.formattedArgs}`),yn("event-override "+s.formattedArgs),void d();const a=r.filter((e=>"trusted"===e.mode&&(!e.needle||qe(e.needle,t.toString())))),c=r.filter((e=>"rewrite"===e.mode&&(!e.needle||qe(e.needle,t.toString()))));if(!("function"==typeof t||t&&"function"==typeof t.handleEvent)||!a.length&&!c.length)return d(),o(un,this,arguments);const l=function(e){const n=new Proxy(e,{get(t,n){if("isTrusted"===n&&a.length)return u("success",`Providing trusted value for ${e.type} event`),yn("event-override "+a[0].formattedArgs),!0;const r=cn.get(t,n);if(c.length&&"string"==typeof r){const t=c.find((e=>e.property===n));if(t){const o=Te(r).replace(t.search,t.replacement).toString();if(o!==r)return u("success",`Rewriting ${n} of ${e.type} event, \nFILTER: event-override ${t.formattedArgs}`),yn("event-override "+t.formattedArgs),o}}return"function"==typeof r?function(...e){return o(r,t,e)}:r}});return"function"==typeof t?i(t,this,n):i(t.handleEvent,t,n)};return l.originalListener=t,pn.has(t)||pn.set(t,new sn),pn.get(t).set(e,l),u("info",`\nWrapping event listener for ${e}`),d(),o(un,this,[e,l,n])}));ut(e,un),an.defineProperty(window.EventTarget.prototype,"addEventListener",{...h,value:e})}const y=an.getOwnPropertyDescriptor(window.EventTarget.prototype,"removeEventListener");if(y.configurable){let e=l(fn,(function(e,t,n){if(t&&pn.has(t)&&pn.get(t).has(e)){const r=pn.get(t).get(e);return pn.get(t).delete(e),o(fn,this,[e,r,n])}return o(fn,this,arguments)}));ut(e,fn),an.defineProperty(window.EventTarget.prototype,"removeEventListener",{...y,value:e})}u("info","Initialized event-override snippet")},"freeze-element":function(e,t="",...n){const r=Ve(arguments);let s,a,c=!1,l=!1,u=Te(n).filter((e=>!y(e))),f=Te(n).filter((e=>y(e))).map(Fe),p=_e(),d=qn(e);!function(){let n=Te(t).split("+");1===n.length&&""===n[0]&&(n=[]);for(let t of n)switch(t){case"subtree":c=!0;break;case"abort":l=!0;break;default:throw new Xn("[freeze] Unknown option passed to the snippet. [selector]: "+e+" [option]: "+t)}}();let h={selector:e,shouldAbort:l,rid:p,exceptionSelectors:u,regexExceptions:f,changeId:0};function y(e){return e.length>=2&&"/"==e[0]&&"/"==e[e.length-1]}function g(){a=d(),w(a,!1)}function w(e,t=!0){for(let n of e)zn.frozen.has(n)||(zn.frozen.set(n,h),!t&&c&&new Gn((e=>{for(let t of Te(e))w(Te(t,"MutationRecord").addedNodes)})).observe(n,{childList:!0,subtree:!0}),c&&Te(n).nodeType===Wn&&w(Te(n).childNodes))}function m(e,...t){rt(`[freeze][${e}] `,...t)}function v(e,t,n,r){let o=r.selector,s=r.changeId,i="string"==typeof e,a=r.shouldAbort?"aborting":"watching";switch(Vn.groupCollapsed(`[freeze][${s}] ${a}: ${o}`),n){case"appendChild":case"append":case"prepend":case"insertBefore":case"replaceChild":case"insertAdjacentElement":case"insertAdjacentHTML":case"insertAdjacentText":case"innerHTML":case"outerHTML":m(s,i?"text: ":"node: ",e),m(s,"added to node: ",t);break;case"replaceWith":case"after":case"before":m(s,i?"text: ":"node: ",e),m(s,"added to node: ",Te(t).parentNode);break;case"textContent":case"innerText":case"nodeValue":m(s,"content of node: ",t),m(s,"changed to: ",e)}m(s,`using the function "${n}"`),Vn.groupEnd(),r.changeId++}function b(e,t){if(t)for(let n of t)if(qe(n,e))return!0;return!1}zn.frozen.has(document)||(zn.frozen.set(document,!0),function(){let e;function t(e){return e&&zn.frozen.has(e)}function n(e){try{return e&&(zn.frozen.has(e)||zn.frozen.has(Te(e).parentNode))}catch(e){return!1}}function r(e,t){try{return e&&(zn.frozen.has(e)&&t||zn.frozen.has(Te(e).parentNode)&&!t)}catch(e){return!1}}function o(e){return zn.frozen.get(e)}function s(e){try{if(zn.frozen.has(e))return zn.frozen.get(e);let t=Te(e).parentNode;return zn.frozen.get(t)}catch(e){}}function i(e,t){try{if(zn.frozen.has(e)&&t)return zn.frozen.get(e);let n=Te(e).parentNode;return zn.frozen.get(n)}catch(e){}}e=P(Jn,"appendChild",t,o),kt(Jn,"appendChild",e),e=P(Jn,"insertBefore",t,o),kt(Jn,"insertBefore",e),e=P(Jn,"replaceChild",t,o),kt(Jn,"replaceChild",e),e=k(Bn,"append",t,o),kt(Bn,"append",e),e=k(Bn,"prepend",t,o),kt(Bn,"prepend",e),e=k(Bn,"replaceWith",n,s),kt(Bn,"replaceWith",e),e=k(Bn,"after",n,s),kt(Bn,"after",e),e=k(Bn,"before",n,s),kt(Bn,"before",e),e=O(Bn,"insertAdjacentElement",r,i),kt(Bn,"insertAdjacentElement",e),e=O(Bn,"insertAdjacentHTML",r,i),kt(Bn,"insertAdjacentHTML",e),e=O(Bn,"insertAdjacentText",r,i),kt(Bn,"insertAdjacentText",e),e=T(Bn,"innerHTML",t,o),kt(Bn,"innerHTML",e),e=T(Bn,"outerHTML",n,s),kt(Bn,"outerHTML",e),e=j(Jn,"textContent",t,o),kt(Jn,"textContent",e),e=j(_n,"innerText",t,o),kt(_n,"innerText",e),e=j(Jn,"nodeValue",t,o),kt(Jn,"nodeValue",e)}()),s=new Gn(g),s.observe(document,{childList:!0,subtree:!0}),g();let E=!1;function $(e){throw E||(E=!0,Be("freeze-element "+r)),new Qn(e)}function S(e,t,n,r){let o=new Un,{body:s}=Te(o.parseFromString(e,"text/html")),i=x(Te(s).childNodes,t,n,r);return Te(i).map((e=>{switch(Te(e).nodeType){case Wn:return Te(e).outerHTML;case Hn:return Te(e).textContent;default:return""}})).join("")}function x(e,t,n,r){let o=Te([]);for(let s of e)R(s,t,n,r)&&o.push(s);return o}function R(e,t,n,r){let o=r.shouldAbort,s=r.regexExceptions,i=r.exceptionSelectors,a=r.rid;if("string"==typeof e){let i=e;return!!b(i,s)||(et()&&v(i,t,n,r),o&&$(a),et())}let c=e;switch(Te(c).nodeType){case Wn:return!!function(e,t){if(t){let n=Te(e);for(let e of t)if(n.matches(e))return!0}return!1}(c,i)||(o&&(et()&&v(c,t,n,r),$(a)),!!et()&&(Fn(c),v(c,t,n,r),!0));case Hn:return!!b(Te(c).textContent,s)||(et()&&v(c,t,n,r),o&&$(a),!1);default:return!0}}function P(e,t,n,r){let s=Yn(e,t)||{},a=s.get&&i(s.get,e)||s.value;if(a)return{get:()=>function(...e){if(n(this)){let n=r(this);if(n){let r=e[0];if(!R(r,this,t,n))return r}}return o(a,this,e)}}}function k(e,t,n,r){let s=Yn(e,t)||{},a=s.get&&i(s.get,e)||s.value;if(a)return{get:()=>function(...e){if(!n(this))return o(a,this,e);let s=r(this);if(!s)return o(a,this,e);let i=x(e,this,t,s);return i.length>0?o(a,this,i):void 0}}}function O(e,t,n,r){let s=Yn(e,t)||{},a=s.get&&i(s.get,e)||s.value;if(a)return{get:()=>function(...e){let[s,c]=e,l="afterbegin"===s||"beforeend"===s;if(n(this,l)){let e=r(this,l);if(e){let n,r=l?this:Te(this).parentNode;switch(t){case"insertAdjacentElement":if(!R(c,r,t,e))return c;break;case"insertAdjacentHTML":return n=S(c,r,t,e),n?i(a,this,s,n):void 0;case"insertAdjacentText":if(!R(c,r,t,e))return}}}return o(a,this,e)}}}function T(e,t,n,r){let o=Yn(e,t)||{},{set:s}=o;if(s)return{set(e){if(!n(this))return i(s,this,e);let o=r(this);if(!o)return i(s,this,e);let a=S(e,this,t,o);return a?i(s,this,a):void 0}}}function j(e,t,n,r){let o=Yn(e,t)||{},{set:s}=o;if(s)return{set(e){if(!n(this))return i(s,this,e);let o=r(this);return o?R(e,this,t,o)?i(s,this,e):void 0:i(s,this,e)}}}},"hide-if-canvas-contains":function(e,t="canvas",n="",r=""){const s=ot("hide-if-canvas-contains"),i=Ve(arguments),{mark:a,end:c}=Qe("hide-if-canvas-contains");if(!e)return void s("error","The parameter 'search' is required");if(!cr){a();const f=Zn.prototype;function p(e){const t=f[e];let n=l(t,(function(e,...n){const r=this.canvas;if(ur.has(r))return o(t,this,[e,...n]);const s=((lr.get(r)||"")+e).slice(-1e4);lr.set(r,s);for(const[e,t]of cr)"data"!==t.mode&&qe(e,s)&&mr(r,t);const i=o(t,this,[e,...n]);return vr(r),i}));ut(n,t),rr.defineProperty(window.CanvasRenderingContext2D.prototype,e,{value:n})}function d(){const e=f.clearRect;let t=l(e,(function(...t){let n=!1,r=!0;for(const{clearRectBehavior:e}of cr.values())"always"===e&&(n=!0),"never"!==e&&(r=!1);if(!r){const[e,r,o,s]=t,i=e<=0&&r<=0&&o>=this.canvas.width&&s>=this.canvas.height;(n||i)&&lr.delete(this.canvas)}const s=o(e,this,t);return vr(this.canvas),s}));ut(t,e),rr.defineProperty(window.CanvasRenderingContext2D.prototype,"clearRect",{value:t})}function h(){const e=f.drawImage;let t=l(e,(function(t,...n){if(s("info","drawImage called with arguments:",t,...n),t&&"string"==typeof t.src&&t.src)for(const[e,n]of cr)"data"!==n.mode&&qe(e,t.src)&&mr(this.canvas,n);const r=o(e,this,[t,...n]);return vr(this.canvas),r}));ut(t,e),rr.defineProperty(window.CanvasRenderingContext2D.prototype,"drawImage",{value:t})}s("info","CanvasRenderingContext2D proxied"),p("fillText"),p("strokeText"),d(),h(),cr=new tr;new nr((e=>{for(let t of Te(e))"childList"===t.type&&fr.forEach((e=>{const t=Te(e.canvasElement).closest(e.rule.selector);if(t&&!pr.has(t)){Fn(t),pr.add(t),fr.delete(e),ot("hide-if-canvas-contains")("success","Matched: ",t,`\nFILTER: hide-if-canvas-contains ${e.rule.formattedArguments}`);const n="hide-if-canvas-contains "+e.rule.formattedArguments;dr.has(n)||(dr.add(n),Be(n))}}))})).observe(er,{childList:!0,subtree:!0}),c()}const u=Fe(e,s);if(cr.set(u,{selector:t,formattedArguments:i,clearRectBehavior:n,mode:r}),"data"===r){hr=!0,function(){if(yr)return;yr=!0;const e=Zn.prototype,t=["fillRect","strokeRect","putImageData","fill","stroke"];for(const n of t){const t=e[n];if("function"!=typeof t)continue;let r=l(t,(function(...e){const n=o(t,this,e);return vr(this.canvas),n}));ut(r,t),rr.defineProperty(window.CanvasRenderingContext2D.prototype,n,{value:r})}}();for(const y of jn("canvas"))vr(y)}},"hide-if-shadow-contains":function(e,t="*"){const n=Ve(arguments);let r=`${e}\\${t}`;const s=ot("hide-if-shadow-contains");Tr.has(r)||Tr.set(r,[Fe(e,s),t,nt,n]);const{mark:i,end:a}=Qe("hide-if-shadow-contains");if(!Ar){Ar=new $r((e=>{i();let t=new xr;for(let{target:n}of Te(e)){let e=Te(n).parentNode;for(;e;)[n,e]=[e,Te(n).parentNode];if(!Or.has(n)&&!t.has(n)){t.add(n);for(let[e,t,r,o]of Tr.values())if(qe(e,Te(n).textContent)){let e=Te(n.host).closest(t);if(e){r(),Te(n).appendChild(document.createElement("style")).textContent=":host {display: none !important}",Fn(e),Or.add(n),s("success","Hiding: ",e,`\nFILTER: hide-if-shadow-contains ${o}`);const t="hide-if-shadow-contains "+o;jr.has(t)||(jr.add(t),Be(t))}a()}}}}));let e=l(kr,(function(){let e=o(kr,this,arguments);return s("info","attachShadow is called for: ",e),Ar.observe(e,{childList:!0,characterData:!0,subtree:!0}),e}));ut(e,kr),Sr.defineProperty(Pr,"attachShadow",{value:e})}},"json-override":function(e,t,n="",r=""){if(!e)throw new qr("[json-override snippet]: Missing paths to override.");if(void 0===t)throw new qr("[json-override snippet]: No value to override with.");let s=ot("json-override");const{mark:i,end:a}=Qe("json-override");if(!_r){function p(e,t){for(let{formattedArgs:n,prune:r,jsonPathObjects:o,needle:i,filter:a,value:c}of _r.values())if(!a||qe(a,t)){if(Te(i).some((t=>!It(e,t))))return e;for(let t of r)if(t.startsWith("jsonpath("))try{const r=o.get(t);r.evaluate(e).forEach((({parent:e,key:t})=>{s("success",`JSONPath match found at [${t}], replaced with ${c}`,`\nFILTER: json-override ${n}`),zr("json-override "+n),e[t]=Nt(c)}))}catch(e){s("error",`JSONPath evaluation failed for: ${t}. Error: ${e.message}`)}else t.includes("{}")||t.includes("[]")?d(e,t,c,n):h(e,t,c,n)}return e}function d(e,t,n,r){let o=Te(t).split("."),i=e;for(let e=0;e<o.length;e++){let a=o[e];if("[]"===a)return void(Fr.isArray(i)&&(s("info",`Iterating over array at: ${a}`),Te(i).forEach((t=>{null!=t&&d(t,o.slice(e+1).join("."),n,r)}))));if("{}"===a)return void(i&&"object"==typeof i&&(s("info",`Iterating over object at: ${a}`),Jr.keys(i).forEach((t=>{let s=i[t];null!=s&&d(s,o.slice(e+1).join("."),n,r)}))));if(!i||"object"!=typeof i||!m(i,a))return;e===o.length-1?(s("success",`Found ${t}, replaced it with ${n}`,`\nFILTER: json-override ${r}`),zr("json-override "+r),i[a]=Nt(n)):i=i[a]}}function h(e,t,n,r){let o=It(e,t);void 0!==o&&(s("success",`Found ${t}, replaced it with ${n}`,`\nFILTER: json-override ${r}`),zr("json-override "+r),o[0][o[1]]=Nt(n))}i();let{parse:y}=Wr;_r=new Hr;let g=l(y,(function(e){return p(o(y,this,arguments),e)}));ut(g,y),Jr.defineProperty(window.JSON,"parse",{value:g}),s("info","Wrapped JSON.parse for override");let{json:w}=Br.prototype;Jr.defineProperty(window.Response.prototype,"json",{value:l(w,(function(e){return o(w,this,arguments).then((t=>p(t,e)))}))}),s("info","Wrapped Response.json for override"),a()}const c=Ve(arguments),u=Te(e).split(/ +/),f=new Hr;for(const v of u)if(v.startsWith("jsonpath("))try{f.set(v,new Dr(v.slice(9,-1)))}catch(b){s("error",`Invalid JSONPath query: ${v}. Error: ${b.message}`)}_r.set(e,{formattedArgs:c,prune:u,jsonPathObjects:f,needle:n.length?Te(n).split(/ +/):[],filter:r?Fe(r,s):null,value:t})},"json-prune":function(e,t="",n=""){if(!e)throw new Xr("Missing paths to prune");let r=ot("json-prune");const{mark:s,end:i}=Qe("json-prune");if(!Zr){function f(e){for(let{prune:t,needle:n,jsonPathObjects:o,stackNeedle:s,formattedArgs:i}of Zr.values()){if(Te(n).length>0&&Te(n).some((t=>!It(e,t))))return e;if(Te(s)&&Te(s).length>0&&!Ct(s,r))return e;for(let n of t)if(n.startsWith("jsonpath("))try{const t=o.get(n);t.evaluate(e).forEach((({parent:e,key:t})=>{r("success",`JSONPath match found and deleted at [${t}]`,`\nFILTER: json-prune ${i}`),to("json-prune "+i),delete e[t]}))}catch(e){r("error",`JSONPath evaluation failed for: ${n}. Error: ${e.message}`)}else n.includes("{}")||n.includes("[]")||n.includes("{-}")||n.includes("[-]")?p(e,n,i):h(e,n,i)}return e}function p(e,t,n){let o=Te(t).split("."),s=e;for(let e=0;e<o.length;e++){let i=o[e];if("[]"===i)return void(Ur.isArray(s)&&(r("info",`Iterating over array at: ${i}`),Te(s).forEach((t=>p(t,o.slice(e+1).join("."),n)))));if("[-]"===i){if(Ur.isArray(s)){r("info",`Iterating over array with element removal at: ${i}`);let t=o.slice(e+1).join("."),a=[];Te(s).forEach(((e,n)=>{d(e,t)&&a.push(n)}));for(let e=a.length-1;e>=0;e--)r("success",`Found element at index ${a[e]} matching ${t} and removed entire element, \nFILTER: json-prune ${n}`),to("json-prune "+n),s.splice(a[e],1)}return}if("{}"===i)return void("object"==typeof s&&null!==s&&(r("info",`Iterating over object at: ${i}`),Qr.keys(s).forEach((t=>p(s[t],o.slice(e+1).join("."),n)))));if("{-}"===i){if("object"==typeof s&&null!==s){r("info",`Iterating over object with element removal at: ${i}`);let t=o.slice(e+1).join("."),a=[];Qr.keys(s).forEach((e=>{d(s[e],t)&&a.push(e)})),a.forEach((e=>{r("success",`Found object key ${e} matching ${t} and removed entire element, \nFILTER: json-prune ${n}`),to("json-prune "+n),delete s[e]}))}return}if(!s||"object"!=typeof s||!m(s,i))return;e===o.length-1?(r("success",`Found ${t} and deleted, \nFILTER: json-prune ${n}`),to("json-prune "+n),delete s[i]):s=s[i]}}function d(e,t){if(!t||""===t)return!0;let n=Te(t).split("."),r=e;for(let e=0;e<n.length;e++){let t=n[e];if("[]"===t)return!!Ur.isArray(r)&&Te(r).some((t=>d(t,n.slice(e+1).join("."))));if("{}"===t)return"object"==typeof r&&null!==r&&Qr.keys(r).some((t=>d(r[t],n.slice(e+1).join("."))));if(!r||"object"!=typeof r||!m(r,t))return!1;if(e===n.length-1)return!0;r=r[t]}return!1}function h(e,t,n){let o=It(e,t);void 0!==o&&(r("success",`Found ${t} and deleted`,`\nFILTER: json-prune ${n}`),to("json-prune "+n),delete o[0][o[1]])}s();let{parse:y}=Gr;Zr=new Kr;let g=l(y,(function(){return f(o(y,this,arguments))}));ut(g,y),Qr.defineProperty(window.JSON,"parse",{value:g}),r("info","Wrapped JSON.parse for prune");let{json:w}=Yr.prototype,v=l(w,(function(){return o(w,this,arguments).then((e=>f(e)))}));ut(v,w),Qr.defineProperty(window.Response.prototype,"json",{value:v}),r("info","Wrapped Response.json for prune"),i()}const a=Ve(arguments),c=Te(e).split(/ +/),u=new Kr;for(const b of c)if(b.startsWith("jsonpath("))try{u.set(b,new Dr(b.slice(9,-1)))}catch(E){r("error",`Invalid JSONPath query: ${b}. Error: ${E.message}`)}Zr.set(e,{formattedArgs:a,prune:c,jsonPathObjects:u,needle:t.length?Te(t).split(/ +/):[],stackNeedle:n.length?Te(n).split(/ +/):[]})},"map-override":function(e,t,n="",r,s){if(!e)throw new no("[map-override snippet]: Missing method to override.");if(!t)throw new no("[map-override snippet]: Missing needle.");so||(so=new oo);let a=ot("map-override");const{mark:c,end:u}=Qe("map-override"),{set:f,get:p,has:d}=oo.prototype,h=Ve(arguments);if("set"!==e||so.has("set"))if("get"!==e||so.has("get")){if("has"===e&&!so.has("has")){c(),i(f,so,"has",Te([]));let e=l(d,(function(e){const t=i(p,so,"has");for(const{needleRegex:n,retVal:r,stackNeedles:o}of t)if("string"==typeof e||"number"==typeof e){const t=e.toString();if(qe(n,t)&&Ct(o,a))return a("success",`Map.has returned ${r} for key: ${t}\nFILTER: map-override ${h}`),ao("map-override "+h),r}return o(d,this,arguments)}));ut(e,d),ro.defineProperty(window.Map.prototype,"has",{value:e}),a("info","Wrapped Map.prototype.has"),u()}}else{c(),i(f,so,"get",Te([]));let e=l(p,(function(e){const t=i(p,so,"get");for(const{needleRegex:n,retVal:r,stackNeedles:o}of t)if("string"==typeof e||"number"==typeof e){const t=e.toString();if(qe(n,t)&&Ct(o,a))return a("success",`Map.get returned ${r} for key: ${t}\nFILTER: map-override ${h}`),ao("map-override "+h),r}return o(p,this,arguments)}));ut(e,p),ro.defineProperty(window.Map.prototype,"get",{value:e}),a("info","Wrapped Map.prototype.get"),u()}else{c(),i(f,so,"set",Te([]));let e=l(f,(function(e,t){const n=i(p,so,"set");for(const{needleRegex:e,pathSegments:r,stackNeedles:o}of n)if(co(t,e,r)&&Ct(o,a))return a("success",`Map.set is ignored for value matching needle: ${e}\nFILTER: map-override ${h}`),ao("map-override "+h),this;return o(f,this,arguments)}));ut(e,f),ro.defineProperty(window.Map.prototype,"set",{value:e}),a("info","Wrapped Map.prototype.set"),u()}const y=Fe(t,a);let g=[];r&&(g=r.split("."));let w=[];s&&(w=s.split(",").map((e=>e.trim())));const m=i(p,so,e);let v;"get"===e?v=""===n?void 0:n:"has"===e&&(v="true"===n),m.push({needleRegex:y,retVal:v,pathSegments:g,stackNeedles:w}),i(f,so,e,m)},"override-property-read":function(e,t,n){if(!e)throw new lo("[override-property-read snippet]: No property to override.");if(void 0===t)throw new lo("[override-property-read snippet]: No value to override with.");const r=Ve(arguments);let o=ot("override-property-read");const{mark:s,end:i}=Qe("override-property-read");let a=Nt(t),c=!1;o("info",`Overriding ${e}.`);const l=!("false"===n);s(),kt(window,e,{get:()=>(o("success",`${e} override done.`,"\nFILTER: override-property-read",r),c||(c=!0,Be("override-property-read "+r)),a),set(){}},l),i()},"prevent-element-src-loading":function(e,t){if(!e||"string"!=typeof e)throw new po("[prevent-element-src-loading snippet]: tagName param must be a string.");if(!t)throw new po("[prevent-element-src-loading snippet]: Missing search parameter.");if(e=Te(e).toString().toLowerCase(),!Te(["script","img","iframe","link"]).includes(e))throw new po("[prevent-element-src-loading snippet]: tagName parameter is incorrect.");const n={script:"data:text/javascript;base64,KCk9Pnt9",img:"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",iframe:"data:text/html;base64,PGRpdj48L2Rpdj4=",link:"data:text/plain;base64,"},r={script:window.HTMLScriptElement,img:window.HTMLImageElement,iframe:window.HTMLIFrameElement,link:window.HTMLLinkElement}[e],o="link"===e?"href":"src",s="onerror",i=ot("[prevent-element-src-loading snippet]"),a=Ve(arguments),c="prevent-element-src-loading "+a,{mark:l,end:u}=Qe("prevent-element-src-loading");l();const f=Fe(t,i);if(vo.push({tagName:e,searchRegex:f}),i("info",`Added filter rule\nFILTER: prevent-element-src-loading ${a}`),!Eo.has(e)){Eo.add(e);const t={apply:(e,t,r)=>{if(!r[0]||!r[1])return yo.apply(e,t,r);const s=t.nodeName.toLowerCase(),a=r[0].toLowerCase(),l=r[1];return a===o&&vo.some((e=>s===e.tagName&&qe(e.searchRegex,l)))?(mo.add(t),i("success",`Replaced setAttribute for ${a}: ${l} → ${n[s]}`),bo.has(c)||(bo.add(c),Be(c)),yo.apply(e,t,[a,n[s]])):yo.apply(e,t,r)}};r.prototype.setAttribute=new Proxy(r.prototype.setAttribute,t),i("info","Wrapped setAttribute function");const s=ho.getOwnPropertyDescriptor(r.prototype,o);if(!s)return;ho.defineProperty(r.prototype,o,{enumerable:!0,configurable:!0,get(){return s.get.call(this)},set(e){const t=this.nodeName.toLowerCase();vo.some((n=>t===n.tagName&&qe(n.searchRegex,e)))?(mo.add(this),i("success",`Replaced in src/href setter ${e} → ${n[t]}`),bo.has(c)||(bo.add(c),Be(c)),s.set.call(this,n[t])):s.set.call(this,e)}}),i("info","Wrapped src/href property setter")}if(1===vo.length){const e=ho.getOwnPropertyDescriptor(HTMLElement.prototype,s);if(!e)return;ho.defineProperty(HTMLElement.prototype,s,{enumerable:!0,configurable:!0,get(){return e.get.call(this)},set(t){mo.has(this)?(i("success",`Replaced in onerror setter ${t} → () => {}`),bo.has(c)||(bo.add(c),Be(c)),e.set.call(this,(()=>{}))):e.set.call(this,t)}}),i("info","Wrapped onerror property setter");const t={apply:(e,t,n)=>{if(!n[0]||!n[1]||!t)return yo.apply(e,t,n);const r=n[0];return"function"==typeof t.getAttribute&&mo.has(t)&&"error"===r?(i("success",`Replaced error event handler on ${t} with () => {}`),bo.has(c)||(bo.add(c),Be(c)),yo.apply(e,t,[r,()=>{}])):yo.apply(e,t,n)}};EventTarget.prototype.addEventListener=new Proxy(EventTarget.prototype.addEventListener,t),i("info","Wrapped addEventListener");(()=>{fo("error",(e=>{const t=e.target;if(!t||!t.nodeName)return;const n=t.src||t.href,r=t.nodeName.toLowerCase();vo.some((e=>r===e.tagName&&n&&qe(e.searchRegex,n)))&&(t.onerror=()=>{})}),!0),i("info","Added event listener to defuse global errors")})()}u()},"prevent-listener":function(e,t,n){if(!e)throw new $o("[prevent-listener snippet]: No event type.");let r=ot("[prevent]");if(!To){To=new So;const{mark:e,end:t}=Qe("prevent-listener");let n=l(Oo,(function(n,s){e();for(let{evt:e,handlers:t,selectors:o,formattedArgs:a}of To.values()){if(!qe(e,n))continue;let c=this instanceof Element;for(let l=0;l<t.length;l++){const u=t[l],f=o[l];if(f&&(!c||!Te(this).matches(f)))continue;if(u){const e=function(){try{const e=String("function"==typeof s?s:s.handleEvent);return qe(u,e)}catch(e){return r("error","Error while trying to stringify listener: ",e),!1}};if(!function(){try{const e=i(Po,"function"==typeof s?s:s.handleEvent);return qe(u,e)}catch(e){return r("error","Error while trying to stringify listener: ",e),!1}}()&&!e())continue}const p="prevent-listener "+a;return jo.has(p)||(jo.add(p),Be(p)),void(et()&&(Ro.groupCollapsed("DEBUG [prevent] was successful",`\nFILTER: prevent-listener ${a}`),r("success",`type: ${n} matching ${e}`),r("success","handler:",s),u&&r("success",`matching ${u}`),f&&r("success","on element: ",this,` matching ${f}`),r("success","was prevented from being added"),Ro.groupEnd()))}}return t(),o(Oo,this,arguments)}));ut(n,Oo),xo.defineProperty(ko,"addEventListener",{value:n}),r("info","Wrapped addEventListener")}const s=Ve(arguments);To.has(e)||To.set(e,{evt:Fe(e,r),handlers:[],selectors:[],formattedArgs:s});let{handlers:a,selectors:c}=To.get(e);a.push(t?Fe(t,r):null),c.push(n)},"prevent-window-open":function(e="",t="",n="iframe"){if(""===n&&(n="iframe"),"iframe"!==n&&"obj"!==n&&"blank"!==n)throw new Wo("[prevent-window-open snippet]: decoy must be iframe, obj or blank.");let r=!1;Te(e).startsWith("!")&&(r=!0,e=Te(e).slice(1));const s=ot("[prevent-window-open]");if(Uo.push({regex:Fe(e,s),invert:r,hasDelay:""!==t,autoRemoveAfter:Vo(t)||0,decoy:n,formattedArgs:Ve(arguments)}),Uo.length>1)return;const{mark:i,end:a}=Qe("prevent-window-open"),c=Jo.getOwnPropertyDescriptor(window,"open");if(!c||"function"!=typeof c.value||!c.configurable)return void s("warn","window.open not wrappable, bailing out");const u=c.value,f=(e=0,t=(()=>{}))=>{let n=!1;const r=()=>{n||(n=!0,t())};zo(r,e);const o={href:"about:blank",assign(){},replace(){},reload(){},toString:()=>"about:blank"},s={location:o,defaultView:null,cookie:"",open(){},write(){},writeln(){},close(){}},i={length:0,state:null,scrollRestoration:"auto",back(){},forward(){},go(){},pushState(){},replaceState(){}},a=new Ho,c=Jo.create(Jo.create(null)),l=new Ao(c,{get(e,t,c){if(Co(e,t))return No(e,t,c);if("closed"===t)return n;if("close"===t)return r;if("opener"===t)return window;if("frameElement"===t)return null;if(t===Lo)return"Window";if("parent"===t||"top"===t||"self"===t||"window"===t||"globalThis"===t||"frames"===t)return c;if("location"===t)return o;if("document"===t)return s;if("history"===t)return i;let l;try{l=No(window,t)}catch(e){return}if("function"==typeof l){let e=a.get(t);return e||(e=()=>{},a.set(t,e)),e}return null===l||"object"!=typeof l?l:void 0},set:(e,t,n)=>"location"===t||"opener"===t||(!!Ko.has(t)||Fo(e,t,n)),defineProperty:(e,t,n)=>!Ko.has(t)&&Io(e,t,n),deleteProperty:(e,t)=>Mo(e,t),has:(e,t)=>Ko.has(t)||Do(e,t)||Do(window,t),setPrototypeOf:()=>!1,preventExtensions:()=>!1});return s.defaultView=l,l},p=l(u,(function(e){i();const t=new qo(arguments.length);for(let e=0;e<arguments.length;e++)t[e]=arguments[e];const n=t.join(" ");for(let r=0;r<Uo.length;r++){const i=Uo[r];if(qe(i.regex,n)===i.invert)continue;if(Go("prevent-window-open "+i.formattedArgs),s("success",`Prevented window.open(${n})`,`\nFILTER: prevent-window-open ${i.formattedArgs}`),a(),!i.hasDelay)return null;if("blank"===i.decoy){t[0]="about:blank";const e=o(u,this,t),n=e&&e.close;return"function"==typeof n&&zo((()=>o(n,e,[])),i.autoRemoveAfter),e}const c="obj"===i.decoy?"object":"iframe",l="obj"===i.decoy?"data":"src";let p;try{p=Te(_o).createElement(c),p[l]=null==e?"about:blank":e;const{style:t}=Te(p,"HTMLElement"),n=Te(t,"CSSStyleDeclaration");n.setProperty("height","1px","important"),n.setProperty("position","fixed","important"),n.setProperty("top","-1px","important"),n.setProperty("width","1px","important");const r=Te(_o).body||Te(_o).documentElement;Te(r).appendChild(p)}catch(e){if(p)try{Te(p).remove()}catch(e){}return f(i.autoRemoveAfter)}return f(i.autoRemoveAfter,(()=>Te(p).remove()))}return s("info",`Allowed window.open(${n})`),a(),o(u,this,arguments)}));ut(p,u),Jo.defineProperty(window,"open",{...c,value:p}),s("info","Wrapped window.open")},profile:function(){Ke=!1},"replace-argument":function(e,t,n="",r="",s=""){const i=ot("[replace-argument snippet]"),a="replace-argument "+Ve(arguments),{mark:c,end:u}=Qe("replace-argument");if(!e||"string"!=typeof e)return void i("error",`methodPath param must be a string.\nFILTER: ${a}`);const f=""+t;if(!/^\d+$/.test(f))return void i("error",`argPosition param must be a non-negative integer.\nFILTER: ${a}`);const p=es(f,10),d=Te(e).split("."),h=d[d.length-1];let y=window;for(let e=0;e<d.length-1&&null!=y;e++)y=y[d[e]];if(null==y||"function"!=typeof y[h])return void i("warn",`could not resolve ${e}\nFILTER: ${a}`);const g=s?Te(s).split(",").map((e=>e.trim())):[],w=""===n,m={argPosition:p,search:w?null:We(n,i),replacement:r,wholeValue:w,filterStr:a,stackNeedles:g};let v=ns.get(e);if(v||(v=new Qo,ns.set(e,v)),v.push(m),i("info",`Added rule for ${e}\nFILTER: ${a}`),!rs.has(e)){c(),rs.add(e);const t=y[h],n=l(t,(function(){let n=arguments;try{const t=ns.get(e);if(t)for(const r of t){if(arguments.length<=r.argPosition||!Ct(r.stackNeedles,i))continue;const t=arguments[r.argPosition];let o;if(r.wholeValue)o=Nt(r.replacement);else{if(null!==t&&"object"==typeof t)continue;const e=""+t;if(o=Te(e).replace(r.search,r.replacement).toString(),o===e)continue}const s=Qo.from(arguments);s[r.argPosition]=o,os.has(r.filterStr)||(os.add(r.filterStr),Be(r.filterStr)),i("success",`argument ${r.argPosition} of ${e} replaced\nFILTER: ${r.filterStr}`),n=s;break}}catch(e){n=arguments}return o(t,this,n)}));ut(n,t),Zo.defineProperty(y,h,{value:n}),i("info",`${e} wrapped`),u()}},"replace-fetch-request":function(e,t="",n=null,r="replace"){const o=Ve(arguments),s=ot("replace-fetch-request"),{mark:i,end:a}=Qe("replace-fetch-request");if(!e)throw new ds("[replace-fetch-request]: Missing 'search' parameter");var c;if(ps||(ps=new Map,s("info","fetch proxied"),c=e=>{i();let t=e;for(const[e,{replacement:n,needle:r,formattedArgs:o,isJsonPath:i,jsonPathEngine:a,mode:c}]of ps){if(r){if(!qe(Fe(r,s),t))continue;s("info",`'${r}' found in fetch request body`)}if(i)try{let e=hs.parse(t);const r=a.evaluate(e);Te(r).forEach((({parent:e,key:t})=>{let r=He(n);"append"===c?Je(e,t,r)||s("info",`append has no meaning for the value at [${t}], replaced it instead`):e[t]=r,s("success",`JSONPath [${c}] at [${t}] with `+n,"\nFILTER: replace-fetch-request "+o);const i="replace-fetch-request "+o;ys.has(i)||(ys.add(i),Be(i))})),t=hs.stringify(e)}catch(e){s("info","JSONPath: skipping non-JSON body or evaluation error: "+e.message)}else{const r=t;if(t=Te(t).replace(e,n).toString(),r.toString()!==t.toString()){s("success",`'${e}' replaced with '${n}' in fetch request body`,"\nFILTER: replace-fetch-request "+o);const t="replace-fetch-request "+o;ys.has(t)||(ys.add(t),Be(t))}}}return a(),t},us.push(c),fs()),Te(e).startsWith("jsonpath(")){let i;try{const t=Te(e).slice(9,-1).toString();i=new Dr(t)}catch(t){return void s("error",`Invalid JSONPath query: ${e}. Error: ${t.message}`)}ps.set(e,{replacement:t,needle:n,formattedArgs:o,isJsonPath:!0,jsonPathEngine:i,mode:r})}else{const i=We(e,s);ps.set(i,{replacement:t,needle:n,formattedArgs:o,isJsonPath:!1,jsonPathEngine:null,mode:r})}},"replace-fetch-response":function(e,t="",n=null){const r=Ve(arguments),o=ot("replace-fetch-response"),{mark:s,end:i}=Qe("replace-fetch-response");if(!e)return void o("error","The parameter 'search' is required");if(!gs){const e=e=>{s();return Te(e).clone().text().then((t=>{let n=Te(t);for(const[e,{replacement:t,needle:r,formattedArgs:s}]of gs){if(r){if(!qe(Fe(r,o),n)){et()&&(console.groupCollapsed(`DEBUG [replace-fetch-response] warn: '${r}' not found in fetch response`),o("warn",`${n}`),console.groupEnd());continue}et()&&(console.groupCollapsed(`DEBUG [replace-fetch-response] success: '${r}' found in fetch response`),o("info",`${n}`),console.groupEnd())}const i=n.toString();if(n=n.replace(e,t),n.toString()!==i){const r="replace-fetch-response "+s;bs.has(r)||(bs.add(r),Be(r)),et()&&(console.groupCollapsed(`DEBUG [replace-fetch-response] success: '${e}' replaced with '${t}' in fetch response`,`\nFILTER: replace-fetch-response ${s}`),o("success",`${n}`),console.groupEnd())}}if(n.toString()===t.toString())return e;const r=new vs(n.toString(),{status:e.status,statusText:e.statusText,headers:e.headers});return ms.defineProperties(r,{ok:{value:e.ok},redirected:{value:e.redirected},type:{value:e.type},url:{value:e.url}}),i(),r}))};gs=new ws,o("info","Network API proxied"),a=e,ls.push(a),fs()}var a;const c=We(e,o);gs.set(c,{replacement:t,needle:n,formattedArgs:r})},"replace-outbound-value":function(e,t="",n="",r="",s="",i=""){if(!e)throw new Es("[replace-outbound-value snippet]: Missing method path.");let a=ot("replace-outbound-value");const{mark:c,end:u}=Qe("replace-outbound-value"),f=Ve(arguments);let p=!1;function d(){p||(p=!0,Be("replace-outbound-value "+f))}function h(e,t,n,r){if("base64"===r)try{if(function(e){try{if(""===e)return!1;const t=Ss(e),n=xs(t),r=Te(e).replace(/=+$/,"").toString();return Te(n).replace(/=+$/,"").toString()===r}catch(e){return!1}}(e)){const r=Ss(e);a("info",`Decoded base64 content: ${r}`);const o=t?Te(r).replace(t,n).toString():r;a("info",o!==r?`Modified decoded content: ${o}`:"Decoded content was not modified");const s=xs(o);return a("info",`Re-encoded to base64: ${s}`),s}a("info",`Content is plain text: ${e}`);const r=t?Te(e).replace(t,n).toString():e;a("info",r!==e?`Modified plain text content: ${r}`:"Plain text content was not modified");const o=xs(r);return a("info",`Encoded to base64: ${o}`),o}catch(t){return a("info",`Error processing base64 content: ${t.message}`),e}return t?Te(e).replace(t,n).toString():e}function y(e,t,n,r,o,s){const i=n?We(n,a):null;if(t.length&&"object"==typeof e&&null!==e){const c=n?function(e,t,n,r,o){if(!t.length)return e;let s=e;for(let n=0;n<t.length-1;n++){if(!s||"object"!=typeof s)return a("info",`Cannot navigate to path: property '${t[n]}' not found`),e;s=s[t[n]]}const i=t[t.length-1];if(!s||"object"!=typeof s||!(i in s))return a("info",`Target property '${i}' not found at path`),e;const c=s[i];if("string"!=typeof c)return a("info","Property at path is not a string: "+typeof c),e;const l=h(c,n,r,o);if(l!==c){const n=JSON.parse(JSON.stringify(e));let r=n;for(let e=0;e<t.length-1;e++)r=r[t[e]];return r[i]=l,a("info",`Replaced value at path '${t.join(".")}': '${c}' -> '${l}'`),n}return e}(e,t,i,r,o):e;return c!==e&&(a("success",`Replaced outbound value\nFILTER: replace-outbound-value ${s}`),d()),c}if("string"==typeof e){n||a("info",`Original text content: ${e}`);const t=n?h(e,i,r,o):e;return t!==e&&(a("success",`Replaced outbound value: ${t} \nFILTER: replace-outbound-value ${s}`),d()),t}return e}c();const g=function(e,t){let n=e,r=Te(t).split(".");for(let e=0;e<r.length-1;e++){let t=r[e];if(!n||"object"!=typeof n&&"function"!=typeof n)return{base:n,prop:t,remainingPath:r.slice(e).join("."),success:!1};n=n[t]}return{base:n,prop:r[r.length-1],success:!0}}(window,e);if(!g.success)return a("error",`Could not reach the end of the prop chain: ${e}. Remaining path: ${g.remainingPath}`),void u();const{base:w,prop:m}=g,v=w[m];if(!v||"function"!=typeof v)return a("error",`Could not retrieve the method: ${e}`),void u();let b=[];s&&(b=Te(s).split("."));let E=[];i&&(E=Te(i).split(",").map((e=>e.trim())));let $=!1,S=l(v,(function(){if($)return o(v,this,arguments);$=!0;const e=o(v,this,arguments);if(E.length&&!Ct(E,a))return $=!1,e;if(e&&"function"==typeof e.then)return a("info","Method returned a Promise, modifying resolved value"),$=!1,e.then((e=>{const o="object"==typeof e?JSON.stringify(e):e;return a("info",`Promise resolved with value: ${o}`),y(e,b,t,n,r,s)})).catch((e=>{throw a("info",`Promise rejected: ${e.message}`),e}));const i=y(e,b,t,n,r,s);return $=!1,i}));ut(S,v),$s.defineProperty(w,m,{value:S}),a("info",`Wrapped ${e}`),u()},"replace-xhr-request":function(e,t="",n=null,r="replace"){const o=Ve(arguments),s=ot("replace-xhr-request"),{mark:i,end:a}=Qe("replace-xhr-request");if(!e)throw new Ms("[replace-xhr-request]: Missing 'search' parameter");var c;if(Is||(Is=new Map,s("info","XMLHttpRequest proxied"),c=e=>{i();let t=e;for(const[e,{replacement:n,needle:r,formattedArgs:o,isJsonPath:i,jsonPathEngine:a,mode:c}]of Is){if(r){if(!qe(Fe(r,s),t))continue;s("info",`'${r}' found in XHR request body`)}if(i)try{let e=Ns.parse(t);const r=a.evaluate(e);Te(r).forEach((({parent:e,key:t})=>{let r=He(n);"append"===c?Je(e,t,r)||s("info",`append has no meaning for the value at [${t}], replaced it instead`):e[t]=r,s("success",`JSONPath [${c}] at [${t}] with `+n,"\nFILTER: replace-xhr-request "+o);const i="replace-xhr-request "+o;Cs.has(i)||(Cs.add(i),Be(i))})),t=Ns.stringify(e)}catch(e){s("info","JSONPath: skipping non-JSON body or evaluation error: "+e.message)}else{const r=t;if(t=Te(t).replace(e,n).toString(),r.toString()!==t.toString()){s("success",`'${e}' replaced with '${n}' in XHR request body`,"\nFILTER: replace-xhr-request "+o);const t="replace-xhr-request "+o;Cs.has(t)||(Cs.add(t),Be(t))}}}return a(),t},Ts.push(c),Ls()),Te(e).startsWith("jsonpath(")){let i;try{const t=Te(e).slice(9,-1).toString();i=new Dr(t)}catch(t){return void s("error",`Invalid JSONPath query: ${e}. Error: ${t.message}`)}Is.set(e,{replacement:t,needle:n,formattedArgs:o,isJsonPath:!0,jsonPathEngine:i,mode:r})}else{const i=We(e,s);Is.set(i,{replacement:t,needle:n,formattedArgs:o,isJsonPath:!1,jsonPathEngine:null,mode:r})}},"replace-xhr-response":function(e,t="",n=null){const r=Ve(arguments),o=ot("replace-xhr-response"),{mark:s,end:i}=Qe("replace-xhr-response");var a;if(e)if(Ds||(Ds=new Map,o("info","XMLHttpRequest proxied"),a=e=>{s();let t=e;for(const[n,{replacement:r,needle:s,formattedArgs:i,isJsonPath:a,jsonPathEngine:c}]of Ds){if(s){if(!qe(Fe(s,o),t)){et()&&(console.groupCollapsed(`DEBUG [replace-xhr-response] warn: '${s}' not found in XHR response`),o("warn",t),console.groupEnd());continue}et()&&(console.groupCollapsed(`DEBUG [replace-xhr-response] success: '${s}' found in XHR response`),o("info",t),console.groupEnd())}if(a)try{let e=Fs.parse(t);const n=c.evaluate(e);Te(n).forEach((({parent:e,key:t})=>{e[t]=Nt(r),o("success",`JSONPath match at [${t}], replaced with `+r,"\nFILTER: replace-xhr-response "+i);const n="replace-xhr-response "+i;qs.has(n)||(qs.add(n),Be(n))})),t=Fs.stringify(e)}catch(e){o("info","JSONPath: skipping non-JSON response or evaluation error: "+e.message)}else if(t=Te(t).replace(n,r).toString(),e.toString()!==t.toString()){const e="replace-xhr-response "+i;qs.has(e)||(qs.add(e),Be(e)),et()&&(console.groupCollapsed(`DEBUG [replace-xhr-response] success: '${n}' replaced with '${r}' in XHR response`,"\nFILTER: replace-xhr-response "+i),o("success",t),console.groupEnd())}}return i(),t.toString()},js.push(a),Ls()),Te(e).startsWith("jsonpath(")){let s;try{const t=Te(e).slice(9,-1).toString();s=new Dr(t)}catch(t){return void o("error",`Invalid JSONPath query: ${e}. Error: ${t.message}`)}Ds.set(e,{replacement:t,needle:n,formattedArgs:r,isJsonPath:!0,jsonPathEngine:s})}else{const s=We(e,o);Ds.set(s,{replacement:t,needle:n,formattedArgs:r,isJsonPath:!1,jsonPathEngine:null})}else o("error","The parameter 'pattern' is required")},"strip-fetch-query-parameter":function(e,t=null){const n=Ve(arguments),r=ot("strip-fetch-query-parameter"),{mark:o,end:s}=Qe("strip-fetch-query-parameter"),i=e=>{o();for(let[t,n]of Ws.entries()){const{reg:o,args:s}=n;if((!o||qe(o,e))&&Js(e.searchParams,t)){r("success",`${t} has been stripped from url ${e}`,`\nFILTER: strip-fetch-query-parameter ${s}`);const n="strip-fetch-query-parameter "+s;Bs.has(n)||(Bs.add(n),Be(n)),Hs(e.searchParams,t)}}s()};var a;Ws||(Ws=new Map,a=i,cs.push(a),fs()),Ws.set(e,{reg:t&&Fe(t,r),args:n})},"timer-override":function(e,t="",n="",r=Qs.BOTH,s=""){if(!e)throw new _s("[timer-override snippet]: Missing required parameter timerValue.");if(!Vs.values(Qs).includes(r))throw new _s("[timer-override snippet]: Invalid mode. Acceptable values are: "+Vs.values(Qs).join(", "));const a=zs(e,10);if(Us(a))throw new _s("[timer-override snippet]: timerValue must be a number.");const c=ot("timer-override");if(!Ys){Ys=Te([]);const{mark:f,end:p}=Qe("timer-override");function d(e){try{return"function"==typeof e?i(Xs,e):""+e}catch(e){return""}}function h(e,t,n,r,s,i,a){const l=d(s);for(const u of Ys){if(r.indexOf(u.mode)<0)continue;if(u.needleRegex){const e=""+i;if(!qe(u.needleRegex,l)&&!qe(u.needleRegex,e))continue;c("info",u.needle+" found in "+l)}if(u.stackNeedles.length>0&&!Ct(u.stackNeedles,c))continue;let f=s;const p=u.newDelay;u.isNoop&&(f=()=>{},c("success","Callback replaced with noop for "+l)),c("success",n+" replaced with "+p+" for "+l);const d="timer-override "+u.formattedArgs;Zs.has(d)||(Zs.add(d),Be(d));const h=Te([f,p]);for(let e=2;e<a.length;e++)h.push(a[e]);return o(t,e,h)}return null}f();const y=Te([Qs.TIMEOUT,Qs.BOTH]);let g=l(Gs,(function(e,t){const n=h(this,Gs,"setTimeout",y,e,t,arguments);return null!==n?n:o(Gs,this,arguments)}));ut(g,Gs),Vs.defineProperty(window,"setTimeout",{value:g});const w=Te([Qs.INTERVAL,Qs.BOTH]);let m=l(Ks,(function(e,t){const n=h(this,Ks,"setInterval",w,e,t,arguments);return null!==n?n:o(Ks,this,arguments)}));ut(m,Ks),Vs.defineProperty(window,"setInterval",{value:m}),c("info","timer APIs proxied"),p()}let u=[];s&&(u=s.split(/ +/)),Ys.push({newDelay:a,needle:t,needleRegex:t?Fe(t,c):null,mode:r,isNoop:"noop"===n,stackNeedles:u,formattedArgs:Ve(arguments)})},trace:function(...e){o(rt,null,e)},"tmp-yt-buffering-spoof":function(e,t,n,r){if(ci)return;ci=!0;const{Document:s,HTMLIFrameElement:i,Storage:a}=Te(window),c=ot("tmp-yt-buffering-spoof"),{mark:u,end:f}=Qe("tmp-yt-buffering-spoof");u();let p=li,d=null,h=0,y=0,g=0,w="",m="";const v={gate:0,preview:0,excluded:0},b={gate:null,preview:null,excluded:null},E=window.JSON.stringify,$=window.JSON.parse,S=function(e){for(let t=1;t<arguments.length;t++){if(null==e)return;e=e[arguments[t]]}return e},x=(e,t,n)=>{v[e]++,t!==b[e]&&(b[e]=t,c("info",n))},R=(e,t,n,r,o)=>{if(!O.has(e))try{ni.defineProperty(t,n,{value:r,writable:!0,configurable:!0})}catch(e){c("error",`Failed to install ${o}: ${e}`)}},P=ni.getOwnPropertyDescriptor(s.prototype,"visibilityState"),k=function(e){const t=[],n=[];if("string"!=typeof e||0===e.length)return{allow:t,deny:n};for(const r of e.split(/\s+/))r&&("!"===r.charAt(0)&&r.length>1?n.push(r.slice(1).toLowerCase()):t.push(r.toLowerCase()));return{allow:t,deny:n}}("string"==typeof r&&r.replace(/\s+/g,"").length>0?r:"!homepage !shorts watch"),O=new ri,T=new ri;let j=!1;const A=[];if("string"==typeof e){const t=e.split(/[\s,]+/);for(let e=0;e<t.length;e++){const n=t[e];if(!n)continue;const r=/^\d+$/.test(n)?ii(n,10):0,o=n.toLowerCase();r>=1&&r<=10?O.add(r):-1!==$i.indexOf(o)?T.add(o):"useractionmute"===o?j=!0:A.push(n)}}A.length>0&&c("info","Ignoring unrecognised token(s) in disabledHooks: "+A.join(", "));const L=e=>T.has(e),I=(e,t)=>{if(null==e)return t;const n=ii(`${e}`,10);return n>=0?n:t},M=I(t,5e3),N=I(n,600),C=N,D=e=>-1!==e.indexOf("youtube.com/tv")||-1!==e.indexOf("youtube.com/embed/"),F=e=>"string"==typeof e&&-1!==e.indexOf("/shorts/"),q=()=>{const e=ai.location.href;return D(e)||F(e)},W=()=>q()||!function(e,t){const n=Si(e);return-1===t.deny.indexOf(n)&&(0===t.allow.length||-1!==t.allow.indexOf(n))}(ai.location.href,k),H=()=>{try{const e=si.getElementById("movie_player");return e&&"function"==typeof e.getPlayerResponse?e.getPlayerResponse():null}catch(e){return null}},J=e=>{const t=e.videoId||e.playerRequest&&e.playerRequest.videoId;return"string"==typeof t&&t.length>0?t:""},B=e=>{const t=[e],n=e.playerResponse;return n&&"object"==typeof n&&n.playabilityStatus&&t.push(n),t},_=e=>{const t=S(e,"playerConfig","audioConfig");if(!t||!t.muteOnStart)return;const n=-1!==ai.location.href.indexOf("/watch"),r=S(e,"playabilityStatus","miniplayer");if(!n&&(!e.cards||r))return;delete t.muteOnStart;const o=e.messages;o&&o[0]&&o[0].youThereRenderer&&delete o[0].youThereRenderer},V=e=>{if(e.playerRequest)return!1;const t=e.params||e.playbackContext&&e.playbackContext.params;if("string"!=typeof t||0!==t.indexOf("YAHI"))return!1;const n=ai.location.href;if("watch"!==Si(n))return!0;const r=function(e,t){if("string"!=typeof e||0===e.length)return"";const n=new RegExp("[?&]"+t+"=([^&#]+)").exec(e);return n?n[1]:""}(n,"v"),o=J(e);return Boolean(r&&o&&r!==o)},z=(e,t)=>{try{if(!e||!t)return;const n=J(e);if((e=>{const t=ai.location.href;if(D(t))return!0;if(L("shorts"))return F(t);const n=S(e,"contentPlaybackContext","currentUrl")||t;return F(n)})(t)){return void x("excluded",n,`Excluded: leaving request for ${n||"?"} untouched.`)}if(!L("preview")&&V(e)){return void x("preview",n,`Preview: leaving request for ${n||"?"} untouched.`)}(e=>{const t=J(e);t&&(null!==d&&d!==t&&(c("info",`New video ${t} (was ${d}) — reset to ${li}`),p=li),d=t)})(e);const r=(e=>{const t=J(e),n=H(),r=S(n,"playabilityStatus","status");if(L("gate"))return"LOGIN_REQUIRED"===r||"CONTENT_CHECK_REQUIRED"===r?hi:p;let o="";if((e=>{const t=e.playerRequest||e;return!0===t.racyCheckOk||!0===t.contentCheckOk})(e))o="request acknowledges an age/content check";else if(Ei(r)){const e=S(n,"videoDetails","videoId")||m;t&&e!==t||(o=`player reports ${r}`)}return o?(x("gate",`${t}|${o}`,`Gate: sending request for ${t||"?"} unmodified (${o}); state stays ${p}.`),hi):p})(e),o=S(e,"context","client","clientScreen"),s=t=>{e.params=t,e.playerRequest&&(e.playerRequest.params=t),e.playbackContext&&(e.playbackContext.params=t)},i=n=>{t.contentPlaybackContext&&(t.contentPlaybackContext.lactMilliseconds=`${ti.now()}`),n&&(()=>{try{ni.defineProperty(si,"visibilityState",{get:()=>"visible",configurable:!0})}catch(e){}})();const r=S(e,"context","client","configInfo");r&&r.appInstallData&&delete r.appInstallData,h++};switch(r){case li:if(o===mi)return;return s(gi),void i(!0);case ui:if(o===mi)return;return s(wi),e.playlistId||(e.context.client.clientScreen=mi),void i(!0);case fi:{if(o===mi)return;const e=t.params;if("string"==typeof e&&(0===e.indexOf(gi)||0===e.indexOf(wi)))return;return t.adPlaybackContext={pyv:!0},void i(!1)}case pi:if("WEB"!==S(e,"context","client","clientName"))return;return e.context.client.clientScreen=mi,void i(!0);case di:return t.adPlaybackContext={adType:"AD_TYPE_INSTREAM"},void i(!0);default:(()=>{try{P&&ni.defineProperty(si,"visibilityState",P)}catch(e){}})()}}catch(e){}},U=e=>{if(!e||!e.context||!e.context.client)return;const t=e.playbackContext;t&&void 0===t.adPlaybackContext&&z(e,t);const n=e.playerRequest&&e.playerRequest.playbackContext;n&&void 0===n.adPlaybackContext&&z(e,n)},X=e=>{if("string"!=typeof e||-1===e.indexOf('"contentPlaybackContext"')&&-1===e.indexOf('"adSignalsInfo"'))return null;const t=$(e);if(!t||!t.context||!t.context.client)return null;const n=h;return U(t),h===n?null:E(t)},G=l(E,(function(){try{const e=arguments[0];e&&"object"==typeof e&&U(e)}catch(e){}return o(E,this,arguments)}));ut(G,E),R(1,window.JSON,"stringify",G,"JSON.stringify");const K=l($,(function(){if(W()||p===hi)return o($,this,arguments);let e;try{e=o($,this,arguments)}catch(e){return o($,this,arguments)}try{if(!e||"object"!=typeof e)return e;if(!e.responseContext&&!e.playabilityStatus)return e;y++;const t=L("gate"),n=function(e){if(!e||"object"!=typeof e)return;const t=e.playabilityStatus;if(t&&t.status)return t.status;const n=e.playerResponse&&e.playerResponse.playabilityStatus;return n&&n.status?n.status:void 0}(e);if(!t&&Ei(n)){m=function(e){if(!e||"object"!=typeof e)return"";const t=e.videoDetails&&e.videoDetails.videoId;if(t)return t;const n=e.playerResponse&&e.playerResponse.videoDetails;return n&&n.videoId||""}(e)||d||"";const t=`${d}|${n}`;return t!==w&&(w=t,c("info",`Response is ${n} — a gate, not a spoof failure; state stays ${p}.`)),e}const r=E(e);let o=!1;for(const e of vi)if(-1!==r.indexOf(e)){o=!0;break}if(o){if(!(t&&-1!==r.indexOf("CONTENT_CHECK_REQUIRED")))return(e=>{const t=yi[p]||hi;c("info",`State: ${p} → ${t} (${e})`),p=t})("response had error marker"),e}for(const t of B(e))if(p===li&&_(t),p===di){const e=S(t,"playerConfig","granularVariableSpeedConfig");e&&(e.maximumPlaybackRate=200,e.minimumPlaybackRate=25)}}catch(e){}return e}));ut(K,$),R(2,window.JSON,"parse",K,"JSON.parse");const Q=window.TextEncoder.prototype.encode,Y=l(Q,(function(){try{const e=X(arguments[0]);null!==e&&(arguments[0]=e)}catch(e){}return o(Q,this,arguments)}));ut(Y,Q),R(3,window.TextEncoder.prototype,"encode",Y,"TextEncoder.prototype.encode");const Z=new Proxy(window.Request,{construct(e,t,n){try{const e=t[0],n=t[1];if(-1!==("string"==typeof e?e:e&&"string"==typeof e.url?e.url:"").indexOf("youtubei")&&n){const e=X(n.body);null!==e&&(n.body=e)}}catch(e){}return Reflect.construct(e,t,n)}});R(4,window,"Request",Z,"Request");const ee=window.XMLHttpRequest.prototype.send,te=l(ee,(function(){try{const e=arguments[0],t=ei.isArray(e),n=X(t?e[0]:e);null!==n&&(t?e[0]=n:arguments[0]=n)}catch(e){}return o(ee,this,arguments)}));ut(te,ee),R(5,window.XMLHttpRequest.prototype,"send",te,"XMLHttpRequest.prototype.send");const ne={apply(e,t,n){const r=Reflect.apply(e,t,n);try{if(r&&r.responseContext)for(const e of B(r))delete e.adSlots,delete e.playerAds,_(e)}catch(e){}return r}},re={apply(e,t,n){try{const e=n[0];if(e&&"string"==typeof e.value&&-1!==e.value.indexOf("playerResponse")){let t=e.value;const r=-1!==ai.location.href.indexOf("/watch"),o=-1!==t.indexOf("cards")&&-1===t.indexOf('"miniplayer"');(r||o)&&-1!==t.indexOf('"muteOnStart":true')&&(t=t.replace('"muteOnStart":true','"muteOnStart":false'),t=t.replace('"youThereRenderer":','"no_youThereRenderer":')),t=t.replace(/"(adSlots|playerAds)":/g,'"no_ads":'),e.value=t,n[0]=e}}catch(e){}return Reflect.apply(e,t,n)}},oe=window.Promise.prototype.then,se=l(oe,(function(){if(W())return o(oe,this,arguments);try{const e=arguments[0];if("function"==typeof e){const t=e.toString();-1!==t.indexOf("jspbResponseCtor")?arguments[0]=new Proxy(e,ne):-1!==t.indexOf(".next(")&&(arguments[0]=new Proxy(e,re))}}catch(e){}return o(oe,this,arguments)}));ut(se,oe),R(6,window.Promise.prototype,"then",se,"Promise.prototype.then");const ie=window.Node.prototype.appendChild,ae=l(ie,(function(){const e=o(ie,this,arguments);if(q())return e;try{e instanceof i&&"about:blank"===e.src&&e.contentWindow&&(e.contentWindow.fetch=ai.fetch,e.contentWindow.Request=ai.Request)}catch(e){}return e}));ut(ae,ie),R(7,window.Node.prototype,"appendChild",ae,"Node.prototype.appendChild");let ce=!1,le=0,ue=!1;const fe=new oi,pe=a&&a.prototype&&a.prototype.getItem,de=[];for(const e of["sessionStorage","localStorage"])try{ai[e]&&de.push(ai[e])}catch(e){}const he=()=>{if("function"!=typeof pe)return!1;for(const e of de)try{const t=o(pe,e,["yt-player-volume"]);if("string"!=typeof t||0===t.length)continue;const n=$(t),r=n&&n.data,s="string"==typeof r?$(r):r;if(s&&"boolean"==typeof s.muted)return s.muted||0===s.volume}catch(e){}return!1},ye=()=>!W(),ge=(e,t,n,r)=>{g++;const o=(e=>{let t=!1;try{const e=si.getElementById("movie_player");e&&"function"==typeof e.unMute&&(e.unMute(),t=!0,"function"==typeof e.getVolume&&"function"==typeof e.setVolume&&0===e.getVolume()&&e.setVolume(100))}catch(e){}try{e&&e.muted&&(e.muted=!1)}catch(e){}return t})(e);c("info",`${t} ${n} for videoId=${r} — unmuted (via `+(o?"player.unMute()":"element")+").")},we=(e,t,n)=>{if("playing"===n&&(t.playingAt=ti.now(),t.lateReverts=0),!ye())return;if(!e.muted)return void(ce=!1);const r=S(H(),"videoDetails","videoId")||"?",o=`[video.${n}]`;if(j&&((e,t,n)=>"volumechange"===e&&(ue||0!==le&&ti.now()-le<N)?(ce=!0,c("info",`${t} mute within user-gesture window — remembering + respecting user mute (videoId=${n}).`),!0):("playing"===e&&!ce&&he()&&(ce=!0,c("info",`${t} stored player preference is muted — treating as user mute.`)),!!ce&&(c("info",`${t} muted — user mute active, respecting (videoId=${n}).`),!0)))(n,o,r))return;let s="muted at first playing";const i="volumechange"===n;if(i){if(0===t.playingAt)return;const e=ti.now()-t.playingAt;if(e>=M||t.lateReverts>=5)return;s=`late mute at +${e}ms after playing`}const a=()=>{i&&t.lateReverts++,ge(e,o,s,r)};if(j)return void a();const l=()=>{!e.muted||!ye()||t.lateReverts>=5||(he()?c("info",`${o} muted — stored preference says the user muted, respecting (videoId=${r}).`):a())};i&&C>0?window.setTimeout((()=>{try{l()}catch(e){}}),C):l()},me=()=>{if(W())return;const e=(()=>{const e=si.getElementById("movie_player");return e?e.querySelector("video.html5-main-video")||e.querySelector("video.video-stream"):null})();if(!e||fe.has(e))return;fe.add(e);const t={playingAt:0,lateReverts:0};for(const n of["playing","volumechange"])e.addEventListener(n,(()=>{try{we(e,t,n)}catch(e){}}));c("info",`[video-watcher] attached to <video> element (late-mute window=${M}ms).`)};if(ve=10,!O.has(ve)){me(),new MutationObserver(me).observe(si,{childList:!0,subtree:!0}),si.addEventListener("yt-navigate-finish",me);const e=()=>{const e=()=>{le=ti.now()},t=e=>{const t=e.target;return!(!t||"function"!=typeof t.closest||!t.closest(".ytp-volume-area, .ytp-mute-button, .ytp-volume-panel"))},n=(e,t)=>{si.addEventListener(e,(e=>{try{t(e)}catch(e){}}),!0)},r=()=>{ue&&(ue=!1,e())};n("pointerdown",(n=>{t(n)?(ue=!0,e()):ue=!1}));for(const e of["pointerup","pointercancel"])n(e,r);ai.addEventListener("blur",r,!0);for(const r of["click","wheel"])n(r,(n=>{t(n)&&e()}));si.addEventListener("keydown",(t=>{try{const n=t.key,r=si.activeElement;if("m"===n||"M"===n){const t=r&&r.tagName?r.tagName:"";if("INPUT"===t||"TEXTAREA"===t||r&&r.isContentEditable)return;return void e()}("ArrowUp"===n||"ArrowDown"===n)&&r&&"function"==typeof r.closest&&r.closest("#movie_player")&&e()}catch(e){}}),!0)};j&&e()}var ve;c("info",`Installed. Starting state: ${p}. Hooks: JSON.{stringify,parse}, TextEncoder.encode, Request, XMLHttpRequest.send, Promise.then, Node.appendChild, video-unmute. Counters: ${h} mutations, ${y} responses inspected, ${v.gate} gate skips, ${v.preview} preview skips, ${v.excluded} excluded requests, ${g} video-element unmutes. Windows: late-mute=${M}ms, `+(j?`user-gesture=${N}ms (user mute from volume-control gestures).`:`storage-check delay=${C}ms.`)+(O.size>0?` Disabled hooks: ${[...O].join(",")}.`:"")+(T.size>0?` Legacy behaviour: ${[...T].join(",")}.`:"")+function(e){if(0===e.allow.length&&0===e.deny.length)return"";const t=[];e.allow.length>0&&t.push("allow=["+e.allow.join(",")+"]");e.deny.length>0&&t.push("deny=["+e.deny.join(",")+"]");return" Path filter: "+t.join(" ")+"."}(k)),f()},"tmp-yt-force-reload":function(e,t,n,r){if(Ai)return;Ai=!0;const o=ot("tmp-yt-force-reload"),{mark:s,end:i}=Qe("tmp-yt-force-reload");s();const a=(()=>{const e="string"==typeof n?n.toString():"0",t=Oi(e,10);return isNaN(t)||t<0?0:t})(),c="every"===("string"==typeof e?e.toString():"").toLowerCase()?"every":"first",l=(()=>{const e=("string"==typeof t?t.toString():"").toLowerCase();return"dom"===e||"player"===e||"both"===e?e:"none"})(),u=function(e){const t=[],n=[];if("string"!=typeof e||0===e.length)return{allow:t,deny:n};const r=e.split(/\s+/);for(let e=0;e<r.length;e++){const o=r[e];o&&("!"===o.charAt(0)&&o.length>1?n.push(o.slice(1).toLowerCase()):t.push(o.toLowerCase()))}return{allow:t,deny:n}}(r),f=xi.now();let p="",d=0,h=!1;const y=new Pi;let g=!1,w=0;const m=()=>{if("none"===l)return;if(-1===ji.location.href.indexOf("/watch?"))return;if(!Ii(ji.location.href,u))return;const e=ki.getElementById("movie_player");if(!e||"function"!=typeof e.loadVideoById)return;if(!(e=>{if("none"===l||!e)return!1;let t=!1,n=!1;if("dom"===l||"both"===l)try{t=e.classList.contains("ytp-error")||null!==e.querySelector(".ytp-error")}catch(e){}if("player"===l||"both"===l)try{const t="function"==typeof e.getPlayerResponse?e.getPlayerResponse():null,r=t&&t.playabilityStatus&&t.playabilityStatus.status;n="string"==typeof r&&"OK"!==r&&"OK_LIMITED"!==r}catch(e){}return"both"===l?t&&n:"player"===l?n:t})(e))return;let t;try{t="function"==typeof e.getPlayerResponse?e.getPlayerResponse():null}catch(e){t=null}const n=t&&t.videoDetails&&t.videoDetails.videoId;if("string"!=typeof n||""===n)return;if(y.has(n))return;y.add(n);const r=t.playerConfig&&t.playerConfig.playbackStartConfig&&t.playerConfig.playbackStartConfig.startSeconds||0;w++;const s=w,i=xi.now()-f,a=t&&t.playabilityStatus&&t.playabilityStatus.status;o("info",`error#${s} [+${i}ms] Error detected for "${n}" (signal=${l}, playabilityStatus=${a}). Firing loadVideoById("${n}", ${r}).`);try{e.loadVideoById(n,r)}catch(e){o("error",`error#${s} loadVideoById threw: ${e}`)}},v=()=>{if(h)return!0;if(-1===ji.location.href.indexOf("/watch?"))return!1;if(!Ii(ji.location.href,u))return!1;const e=ki.getElementById("movie_player");if(!e||"function"!=typeof e.loadVideoById)return!1;let t;(e=>{if("none"===l)return;if(g||!e)return;g=!0,new Ri((()=>{m()})).observe(e,{attributes:!0,attributeFilter:["class"],childList:!0,subtree:!0}),o("info",`Error arm attached to movie_player (signal=${l}).`),m()})(e);try{t="function"==typeof e.getPlayerResponse?e.getPlayerResponse():null}catch(e){t=null}const n=t&&t.videoDetails&&t.videoDetails.videoId;if("string"!=typeof n||""===n)return!1;if(n===p)return!1;const r=Li(e,"getPlayerState"),s=Li(e,"getCurrentTime"),i=Li(e,"getVideoLoadedFraction"),y=Li(e,"getDuration"),w=Li(e,"getPlayerStateObject"),v=`state=${r}, current=${s}, loadedFraction=${i}, duration=${y}, isBuffering=${w&&w.isBuffering}`;let b,E;if(1===r||2===r||0===r?(b=!1,E="already playing/paused/ended"):3===r&&"number"==typeof s&&s>=1&&("number"==typeof i&&i>=.05)?(b=!1,E="mid-playback buffer"):(b=!0,E="fresh / pre-playback"),!b)return p=n,o("info",`Skipping reload for "${n}": ${E}. ${v}`),!0;const $=t.playerConfig&&t.playerConfig.playbackStartConfig&&t.playerConfig.playbackStartConfig.startSeconds||0;p=n,d++;const S=d,x=n,R=$,P=()=>{try{const t=xi.now()-f;o("info",`#${S} [+${t}ms] Firing loadVideoById("${x}", ${R}). ${v}`),e.loadVideoById(x,R)}catch(e){o("error",`#${S} loadVideoById threw: ${e}`)}};return a>0?Ti(P,a):P(),"first"===c&&(h=!0,o("info","first-mode: disabling further reloads after this fire.")),!0},b=()=>{if(v())return;let e=new Ri((()=>{v()&&e&&(e.disconnect(),e=null)}));e.observe(ki,{childList:!0,subtree:!0}),Ti((()=>{e&&(e.disconnect(),e=null)}),1e4)};"loading"===ki.readyState?ki.addEventListener("DOMContentLoaded",b):b(),ki.addEventListener("yt-navigate-finish",(()=>{let e=30;const t=()=>{v()||(e--,e<=0||Ti(t,100))};Ti(t,100)})),o("info","Installed. Mode="+c+". "+("first"===c?"Fires once on the first video, then disables.":"Fires on every new video (cold load + SPA nav).")+(a>0?` +${a}ms delay.`:"")+("none"===l?" Error arm disabled.":` Error arm via ${l} signal (1 reload/video).`)+function(e){if(0===e.allow.length&&0===e.deny.length)return"";const t=[];e.allow.length>0&&t.push("allow=["+e.allow.join(",")+"]");e.deny.length>0&&t.push("deny=["+e.deny.join(",")+"]");return" Path filter: "+t.join(" ")+"."}(u)),i()}};
const snippets=Mi;
let context;
for (const [name, ...args] of filters) {
if (snippets.hasOwnProperty(name)) {
try { context = snippets[name].apply(context, args); }
catch (error) { console.error(error); }
}
}
context = void 0;
};
const graph = new Map([["abort-current-inline-script",null],["abort-on-iframe-property-read",null],["abort-on-iframe-property-write",null],["abort-on-property-read",null],["abort-on-property-write",null],["array-override",null],["blob-override",null],["cookie-remover",null],["debug",null],["event-override",null],["freeze-element",null],["hide-if-canvas-contains",null],["hide-if-shadow-contains",null],["json-override",null],["json-prune",null],["map-override",null],["override-property-read",null],["prevent-element-src-loading",null],["prevent-listener",null],["prevent-window-open",null],["profile",null],["replace-argument",null],["replace-fetch-request",null],["replace-fetch-response",null],["replace-outbound-value",null],["replace-xhr-request",null],["replace-xhr-response",null],["strip-fetch-query-parameter",null],["timer-override",null],["trace",null],["tmp-yt-buffering-spoof",null],["tmp-yt-force-reload",null]]);
callback.get = snippet => graph.get(snippet);
callback.has = snippet => graph.has(snippet);
callback.getGraph = () => graph;
callback.setEnvironment = env => {
  if (typeof currentEnvironment !== "undefined")
    currentEnvironment = env;
};
callback.setDebugStyle = styles => {
  if (typeof currentEnvironment !== "undefined")
  {
    delete currentEnvironment.initial;
    currentEnvironment.debugCSSProperties = styles;
  }
    
};
callback.getEnvironment = () => currentEnvironment;
/* harmony default export */ const main = (callback);
;// ./src/content/shared/constants.js
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Prefix that should be used for storage and synchronization to avoid conflicts
 * when multiple extensions are installed in the same session.
 *
 * !!! IMPORTANT - DO NOT CHANGE THIS VALUE !!!
 * This exact string "ab" is hardcoded in the build
 * configurations and is replaced during the build process with host-specific
 * values (e.g., "ab" for Adblock, "abp" for Adblock Plus).
 *
 * If you change this value, the build process will NOT replace it, and the
 * extension will fail to work properly due to namespace conflicts.
 *
 * Build configuration references:
 * - host/adblock/build/config/base.mjs (replacements.search)
 * - host/adblockplus/build/webext/config/base.mjs (replacements.search)
 *
 * @type {string}
 */
const HOST_PREFIX_TO_REPLACE = "ab";

/**
 * Dataset key used to exchange the communication channel name between content
 * scripts in different contexts (main world and isolated world)
 * @type {string}
 */
const COMMS_CHANNEL_DATASET_KEY = `${HOST_PREFIX_TO_REPLACE}FiltersChannel`;

/**
 * Event used to communicate between content script contexts
 * @type {string}
 */
const HANDSHAKE_EVENT_NAME = `${HOST_PREFIX_TO_REPLACE}-handshake`;

/**
 * Storage key used to cache the filters config in content scripts
 * @type {string}
 */
const CACHED_FILTERS_CONFIG_KEY = `${HOST_PREFIX_TO_REPLACE}-filters-config`;

;// ./src/all/snippets.js
/**
 * CSS properties applied to elements hidden in debug mode
 * @type {string[][]}
 */
const DEBUG_CSS_PROPERTIES = [
    ["background", "repeating-linear-gradient(to bottom, #e67370 0, #e67370 9px, white 9px, white 10px)"],
    ["outline", "solid red"]
  ];
  
;// ./src/content/main/shims/storage.js
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-extend-native */

function shimStorage(CACHED_FILTERS_CONFIG_KEY) {
  // =================== Secured copies of native functions ====================
  // These are captured before page scripts run.
  // Used inside Proxy apply handlers which run after page scripts.
  const {parse: $JSONparse, stringify: $JSONstringify} = JSON;
  const {keys: $ObjectKeys} = Object;
  const {
    apply: $ReflectApply,
    ownKeys: $ReflectOwnKeys,
    get: $ReflectGet,
    set: $ReflectSet,
    has: $ReflectHas,
    getOwnPropertyDescriptor: $ReflectGetOwnPropertyDescriptor,
    defineProperty: $ReflectDefineProperty,
    deleteProperty: $ReflectDeleteProperty
  } = Reflect;
  const {filter: $ArrayFilter} = Array.prototype;
  const {get: $MapGet, set: $MapSet, has: $MapHas} = Map.prototype;
  const $String = String;

  // Helpers using secured copies
  const filter = (arr, fn) => $ReflectApply($ArrayFilter, arr, [fn]);
  const mapGet = (map, key) => $ReflectApply($MapGet, map, [key]);
  const mapSet = (map, key, val) => $ReflectApply($MapSet, map, [key, val]);
  const mapHas = (map, key) => $ReflectApply($MapHas, map, [key]);

  // Need to unwrap our own proxies when multiple extensions run this shim.
  const realLocalStorage = window.localStorage;
  const realSessionStorage = window.sessionStorage;
  let localStorageProxy;
  let sessionStorageProxy;
  function unwrapStorage(storage) {
    if (storage === localStorageProxy) {
      return realLocalStorage;
    }
    if (storage === sessionStorageProxy) {
      return realSessionStorage;
    }
    return storage;
  }

  const originalToStrings = new Map();

  const storageGetItemDesc = Object.getOwnPropertyDescriptor(
    Storage.prototype, "getItem"
  );
  const originalStorageGetItem = storageGetItemDesc.value;

  // =================== Conditional application of the shim ===================
  function shouldShimStorage() {
    const config = getConfig(window.sessionStorage) ||
      getConfig(window.localStorage);
    return Boolean(config);
  }

  if (!shouldShimStorage()) {
    return;
  }

  // ===================== Storage.prototype.getItem ======================
  // @docs https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem
  function getConfig(storage) {
    try {
      const configSerialized = $ReflectApply(
        originalStorageGetItem, unwrapStorage(storage),
        [CACHED_FILTERS_CONFIG_KEY]
      );
      if (configSerialized) {
        return $JSONparse(configSerialized);
      }
    }
    catch (e) {
      // If we can't parse, return null
    }
    return null;
  }

  function websiteHasValue(config) {
    return config && typeof config.websiteValue === "string";
  }
  const storageGetItemProxy = new Proxy(originalStorageGetItem, {
    apply(target, thisArg, argumentsList) {
      const key = argumentsList[0];
      const unwrappedThis = unwrapStorage(thisArg);
      if (key === CACHED_FILTERS_CONFIG_KEY) {
        const config = getConfig(unwrappedThis);
        if (websiteHasValue(config)) {
          return config.websiteValue;
        }
        return null;
      }
      return $ReflectApply(target, unwrappedThis, argumentsList);
    }
  });
  Object.defineProperty(Storage.prototype, "getItem", {
    ...storageGetItemDesc,
    value: storageGetItemProxy
  });
  mapSet(
    originalToStrings,
    storageGetItemProxy,
    originalStorageGetItem.toString.bind(originalStorageGetItem)
  );

  // ===================== Storage.prototype.setItem ===========================
  // @docs https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem
  const storageSetItemDesc = Object.getOwnPropertyDescriptor(
    Storage.prototype, "setItem"
  );
  const originalStorageSetItem = storageSetItemDesc.value;
  const storageSetItemProxy = new Proxy(originalStorageSetItem, {
    apply(target, thisArg, argumentsList) {
      const key = argumentsList[0];
      const unwrappedThis = unwrapStorage(thisArg);
      if (key === CACHED_FILTERS_CONFIG_KEY) {
        const config = getConfig(unwrappedThis) || {};
        config.websiteValue = $String(argumentsList[1]);
        $ReflectApply(
          target,
          unwrappedThis,
          [CACHED_FILTERS_CONFIG_KEY, $JSONstringify(config)]
        );
        return void 0;
      }
      return $ReflectApply(target, unwrappedThis, argumentsList);
    }
  });
  Object.defineProperty(Storage.prototype, "setItem", {
    ...storageSetItemDesc,
    value: storageSetItemProxy
  });
  mapSet(
    originalToStrings,
    storageSetItemProxy,
    originalStorageSetItem.toString.bind(originalStorageSetItem)
  );

  // ================== Storage.prototype.removeItem ==========================
  // @docs https://developer.mozilla.org/en-US/docs/Web/API/Storage/removeItem
  const storageRemoveItemDesc = Object.getOwnPropertyDescriptor(
    Storage.prototype, "removeItem"
  );
  const originalStorageRemoveItem = storageRemoveItemDesc.value;
  const storageRemoveItemProxy = new Proxy(originalStorageRemoveItem, {
    apply(target, thisArg, argumentsList) {
      const key = argumentsList[0];
      const unwrappedThis = unwrapStorage(thisArg);
      if (key === CACHED_FILTERS_CONFIG_KEY) {
        const config = getConfig(unwrappedThis);
        if (websiteHasValue(config)) {
          delete config.websiteValue;
          $ReflectApply(
            originalStorageSetItem,
            unwrappedThis, [CACHED_FILTERS_CONFIG_KEY, $JSONstringify(config)]
          );
        }
        return void 0;
      }
      return $ReflectApply(target, unwrappedThis, argumentsList);
    }
  });
  Object.defineProperty(Storage.prototype, "removeItem", {
    ...storageRemoveItemDesc,
    value: storageRemoveItemProxy
  });
  mapSet(
    originalToStrings,
    storageRemoveItemProxy,
    originalStorageRemoveItem.toString.bind(originalStorageRemoveItem)
  );

  // ==================== Storage.prototype.clear ============================
  // @docs https://developer.mozilla.org/en-US/docs/Web/API/Storage/clear
  const storageClearDesc = Object.getOwnPropertyDescriptor(
    Storage.prototype, "clear"
  );
  const originalStorageClear = storageClearDesc.value;
  const storageClearProxy = new Proxy(originalStorageClear, {
    apply(target, thisArg, argumentsList) {
      const unwrappedThis = unwrapStorage(thisArg);
      const config = getConfig(unwrappedThis);
      if (config) {
        delete config.websiteValue;
      }

      $ReflectApply(target, unwrappedThis, argumentsList);

      // Restore our config (without websiteValue)
      if (config && $ObjectKeys(config).length > 0) {
        $ReflectApply(
          originalStorageSetItem,
          unwrappedThis, [CACHED_FILTERS_CONFIG_KEY, $JSONstringify(config)]
        );
      }
      return void 0;
    }
  });
  Object.defineProperty(Storage.prototype, "clear", {
    ...storageClearDesc,
    value: storageClearProxy
  });
  mapSet(
    originalToStrings,
    storageClearProxy,
    originalStorageClear.toString.bind(originalStorageClear)
  );

  // ===================== Storage.prototype.key ===============================
  // @docs https://developer.mozilla.org/en-US/docs/Web/API/Storage/key
  const storageKeyDesc = Object.getOwnPropertyDescriptor(
    Storage.prototype, "key"
  );
  const originalStorageKey = storageKeyDesc.value;
  const storageKeyProxy = new Proxy(originalStorageKey, {
    apply(target, thisArg, argumentsList) {
      const unwrappedThis = unwrapStorage(thisArg);
      const config = getConfig(unwrappedThis);
      if (!config || websiteHasValue(config)) {
        return $ReflectApply(target, unwrappedThis, argumentsList);
      }

      const requestedIndex = argumentsList[0];
      for (let i = 0; i <= requestedIndex; i++) {
        const key = $ReflectApply(target, unwrappedThis, [i]);
        if (key === CACHED_FILTERS_CONFIG_KEY) {
          return $ReflectApply(target, unwrappedThis, [requestedIndex + 1]);
        }
      }
      return $ReflectApply(target, unwrappedThis, argumentsList);
    }
  });
  Object.defineProperty(Storage.prototype, "key", {
    ...storageKeyDesc,
    value: storageKeyProxy
  });
  mapSet(
    originalToStrings,
    storageKeyProxy,
    originalStorageKey.toString.bind(originalStorageKey)
  );

  // =================== Storage.prototype.length ============================
  // @docs https://developer.mozilla.org/en-US/docs/Web/API/Storage/length
  const storageLengthDesc = Object.getOwnPropertyDescriptor(
    Storage.prototype, "length"
  );
  const originalStorageLengthGetter = storageLengthDesc.get;
  Object.defineProperty(Storage.prototype, "length", {
    ...storageLengthDesc,
    get() {
      const unwrappedThis = unwrapStorage(this);
      const originalLength =
        $ReflectApply(originalStorageLengthGetter, unwrappedThis, []);
      const config = getConfig(unwrappedThis);
      if (config && !websiteHasValue(config)) {
        return originalLength - 1;
      }
      return originalLength;
    }
  });

  // ================== Proxy wrapper for localStorage ===========
  // Handles: {...localStorage}, Object.keys(), Object.values(), for...in, etc.
  const methodProxyCache = new Map();

  function getMethodProxy(method) {
    if (mapHas(methodProxyCache, method)) {
      return mapGet(methodProxyCache, method);
    }
    const methodProxy = new Proxy(method, {
      apply(fn, thisArg, args) {
        return $ReflectApply(fn, thisArg, args);
      }
    });
    mapSet(methodProxyCache, method, methodProxy);
    // Register toString for the wrapper to preserve function name
    const originalMethod = mapGet(originalToStrings, method);
    if (originalMethod) {
      mapSet(originalToStrings, methodProxy, originalMethod);
    }
    return methodProxy;
  }

  const storageInstanceProxyConfig = {
    ownKeys(target) {
      const keys = $ReflectOwnKeys(target);
      const config = getConfig(target);
      if (config && !websiteHasValue(config)) {
        return filter(keys, key => key !== CACHED_FILTERS_CONFIG_KEY);
      }
      return keys;
    },

    // Required for spread operator
    getOwnPropertyDescriptor(target, prop) {
      if (prop === CACHED_FILTERS_CONFIG_KEY) {
        const config = getConfig(target);
        if (config && !websiteHasValue(config)) {
          return void 0; // Hide the property entirely
        }
        // When website has set a value, return a proper enumerable descriptor
        // with the website's value (not our internal config)
        if (websiteHasValue(config)) {
          return {
            value: config.websiteValue,
            writable: true,
            enumerable: true,
            configurable: true
          };
        }
      }
      return $ReflectGetOwnPropertyDescriptor(target, prop);
    },

    // Needed for 'in' operator
    has(target, prop) {
      if (prop === CACHED_FILTERS_CONFIG_KEY) {
        const config = getConfig(target);
        if (config && !websiteHasValue(config)) {
          return false;
        }
      }
      return $ReflectHas(target, prop);
    },

    // Forward get/set using original target so native methods work correctly
    get(target, prop) {
      if (prop === CACHED_FILTERS_CONFIG_KEY) {
        return target.getItem(CACHED_FILTERS_CONFIG_KEY);
      }
      // Return correct toStringTag so Object.prototype.toString returns
      // [object Storage] instead of [object Object] (for older Firefox)
      if (prop === Symbol.toStringTag) {
        return "Storage";
      }
      const value = $ReflectGet(target, prop, target);
      // For methods, wrap in a proxy to bind `this` to original target
      // while preserving toString behavior
      if (typeof value === "function") {
        return getMethodProxy(value);
      }
      return value;
    },

    set(target, prop, value) {
      if (prop === CACHED_FILTERS_CONFIG_KEY) {
        target.setItem(CACHED_FILTERS_CONFIG_KEY, value);
        return true;
      }
      return $ReflectSet(target, prop, value, target);
    },

    defineProperty(target, prop, descriptor) {
      if (prop === CACHED_FILTERS_CONFIG_KEY) {
        if ("value" in descriptor) {
          target.setItem(CACHED_FILTERS_CONFIG_KEY, descriptor.value);
        }
        return true;
      }
      return $ReflectDefineProperty(target, prop, descriptor);
    },

    deleteProperty(target, prop) {
      if (prop === CACHED_FILTERS_CONFIG_KEY) {
        target.removeItem(CACHED_FILTERS_CONFIG_KEY);
        return true;
      }
      return $ReflectDeleteProperty(target, prop);
    }
  };

  localStorageProxy = new Proxy(
    window.localStorage,
    storageInstanceProxyConfig
  );

  sessionStorageProxy = new Proxy(
    window.sessionStorage,
    storageInstanceProxyConfig
  );

  // Capture the native accessor getters before redefining.
  const localStorageDesc =
    Object.getOwnPropertyDescriptor(window, "localStorage");
  const sessionStorageDesc =
    Object.getOwnPropertyDescriptor(window, "sessionStorage");
  const nativeLocalStorageGetter = localStorageDesc && localStorageDesc.get;
  const nativeSessionStorageGetter =
    sessionStorageDesc && sessionStorageDesc.get;

  function localStorageGetter() {
    return localStorageProxy;
  }
  function sessionStorageGetter() {
    return sessionStorageProxy;
  }

  if (nativeLocalStorageGetter) {
    $ReflectDefineProperty(localStorageGetter, "name", {
      value: nativeLocalStorageGetter.name,
      configurable: true
    });
    mapSet(
      originalToStrings,
      localStorageGetter,
      nativeLocalStorageGetter.toString.bind(nativeLocalStorageGetter)
    );
  }
  if (nativeSessionStorageGetter) {
    $ReflectDefineProperty(sessionStorageGetter, "name", {
      value: nativeSessionStorageGetter.name,
      configurable: true
    });
    mapSet(
      originalToStrings,
      sessionStorageGetter,
      nativeSessionStorageGetter.toString.bind(nativeSessionStorageGetter)
    );
  }

  Object.defineProperty(window, "localStorage", {
    get: localStorageGetter,
    configurable: true,
    enumerable: true
  });

  Object.defineProperty(window, "sessionStorage", {
    get: sessionStorageGetter,
    configurable: true,
    enumerable: true
  });

  // ===================== Function.prototype.toString =========================
  // @docs https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/toString
  const functionToStringDesc = Object.getOwnPropertyDescriptor(
    Function.prototype, "toString"
  );
  const originalFunctionToString = functionToStringDesc.value;
  const functionToStringProxy = new Proxy(originalFunctionToString, {
    apply(target, thisArg, argumentsList) {
      // Call "super" first, just in case the function was overwritten and had
      // checks if it was called
      const r = $ReflectApply(target, thisArg, argumentsList);

      const restoredToString = mapGet(originalToStrings, thisArg);
      if (restoredToString) {
        return $ReflectApply(restoredToString, thisArg, argumentsList);
      }

      return r;
    }
  });
  Object.defineProperty(Function.prototype, "toString", {
    ...functionToStringDesc,
    value: functionToStringProxy
  });
  mapSet(
    originalToStrings,
    functionToStringProxy,
    originalFunctionToString.toString.bind(originalFunctionToString)
  );
}

;// ./src/content/shared/helpers.js
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */



/**
 * Claims a communication channel name from the document's dataset.
 *
 * If a channel name already exists in the dataset, it is consumed (removed
 * from the dataset and returned). If no channel name exists, the fallback
 * channel is stored in the dataset and returned.
 *
 * This mechanism ensures that only one content script can claim the
 * channel name at a time, preventing conflicts when the main world
 * and isolated world scripts execution order is not consistent.
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/139#changes_for_add-on_developers
 * @see https://bugzil.la/1792685
 * @see https://eyeo.atlassian.net/wiki/spaces/B2C/pages/1666678786/Content-script+based+snippets
 *
 * @param {string} fallbackChannel - The channel name to use and store if
 *   none is present.
 * @returns {string} The claimed channel name (either the existing one
 *   or the fallback).
 */
function claimCommsChannel(fallbackChannel) {
  let channelName = document.documentElement.dataset[COMMS_CHANNEL_DATASET_KEY];

  if (!channelName) {
    channelName = fallbackChannel;
    document.documentElement.dataset[COMMS_CHANNEL_DATASET_KEY] = channelName;
  }
  else {
    delete document.documentElement.dataset[COMMS_CHANNEL_DATASET_KEY];
  }

  return channelName;
}

;// ./src/all/errors.js
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */

const ERROR_NO_CONNECTION = (/* unused pure expression or super */ null && ("Could not establish connection. " +
      "Receiving end does not exist."));
const ERROR_CLOSED_CONNECTION = (/* unused pure expression or super */ null && ("A listener indicated an asynchronous " +
      "response by returning true, but the message channel closed before a " +
      "response was received"));
// https://bugzilla.mozilla.org/show_bug.cgi?id=1578697
const ERROR_MANAGER_DISCONNECTED = "Message manager disconnected";

/**
 * Reconstructs an error from a serializable error object
 *
 * @param {Object} errorData - Error object
 *
 * @returns {Error} error
 */
function fromSerializableError(errorData) {
  const error = new Error(errorData.message);
  error.cause = errorData.cause;
  error.name = errorData.name;
  error.stack = errorData.stack;

  return error;
}

/**
 * Filters out `browser.runtime.sendMessage` errors to do with the receiving end
 * no longer existing.
 *
 * @param {Promise} promise The promise that should have "no connection" errors
 *   ignored. Generally this would be the promise returned by
 *   `browser.runtime.sendMessage`.
 * @return {Promise} The same promise, but will resolve with `undefined` instead
 *   of rejecting if the receiving end no longer exists.
 */
function ignoreNoConnectionError(promise) {
  return promise.catch(error => {
    if (typeof error == "object" &&
        (error.message == ERROR_NO_CONNECTION ||
         error.message == ERROR_CLOSED_CONNECTION ||
         error.message == ERROR_MANAGER_DISCONNECTED)) {
      return;
    }

    throw error;
  });
}

/**
 * Creates serializable error object from given error
 *
 * @param {Error} error - Error
 *
 * @returns {Object} serializable error object
 */
function toSerializableError(error) {
  return {
    cause: error.cause instanceof Error ?
      toSerializableError(error.cause) :
      error.cause,
    message: error.message,
    name: error.name,
    stack: error.stack
  };
}

;// ./src/content/main/snippets.entry.js
/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */









// Use chrome.storage to detect if we're in an isolated world.
// Note: chrome.runtime is unreliable since other extensions may expose it
// in the main world.
const isMainWorld = !(
  (typeof chrome === "object" && !!chrome.storage) ||
  (typeof browser === "object" && !!browser.storage)
);

const nativeDispatch = document.dispatchEvent.bind(document);

// Get or create a unique channel name for communicating with the isolated world
const commsChannelName = claimCommsChannel(esm_browser_v4());

// Creates a sendSnippetHitEvent function that dispatches hit events back to
// the isolated world via the comms channel. The isolated-world listener
// receives, validates, and forwards the event to the telemetry pipeline.
const createMainWorldHitEventSender = (commsChannel, dispatch) => {
  const dispatchFn = dispatch || document.dispatchEvent.bind(document);
  return function sendSnippetHitEvent(filter, domain) {
    try {
      dispatchFn(new CustomEvent(commsChannel, {
        detail: {
          type: "ewe:snippet-hit",
          filter,
          domain
        }
      }));
    }
    catch (e) {
      // telemetry must never break snippet execution
    }
  };
};

const runStorageShim = (shimFn, configKey) => {
  try {
    if (typeof shimFn === "function" && configKey) {
      shimFn(configKey);
    }
  }
  catch (err) {
    // It would be good to report this error to Sentry, but we don't currently
    // have a way to do that from the main world.
  }
};

const runSnippets = snippetsConfig => {
  const {callback, filters, env, commsChannel, serializeError,
    dispatchFn} = snippetsConfig;

  if (filters.length) {
    try {
      callback(env, ...filters);
    }
    catch (e) {
      // It would be good to report this error to Sentry, but we don't currently
      // have a way to do that from the main world.
      const errorEvent = new CustomEvent(commsChannel, {
        detail: {
          type: "ewe:main-error",
          error: serializeError(e)
        }
      });
      dispatchFn(errorEvent);
    }
  }
};

const createTrustedScriptPolicy = () => {
  const isTrustedTypesSupported = typeof trustedTypes !== "undefined";
  let policy = null;

  try {
    if (isTrustedTypesSupported) {
      policy = trustedTypes.createPolicy(esm_browser_v4(), {
        createScript: code => code,
        createScriptURL: url => url
      });
    }
  }
  catch (_) {
  }
  return policy;
};

const injectScript = (executable, policy) => {
  const script = document.createElement("script");
  script.type = "application/javascript";
  script.async = false;

  if (policy) {
    script.textContent = policy.createScript(executable);
  }
  else {
    script.textContent = executable;
  }

  try {
    document.documentElement.appendChild(script);
  }
  catch (_) {}
  document.documentElement.removeChild(script);
};

const appendSnippets = snippetsConfig => {
  const policy = createTrustedScriptPolicy();
  const {
    callback,
    filters,
    env,
    shimFn,
    shimConfigKey,
    commsChannel,
    serializeError
  } = snippetsConfig;

  const snippetsCode = filters.length ? `
    const callback = (${callback});
    const runSnippets = (${runSnippets});
    const serializeError = (${serializeError});
    const createHitSender = (${createMainWorldHitEventSender});
    const env = ${JSON.stringify(env)};
    env.sendSnippetHitEvent = createHitSender(
      "${commsChannel}", null
    );
    const snippetsConfig = {
      callback,
      env,
      filters: ${JSON.stringify(filters)},
      commsChannel: "${commsChannel}",
      serializeError,
      dispatchFn: document.dispatchEvent.bind(document)
    };
    runSnippets(snippetsConfig);
  ` : "";

  const code = `(function () {
    const shimFn = (${shimFn});
    const shimConfigKey = "${shimConfigKey}";
    const runStorageShim = (${runStorageShim});
    runStorageShim(shimFn, shimConfigKey);
    ${snippetsCode}
  })();`;

  injectScript(code, policy);
};

const onFiltersReceived = event => {
  if (!event || !event.detail) {
    return;
  }

  const {type, filters, debug} = event.detail;

  // ignore other events that are not related to filters config
  if (type !== "ewe:filters-config") {
    return;
  }

  // Check which snippets need to be executed in the main world.
  const mainSnippets = [];
  for (const filter of filters) {
    for (const [name, ...args] of filter) {
      if (main.has(name)) {
        mainSnippets.push([name, ...args]);
      }
    }
  }

  // sendDetectionEvent is intentionally not included in the main world env.
  // Detection events rely on ServerLogger and Sentry, which require extension
  // API access only available in the isolated world. See snippet-events.js.
  const snippetsConfig = {
    callback: main,
    env: {
      debugCSSProperties: debug ? DEBUG_CSS_PROPERTIES : null,
      sendSnippetHitEvent: createMainWorldHitEventSender(
        commsChannelName, isMainWorld ? nativeDispatch : null
      )
    },
    filters: mainSnippets,
    shimFn: shimStorage,
    shimConfigKey: CACHED_FILTERS_CONFIG_KEY,
    commsChannel: commsChannelName,
    serializeError: toSerializableError,
    dispatchFn: nativeDispatch
  };

  // If this script is injected into the main world we can execute directly.
  // If we are on isolated world (MV2), we need to create an inline script to
  // inject the snippets into page context.
  if (isMainWorld) {
    runStorageShim(shimStorage, CACHED_FILTERS_CONFIG_KEY);
    runSnippets(snippetsConfig);
  }
  else {
    appendSnippets(snippetsConfig);
  }
};

document.addEventListener(commsChannelName, onFiltersReceived);
document.dispatchEvent(new CustomEvent(HANDSHAKE_EVENT_NAME));

/******/ })()
;
