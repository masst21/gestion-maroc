const {PrismaClient}=require('@prisma/client');
const bcrypt=require('bcryptjs');
const p=new PrismaClient();
(async()=>{const password=await bcrypt.hash('Synthetic-test-password-123!',10);
 for(const [id,storeId,email] of [['test-admin','test-store','catalog-test@example.invalid'],['test-admin-other','test-store-two','catalog-other@example.invalid']]){
 await p.user.create({data:{id,storeId,email,password,fullName:'Synthetic admin',role:'admin'}});
 }
 await p.article.create({data:{id:'test-article',storeId:'test-store',reference:'LEGACY',name:'Synthetic existing article',barcode:'000123456789',salePriceHt:10,vatRate:20,stockQty:5}});
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>p.$disconnect());
