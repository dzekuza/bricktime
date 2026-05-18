export type MerchType = 'hoodie' | 't-shirt'
export type MerchStatus = 'active' | 'draft' | 'coming-soon'

export interface MerchItem {
  id: string
  name: string
  type: MerchType
  price: number
  sizes: string[]
  stock: number
  status: MerchStatus
  description: string
  bg: string
}

export const merch: MerchItem[] = [
  {
    id: 'hoodie-classic',
    name: 'BRICKTIME Classic Hoodie',
    type: 'hoodie',
    price: 49,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 0,
    status: 'coming-soon',
    description: 'Unisex džemperis su gobtuvu. 100% medvilnė, oversized fit. BRICKTIME logo ant krūtinės.',
    bg: '#001B21',
  },
  {
    id: 'tshirt-brick',
    name: 'BRICKTIME Brick Tee',
    type: 't-shirt',
    price: 29,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 0,
    status: 'coming-soon',
    description: 'Klasikiniai marškinėliai. 100% medvilnė, regular fit. Brick logotipas ant nugaros.',
    bg: '#FFD731',
  },
]
