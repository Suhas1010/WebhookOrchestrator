import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      userId?: string;
      tenantId: string;
      role?: string;
      apiKeyId?: string;
      authMethod: "jwt" | "api-key";
    };
  }
}

export {};