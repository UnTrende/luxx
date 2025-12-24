// Documentation endpoint for API documentation
// This would serve interactive API documentation

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { generateOpenAPISpec } from "../_shared/openapi-generator.ts";

serve(async (req) => {
  // Define routes for documentation
  const routes = [
    {
      path: "/health",
      method: "GET",
      summary: "Health Check",
      description: "Check the health status of the application",
      responses: {
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  timestamp: { type: "string" },
                  latency: { type: "number" }
                }
              }
            }
          }
        }
      }
    },
    {
      path: "/export-data",
      method: "POST",
      summary: "Export Data",
      description: "Export data in CSV format",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                entity: { type: "string", enum: ["bookings", "orders", "users"] },
                format: { type: "string", enum: ["csv"] }
              }
            }
          }
        }
      },
      responses: {
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  csv: { type: "string" },
                  filename: { type: "string" }
                }
              }
            }
          }
        },
        "400": {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { "$ref": "#/components/schemas/Error" }
            }
          }
        }
      }
    }
  ];

  const spec = generateOpenAPISpec(routes);
  
  // Generate interactive documentation
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>LuxeCut API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            spec: ${JSON.stringify(spec)},
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ]
          });
        };
      </script>
    </body>
  </html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600'
    }
  });
});