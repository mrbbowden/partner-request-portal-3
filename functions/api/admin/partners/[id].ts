import { drizzle } from "drizzle-orm/d1";
import { partners } from "../../../schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const partnerUpdateSchema = z.object({
  id: z.string().min(3, "Partner ID must be at least 3 characters").max(9, "Partner ID must be at most 9 characters").optional(),
  partnerName: z.string().min(1, "Partner Name is required"),
  partnerEmail: z.string().email("Invalid email format").optional(),
  partnerPhone: z.string().optional(),
  partnerStreetAddress: z.string().optional(),
  partnerCity: z.string().optional(),
  partnerState: z.string().optional(),
  partnerZip: z.string().optional(),
});

export async function onRequest(context: any) {
  const { request, params, env } = context;
  const { id } = params;
  
  // Capitalize the partner ID for consistent searching
  const capitalizedId = id.toUpperCase();

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
      const result = await db.select().from(partners).where(eq(partners.id, capitalizedId)).limit(1);

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: "Partner not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result[0]), {
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

  if (request.method === "PUT") {
    try {
      const body = await request.json();
      const validatedData = partnerUpdateSchema.parse(body);

      const db = drizzle(env.DB);
      
      // Check if we're updating the ID
      if (validatedData.id && validatedData.id !== capitalizedId) {
        // ID is changing - we need to handle this specially
        // First check if the new ID already exists
        const existingPartner = await db.select().from(partners).where(eq(partners.id, validatedData.id.toUpperCase())).limit(1);
        if (existingPartner.length > 0) {
          return new Response(JSON.stringify({ error: `Partner ID "${validatedData.id}" already exists` }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        
        // Update with new ID - this requires a special approach since we can't directly update the primary key
        // We'll need to delete the old record and insert a new one
        const oldPartner = await db.select().from(partners).where(eq(partners.id, capitalizedId)).limit(1);
        if (oldPartner.length === 0) {
          return new Response(JSON.stringify({ error: "Partner not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        
        // Delete the old partner
        await db.delete(partners).where(eq(partners.id, capitalizedId));
        
        // Insert the new partner with the new ID
        const newPartner = await db.insert(partners).values({
          id: validatedData.id.toUpperCase(),
          partnerName: validatedData.partnerName,
          partnerEmail: validatedData.partnerEmail || null,
          partnerPhone: validatedData.partnerPhone || null,
          partnerStreetAddress: validatedData.partnerStreetAddress || null,
          partnerCity: validatedData.partnerCity || null,
          partnerState: validatedData.partnerState || null,
          partnerZip: validatedData.partnerZip || null,
        }).returning();
        
        return new Response(JSON.stringify(newPartner[0]), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // Regular update without ID change
        const result = await db
          .update(partners)
          .set({
            partnerName: validatedData.partnerName,
            partnerEmail: validatedData.partnerEmail || null,
            partnerPhone: validatedData.partnerPhone || null,
            partnerStreetAddress: validatedData.partnerStreetAddress || null,
            partnerCity: validatedData.partnerCity || null,
            partnerState: validatedData.partnerState || null,
            partnerZip: validatedData.partnerZip || null,
          })
          .where(eq(partners.id, capitalizedId))
          .returning();

        if (result.length === 0) {
          return new Response(JSON.stringify({ error: "Partner not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(result[0]), {
          headers: { "Content-Type": "application/json" },
        });
      }
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

  if (request.method === "DELETE") {
    try {
      const db = drizzle(env.DB);
      const result = await db.delete(partners).where(eq(partners.id, capitalizedId)).returning();

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: "Partner not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Partner deleted successfully" }), {
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

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}


