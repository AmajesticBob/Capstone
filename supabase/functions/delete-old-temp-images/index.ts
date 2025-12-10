import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const BUCKET_NAME = 'temp-images'
    const TWENTY_FOUR_HOURS_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000)

    console.log(`Starting cleanup for bucket: ${BUCKET_NAME}`)

    const { data: folders, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list()

    if (listError) throw listError

    if (!folders || folders.length === 0) {
      return new Response(JSON.stringify({ message: 'Bucket is empty' }), { status: 200 })
    }

    let deletedCount = 0
    let errors = []

    for (const folder of folders) {
      if (!folder.id) continue 
      const { data: files, error: fileError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list(folder.name)

      if (fileError) {
        console.error(`Error listing folder ${folder.name}:`, fileError)
        continue
      }
      const filesToDelete = files
        .filter((file) => file.name !== '.emptyFolderPlaceholder') 
        .filter((file) => {
          const createdAt = new Date(file.created_at)
          return createdAt < TWENTY_FOUR_HOURS_AGO
        })
        .map((file) => `${folder.name}/${file.name}`)

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .storage
          .from(BUCKET_NAME)
          .remove(filesToDelete)

        if (deleteError) {
          errors.push(`Failed to delete in ${folder.name}: ${deleteError.message}`)
        } else {
          deletedCount += filesToDelete.length
        }
      }
    }
    return new Response(
      JSON.stringify({ 
        message: `Cleanup complete`, 
        deleted: deletedCount,
        errors: errors 
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})