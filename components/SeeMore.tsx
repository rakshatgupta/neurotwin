import type {ReactNode} from 'react';
export default function SeeMore({children,label='How this works'}:{children:ReactNode;label?:string}) {
 return <details className="explanation"><summary><span className="when-closed">See more</span><span className="when-open">See less</span><span className="explanation-label"> · {label}</span></summary><div className="explanation-content">{children}</div></details>;
}
