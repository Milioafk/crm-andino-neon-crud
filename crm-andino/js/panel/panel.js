// Panel de administrador / empleado — CRUD completo sobre TODOS los registros
import { sql } from '../config/neon-config.js';
import { exigirSesion, cerrarSesion } from '../auth/auth.js';

// Un cliente es redirigido a registro.html automáticamente
const usuario = exigirSesion(['administrador', 'empleado']);
document.getElementById('btn-salir').addEventListener('click', cerrarSesion);
document.getElementById('rol-etiqueta').textContent = 'Panel de ' + usuario.rol + ' — ' + usuario.nombre;

// Consultar — todos, sin filtro por usuario
export async function listarTodos() {
  return await sql`SELECT * FROM solicitudes_demo_crm ORDER BY fecha_registro DESC, id DESC;`;
}

// Crear — atención presencial/telefónica: id_usuario queda NULL
export async function crearRegistro(datos) {
  const codigo = 'COD-' + Date.now().toString().slice(-8);
  await sql`
    INSERT INTO solicitudes_demo_crm (codigo_seguimiento, nombre, empresa, correo, num_usuarios, mensaje, estado)
    VALUES (${codigo}, ${datos.nombre}, ${datos.empresa}, ${datos.correo}, ${datos.num_usuarios}, ${datos.mensaje}, 'registrado');
  `;
  return codigo;
}

// Actualizar — cualquier registro, incluido el estado
export async function actualizarComoPanel(id, datos) {
  await sql`
    UPDATE solicitudes_demo_crm
    SET nombre = ${datos.nombre}, empresa = ${datos.empresa}, correo = ${datos.correo},
        num_usuarios = ${datos.num_usuarios}, mensaje = ${datos.mensaje}, estado = ${datos.estado}
    WHERE id = ${id};
  `;
}

// Eliminar — la interfaz pide confirmación antes de llamarla
export async function eliminarRegistro(id) {
  await sql`DELETE FROM solicitudes_demo_crm WHERE id = ${id};`;
}

const form = document.getElementById('form-panel');
const cuerpo = document.getElementById('cuerpo');
const msg = document.getElementById('mensaje');
const btnCancelar = document.getElementById('btn-cancelar');
let editandoId = null;

function mostrar(texto, tipo) {
  msg.textContent = texto;
  msg.className = 'msg visible ' + tipo;
}
function td(texto) {
  const c = document.createElement('td');
  c.textContent = texto;
  return c;
}
function salirDeEdicion() {
  editandoId = null;
  form.reset();
  document.getElementById('titulo-form').textContent = 'Nueva solicitud (atención presencial)';
  document.getElementById('btn-guardar').textContent = 'Crear solicitud';
  btnCancelar.hidden = true;
}
function editar(r) {
  editandoId = r.id;
  form.nombre.value = r.nombre;
  form.empresa.value = r.empresa;
  form.correo.value = r.correo;
  form.usuarios.value = r.num_usuarios;
  form.mensaje.value = r.mensaje || '';
  form.estado.value = r.estado;
  document.getElementById('titulo-form').textContent = 'Editando ' + r.codigo_seguimiento;
  document.getElementById('btn-guardar').textContent = 'Guardar cambios';
  btnCancelar.hidden = false;
  form.scrollIntoView({ behavior: 'smooth' });
}

async function pintar() {
  try {
    const filas = await listarTodos();
    cuerpo.replaceChildren();
    document.getElementById('total').textContent = filas.length + ' solicitudes en total';
    for (const r of filas) {
      const tr = document.createElement('tr');
      tr.append(td(r.codigo_seguimiento), td(r.nombre), td(r.empresa), td(r.correo), td(r.num_usuarios));
      const est = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'estado estado-' + r.estado;
      badge.textContent = r.estado;
      est.append(badge);
      tr.append(est, td(r.id_usuario ? 'Usuario #' + r.id_usuario : 'Presencial'));
      const acc = document.createElement('td');
      acc.className = 'acciones';
      const bE = document.createElement('button');
      bE.type = 'button'; bE.className = 'btn btn-outline btn-sm'; bE.textContent = 'Editar';
      bE.addEventListener('click', () => editar(r));
      const bD = document.createElement('button');
      bD.type = 'button'; bD.className = 'btn btn-peligro btn-sm'; bD.textContent = 'Eliminar';
      bD.addEventListener('click', async () => {
        if (!confirm('¿Eliminar la solicitud ' + r.codigo_seguimiento + '? Esta acción no se puede deshacer.')) return;
        try {
          await eliminarRegistro(r.id);
          if (editandoId === r.id) salirDeEdicion();
          mostrar('✓ Solicitud eliminada.', 'ok');
          pintar();
        } catch (err) { console.error(err); mostrar('No se pudo eliminar.', 'error'); }
      });
      acc.append(bE, bD);
      tr.append(acc);
      cuerpo.append(tr);
    }
  } catch (err) {
    console.error(err);
    mostrar('No se pudieron cargar las solicitudes.', 'error');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = {
    nombre: form.nombre.value.trim(), empresa: form.empresa.value.trim(),
    correo: form.correo.value.trim(), num_usuarios: form.usuarios.value,
    mensaje: form.mensaje.value.trim(), estado: form.estado.value
  };
  try {
    if (editandoId) {
      await actualizarComoPanel(editandoId, datos);
      mostrar('✓ Solicitud actualizada.', 'ok');
    } else {
      const codigo = await crearRegistro(datos);
      mostrar('✓ Solicitud creada. Código: ' + codigo, 'ok');
    }
    salirDeEdicion();
    pintar();
  } catch (err) { console.error(err); mostrar('No se pudo guardar.', 'error'); }
});
btnCancelar.addEventListener('click', salirDeEdicion);

salirDeEdicion();
pintar();
