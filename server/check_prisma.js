const prisma = require('@prisma/client');
console.log('Exports:', Object.keys(prisma));
console.log('Prisma.Decimal:', prisma.Prisma ? !!prisma.Prisma.Decimal : 'No Prisma object');
