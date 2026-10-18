import SeeMore from './SeeMore';
import {explanationSections} from '../lib/explanationText';
function formatted(text:string){return text.split(/(\*\*[^*]+\*\*)/g).map((part,index)=>part.startsWith('**')&&part.endsWith('**')?<strong key={index}>{part.slice(2,-2)}</strong>:part);}
export default function ExplanationText({text,label}:{text:string;label:string}){
 const sections=explanationSections(text);
 return <SeeMore label={label}><div className="explanation-sections">{sections.map((section,index)=><div className="explanation-section" key={index}><span className="explanation-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><p>{formatted(section)}</p></div>)}</div></SeeMore>;
}
