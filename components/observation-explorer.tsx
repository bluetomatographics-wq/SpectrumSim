'use client';
import { useEffect, useState } from 'react';
import { observations } from '@/lib/observations';

export function ObservationExplorer({onExperiment}:{onExperiment:()=>void}) {
 const [selected,setSelected]=useState(0),[split,setSplit]=useState(50),[revealed,setRevealed]=useState(false);
 const [failed,setFailed]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{const read=()=>{const id=location.hash.split('/')[1];const i=observations.findIndex(o=>o.id===id);if(i>=0){setSelected(i);setRevealed(false);setSplit(50);setFailed(false);}};read();window.addEventListener('hashchange',read);return()=>window.removeEventListener('hashchange',read);},[]);
 const scene=observations[selected];
 function select(i:number){setSelected(i);setRevealed(false);setSplit(50);setFailed(false);setStatus('');history.replaceState(null,'','#observe/'+observations[i].id);}
 async function share(){try{await navigator.clipboard.writeText(location.href);setStatus('Comparison link copied.');}catch{setStatus('Copy the address from your browser to share this comparison.');}}
 return <section className="learning-workspace" aria-label="Real image comparisons">
  <div className="lesson-picker" aria-label="Choose an observation">{observations.map((o,i)=><button key={o.id} onClick={()=>select(i)} aria-pressed={selected===i}><span className="lesson-number">0{i+1}</span><span><strong>{o.object}</strong><small>{o.rightLabel.split(' · ')[0]}</small></span></button>)}</div>
  <div className="learning-grid">
   <div className="observation-panel">
    <div className="lesson-title"><span className="eyebrow">REAL OBSERVATIONS</span><h2>{scene.title}</h2><p>{scene.prompt}</p></div>
    <div className="observation-frame" key={scene.id} role="img" aria-label={`${scene.object}: ${scene.leftLabel} on the left, ${scene.rightLabel} on the right. ${split}% visible view.`} onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();setSplit(Math.round(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100))));}} onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const r=e.currentTarget.getBoundingClientRect();setSplit(Math.round(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100))));}}>
     <img src={scene.right} alt="" draggable={false} width={1280} height={720} onError={()=>setFailed(true)} fetchPriority="high"/>
     <img src={scene.left} alt="" draggable={false} width={1280} height={720} style={{clipPath:`inset(0 ${100-split}% 0 0)`}} onError={()=>setFailed(true)} fetchPriority="high"/>
     <div className="observation-divider" style={{left:split+'%'}}><span>↔</span></div>
     {split>10&&<span className="capture-label capture-left">{scene.leftLabel}</span>}{split<90&&<span className="capture-label capture-right">{scene.rightLabel}</span>}
     {failed&&<p className="capture-error" role="alert">An observation could not be loaded. Reload the page or open the original source below.</p>}
    </div>
    <label className="comparison-range"><span>Reveal each observation <output>{split}% visible</output></span><input type="range" min="0" max="100" value={split} onChange={e=>setSplit(Number(e.target.value))} aria-label="Observation comparison divider"/><span className="range-ends"><span>All {scene.rightLabel.split(' · ')[0].toLowerCase()}</span><span>All visible</span></span></label>
    <div className="comparison-actions"><button className="tool-button" onClick={()=>setSplit(0)}>Other wavelength</button><button className="tool-button" onClick={()=>setSplit(50)}>Compare</button><button className="tool-button" onClick={()=>setSplit(100)}>Visible</button><button className="text-tool" onClick={share}>Copy comparison link ↗</button></div>
    <p className="tool-help" role="status">{status}</p>
    <p className="capture-credit">{scene.credit}. <a href={scene.source} target="_blank" rel="noreferrer">Source and full observation details ↗</a></p>
   </div>
   <aside className="lesson-notes">
    <span className="eyebrow">A TWO-MINUTE DISCOVERY</span><h3>{scene.question}</h3>
    <p>Move the divider before revealing the explanation. Name one feature that changes.</p>
    <button className="upload-button" aria-expanded={revealed} onClick={()=>setRevealed(!revealed)}>{revealed?'Hide explanation':'Reveal explanation'}</button>
    {revealed&&<div className="lesson-answer"><p>{scene.answer}</p><strong>{scene.lesson}</strong></div>}
    <div className="legend-note"><h4>What do the colors mean?</h4><p>{scene.colors}</p></div>
    <details><summary>About these captures</summary><p>{scene.context}</p><p>Resized and compressed for this app; no AI reconstruction or simulated bands. These are processed outreach images, not calibrated measurement files.</p></details>
    <button className="text-tool" onClick={onExperiment}>Next: try a guided experiment →</button>
   </aside>
  </div>
 </section>;
}
