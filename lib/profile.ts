export function username(value:string){
 const name=value.trim().toLowerCase();
 if(!/^[a-z][a-z0-9_]{2,23}$/.test(name))throw new Error('Use 3–24 characters: start with a letter, then letters, numbers or underscores.');
 return name;
}
export function displayName(value:string){
 const name=value.normalize('NFKC').replace(/\s+/g,' ').trim();
 if(!name||name.length>60||/[\p{Cc}\p{Cf}<>]/u.test(name))throw new Error('Enter a name between 1 and 60 characters.');
 return name;
}
