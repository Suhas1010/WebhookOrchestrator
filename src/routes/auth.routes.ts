
import { Router } from "express";
import { registerController,loginController} from "../controllers/auth.controller.js";
import { validateJson } from "../middleware/validate.js";
import { validateLoginBody, validateRegistrationBody } from "../middleware/auth.validation.js";

const router = Router();

router.post(
  "/register",
  validateJson,
  validateRegistrationBody,
  registerController
);

router.post(
  "/login",
  validateJson,
  validateLoginBody,
  loginController
);

export default router;
