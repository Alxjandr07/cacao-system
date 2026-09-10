package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Auditoria;
import com.caco.cacao_system.repository.AuditoriaRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private static final int MAX_DETALLE = 4000;

    private final AuditoriaRepository auditoriaRepository;

    public void registrar(String usuario, String accion, String entidad, Long entidadId,
                          String detalle, String ip) {
        try {
            Auditoria a = new Auditoria();
            a.setUsuario(usuario == null || usuario.isBlank() ? "SISTEMA" : usuario);
            a.setAccion(accion);
            a.setEntidad(entidad);
            a.setEntidadId(entidadId);
            if (detalle != null && detalle.length() > MAX_DETALLE) {
                detalle = detalle.substring(0, MAX_DETALLE) + "…";
            }
            a.setDetalle(detalle);
            a.setIp(ip);
            a.setFecha(LocalDateTime.now());
            auditoriaRepository.save(a);
        } catch (Exception ignored) {
            // La auditoría jamás debe romper una operación del sistema.
        }
    }

    public List<Auditoria> listar(String usuario, String accion, String entidad,
                                  LocalDateTime desde, LocalDateTime hasta, int limite) {
        Specification<Auditoria> spec = Specification.where(null);

        if (usuario != null && !usuario.isBlank()) {
            String u = usuario.trim().toLowerCase();
            spec = spec.and((r, cq, cb) -> cb.like(cb.lower(r.get("usuario")), "%" + u + "%"));
        }
        if (accion != null && !accion.isBlank()) {
            String a = accion.trim().toLowerCase();
            spec = spec.and((r, cq, cb) -> cb.like(cb.lower(r.get("accion")), "%" + a + "%"));
        }
        if (entidad != null && !entidad.isBlank()) {
            String e = entidad.trim().toLowerCase();
            spec = spec.and((r, cq, cb) -> cb.like(cb.lower(r.get("entidad")), "%" + e + "%"));
        }
        if (desde != null) {
            spec = spec.and((r, cq, cb) -> cb.greaterThanOrEqualTo(r.get("fecha"), desde));
        }
        if (hasta != null) {
            spec = spec.and((r, cq, cb) -> cb.lessThanOrEqualTo(r.get("fecha"), hasta));
        }

        int lim = Math.max(1, Math.min(limite, 2000));
        Sort orden = Sort.by(Sort.Order.desc("fecha"), Sort.Order.desc("id"));
        return auditoriaRepository.findAll(spec, PageRequest.of(0, lim, orden)).getContent();
    }

    public static String usuarioDe(HttpServletRequest request) {
        if (request == null) return "SISTEMA";
        String u = request.getHeader("X-Username");
        return (u == null || u.isBlank()) ? "SISTEMA" : u;
    }

    public static String ipDe(HttpServletRequest request) {
        if (request == null) return "";
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String ip = request.getRemoteAddr();
        if (ip == null || ip.isBlank()) return "";
        if ("::1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) return "127.0.0.1";
        if (ip.startsWith("::ffff:")) return ip.substring("::ffff:".length());
        return ip;
    }
}