package com.caco.cacao_system.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "proveedores")
public class Proveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 13)
    private String ruc;

    @Column(name = "nombre", nullable = false, length = 200)
    private String nombre;

    @Column(length = 100)
    private String representante;

    @Column(length = 10)
    private String telefono;

    @Column(length = 100)
    private String email;

    @Column(nullable = false, length = 200)
    private String direccion;

    @Column(nullable = false, length = 100)
    private String ciudad;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false)
    private Boolean activo = true;
}
