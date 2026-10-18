export const measurements:Record<string,{label:string;unit:string;meaning:string;why:string}>={
 sleep:{label:'Sleep duration',unit:'hours',meaning:'Time you reported being asleep, not time spent in bed.',why:'Hours make nightly duration easy to read; 0.5 hours is 30 minutes.'},
 activity:{label:'Physical activity',unit:'minutes',meaning:'Daily movement duration you entered or imported.',why:'Minutes describe duration. This is not steps, calories or exercise intensity.'},
 stress:{label:'Reported stress',unit:'points out of 10',meaning:'Your own stress rating from 0 (lowest) to 10 (highest).',why:'A consistent rating scale helps compare your entries; it is not a clinical measurement.'},
 reaction_ms:{label:'Reaction time',unit:'ms',meaning:'Median response delay in the five-trial browser task.',why:'Milliseconds show short response times precisely: 1,000 ms equals one second. Lower means faster responses, not better brain health.'},
 memory_accuracy:{label:'Recall accuracy',unit:'%',meaning:'Percentage of correctly recalled digits in this task.',why:'Percent expresses the share correct out of 100. It is task performance, not overall memory capacity.'},
 voice:{label:'Recording level',unit:'RMS (unitless)',meaning:'Average root-mean-square amplitude of normalized microphone samples.',why:'RMS summarizes signal amplitude. It is not decibels or a neurological score; distance, device and surroundings affect it.'},
};
export function measurementFor(signal:string){const keys:Record<string,string>={'Sleep':'sleep','Activity':'activity','Stress':'stress','Reaction time':'reaction_ms','Recall accuracy':'memory_accuracy','Recording level':'voice'};return measurements[keys[signal]||signal]||measurements.sleep;}
