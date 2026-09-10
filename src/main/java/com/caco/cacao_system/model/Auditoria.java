package com.caco.cacao_system.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "auditoria")
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String usuario;

    @Column(nullable = false, length = 30)
    private String accion;

    @Column(nullable = false, length = 60)
    private String entidad;

    private Long entidadId;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Column(length = 45)
    private String ip;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();
}