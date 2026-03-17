const prisma = require('@prisma/client');
console.log('Decimal export:', !!prisma.Decimal);
console.log('Prisma.Decimal:', prisma.Prisma ? !!prisma.Prisma.Decimal : 'No Prisma object');
console.log('Decimal is Prisma.Decimal:', prisma.Decimal === (prisma.Prisma && prisma.Prisma.Decimal));
