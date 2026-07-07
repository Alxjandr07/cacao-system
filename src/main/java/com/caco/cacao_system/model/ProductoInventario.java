package com.caco.cacao_system.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "producto_inventario")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoProducto tipo; // CACAO o INSUMO

    @Column(nullable = false)
    private String unidadMedida; // kg, unidades, litros...

    @Column(nullable = false)
    private BigDecimal stockActual;

    @Column(nullable = false)
    private BigDecimal stockMinimo; // umbral para alerta

    private String descripcion;

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