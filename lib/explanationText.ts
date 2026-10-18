// Presentation only: preserve the provider's words, never infer new findings.
export function explanationSections(text:string){
 const paragraphs=text.trim().split(/\n\s*\n|\n(?=\s*(?:#{1,6}\s|[-*•]\s|\d+[.)]\s))/).filter(Boolean);
 return paragraphs.flatMap(paragraph=>{
  const sentences=paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/);
  if(paragraph.length<550||sentences.length<2)return [paragraph.trim()];
  const chunks:string[]=[];let chunk='';
  for(const sentence of sentences){if(chunk&&chunk.length+sentence.length>420){chunks.push(chunk.trim());chunk='';}chunk+=(chunk?' ':'')+sentence;}
  if(chunk.trim())chunks.push(chunk.trim());return chunks;
 });
}
