export type MerchType = 'hoodie' | 't-shirt'
export type MerchStatus = 'active' | 'draft'

export interface MerchItem {
  id: string
  name: string
  type: MerchType
  price: number
  sizes: string[]
  stock: number
  status: MerchStatus
  created_at: string
}

export const mockMerch: MerchItem[] = [
  {
    id: '1',
    name: 'BRICKTIME Classic Hoodie',
    type: 'hoodie',
    price: 49,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 0,
    status: 'draft',
    created_at: '2026-05-18T00:00:00Z',
  },
  {
    id: '2',
    name: 'BRICKTIME Brick Logo Tee',
    type: 't-shirt',
    price: 29,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 0,
    status: 'draft',
    created_at: '2026-05-18T00:00:00Z',
  },
]
