package com.caco.cacao_system;

import com.caco.cacao_system.model.Permiso;
import com.caco.cacao_system.repository.PermisoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CacaoSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(CacaoSystemApplication.class, args);
	}

	@Bean
	CommandLineRunner seedPermisos(PermisoRepository permisoRepository) {
		return args -> {
			if (permisoRepository.count() > 0) return;

			permisoRepository.saveAll(java.util.List.of(
				crearPermiso("GESTIONAR_USUARIOS", "Gestionar usuarios", "SEGURIDAD"),
				crearPermiso("GESTIONAR_ROLES", "Gestionar roles", "SEGURIDAD"),
				crearPermiso("GESTIONAR_PERSONAL", "Gestionar personal", "RRHH"),
				crearPermiso("GESTIONAR_PROVEEDORES", "Gestionar proveedores", "COMPRAS"),
				crearPermiso("VER_INVENTARIO", "Ver inventario", "PRODUCCION"),
				crearPermiso("GESTIONAR_CULTIVO", "Gestionar cultivo y mantenimiento", "PRODUCCION"),
				crearPermiso("GESTIONAR_COSECHA", "Gestionar cosecha", "PRODUCCION"),
				crearPermiso("GESTIONAR_VENTAS", "Gestionar ventas", "COMERCIAL"),
				crearPermiso("VER_REPORTES", "Ver reportes", "REPORTES"),
				crearPermiso("CONFIGURAR_SISTEMA", "Configuración del sistema", "SISTEMA")
			));
		};
	}

	private static Permiso crearPermiso(String nombre, String descripcion, String categoria) {
		Permiso p = new Permiso();
		p.setNombre(nombre);
		p.setDescripcion(descripcion);
		p.setCategoria(categoria);
		return p;
	}
}
