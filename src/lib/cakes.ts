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
    try {
        // First, get the category to find its ID
        const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single()

        if (categoryError) {
            console.error('Category fetch error:', categoryError)
            throw categoryError
        }
        if (!categoryData || !categoryData.id) {
            console.warn(`Category with slug "${categorySlug}" not found`)
            return []
        }

        const categoryId = categoryData.id

        // Always use client-side filtering for reliability
        // Fetch all available cakes with their categories
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
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Cakes fetch error:', error)
            throw error
        }

        // Filter by category on the client side
        const filteredCakes = (data ?? [])
            .filter((cake: any) => {
                const category = cake.categories
                return category && category.id === categoryId
            })
            .map((cake: any) => ({
                id: cake.id || '',
                name: cake.name || '',
                ingredients: cake.ingredients ?? null,
                base_price_rsd: cake.base_price_rsd ?? null,
                is_bento: Boolean(cake.is_bento),
                is_available: Boolean(cake.is_available),
                categories: cake.categories || null,
                cake_variants: (cake.cake_variants ?? [])
                    .filter((v: any) => v && v.is_available && v.cake_sizes != null)
                    .map((v: any) => ({
                        id: v.id || '',
                        price_rsd: v.price_rsd || 0,
                        is_available: Boolean(v.is_available),
                        cake_sizes: v.cake_sizes ? {
                            id: v.cake_sizes.id || '',
                            name: v.cake_sizes.name || '',
                            code: v.cake_sizes.code || '',
                            sort_order: v.cake_sizes.sort_order ?? 0,
                        } : null,
                    }))
                    .filter((v: any) => v.cake_sizes != null)
                    .sort(
                        (a: any, b: any) =>
                            (a.cake_sizes?.sort_order ?? 0) - (b.cake_sizes?.sort_order ?? 0)
                    ),
            }))

        return filteredCakes
    } catch (error: any) {
        console.error('fetchCakes error:', error)
        throw error
    }
}
