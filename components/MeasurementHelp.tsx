import SeeMore from './SeeMore';
import {measurementFor} from '../lib/measurements';
export default function MeasurementHelp({signal}:{signal:string}){const m=measurementFor(signal);return <div className="measurement-help"><p className="panel-sub"><strong>{m.label}</strong> · {m.unit} · recorded values</p><SeeMore label="Meaning and units"><p>{m.meaning}</p><p>{m.why}</p></SeeMore></div>;}
