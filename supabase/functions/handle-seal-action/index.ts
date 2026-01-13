import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");
    const reason = url.searchParams.get("reason");

    if (!token || !action) {
      return new Response(createHtmlResponse("Error", "Invalid request. Missing token or action."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    if (action !== "approve" && action !== "reject") {
      return new Response(createHtmlResponse("Error", "Invalid action. Must be 'approve' or 'reject'."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find seal by token
    const { data: seal, error: sealError } = await supabase
      .from("digital_seals")
      .select("*")
      .eq("approval_token", token)
      .single();

    if (sealError || !seal) {
      return new Response(createHtmlResponse("Error", "Seal not found or invalid token."), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    if (seal.status !== "pending") {
      return new Response(createHtmlResponse("Already Processed", `This seal has already been ${seal.status}.`), {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Get the approver's email from referer or default
    const approverEmail = req.headers.get("referer") || "email-link";

    if (action === "approve") {
      await supabase
        .from("digital_seals")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by_email: approverEmail,
        })
        .eq("id", seal.id);

      return new Response(
        createHtmlResponse(
          "Seal Approved ✓",
          "The digital seal has been approved and will be applied to the document. Thank you for your verification."
        ),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    } else {
      // For rejection, show a form if no reason provided
      if (!reason && req.method === "GET") {
        return new Response(createRejectionForm(token), {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }

      await supabase
        .from("digital_seals")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || "No reason provided",
        })
        .eq("id", seal.id);

      return new Response(
        createHtmlResponse(
          "Seal Rejected",
          "The digital seal request has been rejected. The requester will be notified."
        ),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (error: any) {
    console.error("Error in handle-seal-action:", error);
    return new Response(createHtmlResponse("Error", `An error occurred: ${error.message}`), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
});

function createHtmlResponse(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - DIT Digital Seal</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 12px; 
          text-align: center; 
          max-width: 500px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 { color: #0a1628; margin-bottom: 20px; }
        p { color: #64748b; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `;
}

function createRejectionForm(token: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reject Seal - DIT Digital Seal</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 12px; 
          text-align: center; 
          max-width: 500px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 { color: #0a1628; margin-bottom: 20px; }
        p { color: #64748b; line-height: 1.6; margin-bottom: 20px; }
        textarea { 
          width: 100%; 
          padding: 12px; 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          margin-bottom: 20px;
          min-height: 100px;
          font-family: inherit;
          box-sizing: border-box;
        }
        button { 
          background: #dc2626; 
          color: white; 
          border: none; 
          padding: 12px 30px; 
          border-radius: 6px; 
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        }
        button:hover { background: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reject Digital Seal</h1>
        <p>Please provide a reason for rejecting this seal request:</p>
        <form action="?token=${token}&action=reject" method="GET">
          <input type="hidden" name="token" value="${token}">
          <input type="hidden" name="action" value="reject">
          <textarea name="reason" placeholder="Enter rejection reason..." required></textarea>
          <button type="submit">Submit Rejection</button>
        </form>
      </div>
    </body>
    </html>
  `;
}
