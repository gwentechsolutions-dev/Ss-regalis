import snapshot from './demo-data.json';
import { defaults, type Property, type Settings, units } from './domain';
export function databaseFreeDemo() { return process.env.NEXT_PUBLIC_DATABASE_FREE_DEMO === 'true'; }
export function demoSettings(): Settings { return { ...defaults, ...snapshot.settings }; }
export function demoProperties(params: Record<string,string|undefined>) {
 let rows = (snapshot.properties as unknown as Property[]).filter(p => p.status !== 'Hidden');
 for (const key of ['category','status','facing','furnishing','construction'] as const) if(params[key]) rows=rows.filter(p=>String(p[key])===params[key]);
 for(const key of ['parking','water','electricity','approvalVerified','featured'] as const) if(params[key]) rows=rows.filter(p=>String(p[key])===params[key]);
 for(const key of ['road','amenities','approvals','location'] as const) if(params[key]) rows=rows.filter(p=>String(p[key]).toLowerCase().includes(params[key]!.toLowerCase()));
 if(params.q) rows=rows.filter(p=>(p.title+' '+p.location).toLowerCase().includes(params.q!.toLowerCase()));
 if(params.approvals) rows=rows.filter(p=>p.approvalVerified);
 for(const [key,col,min] of [['minPrice','price',true],['maxPrice','price',false],['minArea','areaSqft',true],['maxArea','areaSqft',false],['bedrooms','bedrooms',true],['bathrooms','bathrooms',true]] as const) if(params[key] && Number.isFinite(Number(params[key]))) {const n=Number(params[key])*(key.includes('Area')?(units[params.unit as keyof typeof units]||1):1);rows=rows.filter(p=>min?p[col]>=n:p[col]<=n);}
 const sort=params.sort||'newest'; rows.sort((a,b)=>{const col=sort.startsWith('price')?'price':sort.startsWith('area')?'areaSqft':sort==='bedrooms'?'bedrooms':'createdAt';const diff=typeof a[col]==='number'?Number(a[col])-Number(b[col]):String(a[col]).localeCompare(String(b[col]));return diff*(sort.endsWith('asc')||sort==='oldest'?1:-1)});
 const total=rows.length,pages=Math.ceil(total/12),page=Math.max(1,Math.min(Number(params.page)||1,Math.max(1,pages)));
 return {properties:rows.slice((page-1)*12,page*12),total,pages,page};
}
