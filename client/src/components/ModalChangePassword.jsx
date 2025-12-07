import { useState } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import api from "../api/http";

export default function ModalChangePassword({ show, onHide, userId }) {
  const [loading, setLoading] = useState(false);
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState("");

  const reset = () => {
    setPass1("");
    setPass2("");
    setMsg("");
  };

  const handleSave = async () => {
    if (!pass1.trim() || !pass2.trim())
      return setMsg("Debe ingresar ambas contraseñas.");

    if (pass1 !== pass2)
      return setMsg("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      await api.put(`/usuarios/${userId}/password`, { newPassword: pass1 });
      setMsg("Contraseña actualizada correctamente.");
      setTimeout(() => {
        reset();
        onHide();
      }, 1200);
    } catch (err) {
      setMsg("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={() => { reset(); onHide(); }} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cambiar contraseña</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nueva contraseña</Form.Label>
            <Form.Control
              type="password"
              value={pass1}
              onChange={(e) => setPass1(e.target.value)}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Confirmar contraseña</Form.Label>
            <Form.Control
              type="password"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
            />
          </Form.Group>

          {msg && (
            <div className="alert alert-info mt-3 py-2">{msg}</div>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => { reset(); onHide(); }}>
          Cancelar
        </Button>

        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Guardando...
            </>
          ) : (
            "Actualizar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
