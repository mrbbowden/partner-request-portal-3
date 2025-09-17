import { drizzle } from "drizzle-orm/d1";
import { requests, partners } from "../schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const insertRequestSchema = z.object({
  partnerId: z.string().min(3, "Partner ID must be at least 3 characters").max(9, "Partner ID must be at most 9 characters"),
  partnerName: z.string().min(1, "Partner Name is required"),
  caseManagerName: z.string().min(1, "Case Manager's Name is required"),
  caseManagerEmail: z.string().email("Invalid email format"),
  caseManagerPhone: z.string().min(1, "Case Manager's Phone is required"),
  // Recipient fields
  recipientsName: z.string().min(1, "Recipient's Name is required"),
  recipientsStreetAddress: z.string().min(1, "Recipient's Street Address is required"),
  recipientsCity: z.string().min(1, "Recipient's City is required"),
  recipientsState: z.string().min(1, "Recipient's State is required"),
  recipientsZip: z.string().min(1, "Recipient's Zip Code is required"),
  recipientsEmail: z.string().email("Invalid recipient email format"),
  recipientsPhone: z.string().min(1, "Recipient's Phone is required"),
  race: z.string().min(1, "Race is required"),
  ethnicity: z.string().min(1, "Ethnicity is required"),
  // Household Information
  numberOfMenInHousehold: z.string().min(1, "Number of Men in Household is required"),
  numberOfWomenInHousehold: z.string().min(1, "Number of Women in Household is required"),
  numberOfChildrenInHousehold: z.string().min(1, "Number of Children in Household is required"),
  employedHousehold: z.string().min(1, "Employed Household status is required"),
  englishSpeaking: z.string().min(1, "English Speaking status is required"),
  descriptionOfNeed: z.string().min(1, "Description of Need is required"),
});

async function sendToZapier(data: any, env: any) {
  const webhookUrl = env.ZAPIER_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error("ZAPIER_WEBHOOK_URL environment variable not set");
    return { success: false, error: "Webhook URL not configured" };
  }

  console.log("🔄 Attempting to send webhook to Zapier...");
  console.log("📡 Webhook URL:", webhookUrl);
  console.log("📦 Data being sent:", JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: data.requestId,
        partnerId: data.partnerId,
        partnerName: data.partnerName,
        caseManagerName: data.caseManagerName,
        caseManagerEmail: data.caseManagerEmail,
        caseManagerPhone: data.caseManagerPhone,
        // Recipient fields
        recipientsName: data.recipientsName,
        recipientsStreetAddress: data.recipientsStreetAddress,
        recipientsCity: data.recipientsCity,
        recipientsState: data.recipientsState,
        recipientsZip: data.recipientsZip,
        recipientsEmail: data.recipientsEmail,
        recipientsPhone: data.recipientsPhone,
        race: data.race,
        ethnicity: data.ethnicity,
        // Household Information
        numberOfMenInHousehold: data.numberOfMenInHousehold,
        numberOfWomenInHousehold: data.numberOfWomenInHousehold,
        numberOfChildrenInHousehold: data.numberOfChildrenInHousehold,
        employedHousehold: data.employedHousehold,
        englishSpeaking: data.englishSpeaking,
        descriptionOfNeed: data.descriptionOfNeed,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log("📊 Zapier response status:", response.status);
    console.log("📊 Zapier response headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const responseText = await response.text();
      console.log("✅ Zapier webhook successful!");
      console.log("📄 Response body:", responseText);
      return { success: true, status: response.status, response: responseText };
    } else {
      const errorText = await response.text();
      console.error("❌ Zapier webhook failed!");
      console.error("📊 Status:", response.status);
      console.error("📊 Status Text:", response.statusText);
      console.error("📄 Error Response:", errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error("💥 Error sending to Zapier:", error);
    console.error("🔍 Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { success: false, error: error.message };
  }
}

export async function onRequest(context: any) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const validatedData = insertRequestSchema.parse(body);

    // Verify partner exists
    const db = drizzle(env.DB);
    const partner = await db.select().from(partners).where(eq(partners.id, validatedData.partnerId)).limit(1);

    if (partner.length === 0) {
      return new Response(JSON.stringify({ error: "Partner not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate a simple ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert request using raw SQL to bypass ORM issues
    const result = await env.DB.prepare(`
      INSERT INTO requests (
        id, partner_id, partner_name, case_manager_name, case_manager_email, case_manager_phone, 
        recipients_name, recipients_street_address, recipients_city, 
        recipients_state, recipients_zip, recipients_email, recipients_phone, race, ethnicity,
        number_of_men_in_household, number_of_women_in_household, number_of_children_in_household, employed_household, english_speaking, description_of_need, webhook_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      requestId,
      validatedData.partnerId,
      validatedData.partnerName,
      validatedData.caseManagerName,
      validatedData.caseManagerEmail,
      validatedData.caseManagerPhone,
      validatedData.recipientsName,
      validatedData.recipientsStreetAddress,
      validatedData.recipientsCity,
      validatedData.recipientsState,
      validatedData.recipientsZip,
      validatedData.recipientsEmail,
      validatedData.recipientsPhone,
      validatedData.race,
      validatedData.ethnicity,
      validatedData.numberOfMenInHousehold,
      validatedData.numberOfWomenInHousehold,
      validatedData.numberOfChildrenInHousehold,
      validatedData.employedHousehold,
      validatedData.englishSpeaking,
      validatedData.descriptionOfNeed,
      'pending'
    ).run();

    // Send to Zapier with monitoring
    const webhookData = {
      requestId: requestId,
      ...validatedData,
      employedHousehold: validatedData.employedHousehold,
      partner: {
        id: partner[0].id,
        partnerName: partner[0].partnerName,
        caseManagerEmail: partner[0].caseManagerEmail,
        caseManagerPhone: partner[0].caseManagerPhone,
      },
    };
    
    console.log("🚀 Request saved to database successfully. Request ID:", requestId);
    
    // Send to Zapier and log the result
    const webhookResult = await sendToZapier(webhookData, env);
    
    // Update webhook status in database
    const webhookStatus = webhookResult.success ? 'successful' : 'failed';
    await env.DB.prepare(`
      UPDATE requests SET webhook_status = ? WHERE id = ?
    `).bind(webhookStatus, requestId).run();
    
    if (webhookResult.success) {
      console.log("🎉 Webhook sent successfully to Zapier!");
    } else {
      console.error("⚠️ Webhook failed, but request was saved to database");
      console.error("🔍 Webhook error details:", webhookResult);
    }

    return new Response(JSON.stringify({ 
      message: "Request submitted successfully",
      requestId: requestId 
    }), {
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
