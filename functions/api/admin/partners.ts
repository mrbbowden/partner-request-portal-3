import { drizzle } from "drizzle-orm/d1";
import { partners } from "../../schema";
import { z } from "zod";

const partnerSchema = z.object({
  id: z.string().min(3, "Partner ID must be at least 3 characters").max(9, "Partner ID must be at most 9 characters"),
  partnerName: z.string().min(1, "Partner Name is required"),
  partnerEmail: z.string().email("Invalid email format"),
  partnerPhone: z.string().min(1, "Partner Phone is required"),
  partnerStreetAddress: z.string().min(1, "Partner Street Address is required"),
  partnerCity: z.string().min(1, "Partner City is required"),
  partnerState: z.string().min(1, "Partner State is required"),
  partnerZip: z.string().min(1, "Partner Zip is required"),
});

export async function onRequest(context: any) {
  const { request, env } = context;

  // Check admin password
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== "Bearer scooby") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "GET") {
    try {
      const db = drizzle(env.DB);
      const allPartners = await db.select().from(partners).orderBy(partners.id);
      
      return new Response(JSON.stringify(allPartners), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const validatedData = partnerSchema.parse(body);

      const db = drizzle(env.DB);
      await db.insert(partners).values({
        id: validatedData.id,
        partnerName: validatedData.partnerName,
        partnerEmail: validatedData.partnerEmail,
        partnerPhone: validatedData.partnerPhone,
        partnerStreetAddress: validatedData.partnerStreetAddress,
        partnerCity: validatedData.partnerCity,
        partnerState: validatedData.partnerState,
        partnerZip: validatedData.partnerZip,
      });

      return new Response(JSON.stringify({ message: "Partner created successfully" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: "Validation error", details: error.errors }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}


