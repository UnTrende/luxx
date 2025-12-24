// OpenAPI specification generator for LuxeCut functions
// This would generate API documentation for all edge functions

interface RouteDefinition {
  path: string;
  method: string;
  summary: string;
  description: string;
  requestBody?: unknown;
  responses: Record<string, any>;
}

export function generateOpenAPISpec(routes: RouteDefinition[]) {
  return {
    openapi: "3.0.0",
    info: {
      title: "LuxeCut Barber Shop API",
      version: "1.0.0",
      description: "API for managing barber shop appointments and services",
      contact: {
        name: "API Support",
        email: "support@luxecut.com"
      }
    },
    servers: [
      {
        url: "https://your-project.supabase.co/functions/v1",
        description: "Production server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Booking: {
          type: "object",
          required: ["barber_id", "service_ids", "appointment_date", "time_slot"],
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            barber_id: { type: "string", format: "uuid" },
            service_ids: { 
              type: "array", 
              items: { type: "string", format: "uuid" },
              minItems: 1
            },
            appointment_date: { type: "string", format: "date" },
            time_slot: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
            status: { 
              type: "string", 
              enum: ["pending", "confirmed", "completed", "cancelled"],
              default: "pending"
            },
            notes: { type: "string", maxLength: 500 }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            requestId: { type: "string" }
          }
        }
      }
    },
    paths: generatePaths(routes),
    security: [{ bearerAuth: [] }]
  };
}

function generatePaths(routes: RouteDefinition[]) {
  const paths: Record<string, any> = {};
  
  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }
    
    paths[route.path][route.method.toLowerCase()] = {
      summary: route.summary,
      description: route.description,
      requestBody: route.requestBody,
      responses: route.responses,
      security: route.method !== 'GET' ? [{ bearerAuth: [] }] : []
    };
  }
  
  return paths;
}