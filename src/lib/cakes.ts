import { supabase } from './supabase'

export type Category = {
    id: string
    name: string
    slug: string
}

export type CakeSize = {
    id: string
    name: string
    code: string
    sort_order: number
}

export type CakeVariant = {
    price_cents(price_cents: any): string
    id: string
    price_rsd: number
    is_available: boolean
    cake_sizes: CakeSize
}

export type Cake = {
    id: string
    name: string
    ingredients: string | null
    base_price_rsd: number | null
    is_bento: boolean
    is_available: boolean
    categories: Category | null
    cake_variants: CakeVariant[]
}

export async function fetchCakes(
    categorySlug: 'classic' | 'bento'
): Promise<Cake[]> {
    const { data, error } = await supabase
        .from('cakes')
        .select(
            `
      id,name,ingredients,base_price_rsd,is_bento,is_available,created_at,
      categories ( id,name,slug ),
      cake_variants (
        id,price_rsd,is_available,
        cake_sizes ( id,name,code,sort_order )
      )
    `
        )
        .eq('is_available', true)
        .eq('categories.slug', categorySlug)
        .order('created_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map((cake: any) => ({
        ...cake,
        cake_variants: (cake.cake_variants ?? [])
            .filter((v: any) => v.is_available)
            .sort(
                (a: any, b: any) =>
                    (a.cake_sizes?.sort_order ?? 0) - (b.cake_sizes?.sort_order ?? 0)
            ),
    }))
}
