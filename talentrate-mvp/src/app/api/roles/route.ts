import { NextResponse } from 'next/server'
import { listRoles } from '@/lib/config'

export async function GET() {
  try {
    const roles = listRoles()
    
    // Format roles for dropdown
    const formattedRoles = roles.map(role => ({
      name: role,
      value: role
    }))

    return NextResponse.json({
      roles: formattedRoles
    })

  } catch (error) {
    console.error('Roles API error:', error)
    return NextResponse.json({ 
      error: 'Failed to load roles' 
    }, { status: 500 })
  }
}
