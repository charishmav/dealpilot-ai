import { NextResponse } from 'next/server';
import { listLeads } from '@/lib/repository';
export async function GET(){ return NextResponse.json(listLeads(), {headers:{'Cache-Control':'no-store'}}); }
