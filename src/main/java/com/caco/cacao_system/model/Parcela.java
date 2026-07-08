package com.caco.cacao_system.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "parcela")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parcela {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre; // Ej: "Finca El Progreso - Lote A"

    @Column(nullable = false)
    private String ubicacion; // Ej: "Quevedo, Los Ríos"

    private BigDecimal hectareas;

    private String variedadCacao; // Ej: "CCN-51", "Nacional Fino de Aroma"

    private String responsable; // nombre del encargado

    private String observaciones;

    @Column(nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    private LocalDateTime actualizadoEn;

    @PrePersist
    public void prePersist() {
        this.creadoEn = LocalDateTime.now();
        this.actualizadoEn = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.actualizadoEn = LocalDateTime.now();
    }
}