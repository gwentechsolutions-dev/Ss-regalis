import {test,expect} from '@playwright/test';

test('subtle reveal runs once when scrolling; navigation and layout remain usable',async({page})=>{
 await page.setViewportSize({width:1440,height:650});
 await page.addInitScript(()=>{
   localStorage.setItem('regalis-intro','seen');
   const animate=Element.prototype.animate;
   (window as any).__reveals=[];
   Element.prototype.animate=function(frames,options){
     if(typeof options==='object'&&options.duration===600)(window as any).__reveals.push(this.className);
     return animate.call(this,frames,options);
   };
 });
 await page.goto('/');
 const card=page.locator('.category-card').first();
 await card.scrollIntoViewIfNeeded();
 await expect.poll(()=>page.evaluate(()=>(window as any).__reveals.filter((s:string)=>s.includes('category-card')).length)).toBeGreaterThan(0);
 await page.waitForTimeout(850);
 const count=await page.evaluate(()=>(window as any).__reveals.length);
 await page.evaluate(()=>scrollTo(0,0));
 await card.scrollIntoViewIfNeeded();
 await page.waitForTimeout(150);
 expect(await page.evaluate(()=>(window as any).__reveals.length)).toBe(count);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/about');
 await expect(page.locator('main h1')).toBeVisible();
 await page.goto('/contact');
 await expect(page.locator('main h1')).toBeVisible();
});

test('reduced motion and JavaScript-free pages keep all content visible',async({browser})=>{
 for(const javascript of [true,false]){
   const context=await browser.newContext({reducedMotion:'reduce',javaScriptEnabled:javascript});
   const page=await context.newPage();
   await page.goto('/');
   const card=page.locator('.category-card').first();
   await card.scrollIntoViewIfNeeded();
   await expect(card).toHaveCSS('opacity','1');
   if(javascript)expect(await card.evaluate(el=>el.getAnimations().length)).toBe(0);
   await context.close();
 }
});
