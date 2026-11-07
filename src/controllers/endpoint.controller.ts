import type { Request, Response } from "express";

import {
  createEndpoint,
  listEndpoints,
  getEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from "../services/endpoint.service.js";

import { ApiError } from "../utils/api-error.js";
//CREATE ENDPOINT 

export async function createEndpointController (
    req : Request,
    res : Response 
) : Promise<void> {
    const tenantId  = req.auth?.tenantId;
    if(!tenantId)
    {
        throw new ApiError(401,"Authentication required");
    }
    const {url, description} = req.body ?? {};
    if(typeof url !== "string" || !url.trim()){
        throw new ApiError(400, "Valid endpoint URL is required");
    }
    if(
        description !== undefined && 
        description !== null && 
        typeof description !== "string"
    )
    {
        throw new ApiError(400,"Description must be a string");
    }
    const endpoint = await createEndpoint(tenantId, {
  url: url.trim(),
  ...(typeof description === "string" ? { description } : {}),
});

res.status(201).json({
  status: "success",
  message: "Endpoint created successfully",
  data: endpoint,
});
}

export async function listEndpointsController(
  req: Request,
  res: Response
): Promise<void> {
  const tenantId = req.auth?.tenantId;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  const endpoints = await listEndpoints(tenantId);

  res.status(200).json({
    status: "success",
    message: "Endpoints retrieved successfully",
    data: endpoints,
  });
}

// GET SINGLE ENDPOINT

export async function getEndpointController(
  req: Request,
  res: Response
): Promise<void> {
  const tenantId = req.auth?.tenantId;
 const endpointId = req.params.id;

if (typeof endpointId !== "string" || !endpointId.trim()) {
  throw new ApiError(400, "Valid endpoint ID is required");
}

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  if (!endpointId) {
    throw new ApiError(400, "Endpoint ID is required");
  }

  const endpoint = await getEndpoint(tenantId, endpointId);

  res.status(200).json({
    status: "success",
    message: "Endpoint retrieved successfully",
    data: endpoint,
  });
}
// UPDATE ENDPOINT

export async function updateEndpointController(
  req: Request,
  res: Response
): Promise<void> {
  const tenantId = req.auth?.tenantId;
  const endpointId = req.params.id;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  if (typeof endpointId !== "string" || !endpointId.trim()) {
    throw new ApiError(400, "Valid endpoint ID is required");
  }

  const { url, description, enabled } = req.body ?? {};

  // Validate URL
  if (url !== undefined && (typeof url !== "string" || !url.trim())) {
    throw new ApiError(400, "Valid endpoint URL is required");
  }

  // Validate description
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    throw new ApiError(400, "Description must be a string");
  }

  // Validate enabled
  if (enabled !== undefined && typeof enabled !== "boolean") {
    throw new ApiError(400, "Enabled must be a boolean");
  }

  const endpoint = await updateEndpoint(tenantId, endpointId, {
    ...(url !== undefined ? { url: url.trim() } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(enabled !== undefined ? { enabled } : {}),
  });

  res.status(200).json({
    status: "success",
    message: "Endpoint updated successfully",
    data: endpoint,
  });
}
// DELETE ENDPOINT

export async function deleteEndpointController(
  req: Request,
  res: Response
): Promise<void> {
  const tenantId = req.auth?.tenantId;
  const endpointId = req.params.id;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  if (typeof endpointId !== "string" || !endpointId.trim()) {
    throw new ApiError(400, "Valid endpoint ID is required");
  }

  await deleteEndpoint(tenantId, endpointId);

  res.status(200).json({
    status: "success",
    message: "Endpoint deleted successfully",
  });
}