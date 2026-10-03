// Minimal element adapter for controller tests; layout is verified separately.
export class Node {
 constructor(selector='',attrs={},children=[]){this.className=selector.split('.').slice(1).join(' ');this.style={};this.children=[];Object.assign(this,attrs||{});this.textContent=attrs?.text||'';this.append(...children);this.classList={add:c=>{this.className+=' '+c;},remove:c=>{this.className=this.className.split(' ').filter(x=>x!==c).join(' ');},toggle:(c,on)=>{this.classList.remove(c);if(on)this.classList.add(c);},contains:c=>this.className.split(' ').includes(c)};}
 append(...xs){this.children.push(...xs.filter(x=>x!=null));}
 setAttribute(k,v){this[k]=v;}
 set innerHTML(v){this.children=[];} get innerHTML(){return '';}
 querySelector(selector){const cls=selector.slice(1);return this.children.filter(x=>x instanceof Node).map(x=>x.className.split(' ').includes(cls)?x:x.querySelector(selector)).find(Boolean)||null;}
}
