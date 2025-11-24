//server/routes/billeteraRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  getVecinos,
  updateSaldo,
  regenerarQR,
} = require("../controllers/billeteraController");

const ROLES = ["admin", "adminbilletera"];

function allowRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    next();
  };
}

router.get("/vecinos", auth, allowRoles(ROLES), getVecinos);
router.put("/vecinos/:id/saldo", auth, allowRoles(ROLES), updateSaldo);
router.post("/vecinos/:id/qr", auth, allowRoles(ROLES), regenerarQR);

module.exports = router;
