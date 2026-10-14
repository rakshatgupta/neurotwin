import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://127.0.0.1:3001';
for(const [path,method] of [['/api/data/','GET'],['/api/data/','POST'],['/api/data/','DELETE'],['/api/insights/','POST'],['/api/export/','GET'],['/api/account/','DELETE']]){
 const response=await fetch(origin+path,{method,headers:method==='POST'||method==='DELETE'?{'Content-Type':'application/json'}:{},body:method==='POST'||method==='DELETE'?'{}':undefined});
 assert.equal(response.status,401,`${method} ${path} must reject signed-out access`);
 assert.match(response.headers.get('cache-control')||'',/no-store/,'Private API responses must never be cached');
 const content=await response.json();assert(!('checkins' in content),'Signed-out response must not contain health data');
 console.log(`PASS ${method} ${path}: signed-out access denied, private response not cached`);
}
for(const path of ['/','/account/','/home/']){const response=await fetch(origin+path);assert.equal(response.status,200,`Public page ${path} must load`);console.log(`PASS public page ${path}`);}
