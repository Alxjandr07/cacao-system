package com.caco.cacao_system;

import com.caco.cacao_system.model.BackupConfiguracion;
import com.caco.cacao_system.model.Permiso;
import com.caco.cacao_system.model.Rol;
import com.caco.cacao_system.model.Usuario;
import com.caco.cacao_system.repository.BackupConfiguracionRepository;
import com.caco.cacao_system.repository.PermisoRepository;
import com.caco.cacao_system.repository.RolRepository;
import com.caco.cacao_system.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class CacaoSystemApplication {

	static {
		TimeZone.setDefault(TimeZone.getTimeZone("America/Guayaquil"));
	}

	public static void main(String[] args) {
		SpringApplication.run(CacaoSystemApplication.class, args);
	}

	@Bean
	@Order(1)
	CommandLineRunner seedPermisos(PermisoRepository permisoRepository) {
		return args -> {
			List.of(
				crearPermiso("GESTIONAR_USUARIOS", "Gestionar usuarios", "SEGURIDAD"),
				crearPermiso("GESTIONAR_ROLES", "Gestionar roles", "SEGURIDAD"),
				crearPermiso("GESTIONAR_PERSONAL", "Gestionar personal", "RRHH"),
				crearPermiso("GESTIONAR_PROVEEDORES", "Gestionar proveedores", "COMPRAS"),
				crearPermiso("VER_INVENTARIO", "Ver inventario", "PRODUCCION"),
				crearPermiso("GESTIONAR_CULTIVO", "Gestionar cultivo y mantenimiento", "PRODUCCION"),
				crearPermiso("GESTIONAR_COSECHA", "Gestionar cosecha", "PRODUCCION"),
				crearPermiso("GESTIONAR_VENTAS", "Gestionar ventas", "COMERCIAL"),
				crearPermiso("VER_REPORTES", "Ver reportes", "REPORTES"),
				crearPermiso("CONFIGURAR_SISTEMA", "Configuración del sistema", "SISTEMA"),
				crearPermiso("VER_AUDITORIA", "Ver auditoría del sistema", "SISTEMA"),
				crearPermiso("GESTIONAR_BACKUPS", "Gestionar respaldos de base de datos", "SISTEMA")
			).forEach(p -> {
				if (permisoRepository.findByNombre(p.getNombre()).isEmpty()) {
					permisoRepository.save(p);
				}
			});
		};
	}

	@Bean
	@Order(2)
	CommandLineRunner seedConfigBackup(BackupConfiguracionRepository repo) {
		return args -> {
			if (repo.count() == 0) {
				BackupConfiguracion c = new BackupConfiguracion();
				c.setFrecuencia(BackupConfiguracion.DIARIO);
				c.setHora(LocalTime.of(20, 30));
				c.setActivo(true);
				repo.save(c);
			}
		};
	}

	private static Permiso crearPermiso(String nombre, String descripcion, String categoria) {
		Permiso p = new Permiso();
		p.setNombre(nombre);
		p.setDescripcion(descripcion);
		p.setCategoria(categoria);
		return p;
	}

	// Crea el rol ADMIN (con todos los permisos) y el usuario admin/Admin123
	// si no existen. Idempotente: en BD ya pobladas no hace nada.
	@Bean
	@Order(3)
	CommandLineRunner seedAdmin(RolRepository rolRepository, UsuarioRepository usuarioRepository,
			PermisoRepository permisoRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			Rol admin = rolRepository.findByNombre("ADMIN").orElseGet(() -> {
				Rol r = new Rol();
				r.setNombre("ADMIN");
				r.setDescripcion("Acceso total al sistema");
				return rolRepository.save(r);
			});
			if (admin.getPermisos() == null
					|| admin.getPermisos().size() < permisoRepository.count()) {
				admin.setPermisos(new HashSet<>(permisoRepository.findAll()));
				rolRepository.save(admin);
			}
			if (usuarioRepository.findByUsername("admin").isEmpty()) {
				Usuario u = new Usuario();
				u.setUsername("admin");
				u.setPassword(passwordEncoder.encode("Admin123"));
				u.setNombres("Administrador");
				u.setApellidos("Sistema");
				u.setEmail("admin@cacaogest.local");
				u.setActivo(true);
				u.setRol(admin);
				usuarioRepository.save(u);
			}
		};
	}
}
