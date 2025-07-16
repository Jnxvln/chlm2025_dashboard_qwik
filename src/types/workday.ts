import type { Prisma } from '@prisma/client';

export type Workday = Prisma.WorkdayGetPayload<{
  include: {
    driver: true;
    createdBy: true;
    hauls: true;
  };
}>;
