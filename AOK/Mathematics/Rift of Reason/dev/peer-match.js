(function(){
    'use strict';
    const screen=document.getElementById('screen'),choice=document.getElementById('starter');let handle=null;
    function mount(){if(handle)handle.destroy();screen.replaceChildren();const save=Rift.State.freshState();save.seed='peer-bench';save.avatar={type:choice.value,variant:'girl',nickname:choice.value};Rift.State.grantStarter(save);handle=Rift.PeerUI.mount(screen,{save,back:mount});}
    document.getElementById('restart').onclick=mount;document.getElementById('calm').onchange=e=>document.body.classList.toggle('calm-motion',e.target.checked);mount();
})();
