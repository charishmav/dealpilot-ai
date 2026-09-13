import { NextResponse } from 'next/server'; import { listLeads } from '@/lib/repository'; import { insights } from '@/lib/intelligence';
export async function GET(){return NextResponse.json(insights(listLeads()),{headers:{'Cache-Control':'no-store'}})}
