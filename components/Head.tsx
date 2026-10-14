'use client';
import { useState } from 'react';
import { Moon, Music2, Flower2, Orbit, Sparkles, Zap, MoveUpRight } from 'lucide-react';
import Link from 'next/link';
export default function Head({ small = false }: { small?: boolean }) {
 const [open,setOpen] = useState(false);
 return <div className={`head-scene ${open?'is-open':''} ${small?'small':''}`} onPointerEnter={()=>setOpen(true)} onPointerLeave={(e)=>{if(e.pointerType==='mouse')setOpen(false)}} onPointerDown={()=>setOpen(true)} onFocus={()=>setOpen(true)}>
 <div className="scene-halo"/><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/>
 <svg className="head-art" viewBox="0 0 600 640" role="img" aria-label="Sculptural human head that opens to reveal a brain">{/* taste-skill-ignore: shadows model the depth of the user-requested head illustration, not interface decoration. */}
 <defs><linearGradient id="skin" x1="0" y1="0" x2="1" y2=".6"><stop stopColor="#d8d3ed"/><stop offset=".28" stopColor="#eef0f7"/><stop offset=".6" stopColor="#aebbd7"/><stop offset="1" stopColor="#718fa7"/></linearGradient><linearGradient id="neck" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#8a9bb9"/><stop offset=".42" stopColor="#d9dced"/><stop offset="1" stopColor="#8aacc0"/></linearGradient><linearGradient id="top" x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#f0edf8"/><stop offset=".55" stopColor="#c8c9e2"/><stop offset="1" stopColor="#9caec8"/></linearGradient><radialGradient id="ear"><stop stopColor="#8293b2"/><stop offset=".55" stopColor="#b5bfd6"/><stop offset="1" stopColor="#d8dced"/></radialGradient><filter id="shadow"><feGaussianBlur stdDeviation="12"/></filter><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="4"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".035"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>{/* taste-skill-ignore: SVG lighting is intrinsic to the sculptural artwork requested by the user. */}
 <ellipse cx="314" cy="598" rx="140" ry="15" fill="#526e5b" opacity=".15" filter="url(#shadow)"/>
 <g filter="url(#grain)">
 <path d="M237 397 C251 441 253 488 239 518 C224 539 193 548 171 572 Q277 605 407 575 C384 550 354 538 344 516 Q330 480 341 423Z" fill="url(#neck)"/>
 <path d="M164 224 C149 277 152 341 182 384 C203 421 243 447 290 452 C320 456 339 445 367 437 C391 434 412 421 416 405 Q421 395 414 384 L416 374 Q434 369 423 359 L416 352 Q417 338 431 333 C445 334 452 329 448 322 L427 291 Q421 280 426 266 L424 224Z" fill="url(#skin)"/>
 <path d="M274 314 C273 289 259 277 246 287 C231 298 237 331 251 344 C268 352 277 332 274 314Z" fill="url(#ear)"/>
 <path d="M258 331 C248 324 246 305 255 300 Q267 300 267 316 L258 321" fill="none" stroke="#8a9dba" strokeWidth="3.5" strokeLinecap="round"/>
 <path d="M391 278 Q404 274 420 281" fill="none" stroke="#8c9cb6" strokeWidth="4" strokeLinecap="round"/>
 <path d="M396 287 Q408 292 418 286" fill="none" stroke="#617d96" strokeWidth="2.5" strokeLinecap="round"/>
 <path d="M425 333 L432 331 M416 369 Q423 368 426 366" stroke="#6c89a3" strokeWidth="2" strokeLinecap="round"/>
 <path d="M280 377 Q308 414 364 418" fill="none" stroke="#e9edf5" strokeWidth="2" opacity=".4"/>
 <ellipse cx="294" cy="224" rx="130" ry="24" fill="#9faecb"/><ellipse cx="294" cy="224" rx="117" ry="16" fill="#5b708e"/>
 <g className="head-lid"><path d="M164 224 C154 152 198 86 270 77 C353 62 422 119 424 224 Q294 260 164 224Z" fill="url(#top)"/><ellipse cx="294" cy="224" rx="130" ry="22" fill="#a6b5ce"/><path d="M176 218 Q294 250 412 218" fill="none" stroke="#f0f1fa" strokeWidth="2.5" opacity=".7"/></g></g>
 </svg>
 <div className="floating moon"><Moon size={39} fill="currentColor"/></div><div className="floating music"><Music2 size={35}/></div><div className="floating flower"><Flower2 size={43}/></div><div className="floating spark"><Sparkles size={35}/></div><div className="floating bolt"><Zap size={35} fill="currentColor"/></div><div className="floating planet"><Orbit size={45}/></div>
 <Link href="/home/" className="brain" aria-label="Enter your NeuroTwin dashboard" onFocus={()=>setOpen(true)}>
 <svg viewBox="0 0 210 160" aria-hidden="true"><defs><linearGradient id="braincolor" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#ffc4b1"/><stop offset=".45" stopColor="#f89b8c"/><stop offset="1" stopColor="#d76e78"/></linearGradient><filter id="brainshadow"><feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#8c4d43" floodOpacity=".23"/></filter></defs>{/* taste-skill-ignore: SVG lighting and cast shadows are intrinsic to the requested sculptural head and floating brain artwork. */}<g filter="url(#brainshadow)"><path d="M101 20 C81 5 60 17 54 31 C28 23 14 43 20 62 C4 76 12 95 24 100 C22 122 43 134 60 128 C66 146 90 149 105 133 C118 151 143 144 150 127 C172 134 190 116 185 100 C202 83 193 61 182 55 C185 35 166 22 147 29 C136 9 115 9 101 20Z" fill="url(#braincolor)"/><g fill="none" stroke="#b96b6b" strokeWidth="4" strokeLinecap="round"><path d="M104 24 Q97 49 104 73 L104 128 M54 34 Q68 37 63 51 Q50 65 36 55 M25 65 Q46 62 42 79 Q30 93 42 105 M63 52 Q86 44 87 65 Q76 75 80 89 M51 86 Q63 72 67 91 Q61 116 80 118 M25 108 Q44 118 53 108 M86 32 Q74 23 71 35 M148 32 Q137 42 150 53 Q169 64 175 48 M118 36 Q133 31 136 50 Q126 66 121 58 M119 82 Q127 68 146 73 Q164 80 150 97 M180 63 Q164 67 172 85 M177 105 Q162 102 164 116 M123 103 Q137 98 139 115 Q128 130 118 120"/></g><path d="M99 22 Q98 81 104 133" fill="none" stroke="#ffd5b9" strokeWidth="3"/></g></svg><span>Enter your twin <MoveUpRight size={16}/></span></Link>
 {!small&&<div className="scene-note"><span className="tiny-dot"/> Hover to open your mind</div>}
 </div>
}
