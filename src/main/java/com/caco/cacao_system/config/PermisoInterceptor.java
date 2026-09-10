package com.caco.cacao_system.config;

import com.caco.cacao_system.service.PermisoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class PermisoInterceptor implements HandlerInterceptor {

    private final PermisoService permisoService;

    private static final Map<String, String> RUTAS_A_PERMISO = Map.ofEntries(
        Map.entry("/api/usuarios", "GESTIONAR_USUARIOS"),
        Map.entry("/api/roles", "GESTIONAR_ROLES"),
        Map.entry("/api/personal", "GESTIONAR_PERSONAL"),
        Map.entry("/api/proveedores", "GESTIONAR_PROVEEDORES"),
        Map.entry("/api/inventario", "VER_INVENTARIO"),
        Map.entry("/api/cultivo", "GESTIONAR_CULTIVO"),
        Map.entry("/api/cosecha", "GESTIONAR_COSECHA"),
        Map.entry("/api/ventas", "GESTIONAR_VENTAS"),
        Map.entry("/api/facturacion", "GESTIONAR_VENTAS"),
        Map.entry("/api/clientes", "GESTIONAR_VENTAS"),
Map.entry("/api/trazabilidad", "GESTIONAR_COSECHA"),
		Map.entry("/api/auditoria", "VER_AUDITORIA"),
		Map.entry("/api/backups", "GESTIONAR_BACKUPS")
	);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        String path = request.getRequestURI();
        String permiso = buscarPermiso(path);
        if (permiso == null) {
            return true;
        }

        String username = request.getHeader("X-Username");
        if (username == null || username.isBlank()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"Autenticación requerida.\"}");
            return false;
        }

        // Ampliaciones puntuales: se permite la acción si el usuario tiene el permiso
        // principal O alguno de los permisos adicionales relacionados.
        boolean permisosOk;
        String[] adicionales = permisosAdicionales(request.getMethod(), path);
        if (adicionales != null) {
            String[] todos = new String[adicionales.length + 1];
            todos[0] = permiso;
            System.arraycopy(adicionales, 0, todos, 1, adicionales.length);
            permisosOk = permisoService.tieneAlgunPermiso(username, todos);
        } else if ("GET".equalsIgnoreCase(request.getMethod())
                && path.startsWith("/api/roles")) {
            // Quien gestiona usuarios necesita ver la lista de roles para asignarlos,
            // aunque no pueda crear/editar/eliminar roles (eso sigue siendo GESTIONAR_ROLES).
            permisosOk = permisoService.tieneAlgunPermiso(username,
                    permiso, "GESTIONAR_USUARIOS");
        } else {
            permisosOk = permisoService.tienePermiso(username, permiso);
        }

        if (!permisosOk) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"No tienes permiso para esta acción.\"}");
            return false;
        }

        return true;
    }

    private String buscarPermiso(String uri) {
        for (Map.Entry<String, String> e : RUTAS_A_PERMISO.entrySet()) {
            if (uri.startsWith(e.getKey())) {
                return e.getValue();
            }
        }
        return null;
    }

    /**
     * Devuelve permisos adicionales que también habilitan una ruta, o null si la
     * ruta solo admite su permiso principal.
     * - GET /api/personal* : el módulo Cultivo (GESTIONAR_CULTIVO) necesita listar
     *   empleados para poder asignarlos a las actividades de las parcelas.
     * - /api/personal/pagos y /api/personal/sueldos : se usan tanto desde Gestión de
     *   Personal como desde Cultivo (asignar empleado a actividad y marcar pagos).
     * - GET /api/inventario/productos : el módulo Cosecha (GESTIONAR_COSECHA) necesita
     *   listar los productos de inventario a los que se sumará el stock cosechado.
     */
    private String[] permisosAdicionales(String method, String path) {
        boolean esSalarial = path.startsWith("/api/personal/pagos")
                || path.startsWith("/api/personal/sueldos");
        if (("GET".equalsIgnoreCase(method) && path.startsWith("/api/personal"))
                || esSalarial) {
            return new String[]{"GESTIONAR_CULTIVO"};
        }
        if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/inventario/productos")) {
            return new String[]{"GESTIONAR_COSECHA"};
        }
        return null;
    }
}
