import type { CakeSize, Category } from './cakes'
import { supabase } from './supabase'

export type CakeForAdmin = {
  id: string
  name: string
  ingredients: string | null
  base_price_rsd: number | null
  is_bento: boolean
  is_available: boolean
  category_id: string | null
  categories: Category | null
  created_at: string
}

/**
 * Fetch all cakes for admin (including unavailable ones)
 */
export async function fetchAllCakes(): Promise<CakeForAdmin[]> {
  try {
    const { data, error } = await supabase
      .from('cakes')
      .select(`
        id,
        name,
        ingredients,
        base_price_rsd,
        is_bento,
        is_available,
        category_id,
        created_at,
        categories (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('fetchAllCakes error:', error)
      throw error
    }

    return (data ?? []).map((cake: any) => ({
      id: cake.id || '',
      name: cake.name || '',
      ingredients: cake.ingredients ?? null,
      base_price_rsd: cake.base_price_rsd ?? null,
      is_bento: Boolean(cake.is_bento),
      is_available: Boolean(cake.is_available),
      category_id: cake.category_id ?? null,
      categories: cake.categories || null,
      created_at: cake.created_at || '',
    }))
  } catch (error: any) {
    console.error('fetchAllCakes error:', error)
    throw error
  }
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true })

    if (error) {
      console.error('fetchCategories error:', error)
      throw error
    }

    return (data ?? []).map((cat: any) => ({
      id: cat.id || '',
      name: cat.name || '',
      slug: cat.slug || '',
    }))
  } catch (error: any) {
    console.error('fetchCategories error:', error)
    throw error
  }
}

/**
 * Fetch all cake sizes
 */
export async function fetchCakeSizes(): Promise<CakeSize[]> {
  try {
    const { data, error } = await supabase
      .from('cake_sizes')
      .select('id, name, code, sort_order')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('fetchCakeSizes error:', error)
      throw error
    }

    return (data ?? []).map((size: any) => ({
      id: size.id || '',
      name: size.name || '',
      code: size.code || '',
      sort_order: size.sort_order ?? 0,
    }))
  } catch (error: any) {
    console.error('fetchCakeSizes error:', error)
    throw error
  }
}

/**
 * Fetch cake variants for a specific cake
 */
export async function fetchCakeVariants(cakeId: string) {
  try {
    const { data, error } = await supabase
      .from('cake_variants')
      .select(`
        id,
        price_rsd,
        is_available,
        cake_size_id,
        cake_sizes (
          id,
          name,
          code,
          sort_order
        )
      `)
      .eq('cake_id', cakeId)

    if (error) {
      console.error('fetchCakeVariants error:', error)
      throw error
    }

    return (data ?? []).map((variant: any) => ({
      id: variant.id || '',
      price_rsd: variant.price_rsd || 0,
      is_available: Boolean(variant.is_available),
      cake_size_id: variant.cake_size_id || '',
      cake_sizes: variant.cake_sizes ? {
        id: variant.cake_sizes.id || '',
        name: variant.cake_sizes.name || '',
        code: variant.cake_sizes.code || '',
        sort_order: variant.cake_sizes.sort_order ?? 0,
      } : null,
    }))
  } catch (error: any) {
    console.error('fetchCakeVariants error:', error)
    throw error
  }
}

export type SizePriceInput = {
  size_id: string
  price_rsd: number
}

/**
 * Set cake variants (sizes and prices) for a cake
 * This will delete existing variants and create new ones
 */
export async function setCakeVariants(
  cakeId: string,
  variants: SizePriceInput[]
): Promise<void> {
  try {
    // First, delete all existing variants for this cake
    const { error: deleteError } = await supabase
      .from('cake_variants')
      .delete()
      .eq('cake_id', cakeId)

    if (deleteError) {
      console.error('Error deleting existing variants:', deleteError)
      throw deleteError
    }

    // If no variants provided, we're done
    if (variants.length === 0) {
      return
    }

    // Create new variants
    const insertData = variants.map((v) => ({
      cake_id: cakeId,
      cake_size_id: v.size_id,
      price_rsd: Number(v.price_rsd),
      is_available: true,
    }))

    console.log('Creating variants:', JSON.stringify(insertData, null, 2))

    const { error: insertError } = await supabase
      .from('cake_variants')
      .insert(insertData)

    if (insertError) {
      console.error('Error creating variants:', insertError)
      throw insertError
    }
  } catch (error: any) {
    console.error('setCakeVariants error:', error)
    throw error
  }
}

export type CreateCakeInput = {
  name: string
  ingredients: string | null
  base_price_rsd: number | null
  is_bento: boolean
  is_available: boolean
  category_id: string | null
  variants?: SizePriceInput[]
}

/**
 * Create a new cake
 */
export async function createCake(input: CreateCakeInput): Promise<string> {
  try {
    // Build insert data, ensuring no undefined values
    const insertData: Record<string, any> = {
      name: input.name.trim(),
      is_bento: Boolean(input.is_bento),
      is_available: Boolean(input.is_available),
    }

    // Handle ingredients
    if (input.ingredients && input.ingredients.trim()) {
      insertData.ingredients = input.ingredients.trim()
    } else {
      insertData.ingredients = null
    }

    // Handle base_price_rsd
    if (input.base_price_rsd !== null && input.base_price_rsd !== undefined && !isNaN(input.base_price_rsd)) {
      insertData.base_price_rsd = Number(input.base_price_rsd)
    } else {
      insertData.base_price_rsd = null
    }

    // Handle category_id
    if (input.category_id && input.category_id.trim()) {
      insertData.category_id = input.category_id.trim()
    } else {
      insertData.category_id = null
    }

    console.log('Creating cake with data:', JSON.stringify(insertData, null, 2))

    const { data, error } = await supabase
      .from('cakes')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      console.error('createCake error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw new Error(error.message || 'Failed to create cake')
    }

    if (!data?.id) {
      throw new Error('Failed to create cake: no ID returned')
    }

    // If variants are provided, create them
    if (input.variants && input.variants.length > 0) {
      await setCakeVariants(data.id, input.variants)
    }

    return data.id
  } catch (error: any) {
    console.error('createCake error:', error)
    throw error
  }
}

export type UpdateCakeInput = {
  name?: string
  ingredients?: string | null
  base_price_rsd?: number | null
  is_bento?: boolean
  is_available?: boolean
  category_id?: string | null
  variants?: SizePriceInput[]
}

/**
 * Update an existing cake
 */
export async function updateCake(
  cakeId: string,
  input: UpdateCakeInput
): Promise<void> {
  try {
    const updateData: Record<string, any> = {}
    
    if (input.name !== undefined) {
      updateData.name = input.name.trim()
    }
    if (input.ingredients !== undefined) {
      updateData.ingredients = input.ingredients && input.ingredients.trim() 
        ? input.ingredients.trim() 
        : null
    }
    if (input.base_price_rsd !== undefined) {
      if (input.base_price_rsd !== null && !isNaN(input.base_price_rsd)) {
        updateData.base_price_rsd = Number(input.base_price_rsd)
      } else {
        updateData.base_price_rsd = null
      }
    }
    if (input.is_bento !== undefined) {
      updateData.is_bento = Boolean(input.is_bento)
    }
    if (input.is_available !== undefined) {
      updateData.is_available = Boolean(input.is_available)
    }
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id && input.category_id.trim()
        ? input.category_id.trim()
        : null
    }

    console.log('Updating cake', cakeId, 'with data:', JSON.stringify(updateData, null, 2))
    
    if (Object.keys(updateData).length === 0) {
      console.warn('No fields to update')
      return
    }

    const { error } = await supabase
      .from('cakes')
      .update(updateData)
      .eq('id', cakeId)

    if (error) {
      console.error('updateCake error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw new Error(error.message || 'Failed to update cake')
    }

    // If variants are provided, update them
    if (input.variants !== undefined) {
      await setCakeVariants(cakeId, input.variants)
    }
  } catch (error: any) {
    console.error('updateCake error:', error)
    throw error
  }
}

/**
 * Delete a cake
 */
export async function deleteCake(cakeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('cakes')
      .delete()
      .eq('id', cakeId)

    if (error) {
      console.error('deleteCake error:', error)
      throw error
    }
  } catch (error: any) {
    console.error('deleteCake error:', error)
    throw error
  }
}

