import { NextResponse } from 'next/server'; import { setStage } from '@/lib/repository';
const stages=['New','Qualified','Proposal','Negotiation','Won','Lost'];
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const {stage}=await req.json();if(!stages.includes(stage))return NextResponse.json({error:'Invalid stage'},{status:400});const l=setStage(id,stage);return l?NextResponse.json(l):NextResponse.json({error:'Lead not found'},{status:404});}
