/** Projection onto the interior of a fixed statistical reference interval.
 * Computational counterfactual only: no physiological causal effects assumed. */
export type ReferenceInput={name:string;latest:number;baseline:number;deviation:number;unit:string;fresh:boolean};
const bounds:Record<string,[number,number]>={Sleep:[0,24],Activity:[0,1440],Stress:[0,10],Steps:[0,200000],'Reaction time':[1,10000],'Recall accuracy':[0,100],'Recording level':[0,1]};
export function referenceProjection(f:ReferenceInput){
 if(!f.fresh||![f.latest,f.baseline,f.deviation].every(Number.isFinite)||Math.abs(f.deviation)<2.5)return null;
 const spread=(f.latest-f.baseline)/f.deviation;
 if(!(spread>0)||!bounds[f.name])return null;
 // 2.49 gives an attainable interior point; at exactly 2.5 the flag stays on.
 const [min,max]=bounds[f.name],low=Math.max(min,f.baseline-2.49*spread),high=Math.min(max,f.baseline+2.49*spread);
 if(low>high)return null;
 const projected=Math.min(high,Math.max(low,f.latest));
 return {name:f.name,current:f.latest,projected,change:projected-f.latest,unit:f.unit,spread,low,high,deviationAfter:(projected-f.baseline)/spread};
}
