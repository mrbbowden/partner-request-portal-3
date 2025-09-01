export async function onRequest(context: any) {
  const { request, env } = context;

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const webhookUrl = env.ZAPIER_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return new Response(JSON.stringify({ 
      error: "Webhook URL not configured",
      message: "ZAPIER_WEBHOOK_URL environment variable is not set"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Test data
  const testData = {
    requestId: "test_" + Date.now(),
    partnerId: "TEST123",
    partnerName: "Test Partner",
    caseManagerName: "Test Case Manager",
    caseManagerEmail: "test@example.com",
    caseManagerPhone: "555-123-4567",
    recipientsName: "Test Recipient",
    recipientsStreetAddress: "123 Test St",
    recipientsCity: "Test City",
    recipientsState: "TS",
    recipientsZip: "12345",
    recipientsEmail: "recipient@example.com",
    recipientsPhone: "555-987-6543",
    race: "White",
    ethnicity: "Not Hispanic or Latino or Spanish Origin",
    numberOfMenInHousehold: "1",
    numberOfWomenInHousehold: "1",
    numberOfChildrenInHousehold: "2",
    employedHousehold: "true",
    englishSpeaking: "true",
    descriptionOfNeed: "Test request for webhook verification",
    timestamp: new Date().toISOString(),
  };

  console.log("🧪 Testing webhook configuration...");
  console.log("📡 Webhook URL:", webhookUrl);
  console.log("📦 Test data:", JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    
    console.log("📊 Test response status:", response.status);
    console.log("📄 Test response body:", responseText);

    if (response.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: "Webhook test successful!",
        status: response.status,
        response: responseText,
        webhookUrl: webhookUrl,
        testData: testData
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: "Webhook test failed",
        status: response.status,
        error: responseText,
        webhookUrl: webhookUrl,
        testData: testData
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("💥 Webhook test error:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: "Webhook test error",
      error: error.message,
      webhookUrl: webhookUrl,
      testData: testData
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
