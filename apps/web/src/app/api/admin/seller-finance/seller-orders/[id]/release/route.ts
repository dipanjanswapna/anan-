import {NextRequest,NextResponse} from "next/server";
type Context={params:Promise<{id:string}>};
const apiBase=()=>process.env.ANAN_API_URL??"http://localhost:4000/api/v1";
export async function POST(request:NextRequest,context:Context){
 const token=request.cookies.get("anan_session")?.value;if(!token)return NextResponse.json({message:"Admin sign-in required."},{status:401});
 const {id}=await context.params;if(!/^[a-zA-Z0-9_-]{1,64}$/.test(id))return NextResponse.json({message:"Invalid seller order ID."},{status:400});
 try{const upstream=await fetch(`${apiBase()}/admin/seller-finance/seller-orders/${id}/release`,{method:"POST",headers:{authorization:`Bearer ${token}`},cache:"no-store"});const payload=await upstream.json().catch(()=>({}));const response=NextResponse.json(payload,{status:upstream.status});if(upstream.status===401)response.cookies.delete("anan_session");return response;}
 catch{return NextResponse.json({message:"Admin finance service unavailable."},{status:503});}
}
