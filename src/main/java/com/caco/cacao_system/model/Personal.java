package com.caco.cacao_system.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "personal")
public class Personal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String cedula;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, length = 100)
    private String cargo;

    @Column(length = 10)
    private String telefono;

    @Column(length = 100)
    private String email;

    @Column(length = 200)
    private String direccion;

    @Column(name = "fecha_ingreso")
    private LocalDate fechaIngreso;

    @Column(nullable = false)
    private Boolean activo = true;
}
