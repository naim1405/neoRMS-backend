import express from 'express';
import { UserRole } from '@prisma/client';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { inventoryController } from './inventory.controller';
import { inventoryValidation } from './inventory.validation';
import { verifyTenantAccess } from '../../middlewares/tenant.middleware';

const router = express.Router();

const staffRoles = [UserRole.OWNER, UserRole.MANAGER, UserRole.CHEF];

// ── InventoryIngredient ───────────────────────────────────────────────────────

// GET /inventory/inventoryIngredient  (global lookup table — no tenant scope)
router.get(
    '/inventoryIngredient',
    verifyJwt(...staffRoles),
    inventoryController.getAllInventoryIngredients,
);

// ── RestaurantInventory ───────────────────────────────────────────────────────

// GET /inventory/restaurantInventory/:restaurantId
router.get(
    '/restaurantInventory/:restaurantId',
    verifyJwt(...staffRoles),
    verifyTenantAccess,
    inventoryController.getRestaurantInventory,
);

// POST /inventory/restaurantInventory/:restaurantId
router.post(
    '/restaurantInventory/:restaurantId',
    verifyJwt(...staffRoles),
    verifyTenantAccess,
    validateRequest(inventoryValidation.createRestaurantInventorySchema),
    inventoryController.createRestaurantInventory,
);

// PATCH /inventory/restaurantInventory/:restaurantId/:restaurantInventoryId
router.patch(
    '/restaurantInventory/:restaurantId/:restaurantInventoryId',
    verifyJwt(...staffRoles),
    verifyTenantAccess,
    validateRequest(inventoryValidation.updateRestaurantInventorySchema),
    inventoryController.updateRestaurantInventory,
);

// DELETE /inventory/restaurantInventory/:restaurantId/:restaurantInventoryId
router.delete(
    '/restaurantInventory/:restaurantId/:restaurantInventoryId',
    verifyJwt(...staffRoles),
    verifyTenantAccess,
    inventoryController.deleteRestaurantInventory,
);

// PATCH /inventory/restaurantInventory/:restaurantId/:restaurantInventoryId/add
router.patch(
    '/restaurantInventory/:restaurantId/:restaurantInventoryId/add',
    verifyJwt(...staffRoles),
    verifyTenantAccess,
    validateRequest(inventoryValidation.adjustQuantitySchema),
    inventoryController.addQuantity,
);

// PATCH /inventory/restaurantInventory/:restaurantId/:restaurantInventoryId/subtract
router.patch(
    '/restaurantInventory/:restaurantId/:restaurantInventoryId/subtract',
    verifyJwt(...staffRoles),
    verifyTenantAccess,
    validateRequest(inventoryValidation.adjustQuantitySchema),
    inventoryController.subtractQuantity,
);

export const inventoryRoutes = router;
