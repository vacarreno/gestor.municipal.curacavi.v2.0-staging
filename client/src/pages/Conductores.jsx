import { useEffect, useState } from 'react'
import api from '../api/http'
import { Button } from 'react-bootstrap'

export default function Conductores() {
  const [conductores, setConductores] = useState([])
  const [loading, setLoading] = useState(false)

  // === CARGAR DATOS (solo usuarios con rol Conductor) ===
  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/usuarios')
      const soloConductores = (data || []).filter(
        (u) => u.rol?.toLowerCase?.() === 'conductor'
      )
      setConductores(soloConductores)
    } catch (e) {
      alert('Error cargando conductores: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Conductores</h3>
        <Button variant="outline-secondary" size="sm" onClick={load}>
          Refrescar
        </Button>
      </div>

      <div className="card p-3 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>N°</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Departamento</th>
                <th>RUT</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Clase Licencia</th>
              </tr>
            </thead>
            <tbody>
              {conductores.map((c, index) => (
                <tr key={c.id}>
                  <td>{index + 1}</td>
                  <td>{c.nombre}</td>
                  <td>{c.correo || '-'}</td>
                  <td>{c.departamento || '-'}</td>
                  <td>{c.rut || '-'}</td>
                  <td>{c.direccion || '-'}</td>
                  <td>{c.telefono || '-'}</td>
                  <td>{c.licencia || '-'}</td>
                </tr>
              ))}

              {!conductores.length && !loading && (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    Sin registros
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="7" className="text-center">
                    Cargando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
