import type { ItemToCategoryModel } from '../models';

export type ItemToCategoryContract = Pick<ItemToCategoryModel, 'itemId' | 'categoryId'>;
