import { drizzle } from "drizzle-orm/d1";
import { partners } from "../../schema";
import { like, or } from "drizzle-orm";

export async function onRequest(context: any) {
  const { request } = context;
  
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    
    if (!query || query.length < 2) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = drizzle(context.env.DB);
    const searchTerm = `%${query.toUpperCase()}%`;
    
    // Search by partner ID or partner name
    const results = await db
      .select({
        id: partners.id,
        partnerName: partners.partnerName,
        partnerEmail: partners.partnerEmail,
        partnerPhone: partners.partnerPhone,
        partnerStreetAddress: partners.partnerStreetAddress,
        partnerCity: partners.partnerCity,
        partnerState: partners.partnerState,
        partnerZip: partners.partnerZip,
      })
      .from(partners)
      .where(
        or(
          like(partners.id, searchTerm),
          like(partners.partnerName, searchTerm)
        )
      )
      .limit(10)
      .orderBy(partners.id);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
