import { $Enums } from '@prisma/client';
console.log('Enums:', Object.keys($Enums));
if ($Enums.BudgetPeriodType) {
  console.log('BudgetPeriodType exists in $Enums');
} else {
  console.log('BudgetPeriodType MISSING in $Enums');
}
