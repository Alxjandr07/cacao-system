package com.caco.cacao_system.aspect;

import com.caco.cacao_system.service.AuditoriaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.List;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditoriaAspect {

    private static final int MAX_DETALLE = 4000;

    private final AuditoriaService auditoriaService;
    private final ObjectMapper objectMapper;

    @Around("("
            + "execution(* com.caco.cacao_system.repository..*.save(..)) || "
            + "execution(* com.caco.cacao_system.repository..*.saveAll(..)) || "
            + "execution(* com.caco.cacao_system.repository..*.deleteById(..)) || "
            + "execution(* com.caco.cacao_system.repository..*.delete(..)) || "
            + "execution(* com.caco.cacao_system.repository..*.deleteAll(..))"
            + ") && !target(com.caco.cacao_system.repository.AuditoriaRepository)")
    public Object auditar(ProceedingJoinPoint pjp) throws Throwable {
        Object[] args = pjp.getArgs();
        String metodo = pjp.getSignature().getName();
        boolean esUnicoSave = "save".equals(metodo) && args.length > 0;
        boolean esUnicoDelete = "delete".equals(metodo) && args.length > 0;

        // Para save()/delete() capturamos el id ANTES de ejecutar: así distinguimos
        // un INSERT (sin id) de un UPDATE (con id) sin conflictos de entidad gestionada.
        Long idAntes = null;
        Object entidadObj = null;
        if (esUnicoSave || esUnicoDelete) {
            entidadObj = args[0];
            idAntes = extraerId(entidadObj);
        }

        Object resultado = pjp.proceed();
        try {
            registrarDesdeJoinPoint(pjp, resultado, metodo, args, idAntes, entidadObj);
        } catch (Exception ignored) {
        }
        return resultado;
    }

    private void registrarDesdeJoinPoint(ProceedingJoinPoint pjp, Object resultado,
                                         String metodo, Object[] args, Long idAntes,
                                         Object entidadObj) {
        String entidad = nombreEntidad(pjp.getTarget());
        if (entidad == null || entidad.isBlank()) return;

        String accion;
        Long entidadId;
        String detalle;

        switch (metodo) {
            case "save" -> {
                entidadId = idAntes != null ? idAntes : extraerId(entidadObj);
                accion = idAntes == null ? "INSERT" : "UPDATE";
                detalle = resumen(entidadObj, entidad, entidadId);
            }
            case "saveAll" -> {
                int total = 0;
                boolean algunoConId = false;
                for (Object item : iterables(args)) {
                    total++;
                    if (extraerId(item) != null) algunoConId = true;
                }
                entidadId = null;
                accion = algunoConId ? "UPDATE" : "INSERT";
                detalle = "Operación masiva sobre " + entidad + " — " + total + " registro(s).";
            }
            case "deleteById" -> {
                entidadId = asLong(args.length > 0 ? args[0] : null);
                accion = "DELETE";
                detalle = "Eliminación de " + entidad + " con id=" + entidadId;
            }
            case "delete" -> {
                entidadId = idAntes;
                accion = "DELETE";
                detalle = resumen(entidadObj, entidad, entidadId);
            }
            default -> { // deleteAll
                entidadId = null;
                accion = "DELETE";
                detalle = "Eliminación masiva de " + entidad;
            }
        }

        HttpServletRequest request = requestActual();
        auditoriaService.registrar(
                AuditoriaService.usuarioDe(request),
                accion,
                entidad,
                entidadId,
                detalle,
                AuditoriaService.ipDe(request));
    }

    private Iterable<?> iterables(Object[] args) {
        if (args != null) {
            for (Object a : args) {
                if (a instanceof Iterable<?> it) return it;
            }
        }
        return List.of();
    }

    private String resumen(Object entidadObj, String entidad, Long id) {
        if (entidadObj != null) {
            try {
                String json = objectMapper.writeValueAsString(entidadObj);
                return truncar(json);
            } catch (Exception ignored) {
                String s = String.valueOf(entidadObj);
                if (!s.isBlank()) return truncar(s);
            }
        }
        return entidad + (id != null ? " id=" + id : "");
    }

    private String truncar(String s) {
        return s.length() > MAX_DETALLE
                ? s.substring(0, MAX_DETALLE) + "…"
                : s;
    }

    private Long extraerId(Object obj) {
        if (obj == null) return null;
        try {
            for (Method m : obj.getClass().getMethods()) {
                if ("getId".equals(m.getName()) && m.getParameterCount() == 0
                        && Long.class.isAssignableFrom(m.getReturnType())) {
                    return (Long) m.invoke(obj);
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private Long asLong(Object value) {
        if (value instanceof Long l) return l;
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private String nombreEntidad(Object target) {
        try {
            Class<?>[] interfaces = target.getClass().getInterfaces();
            for (Class<?> itf : interfaces) {
                if (itf.getSimpleName().endsWith("Repository")) {
                    return itf.getSimpleName().replace("Repository", "").toLowerCase();
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private HttpServletRequest requestActual() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs == null ? null : attrs.getRequest();
        } catch (Exception e) {
            return null;
        }
    }
}