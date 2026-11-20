(() => {
  'use strict';
  // Reusable SVG drawings; the same devices appear in the map and the signal view.
  function device(type, facing = 1) {
    if (type === 'pc') return '<rect class="device-body" x="-28" y="-29" width="56" height="36" rx="4"/><rect class="device-screen" x="-23" y="-24" width="46" height="25" rx="1"/><path class="device-detail" d="M0,8 V18 M-18,19 H18"/><path class="device-screen-mark" d="M-14,-15 L-6,-9 L-14,-3 M0,-3 H13"/>';
    if (type === 'access') return '<path class="device-top" d="M-65,-9 L-54,-25 H54 L65,-9 Z"/><rect class="device-body" x="-65" y="-9" width="130" height="29" rx="4"/>' + Array.from({length:8},(_,i) => '<rect class="device-port" x="'+(-55+i*13)+'" y="0" width="9" height="10" rx="1"/><circle class="device-led" cx="'+(-51+i*13)+'" cy="15" r="1.5"/>').join('') + '<path class="device-detail" d="M52,-2 V11 M57,-2 V11"/>';
    if (type === 'router') return '<path class="device-body" d="M-43,-11 V10 C-43,29 43,29 43,10 V-11 Z"/><ellipse class="device-top" cx="0" cy="-11" rx="43" ry="15"/><path class="device-arrow" d="M-29,-11 H-9 M-15,-16 L-9,-11 L-15,-6 M29,-11 H9 M15,-16 L9,-11 L15,-6 M0,-23 V-14 M-5,-18 L0,-14 L5,-18 M0,1 V-8 M-5,-4 L0,-8 L5,-4"/><circle class="device-led" cx="27" cy="12" r="2"/><path class="device-detail" d="M-28,12 H-10"/>';
    if (type === 'sfp') return '<path class="device-top" d="M-24,-13 L-16,-20 H19 L25,-13 Z"/><rect class="device-body" x="-24" y="-13" width="49" height="29" rx="2"/><rect class="device-port" x="11" y="-8" width="10" height="18" rx="1"/><path class="device-detail" d="M-17,-5 H3 M-17,1 H3 M-17,7 H3 M-20,16 V21 H4 V16"/>';
    if (type === 'poe') return '<rect class="device-body" x="-25" y="-19" width="50" height="38" rx="6"/><rect class="device-port" x="-29" y="-5" width="8" height="12"/><rect class="device-port" x="21" y="-5" width="8" height="12"/><path class="device-power" d="M2,-13 L-7,2 H0 L-3,13 L9,-4 H2 Z"/><path class="device-detail" d="M-10,20 V27"/>';
    if (type === 'antenna') return '<g transform="scale('+facing+' 1)"><path class="device-body" d="M-13,-25 Q34,-1 -13,20 Q0,-1 -13,-25 Z"/><path class="device-detail" d="M0,-1 L25,-1 M-5,14 V26 M-19,27 H10"/><circle class="device-led" cx="26" cy="-1" r="3"/><path class="device-radio-mark" d="M33,-12 Q43,-1 33,10 M39,-19 Q56,-1 39,17"/></g>';
    return '';
  }
  function signal(type, animate, mobile, costs, selectedRoute) {
    const w = mobile ? 360 : 640, left = 56, right = w-56, y = 90;
    const medium = ['fiber','sfp'].includes(type) ? 'fiber' : ['radio','antenna'].includes(type) ? 'radio' : ['copper','lan','poe','radio-wire'].includes(type) ? 'copper' : 'logic';
    const movement = (path, delay=0) => animate ? '<animateMotion path="'+path+'" dur="2.8s" begin="'+(-delay)+'s" repeatCount="indefinite"/>' : '';
    const endpoint = (key,x,face=1) => '<g class="demo-device" transform="translate('+x+' '+y+')">'+device(key,face)+'</g>';
    let body = '';
    if (medium !== 'logic') {
      const endType = medium === 'fiber' ? 'sfp' : medium === 'radio' ? 'antenna' : type === 'poe' ? 'poe' : 'router';
      const start = left+36, end = right-36;
      body += '<path class="signal-channel '+medium+'-channel" d="M'+start+','+y+' H'+end+'"/>';
      if (medium === 'fiber') {
        body += '<circle class="fiber-lamp" cx="'+start+'" cy="'+y+'" r="8"/>';
        for (let i=0;i<3;i++) body += '<circle class="light-pulse" cx="'+(animate ? 0 : start+(end-start)*(i+1)/4)+'" cy="'+(animate ? 0 : y)+'" r="6">'+movement('M'+start+','+y+' H'+end, i*.8)+'</circle>';
      } else if (medium === 'copper') {
        const levels = [0,1,-1,2,-2,1,0,-1,2,0,-2,1], step = (end-start)/levels.length;
        let wave = 'M'+start+','+y;
        levels.forEach((level,i) => { wave += ' H'+(start+i*step)+' V'+(y-level*9)+' H'+(start+(i+1)*step); });
        body += '<path class="electrical-wave" d="'+wave+'"/>';
        body += '<circle class="electrical-pulse" cx="'+(animate ? 0 : (start+end)/2)+'" cy="'+(animate ? 0 : y)+'" r="6">'+movement(wave)+'</circle>';
        if (type === 'poe') body += '<path class="power-line" d="M'+start+',151 H'+end+'"/><text class="demo-label" x="'+w/2+'" y="181">Napájanie PoE + dáta</text>';
      } else {
        let wave = 'M'+start+','+y;
        const symbols=[1,0,1,1,0,0,1,0];
        for (let x=start;x<=end;x+=3) {
          const amplitude = symbols[Math.min(7,Math.floor((x-start)/(end-start)*8))] ? 15 : 7;
          wave += ' L'+x+','+(y+Math.sin((x-start)/7)*amplitude);
        }
        body += '<path class="radio-wave" d="'+wave+'"/>';
        for (let i=0;i<3;i++) body += '<circle class="radio-ring ring-'+i+'" cx="'+(start+8)+'" cy="'+y+'" r="'+(14+i*12)+'"/>';
        body += '<circle class="radio-pulse" cx="'+(animate?0:(start+end)/2)+'" cy="'+(animate?0:y)+'" r="5">'+movement('M'+start+','+y+' H'+end)+'</circle>';
      }
      body += endpoint(endType,left) + endpoint(endType,right,-1);
      const names = medium === 'fiber' ? ['SFP A','SFP B'] : medium === 'radio' ? ['Rádio A','Rádio B'] : type === 'poe' ? ['PoE','Zariadenie'] : ['Vysielač','Prijímač'];
      body += '<text class="demo-label" x="'+left+'" y="140">'+names[0]+'</text><text class="demo-label" x="'+right+'" y="140">'+names[1]+'</text>';
    } else if (type === 'pc') {
      const path='M'+left+','+y+' H'+right;
      body += '<path class="logic-wire chosen" d="'+path+'"/>'+endpoint('pc',left);
      body += '<g transform="translate('+right+' '+y+') scale(.65)">'+device('access')+'</g>';
      body += '<text class="demo-label" x="'+left+'" y="140">PC</text><text class="demo-label" x="'+right+'" y="140">Switch</text><text class="demo-label" x="'+w/2+'" y="55">Rámec → signál</text>';
      body += '<rect class="logic-packet" x="'+(animate?-6:w/2-6)+'" y="'+(animate?-5:y-5)+'" width="12" height="10" rx="2">'+movement(path)+'</rect>';
    } else {
      const center=w/2, nodeType=type==='building'?'access':type;
      const selected = type==='router' ? ['fiber','copper','radio'].indexOf(selectedRoute) : 1;
      const ys=[40,90,140], labels=type==='router'?['Optika','Meď','Rádio']:['Port 1','Port 2','Port 3'];
      body += '<path class="logic-wire" d="M'+left+','+y+' H'+center+'"/>';
      for(let i=0;i<3;i++) body += '<path class="logic-wire '+(i===selected?'chosen':'')+'" d="M'+center+','+y+' L'+(right-15)+','+ys[i]+'"/><text class="demo-label" x="'+right+'" y="'+(ys[i]+25)+'">'+labels[i]+'</text>';
      const path='M'+left+','+y+' H'+center+(selected<0?'':' L'+(right-15)+','+ys[selected]);
      body += endpoint('pc',left) + endpoint(nodeType,center);
      body += '<rect class="logic-packet" x="'+(animate?-6:center-6)+'" y="'+(animate?-5:y-5)+'" width="12" height="10" rx="2">'+movement(path)+'</rect>';
    }
    return { medium, svg:'<svg viewBox="0 0 '+w+' 205" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+({fiber:'Svetelné impulzy v optickom vlákne',copper:'Elektrický signál v medenom kábli',radio:'Modulovaný rádiový signál medzi anténami',logic:'Spracovanie dát v zariadení'}[medium])+'">'+body+'</svg>' };
  }
  window.BuildingsVisuals = { device, signal };
})();
