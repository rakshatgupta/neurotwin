'use client';
import {useId,useState,type ReactNode} from 'react';
export default function SeeMore({children,label='How this works'}:{children:ReactNode;label?:string}) {
 const [open,setOpen]=useState(false),id=useId();
 return <div className="explanation"><button type="button" className="disclosure-button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}><span>{open?'See less':'See more'}</span><span className="explanation-label"> · {label}</span><span aria-hidden="true">{open?' −':' +'}</span></button><div id={id} className="explanation-content" hidden={!open}>{children}</div></div>;
}
