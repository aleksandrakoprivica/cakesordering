import { create } from 'zustand'

export type CartItem = {
    key: string // unique per cake+variant (or bento)
    cakeId: string
    cakeName: string
    variantId?: string | null
    sizeLabel?: string | null
    unitPriceRsd: number
    qty: number
}

type CartState = {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'qty'>) => void
    removeItem: (key: string) => void
    setQty: (key: string, qty: number) => void
    clear: () => void
}

export const useCart = create<CartState>((set, get) => ({
    items: [],
    addItem: (item) => {
        const existing = get().items.find((x) => x.key === item.key)
        if (existing) {
            set({
                items: get().items.map((x) => (x.key === item.key ? { ...x, qty: x.qty + 1 } : x)),
            })
        } else {
            set({ items: [...get().items, { ...item, qty: 1 }] })
        }
    },
    removeItem: (key) => set({ items: get().items.filter((x) => x.key !== key) }),
    setQty: (key, qty) =>
        set({
            items:
                qty <= 0
                    ? get().items.filter((x) => x.key !== key)
                    : get().items.map((x) => (x.key === key ? { ...x, qty } : x)),
        }),
    clear: () => set({ items: [] }),
}))
