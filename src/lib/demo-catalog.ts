import { propertySchema } from './domain';
import { demoPhotos } from './demo-photos';
const fixtures = [
 ['kanchi-family-home','House','Kanchipuram','Kanchipuram',6800000,1450,3],
 ['oragadam-residential-plot','Residential Plot','Oragadam','Kanchipuram',2400000,1200,0],
 ['chengalpattu-corner-plot','Residential Plot','Chengalpattu','Chengalpattu',3600000,1800,0],
 ['coimbatore-garden-villa','Villa','Coimbatore','Coimbatore',9200000,2200,3],
 ['chennai-omr-apartment','Apartment','OMR, Chennai','Chennai',5800000,1100,2],
 ['madurai-family-apartment','Apartment','Madurai','Madurai',4600000,980,2],
 ['uthiramerur-farmland','Farmland','Uthiramerur','Kanchipuram',4200000,43560,0],
 ['tirunelveli-courtyard-villa','Villa','Tirunelveli','Tirunelveli',7400000,1850,3],
] as const;
export const tamilNaduDemos = fixtures.map(([slug,category,location,district,price,area,bedrooms], i) => propertySchema.parse({
 title: ['Kanchi Family Home','Oragadam Residential Plot','Chengalpattu Corner Plot','Coimbatore Garden Villa','OMR Family Apartment','Madurai Family Apartment','Uthiramerur Open Farmland','Tirunelveli Courtyard Villa'][i],
 slug:'demo-tn-'+slug,category,location,city:location,district,price,area,unit:'sq ft',bedrooms,bathrooms:bedrooms?2:0,
 description:'DEMONSTRATION LISTING — A fictional Tamil Nadu property for exploring this website. Price, dimensions, amenities and location details are sample data, not a property offered for sale. The real regional reference photographs do not depict this listing. Contact SS Regalis Realty for verified current properties.',
 demo:true,featured:i<3,status:'Available',images:demoPhotos[category]||[],
 amenities:bedrooms?'Covered parking\nWater supply\nTerrace access':'Road access\nOpen surroundings',
 specifications:bedrooms?'Sample configuration: practical family layout, naturally ventilated rooms and tiled flooring. All specifications are illustrative.':'Sample land details: level terrain and road access. Dimensions, approvals and utilities must be verified for any real listing.',
 advantages:'Tamil Nadu location reference only. Nearby schools, transport and hospitals must be checked against actual property information.',
 floorPlans:[{type:bedrooms?`${bedrooms} BHK`:'Land parcel',area,price,url:''}],
}));
